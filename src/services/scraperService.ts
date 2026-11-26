import AsyncStorage from '@react-native-async-storage/async-storage';
import { NewsArticle, NewsCategory } from '@/types/news';
import { MOCK_NEWS_ARTICLES } from '@/data/mockNews';

const BASE_URL = 'https://ntodaynews.com';
const STORAGE_KEY_ARTICLES = '@ntoday_live_articles_v1';
const STORAGE_KEY_TIMESTAMP = '@ntoday_live_articles_timestamp';
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes cache validity

// Helper to decode HTML entities and strip unwanted tags
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
    .replace(/\n\s*\n+/g, '\n') // Single newline to prevent awkward blank lines
    .replace(/[ \t]+/g, ' ')
    .trim();
}

// Generate clean summary without cutting mid-word
function generateSnippet(fullText: string, targetLength: number = 220): string {
  if (!fullText) return '';
  const singleLine = fullText.replace(/\n+/g, ' ').trim();
  if (singleLine.length <= targetLength) return singleLine;

  const slice = singleLine.slice(0, targetLength);
  // Find last space or punctuation mark
  const lastSpace = slice.lastIndexOf(' ');
  const lastPeriod = slice.lastIndexOf('.');
  const cutIndex = Math.max(lastPeriod > 100 ? lastPeriod + 1 : -1, lastSpace);

  if (cutIndex > 100) {
    return slice.slice(0, cutIndex).trim();
  }
  return slice.trim();
}

// Fetch with strict timeout helper
async function fetchWithTimeout(url: string, timeoutMs: number = 5500): Promise<string> {
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

// Ensure full valid URL for images
function normalizeImageUrl(src?: string | null): string {
  if (!src) return 'https://ntodaynews.com/assets/images/default.png';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('//')) return `https:${src}`;
  if (src.startsWith('/')) return `${BASE_URL}${src}`;
  return `${BASE_URL}/${src}`;
}

export interface ScrapedCardSummary {
  url: string;
  slug: string;
  title: string;
  imageUrl: string;
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

export const ScraperService = {
  /**
   * Fast extraction of all article cards available on the website homepage
   */
  async scrapeHomepageCards(): Promise<ScrapedCardSummary[]> {
    const html = await fetchWithTimeout(`${BASE_URL}/`, 6500);
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
   * Scrapes historical older news chronologically for infinite scrolling (page 2, 3, 4...)
   */
  async scrapePaginatedCards(page: number, categoryId?: string): Promise<ScrapedCardSummary[]> {
    try {
      let pageUrl = `${BASE_URL}/trending?page_latest=${page}`;
      if (categoryId && categoryId !== 'all') {
        const catMap: Record<string, number> = {
          'ఆంధ్రప్రదేశ్': 161,
          ap: 161,
          'తెలంగాణ': 1,
          telangana: 1,
          'రాజకీయాలు': 162,
          politics: 162,
          'క్రైమ్': 163,
          crime: 163,
          'సినిమా': 2,
          cinema: 2,
          'క్రీడలు': 3,
          sports: 3,
        };
        const catNum = catMap[categoryId.toLowerCase()] || 1;
        pageUrl = `${BASE_URL}/category/${catNum}?page=${page}`;
      }

      const html = await fetchWithTimeout(pageUrl, 6500);
      const cardRegex = /<div class="col-md-6 mb-3">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
      let m: RegExpExecArray | null;
      const cards: ScrapedCardSummary[] = [];
      const seen = new Set<string>();

      while ((m = cardRegex.exec(html)) !== null) {
        const block = m[1];
        const urlMatch = block.match(/href="(https:\/\/ntodaynews\.com\/[a-zA-Z0-9\-]+)"/);
        const imgMatch = block.match(/src="([^"]+)"/);
        const titleMatch = block.match(/<h6[^>]*>([\s\S]*?)<\/h6>/);
        const dateMatch = block.match(/<small[^>]*>[\s\S]*?<\/i>\s*([^<]+)<\/small>/);

        if (urlMatch && titleMatch && !seen.has(urlMatch[1])) {
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

      return cards;
    } catch (err) {
      console.warn(`[ScraperService] Failed to scrape page ${page}:`, err);
      return [];
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
      const html = await fetchWithTimeout(url, 4500);

      // 1. JSON-LD Structured Data
      let jsonLd: any = null;
      const jsonMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
      if (jsonMatch) {
        try {
          jsonLd = JSON.parse(jsonMatch[1]);
        } catch {
          // Ignore JSON parse errors
        }
      }

      // 2. Headline
      const titleMatch =
        html.match(/<h1[^>]*id="article-main-title"[^>]*>([\s\S]*?)<\/h1>/i) ||
        html.match(/<h1[^>]*class="news-title"[^>]*>([\s\S]*?)<\/h1>/i);
      const title = titleMatch ? cleanHtml(titleMatch[1]) : jsonLd?.headline || fallbackTitle;

      // 3. Category Badge
      const catMatch = html.match(/class="category-badge[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
      const category = catMatch ? cleanHtml(catMatch[1]) : 'తాజా వార్తలు';

      // 4. District / Location
      const distMatch = html.match(
        /fa-location-dot[\s\S]*?<span class="small fw-bold text-dark">([\s\S]*?)<\/span>/i
      );
      const district = distMatch ? cleanHtml(distMatch[1]) : '';

      // 5. Reporter Name
      const repMatch =
        html.match(/class="reporter-name"[^>]*>([\s\S]*?)<\/div>/i) ||
        html.match(/class="reporter-name"[^>]*>([\s\S]*?)<\/span>/i);
      const reporterName = repMatch
        ? cleanHtml(repMatch[1])
        : jsonLd?.author?.[0]?.name || 'NToday News';

      // 6. Reporter Area / Desk
      const areaMatch =
        html.match(/class="reporter-area"[^>]*>([\s\S]*?)<\/div>/i) ||
        html.match(/class="reporter-area"[^>]*>([\s\S]*?)<\/span>/i);
      const reporterArea = areaMatch
        ? cleanHtml(areaMatch[1])
        : district
        ? `${district} డెస్క్`
        : 'DESK';

      // 7. Reporter Avatar
      const avatarMatch = html.match(/class="reporter-avatar"[\s\S]*?src="([^"]+)"/i);
      const reporterAvatar = avatarMatch ? normalizeImageUrl(avatarMatch[1]) : undefined;

      // 8. Main News Image
      const imgMatch = html.match(/id="main-news-image"[^>]*src="([^"]+)"/i);
      const imageUrl = normalizeImageUrl(imgMatch ? imgMatch[1] : jsonLd?.image?.[0] || fallbackImg);

      // 9. Clean Telugu Body Content
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
      // Graceful fallback if detail fetch times out
      return {
        title: fallbackTitle,
        content: fallbackTitle,
        category: 'తాజా వార్తలు',
        district: '',
        reporterName: 'NToday News',
        reporterArea: 'DESK',
        imageUrl: normalizeImageUrl(fallbackImg),
        publishedAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Fetch live articles from ntodaynews.com with pagination support & caching
   */
  async fetchLiveArticles(options: {
    page?: number;
    forceRefresh?: boolean;
    categoryId?: string;
    limit?: number;
  } = {}): Promise<{ articles: NewsArticle[]; hasMore: boolean; total: number }> {
    const { page = 1, forceRefresh = false, categoryId, limit = 15 } = options;

    // 1. Check local offline cache first ONLY for page 1 when not force-refreshing
    if (page === 1 && !forceRefresh) {
      try {
        const cachedRaw = await AsyncStorage.getItem(STORAGE_KEY_ARTICLES);
        const timestampRaw = await AsyncStorage.getItem(STORAGE_KEY_TIMESTAMP);
        if (cachedRaw) {
          const cachedArticles: NewsArticle[] = JSON.parse(cachedRaw);
          const age = Date.now() - (timestampRaw ? parseInt(timestampRaw, 10) : 0);
          if (cachedArticles.length > 0 && age < CACHE_TTL_MS) {
            const filtered = this.filterArticles(cachedArticles, categoryId, limit);
            return {
              articles: filtered,
              hasMore: true,
              total: 500,
            };
          }
        }
      } catch (e) {
        console.warn('[ScraperService] Failed to read cache:', e);
      }
    }

    try {
      // 2. Fetch cards: Page 1 uses Homepage; Page >= 2 uses Paginated trending
      let cards: ScrapedCardSummary[] = [];
      if (page === 1) {
        cards = await this.scrapeHomepageCards();
      } else {
        cards = await this.scrapePaginatedCards(page, categoryId);
      }

      if (!cards || cards.length === 0) {
        if (page > 1) {
          return { articles: [], hasMore: false, total: 0 };
        }
        throw new Error('No articles found');
      }

      const targetCards = cards.slice(0, Math.max(limit, 12));

      // 3. Batch parallel execution with concurrency of 5
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
        const wordCount = detail.content.length;
        const readTimeSec = Math.max(25, Math.min(60, Math.round(wordCount / 12)));
        const summary = generateSnippet(detail.content, 220);

        return {
          id: card.slug || `live-p${page}-${idx + 1}`,
          cardIndex: (page - 1) * limit + idx + 1,
          totalCards: (page - 1) * limit + scrapedDetails.length,
          authorName: detail.reporterName || 'NToday News',
          authorDesk: detail.reporterArea || (detail.district ? `${detail.district} డెస్క్` : 'DESK'),
          authorAvatar: detail.reporterAvatar,
          sourceName: 'NTODAY NEWS',
          sourceCredit: 'Source: NTODAY NEWS',
          sourceUrl: card.url,
          externalId: card.slug,
          timeAgo: card.rawDate || 'Just now',
          title: detail.title || card.title,
          summary,
          content: detail.content,
          mediaType: 'image',
          imageUrl: detail.imageUrl || card.imageUrl,
          category: detail.category || 'తాజా వార్తలు',
          category_id: detail.category || 'all',
          likesCount: Math.floor(Math.random() * 45) + 30,
          commentsCount: Math.floor(Math.random() * 8),
          audioDurationSeconds: readTimeSec,
          publishedAt: detail.publishedAt || new Date().toISOString(),
          status: 'published',
          comments: [],
        };
      });

      // 5. Cache Page 1 fresh articles into persistent AsyncStorage
      if (page === 1) {
        try {
          await AsyncStorage.setItem(STORAGE_KEY_ARTICLES, JSON.stringify(articles));
          await AsyncStorage.setItem(STORAGE_KEY_TIMESTAMP, Date.now().toString());
        } catch (e) {
          console.warn('[ScraperService] Failed to cache articles:', e);
        }
      }

      const filtered = this.filterArticles(articles, categoryId, limit);
      return {
        articles: filtered,
        hasMore: true,
        total: 500,
      };
    } catch (err) {
      console.warn('[ScraperService] Live scrape failed, trying cache or mock fallback:', err);

      // Attempt reading cache even if expired
      if (page === 1) {
        try {
          const cachedRaw = await AsyncStorage.getItem(STORAGE_KEY_ARTICLES);
          if (cachedRaw) {
            const cachedArticles: NewsArticle[] = JSON.parse(cachedRaw);
            if (cachedArticles.length > 0) {
              const filtered = this.filterArticles(cachedArticles, categoryId, limit);
              return {
                articles: filtered,
                hasMore: true,
                total: cachedArticles.length,
              };
            }
          }
        } catch {
          // Fallback to MOCK_NEWS_ARTICLES below
        }
      }

      return {
        articles: this.filterArticles(MOCK_NEWS_ARTICLES, categoryId, limit),
        hasMore: false,
        total: MOCK_NEWS_ARTICLES.length,
      };
    }
  },

  /**
   * Filter and slice articles helper
   */
  filterArticles(articles: NewsArticle[], categoryId?: string, limit?: number): NewsArticle[] {
    let list = articles;

    if (categoryId && categoryId !== 'all') {
      const q = categoryId.toLowerCase();
      list = list.filter((a) => {
        const cat = (a.category || '').toLowerCase();
        const catId = (a.category_id || '').toLowerCase();
        return cat.includes(q) || catId.includes(q) || q.includes(cat);
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
      // 1. Check cached articles first
      const cachedRaw = await AsyncStorage.getItem(STORAGE_KEY_ARTICLES);
      if (cachedRaw) {
        const cached: NewsArticle[] = JSON.parse(cachedRaw);
        const match = cached.find((a) => a.id === slug || a.externalId === slug);
        if (match && match.content && match.content.length > 100) {
          return match;
        }
      }

      // 2. Fetch directly from website
      const url = `${BASE_URL}/${slug}`;
      const detail = await this.scrapeArticleDetail(url, 'NToday News', '');
      return {
        id: slug,
        cardIndex: 1,
        totalCards: 1,
        authorName: detail.reporterName,
        authorDesk: detail.reporterArea,
        authorAvatar: detail.reporterAvatar,
        sourceName: 'NTODAY NEWS',
        sourceCredit: 'Source: NTODAY NEWS',
        sourceUrl: url,
        timeAgo: 'Today',
        title: detail.title,
        summary: generateSnippet(detail.content, 220),
        content: detail.content,
        mediaType: 'image',
        imageUrl: detail.imageUrl,
        category: detail.category,
        category_id: detail.category,
        likesCount: 52,
        commentsCount: 3,
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
   * Return live categories
   */
  async fetchCategories(): Promise<NewsCategory[]> {
    return [
      { id: 'all', name: 'అన్నీ', name_en: 'All Stories', slug: 'all', icon: 'apps' },
      { id: 'ఆంధ్రప్రదేశ్', name: 'ఆంధ్రప్రదేశ్', name_en: 'Andhra Pradesh', slug: 'ap', icon: 'location' },
      { id: 'తెలంగాణ', name: 'తెలంగాణ', name_en: 'Telangana', slug: 'telangana', icon: 'location-outline' },
      { id: 'రాజకీయాలు', name: 'రాజకీయాలు', name_en: 'Politics', slug: 'politics', icon: 'megaphone' },
      { id: 'క్రైమ్', name: 'క్రైమ్', name_en: 'Crime', slug: 'crime', icon: 'shield-alert' },
      { id: 'సినిమా', name: 'సినిమా', name_en: 'Cinema', slug: 'cinema', icon: 'film' },
      { id: 'క్రీడలు', name: 'క్రీడలు', name_en: 'Sports', slug: 'sports', icon: 'football' },
      { id: 'జాతీయం', name: 'జాతీయం', name_en: 'National', slug: 'national', icon: 'globe' },
      { id: 'వ్యాపారం', name: 'వ్యాపారం', name_en: 'Business', slug: 'business', icon: 'trending-up' },
      { id: 'వ్యవసాయం', name: 'వ్యవసాయం', name_en: 'Agriculture', slug: 'agriculture', icon: 'leaf' },
    ];
  },
};
