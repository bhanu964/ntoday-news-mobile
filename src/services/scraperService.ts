import AsyncStorage from '@react-native-async-storage/async-storage';
import { NewsArticle, NewsCategory } from '@/types/news';
import { MOCK_NEWS_ARTICLES } from '@/data/mockNews';
import { TranslationService } from './translationService';

const BASE_URL = 'https://ntodaynews.com';
const STORAGE_KEY_ARTICLES_PREFIX = '@ntoday_live_articles_v2_';
const STORAGE_KEY_TIMESTAMP_PREFIX = '@ntoday_live_articles_ts_v2_';
const STORAGE_KEY_CATEGORIES = '@ntoday_live_categories_v2';
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes cache validity

function cleanHtml(rawHtml?: string | null): string {
  if (!rawHtml) return '';
  return rawHtml
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<ins[\s\S]*?<\/ins>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\r\n/g, '\n')
    .replace(/\n\s*\n+/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

// Generate clean summary without cutting mid-word (generates ~1200 chars to comfortably fill mobile news feed cards)
function generateSnippet(fullText: string, targetLength: number = 1200): string {
  if (!fullText) return '';
  const singleLine = fullText.replace(/\n+/g, ' ').trim();
  if (singleLine.length <= targetLength) return singleLine;

  const slice = singleLine.slice(0, targetLength);
  const lastSpace = slice.lastIndexOf(' ');
  const lastPeriod = slice.lastIndexOf('.');
  const cutIndex = Math.max(lastPeriod > 400 ? lastPeriod + 1 : -1, lastSpace);

  if (cutIndex > 400) {
    return slice.slice(0, cutIndex).trim();
  }
  return slice.trim();
}

async function fetchWithTimeout(url: string, timeoutMs: number = 6500): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timer);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.text();
  } catch (err: any) {
    clearTimeout(timer);
    throw err;
  }
}

function normalizeImageUrl(src?: string | null): string {
  if (!src) return 'https://ntodaynews.com/assets/images/default.png';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('//')) return `https:${src}`;
  if (src.startsWith('/')) return `${BASE_URL}${src}`;
  return `${BASE_URL}/${src}`;
}

function resolveCategoryIcon(teLabel: string): string {
  const l = teLabel.trim().toLowerCase();
  if (l.includes('తెలంగాణ') || l.includes('telangana')) return 'location';
  if (l.includes('ఆంధ్రప్రదేశ్') || l.includes('andhra')) return 'location-outline';
  if (l.includes('వినోదం') || l.includes('సినిమా') || l.includes('entertainment')) return 'film';
  if (l.includes('భక్తి') || l.includes('devotional')) return 'sparkles';
  if (l.includes('క్రీడలు') || l.includes('sports')) return 'football';
  if (l.includes('జాతీయం') || l.includes('national')) return 'flag';
  if (l.includes('అంతర్జాతీయం') || l.includes('international')) return 'globe';
  if (l.includes('ఆర్టీఐ') || l.includes('rti')) return 'document-text';
  if (l.includes('రాజకీయాలు') || l.includes('politics')) return 'megaphone';
  if (l.includes('క్రైమ్') || l.includes('crime')) return 'alert-circle';
  return 'newspaper-outline';
}

export interface ScrapedCardSummary {
  url: string;
  slug: string;
  title: string;
  imageUrl: string;
  categoryLabel?: string;
  rawDate?: string;
  rawViews?: string;
}

export interface ScrapedArticleDetail {
  title: string;
  content: string;
  category: string;
  district: string;
  reporterName: string;
  reporterArea: string;
  reporterAvatar?: string;
  imageUrl: string;
  publishedAt?: string;
}

let liveCategoriesCache: NewsCategory[] = [];

export const ScraperService = {
  /**
   * Dynamically extracts category IDs & Telugu names from live HTML (<a href=".../category/{id}">...</a>)
   */
  async extractAndStoreCategoriesFromHtml(html: string): Promise<NewsCategory[]> {
    const catRegex = /<a[^>]*href="(?:https:\/\/ntodaynews\.com)?\/category\/(\d+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;
    const seenIds = new Map<string, string>();

    while ((match = catRegex.exec(html)) !== null) {
      const catId = match[1].trim();
      const label = cleanHtml(match[2]);
      if (!catId || !label) continue;
      // Skip "View All" links pointing to a category
      if (label === 'అన్నీ చూడండి' || label.toLowerCase() === 'view all') continue;
      if (!seenIds.has(catId)) {
        seenIds.set(catId, label);
      }
    }

    if (seenIds.size === 0) return liveCategoriesCache;

    const extracted: NewsCategory[] = [
      { id: 'all', name: 'అన్నీ', name_en: 'All Stories', slug: 'all', icon: 'apps', sort_order: 0 },
    ];

    let order = 1;
    for (const [catId, teName] of seenIds.entries()) {
      const enName =
        TranslationService.getCachedSync(teName) || (await TranslationService.translateCategory(teName));
      extracted.push({
        id: catId,
        name: teName,
        name_en: enName || teName,
        slug: catId,
        icon: resolveCategoryIcon(teName),
        sort_order: order++,
      });
    }

    liveCategoriesCache = extracted;
    try {
      await AsyncStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(extracted));
    } catch {
      // Ignore cache failure
    }
    return extracted;
  },

  async getCachedCategories(): Promise<NewsCategory[]> {
    if (liveCategoriesCache.length > 0) return liveCategoriesCache;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (raw) {
        const parsed = JSON.parse(raw) as NewsCategory[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          liveCategoriesCache = parsed;
          return parsed;
        }
      }
    } catch {
      // Ignore storage error
    }
    return [{ id: 'all', name: 'అన్నీ', name_en: 'All Stories', slug: 'all', icon: 'apps', sort_order: 0 }];
  },

  /**
   * Resolves a numeric category ID, slug, Telugu name, or English name to the canonical website category.
   */
  async resolveCategoryInfo(categoryIdOrName?: string): Promise<NewsCategory | null> {
    if (!categoryIdOrName || categoryIdOrName === 'all') return null;

    let cats = await this.getCachedCategories();
    // If only 'all' exists in cache, scrape live homepage categories first
    if (cats.length <= 1) {
      cats = await this.fetchCategories(true);
    }

    const q = categoryIdOrName.trim().toLowerCase();
    const matched = cats.find(
      (c) =>
        c.id.toLowerCase() === q ||
        c.slug.toLowerCase() === q ||
        c.name.trim().toLowerCase() === q ||
        c.name_en.trim().toLowerCase() === q
    );
    return matched || null;
  },

  /**
   * Fast extraction of all article cards available on the website homepage (and caches live categories)
   */
  async scrapeHomepageCards(): Promise<ScrapedCardSummary[]> {
    const html = await fetchWithTimeout(`${BASE_URL}/`, 6500);
    // Keep live categories synced whenever homepage is fetched
    this.extractAndStoreCategoriesFromHtml(html).catch(() => {});

    const cardRegex = /<a\s+href="(https:\/\/ntodaynews\.com\/[a-zA-Z0-9\-]+)"[^>]*>([\s\S]*?)<\/a>/g;
    let match: RegExpExecArray | null;

    const cards: ScrapedCardSummary[] = [];
    const seenUrls = new Set<string>();

    const skipKeywords = [
      '/category/',
      '/live-',
      '/login',
      '/signup',
      '/reporters',
      '/contact',
      '/privacy',
      '/terms',
      '/editors',
    ];

    while ((match = cardRegex.exec(html)) !== null) {
      const url = match[1];
      const inner = match[2];

      if (seenUrls.has(url)) continue;
      if (skipKeywords.some((kw) => url.includes(kw))) continue;

      const imgMatch = inner.match(/src="([^"]+)"/);
      const titleMatch =
        inner.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/) || inner.match(/title="([^"]+)"/);

      if (imgMatch && titleMatch) {
        seenUrls.add(url);
        const slug = url.replace(`${BASE_URL}/`, '').replace(/^https?:\/\/[^\/]+\//, '');
        const dateMatch = inner.match(/fa-clock[^>]*><\/i>\s*([^<]+)/i);
        const viewsMatch = inner.match(/fa-eye[^>]*><\/i>\s*([^<]+)/i);

        cards.push({
          url,
          slug,
          title: cleanHtml(titleMatch[1]),
          imageUrl: normalizeImageUrl(imgMatch[1]),
          rawDate: dateMatch ? dateMatch[1].trim() : undefined,
          rawViews: viewsMatch ? viewsMatch[1].trim() : undefined,
        });
      }
    }

    return cards;
  },

  /**
   * Scrapes category-specific paginated cards strictly from https://ntodaynews.com/category/{webCatId}?page={page}
   */
  async scrapeCategoryCards(
    webCatId: string,
    page: number = 1
  ): Promise<{ cards: ScrapedCardSummary[]; hasMore: boolean; categoryLabel?: string }> {
    const pageUrl = `${BASE_URL}/category/${webCatId}?page=${page}`;
    const html = await fetchWithTimeout(pageUrl, 6500);

    // Keep live categories synced if not yet loaded
    if (liveCategoriesCache.length <= 1) {
      this.extractAndStoreCategoriesFromHtml(html).catch(() => {});
    }

    const headingMatch = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    const categoryHeading = headingMatch
      ? cleanHtml(headingMatch[1]).replace(/\s*విభాగం$/, '').trim()
      : undefined;

    const articleRegex = /<article[^>]*>([\s\S]*?)<\/article>/gi;
    let m: RegExpExecArray | null;
    const cards: ScrapedCardSummary[] = [];
    const seen = new Set<string>();

    while ((m = articleRegex.exec(html)) !== null) {
      const block = m[1];
      const urlMatch = block.match(/href="(https:\/\/ntodaynews\.com\/[a-zA-Z0-9\-]+)"/i);
      const imgMatch = block.match(/<img[^>]*src="([^"]+)"/i);
      const titleMatch = block.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
      const badgeMatch = block.match(/class="[^"]*badge[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
      const dateMatch = block.match(/fa-calendar-alt[^>]*><\/i>\s*([^<]+)/i) || block.match(/fa-clock[^>]*><\/i>\s*([^<]+)/i);
      const viewsMatch = block.match(/fa-eye[^>]*><\/i>\s*([^<]+)/i);

      if (urlMatch && titleMatch && !seen.has(urlMatch[1])) {
        const url = urlMatch[1];
        seen.add(url);
        cards.push({
          url,
          slug: url.replace(`${BASE_URL}/`, ''),
          imageUrl: normalizeImageUrl(imgMatch ? imgMatch[1] : ''),
          title: cleanHtml(titleMatch[1]),
          categoryLabel: badgeMatch ? cleanHtml(badgeMatch[1]) : categoryHeading,
          rawDate: dateMatch ? cleanHtml(dateMatch[1]) : undefined,
          rawViews: viewsMatch ? cleanHtml(viewsMatch[1]) : undefined,
        });
      }
    }

    const nextPageLink = `page=${page + 1}`;
    const hasMore = html.includes(nextPageLink) || html.includes('rel="next"');

    return {
      cards,
      hasMore,
      categoryLabel: categoryHeading,
    };
  },

  /**
   * Scrapes historical older news chronologically for infinite scrolling on the Trending/Latest feed (page 2, 3, 4...)
   */
  async scrapePaginatedCards(page: number): Promise<{ cards: ScrapedCardSummary[]; hasMore: boolean }> {
    try {
      const pageUrl = `${BASE_URL}/trending?page_latest=${page}`;
      const html = await fetchWithTimeout(pageUrl, 6500);
      const cards: ScrapedCardSummary[] = [];
      const seen = new Set<string>();

      const skipKeywords = ['/category/', '/live-', '/login', '/signup', '/reporters', '/contact', '/privacy', '/terms', '/editors'];

      // Match both .col-md-6 blocks and generic article cards on trending pages
      const blockRegex = /<div class="col-md-6 mb-3">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>|<article[^>]*>([\s\S]*?)<\/article>/gi;
      let m: RegExpExecArray | null;

      while ((m = blockRegex.exec(html)) !== null) {
        const block = m[1] || m[2];
        const urlMatch = block.match(/href="(https:\/\/ntodaynews\.com\/[a-zA-Z0-9\-]+)"/i);
        if (!urlMatch || skipKeywords.some((kw) => urlMatch[1].includes(kw))) continue;

        const imgMatch = block.match(/src="([^"]+)"/i);
        const titleMatch = block.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
        const dateMatch =
          block.match(/<small[^>]*>[\s\S]*?<\/i>\s*([^<]+)<\/small>/i) ||
          block.match(/fa-clock[^>]*><\/i>\s*([^<]+)/i);

        if (titleMatch && !seen.has(urlMatch[1])) {
          seen.add(urlMatch[1]);
          cards.push({
            url: urlMatch[1],
            slug: urlMatch[1].replace(`${BASE_URL}/`, ''),
            imageUrl: normalizeImageUrl(imgMatch ? imgMatch[1] : ''),
            title: cleanHtml(titleMatch[1]),
            rawDate: dateMatch ? cleanHtml(dateMatch[1]) : undefined,
          });
        }
      }

      const hasMore = html.includes(`page_latest=${page + 1}`) || cards.length >= 10;
      return { cards, hasMore };
    } catch (err) {
      console.warn(`[ScraperService] Failed to scrape page ${page}:`, err);
      return { cards: [], hasMore: false };
    }
  },

  /**
   * Scrapes the full story text, reporter information, and district for an individual article URL
   */
  async scrapeArticleDetail(
    url: string,
    fallbackTitle: string,
    fallbackImg: string
  ): Promise<ScrapedArticleDetail> {
    try {
      const html = await fetchWithTimeout(url, 5000);

      let jsonLd: any = null;
      const jsonMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
      if (jsonMatch) {
        try {
          jsonLd = JSON.parse(jsonMatch[1]);
        } catch {
          // Ignore JSON parse errors
        }
      }

      const titleMatch =
        html.match(/<h1[^>]*id="article-main-title"[^>]*>([\s\S]*?)<\/h1>/i) ||
        html.match(/<h1[^>]*class="news-title"[^>]*>([\s\S]*?)<\/h1>/i);
      const title = titleMatch ? cleanHtml(titleMatch[1]) : jsonLd?.headline || fallbackTitle;

      const catMatch = html.match(/class="[^"]*category-badge[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
      const category = catMatch ? cleanHtml(catMatch[1]) : 'తాజా వార్తలు';

      const distMatch = html.match(
        /fa-location-dot[\s\S]*?<span class="small fw-bold text-dark">([\s\S]*?)<\/span>/i
      );
      const district = distMatch ? cleanHtml(distMatch[1]) : '';

      const repMatch =
        html.match(/class="[^"]*reporter-name[^"]*"[^>]*>([\s\S]*?)<\/(?:span|div|a)>/i) ||
        html.match(/Posted by\s*:\s*([^<\r\n]+)/i);
      const jsonAuthor = Array.isArray(jsonLd?.author) ? jsonLd.author[0]?.name : jsonLd?.author?.name;
      const reporterName = repMatch ? cleanHtml(repMatch[1]) : jsonAuthor || 'NToday News';

      const areaMatch = html.match(/class="[^"]*reporter-area[^"]*"[^>]*>([\s\S]*?)<\/(?:span|div|a)>/i);
      const reporterArea = areaMatch
        ? cleanHtml(areaMatch[1])
        : district
        ? `${district} డెస్క్`
        : 'డెస్క్';

      const avatarMatch = html.match(/class="[^"]*reporter-avatar[^"]*"[\s\S]*?src="([^"]+)"/i);
      const reporterAvatar = avatarMatch ? normalizeImageUrl(avatarMatch[1]) : undefined;

      const imgMatch = html.match(/id="main-news-image"[^>]*src="([^"]+)"/i);
      const imageUrl = normalizeImageUrl(imgMatch ? imgMatch[1] : jsonLd?.image?.[0] || fallbackImg);

      const contentMatch = html.match(/<div class="news-content">([\s\S]*?)<\/div>\s*<\/div>/i);
      let content = contentMatch ? cleanHtml(contentMatch[1]) : '';
      if (!content && jsonLd?.description) {
        content = cleanHtml(jsonLd.description);
      }
      if (!content) {
        content = title;
      }

      return {
        title,
        content,
        category,
        district,
        reporterName,
        reporterArea,
        reporterAvatar,
        imageUrl,
        publishedAt: jsonLd?.datePublished || new Date().toISOString(),
      };
    } catch {
      return {
        title: fallbackTitle,
        content: fallbackTitle,
        category: 'తాజా వార్తలు',
        district: '',
        reporterName: 'NToday News',
        reporterArea: 'డెస్క్',
        imageUrl: normalizeImageUrl(fallbackImg),
        publishedAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Fetch live articles from ntodaynews.com with strict per-category filtering & pagination
   */
  async fetchLiveArticles(options: {
    page?: number;
    forceRefresh?: boolean;
    categoryId?: string;
    limit?: number;
  } = {}): Promise<{ articles: NewsArticle[]; hasMore: boolean; total: number }> {
    const { page = 1, forceRefresh = false, categoryId, limit = 12 } = options;

    const isCategoryMode = Boolean(categoryId && categoryId !== 'all');
    const resolvedCat = isCategoryMode ? await this.resolveCategoryInfo(categoryId) : null;
    const catKey = isCategoryMode ? resolvedCat?.id || categoryId!.trim() : 'all';

    const cacheArticlesKey = `${STORAGE_KEY_ARTICLES_PREFIX}${catKey}`;
    const cacheTsKey = `${STORAGE_KEY_TIMESTAMP_PREFIX}${catKey}`;

    // 1. Check per-category offline cache ONLY for Page 1 when not force-refreshing
    if (page === 1 && !forceRefresh) {
      try {
        const cachedRaw = await AsyncStorage.getItem(cacheArticlesKey);
        const timestampRaw = await AsyncStorage.getItem(cacheTsKey);
        if (cachedRaw) {
          const cachedArticles: NewsArticle[] = JSON.parse(cachedRaw);
          const age = Date.now() - (timestampRaw ? parseInt(timestampRaw, 10) : 0);
          if (cachedArticles.length > 0 && age < CACHE_TTL_MS) {
            return {
              articles: cachedArticles.slice(0, limit).map((a, idx, arr) => ({
                ...a,
                cardIndex: idx + 1,
                totalCards: arr.length,
              })),
              hasMore: true,
              total: cachedArticles.length,
            };
          }
        }
      } catch (e) {
        console.warn('[ScraperService] Failed to read cache:', e);
      }
    }

    try {
      let cards: ScrapedCardSummary[] = [];
      let hasMorePages = true;
      let categoryLabel = resolvedCat?.name || (isCategoryMode ? categoryId : undefined);

      // 2. Fetch live cards: strictly from /category/{id}?page={page} when category is selected
      if (isCategoryMode) {
        const webCatId = resolvedCat?.id || (/^\d+$/.test(catKey) ? catKey : undefined);
        if (!webCatId) {
          return { articles: [], hasMore: false, total: 0 };
        }
        const catRes = await this.scrapeCategoryCards(webCatId, page);
        cards = catRes.cards;
        hasMorePages = catRes.hasMore;
        if (catRes.categoryLabel) {
          categoryLabel = catRes.categoryLabel;
        }
      } else {
        if (page === 1) {
          cards = await this.scrapeHomepageCards();
          hasMorePages = true;
        } else {
          const paginated = await this.scrapePaginatedCards(page);
          cards = paginated.cards;
          hasMorePages = paginated.hasMore;
        }
      }

      if (!cards || cards.length === 0) {
        return { articles: [], hasMore: false, total: 0 };
      }

      const targetCards = cards.slice(0, Math.max(limit, 12));

      // 3. Parallel detail scraping in chunks of 5
      const batchSize = 5;
      const scrapedDetails: ScrapedArticleDetail[] = [];

      for (let i = 0; i < targetCards.length; i += batchSize) {
        const chunk = targetCards.slice(i, i + batchSize);
        const chunkResults = await Promise.all(
          chunk.map((c) => this.scrapeArticleDetail(c.url, c.title, c.imageUrl))
        );
        scrapedDetails.push(...chunkResults);
      }

      // 4. Transform into full NewsArticle models
      const articles: NewsArticle[] = scrapedDetails.map((detail, idx) => {
        const card = targetCards[idx];
        const finalTitle = detail.title || card.title;
        const wordCount = detail.content.length;
        const readTimeSec = Math.max(25, Math.min(60, Math.round(wordCount / 12)));
        const summary = generateSnippet(detail.content, 1200);
        const articleCategory = isCategoryMode
          ? categoryLabel || detail.category || 'తాజా వార్తలు'
          : detail.category || card.categoryLabel || 'తాజా వార్తలు';
        const articleCategoryId = isCategoryMode ? catKey : detail.category || 'all';

        return {
          id: card.slug || `live-${catKey}-p${page}-${idx + 1}`,
          cardIndex: (page - 1) * limit + idx + 1,
          totalCards: (page - 1) * limit + scrapedDetails.length,
          authorName: detail.reporterName || 'NToday News',
          authorDesk: detail.reporterArea || (detail.district ? `${detail.district} డెస్క్` : 'డెస్క్'),
          authorDesk_en: TranslationService.getCachedSync(detail.reporterArea),
          authorAvatar: detail.reporterAvatar,
          sourceName: 'NTODAY NEWS',
          sourceCredit: 'Source: NTODAY NEWS',
          sourceUrl: card.url,
          externalId: card.slug,
          timeAgo: card.rawDate || 'Just now',
          title: finalTitle,
          title_en: TranslationService.getCachedSync(finalTitle),
          summary,
          summary_en: TranslationService.getCachedSync(summary),
          content: detail.content,
          content_en: TranslationService.getCachedSync(detail.content),
          mediaType: 'image',
          imageUrl: detail.imageUrl || card.imageUrl,
          category: articleCategory,
          category_en: TranslationService.getCachedSync(articleCategory),
          category_id: articleCategoryId,
          likesCount: 0,
          dislikesCount: 0,
          commentsCount: 0,
          audioDurationSeconds: readTimeSec,
          publishedAt: detail.publishedAt || new Date().toISOString(),
          status: 'published',
          comments: [],
        };
      });

      // 5. Sort chronologically newest-first using parsed publishedAt timestamps
      articles.sort((a, b) => {
        const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return tb - ta;
      });

      const indexed = articles.map((a, idx) => ({
        ...a,
        cardIndex: (page - 1) * limit + idx + 1,
        totalCards: articles.length,
      }));

      // 6. Cache Page 1 per category
      if (page === 1) {
        try {
          await AsyncStorage.setItem(cacheArticlesKey, JSON.stringify(indexed));
          await AsyncStorage.setItem(cacheTsKey, Date.now().toString());
        } catch (e) {
          console.warn('[ScraperService] Failed to cache category articles:', e);
        }
      }

      return {
        articles: indexed,
        hasMore: hasMorePages,
        total: indexed.length,
      };
    } catch (err) {
      console.warn('[ScraperService] Live scrape failed, checking strict cache:', err);

      if (page === 1) {
        try {
          const cachedRaw = await AsyncStorage.getItem(cacheArticlesKey);
          if (cachedRaw) {
            const cachedArticles: NewsArticle[] = JSON.parse(cachedRaw);
            if (cachedArticles.length > 0) {
              return {
                articles: cachedArticles,
                hasMore: true,
                total: cachedArticles.length,
              };
            }
          }
        } catch {
          // Ignore cache error
        }
      }

      if (isCategoryMode) {
        // Strict filtering: never pollute selected category with unrelated mock articles
        const catFilterName = resolvedCat?.name || categoryId;
        const strictMock = this.filterArticles(MOCK_NEWS_ARTICLES, catFilterName, limit);
        return {
          articles: strictMock,
          hasMore: false,
          total: strictMock.length,
        };
      }

      return {
        articles: this.filterArticles(MOCK_NEWS_ARTICLES, undefined, limit),
        hasMore: false,
        total: MOCK_NEWS_ARTICLES.length,
      };
    }
  },

  /**
   * Filter and slice articles strictly
   */
  filterArticles(articles: NewsArticle[], categoryId?: string, limit?: number): NewsArticle[] {
    let list = articles;

    if (categoryId && categoryId !== 'all') {
      const q = categoryId.trim().toLowerCase();
      list = list.filter((a) => {
        const cat = (a.category || '').trim().toLowerCase();
        const catId = (a.category_id || '').trim().toLowerCase();
        return cat === q || catId === q;
      });
    }

    if (limit && limit > 0) {
      list = list.slice(0, limit);
    }

    return list.map((a, idx) => ({
      ...a,
      cardIndex: idx + 1,
      totalCards: list.length,
    }));
  },

  /**
   * Fetch an individual article by slug
   */
  async fetchArticleBySlug(slug: string): Promise<NewsArticle | null> {
    try {
      const cachedRaw = await AsyncStorage.getItem(`${STORAGE_KEY_ARTICLES_PREFIX}all`);
      if (cachedRaw) {
        const cached: NewsArticle[] = JSON.parse(cachedRaw);
        const match = cached.find((a) => a.id === slug || a.externalId === slug);
        if (match && match.content && match.content.length > 100) {
          return match;
        }
      }

      const url = `${BASE_URL}/${slug}`;
      const detail = await this.scrapeArticleDetail(url, 'NToday News', '');
      return {
        id: slug,
        cardIndex: 1,
        totalCards: 1,
        authorName: detail.reporterName,
        authorDesk: detail.reporterArea,
        authorDesk_en: TranslationService.getCachedSync(detail.reporterArea),
        authorAvatar: detail.reporterAvatar,
        sourceName: 'NTODAY NEWS',
        sourceCredit: 'Source: NTODAY NEWS',
        sourceUrl: url,
        timeAgo: 'Today',
        title: detail.title,
        title_en: TranslationService.getCachedSync(detail.title),
        summary: generateSnippet(detail.content, 1200),
        content: detail.content,
        mediaType: 'image',
        imageUrl: detail.imageUrl,
        category: detail.category,
        category_en: TranslationService.getCachedSync(detail.category),
        category_id: detail.category,
        likesCount: 0,
        dislikesCount: 0,
        commentsCount: 0,
        audioDurationSeconds: Math.max(25, Math.round(detail.content.length / 12)),
        publishedAt: detail.publishedAt,
        status: 'published',
        comments: [],
      };
    } catch {
      return null;
    }
  },

  /**
   * Dynamically extracts available categories strictly from the live ntodaynews.com website.
   * Strips out any hardcoded categories that do not exist on the live site.
   */
  async fetchCategories(forceRefresh = false): Promise<NewsCategory[]> {
    if (!forceRefresh && liveCategoriesCache.length > 1) {
      return liveCategoriesCache;
    }

    try {
      const html = await fetchWithTimeout(`${BASE_URL}/`, 6000);
      const extracted = await this.extractAndStoreCategoriesFromHtml(html);
      if (extracted.length > 1) {
        return extracted;
      }
    } catch (err) {
      console.warn('[ScraperService] Failed to fetch live categories:', err);
    }

    return await this.getCachedCategories();
  },
};
