import AsyncStorage from '@react-native-async-storage/async-storage';
import { NewsArticle } from '@/types/news';

const TRANSLATION_CACHE_KEY = '@ntoday_translation_cache_v1';
const MAX_CACHE_ENTRIES = 400;

const KNOWN_CATEGORY_EN: Record<string, string> = {
  'అన్నీ': 'All Stories',
  'తెలంగాణ': 'Telangana',
  'ఆంధ్రప్రదేశ్': 'Andhra Pradesh',
  'వినోదం': 'Entertainment',
  'భక్తి': 'Devotional',
  'క్రీడలు': 'Sports',
  'జాతీయం': 'National',
  'అంతర్జాతీయం': 'International',
  'ఆర్టీఐ': 'RTI',
  'రాజకీయాలు': 'Politics',
  'క్రైమ్': 'Crime',
  'తాజా వార్తలు': 'Latest News',
  'వార్తలు': 'News',
  'డెస్క్': 'Desk',
  'విద్య': 'Education',
  'బిజినెస్': 'Business',
  'వ్యాపారం': 'Business',
  'వ్యవసాయం': 'Agriculture',
  'టెక్నాలజీ': 'Technology',
  'వాతావరణం': 'Weather',
};

const TELUGU_CHAR_REGEX = /[\u0C00-\u0C7F]/;

// In-memory LRU-like cache & in-flight request deduplication
const memoryCache = new Map<string, string>();
const inFlightRequests = new Map<string, Promise<string>>();
let cacheLoaded = false;
let cacheLoadPromise: Promise<void> | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

async function ensureCacheLoaded(): Promise<void> {
  if (cacheLoaded) return;
  if (cacheLoadPromise) return cacheLoadPromise;

  cacheLoadPromise = (async () => {
    try {
      if (typeof window !== 'undefined') {
        const raw = await AsyncStorage.getItem(TRANSLATION_CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Record<string, string>;
          for (const [k, v] of Object.entries(parsed)) {
            memoryCache.set(k, v);
          }
        }
      }
    } catch {
      // Ignore storage errors
    } finally {
      cacheLoaded = true;
    }
  })();

  return cacheLoadPromise;
}

function scheduleCachePersist(): void {
  if (typeof window === 'undefined') return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      // Trim oldest entries if over limit
      while (memoryCache.size > MAX_CACHE_ENTRIES) {
        const firstKey = memoryCache.keys().next().value;
        if (firstKey !== undefined) memoryCache.delete(firstKey);
        else break;
      }
      const obj = Object.fromEntries(memoryCache.entries());
      await AsyncStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(obj));
    } catch {
      // Ignore persist errors
    }
  }, 500);
}

function makeCacheKey(text: string): string {
  const normalized = text.trim();
  if (normalized.length <= 80) return normalized;
  // Lightweight deterministic hash + prefix/length signature to keep storage keys compact
  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `${normalized.slice(0, 32)}_${normalized.length}_${(hash >>> 0).toString(36)}`;
}

function splitIntoChunks(text: string, maxLen = 850): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > maxLen) {
    let splitIdx = remaining.lastIndexOf('\n', maxLen);
    if (splitIdx < maxLen * 0.4) splitIdx = remaining.lastIndexOf('. ', maxLen);
    if (splitIdx < maxLen * 0.4) splitIdx = remaining.lastIndexOf(' ', maxLen);
    if (splitIdx <= 0) splitIdx = maxLen;

    chunks.push(remaining.slice(0, splitIdx + 1).trim());
    remaining = remaining.slice(splitIdx + 1).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

async function fetchGoogleTranslateChunk(chunk: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=te&tl=en&dt=t&q=${encodeURIComponent(
      chunk
    )}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const joined = data[0]
        .map((seg: any) => (Array.isArray(seg) && typeof seg[0] === 'string' ? seg[0] : ''))
        .join('')
        .trim();
      if (joined) return joined;
    }
    return chunk;
  } catch {
    clearTimeout(timeoutId);
    return chunk;
  }
}

export const TranslationService = {
  hasTeluguScript(text?: string | null): boolean {
    if (!text) return false;
    return TELUGU_CHAR_REGEX.test(text);
  },

  /**
   * Instant synchronous lookup if category/label has known translation or cache hit.
   */
  getCachedSync(text?: string | null): string | undefined {
    if (!text) return undefined;
    const trimmed = text.trim();
    if (!trimmed) return '';
    if (!this.hasTeluguScript(trimmed)) return trimmed;
    if (KNOWN_CATEGORY_EN[trimmed]) return KNOWN_CATEGORY_EN[trimmed];
    return memoryCache.get(makeCacheKey(trimmed));
  },

  /**
   * Free Telugu -> English translation with persistent caching & request deduplication.
   */
  async translateToEnglish(text?: string | null): Promise<string> {
    if (!text) return '';
    const trimmed = text.trim();
    if (!trimmed) return '';

    // Already English/numeric
    if (!this.hasTeluguScript(trimmed)) return trimmed;

    // Known instant dictionary hit
    if (KNOWN_CATEGORY_EN[trimmed]) return KNOWN_CATEGORY_EN[trimmed];

    await ensureCacheLoaded();

    const cacheKey = makeCacheKey(trimmed);
    const cached = memoryCache.get(cacheKey);
    if (cached) return cached;

    const existingPromise = inFlightRequests.get(cacheKey);
    if (existingPromise) return existingPromise;

    const promise = (async () => {
      try {
        const chunks = splitIntoChunks(trimmed, 850);
        const translatedChunks = await Promise.all(chunks.map(fetchGoogleTranslateChunk));
        const result = translatedChunks.join('\n').replace(/\n{3,}/g, '\n\n').trim();

        // Cache only if translation actually changed / contains non-error output
        if (result && result !== trimmed) {
          memoryCache.set(cacheKey, result);
          scheduleCachePersist();
        }
        return result || trimmed;
      } finally {
        inFlightRequests.delete(cacheKey);
      }
    })();

    inFlightRequests.set(cacheKey, promise);
    return promise;
  },

  /**
   * Synchronously translates known category names or falls back cleanly to async API.
   */
  async translateCategory(categoryName: string): Promise<string> {
    const trimmed = categoryName.trim();
    if (!trimmed) return 'News';
    if (KNOWN_CATEGORY_EN[trimmed]) return KNOWN_CATEGORY_EN[trimmed];
    return this.translateToEnglish(trimmed);
  },

  /**
   * Translates headline, category, desk, summary and content for an article and returns an enriched copy.
   */
  async translateArticle(article: NewsArticle): Promise<NewsArticle> {
    const needsTitle = !article.title_en && this.hasTeluguScript(article.title);
    const needsContent = !article.content_en && this.hasTeluguScript(article.content);
    const needsSummary = !article.summary_en && this.hasTeluguScript(article.summary);
    const needsCategory = !article.category_en && this.hasTeluguScript(article.category);
    const needsDesk = !article.authorDesk_en && this.hasTeluguScript(article.authorDesk);

    if (!needsTitle && !needsContent && !needsSummary && !needsCategory && !needsDesk) {
      return article;
    }

    const [titleEn, contentEn, summaryEn, categoryEn, deskEn] = await Promise.all([
      needsTitle ? this.translateToEnglish(article.title) : Promise.resolve(article.title_en || article.title),
      needsContent ? this.translateToEnglish(article.content) : Promise.resolve(article.content_en || article.content),
      needsSummary
        ? article.summary && article.content && article.content.startsWith(article.summary.replace(/\.\.\.$/, ''))
          ? Promise.resolve('') // derive summary cleanly from translated content below to halve API calls!
          : this.translateToEnglish(article.summary)
        : Promise.resolve(article.summary_en || article.summary || ''),
      needsCategory ? this.translateCategory(article.category) : Promise.resolve(article.category_en || article.category),
      needsDesk ? this.translateToEnglish(article.authorDesk) : Promise.resolve(article.authorDesk_en || article.authorDesk),
    ]);

    const resolvedSummaryEn = summaryEn || (contentEn ? contentEn.slice(0, 1200) : titleEn);

    return {
      ...article,
      title_en: titleEn || article.title,
      content_en: contentEn || article.content,
      summary_en: resolvedSummaryEn,
      category_en: categoryEn || article.category,
      authorDesk_en: deskEn || article.authorDesk,
    };
  },
};
