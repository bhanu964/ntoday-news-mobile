import { supabase, isSupabaseReady } from './supabaseClient';
import { APP_CONFIG } from '@/config/appConfig';
import { NewsArticle, TopStory, NewsCategory } from '@/types/news';
import { ArticleRow, CategoryRow } from '@/types/database';
import { MOCK_NEWS_ARTICLES, TOP_STORIES } from '@/data/mockNews';

export interface FetchArticlesParams {
  channelId?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
  isBreaking?: boolean;
  searchQuery?: string;
}

export interface FetchArticlesResult {
  articles: NewsArticle[];
  hasMore: boolean;
  total: number;
  isFallback: boolean;
}

// Helper to format ISO timestamp into human-readable relative time (e.g. "12min ago")
function formatTimeAgo(isoString?: string | null): string {
  if (!isoString) return 'Just now';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}hr ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// Transform database row into client NewsArticle entity
function mapRowToArticle(row: ArticleRow, index: number, total: number): NewsArticle {
  return {
    id: row.id,
    cardIndex: index + 1,
    totalCards: total,
    authorName: row.author ? row.author.split('(')[0].trim() : 'Desk Reporter',
    authorDesk: row.author && row.author.includes('(') ? row.author.replace(/.*\(|\).*/g, '') : 'DESK',
    sourceName: row.source_name || row.source || 'NTODAY NEWS',
    sourceCredit: row.source_name ? `Source: ${row.source_name}` : row.source || 'The Clearcut News',
    sourceUrl: row.source_url || undefined,
    externalId: row.external_id || undefined,
    importStatus: row.import_status || undefined,
    timeAgo: formatTimeAgo(row.published_at),
    title: row.title,
    title_en: row.title_en || undefined,
    summary: row.summary || undefined,
    summary_en: row.summary_en || undefined,
    content: row.content,
    content_en: row.content_en || undefined,
    mediaType: row.video_url ? 'video' : 'image',
    imageUrl: row.image_url,
    videoUrl: row.video_url || undefined,
    category: row.category_id,
    category_id: row.category_id,
    likesCount: row.like_count ?? 0,
    commentsCount: row.comment_count ?? 0,
    audioDurationSeconds: Math.max(25, Math.min(60, Math.round(row.content.length / 10))),
    isBreaking: row.is_breaking,
    publishedAt: row.published_at,
    status: row.status,
    comments: [],
  };
}

export const ArticlesService = {
  /**
   * Fetch paginated published articles for the configured channel.
   * Falls back to MOCK_NEWS_ARTICLES on network or config failures.
   */
  async fetchArticles(params: FetchArticlesParams = {}): Promise<FetchArticlesResult> {
    const channelId = params.channelId || APP_CONFIG.channelId;
    const page = params.page ?? 1;
    const limit = params.limit ?? APP_CONFIG.articlesPerPage;
    const offset = (page - 1) * limit;

    if (!isSupabaseReady() || !supabase) {
      return ArticlesService.getFallbackArticles(params);
    }

    try {
      let query = supabase
        .from('articles')
        .select('*', { count: 'exact' })
        .eq('channel_id', channelId)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (params.categoryId && params.categoryId !== 'all') {
        query = query.eq('category_id', params.categoryId);
      }

      if (params.isBreaking) {
        query = query.eq('is_breaking', true);
      }

      if (params.searchQuery && params.searchQuery.trim()) {
        const term = `%${params.searchQuery.trim()}%`;
        query = query.or(
          `title.ilike.${term},title_en.ilike.${term},content.ilike.${term},content_en.ilike.${term}`
        );
      }

      query = query.range(offset, offset + limit - 1);

      const { data, count, error } = await query;

      if (error || !data || data.length === 0) {
        if (page === 1) {
          console.warn('[ArticlesService] Remote empty or error, using mock fallback:', error?.message);
          return ArticlesService.getFallbackArticles(params);
        }
        return {
          articles: [],
          hasMore: false,
          total: count ?? 0,
          isFallback: false,
        };
      }

      const totalCount = count ?? data.length;
      const articles = (data as ArticleRow[]).map((row, idx) =>
        mapRowToArticle(row, offset + idx, totalCount)
      );

      return {
        articles,
        hasMore: offset + data.length < totalCount,
        total: totalCount,
        isFallback: false,
      };
    } catch (err) {
      console.warn('[ArticlesService] Fetch error, falling back to mock:', err);
      return ArticlesService.getFallbackArticles(params);
    }
  },

  /**
   * Helper that filters mock data matching the requested parameters.
   */
  getFallbackArticles(params: FetchArticlesParams): FetchArticlesResult {
    let list = [...MOCK_NEWS_ARTICLES];

    if (params.categoryId && params.categoryId !== 'all') {
      list = list.filter(
        (a) => a.category === params.categoryId || a.category_id === params.categoryId
      );
    }

    if (params.isBreaking) {
      list = list.filter((a) => a.isBreaking);
    }

    if (params.searchQuery && params.searchQuery.trim()) {
      const q = params.searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.title_en && a.title_en.toLowerCase().includes(q)) ||
          a.content.toLowerCase().includes(q)
      );
    }

    const page = params.page ?? 1;
    const limit = params.limit ?? APP_CONFIG.articlesPerPage;
    const offset = (page - 1) * limit;
    const paginated = list.slice(offset, offset + limit);

    return {
      articles: paginated.map((a, idx) => ({
        ...a,
        cardIndex: offset + idx + 1,
        totalCards: list.length,
      })),
      hasMore: offset + limit < list.length,
      total: list.length,
      isFallback: true,
    };
  },

  /**
   * Fetch an individual article by ID from Supabase or fallback mock data.
   */
  async fetchArticleById(id: string): Promise<NewsArticle | null> {
    if (isSupabaseReady() && supabase) {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('id', id)
          .single();

        if (data && !error) {
          return mapRowToArticle(data as ArticleRow, 0, 1);
        }
      } catch {
        // Fallback below
      }
    }

    // Search local fallback mock articles
    const mock = MOCK_NEWS_ARTICLES.find((a) => a.id === id);
    if (mock) {
      return { ...mock, cardIndex: 1, totalCards: 1 };
    }

    return null;
  },

  /**
   * Fetch Top Stories for Explore screen.
   */
  async fetchTopStories(): Promise<TopStory[]> {
    if (!isSupabaseReady() || !supabase) {
      return TOP_STORIES;
    }

    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('channel_id', APP_CONFIG.channelId)
        .eq('status', 'published')
        .order('like_count', { ascending: false })
        .limit(5);

      if (error || !data || data.length === 0) {
        return TOP_STORIES;
      }

      return (data as ArticleRow[]).map((row, idx) => ({
        rank: idx + 1,
        id: row.id,
        title: row.title,
        title_en: row.title_en || undefined,
        excerpt: row.summary || row.content.slice(0, 90) + '...',
        excerpt_en: row.summary_en || (row.content_en ? row.content_en.slice(0, 90) + '...' : undefined),
        imageUrl: row.image_url,
        timeAgo: formatTimeAgo(row.published_at),
        category: row.category_id,
        views: `${Math.max(10, (row.like_count + 1) * 3 + 12)}.${idx + 1}K`,
      }));
    } catch {
      return TOP_STORIES;
    }
  },

  /**
   * Fetch Categories from Supabase or fallback.
   */
  async fetchCategories(): Promise<NewsCategory[]> {
    if (!isSupabaseReady() || !supabase) {
      return defaultCategories;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('channel_id', APP_CONFIG.channelId)
        .order('sort_order', { ascending: true });

      if (error || !data || data.length === 0) {
        return defaultCategories;
      }

      return (data as CategoryRow[]).map((c) => ({
        id: c.id,
        name: c.name,
        name_en: c.name_en,
        slug: c.slug,
        icon: c.icon || 'apps',
        sort_order: c.sort_order,
      }));
    } catch {
      return defaultCategories;
    }
  },
};

const defaultCategories: NewsCategory[] = [
  { id: 'all', name: 'అన్నీ', name_en: 'All Stories', slug: 'all', icon: 'apps' },
  { id: 'cat-politics', name: 'రాజకీయాలు', name_en: 'Politics', slug: 'politics', icon: 'megaphone' },
  { id: 'cat-crime', name: 'క్రైమ్', name_en: 'Crime', slug: 'crime', icon: 'shield-alert' },
  { id: 'cat-weather', name: 'వాతావరణం', name_en: 'Weather', slug: 'weather', icon: 'cloudy-night' },
  { id: 'cat-business', name: 'బిజినెస్', name_en: 'Business', slug: 'business', icon: 'trending-up' },
  { id: 'cat-education', name: 'విద్య & ఉద్యోగాలు', name_en: 'Jobs & Education', slug: 'education', icon: 'school' },
  { id: 'cat-telangana', name: 'తెలంగాణ', name_en: 'Telangana', slug: 'telangana', icon: 'location' },
  { id: 'cat-cinema', name: 'సినిమా', name_en: 'Cinema', slug: 'cinema', icon: 'film' },
  { id: 'cat-sports', name: 'క్రీడలు', name_en: 'Sports', slug: 'sports', icon: 'football' },
  { id: 'cat-agriculture', name: 'వ్యవసాయం', name_en: 'Agriculture', slug: 'agriculture', icon: 'leaf' },
  { id: 'cat-tech', name: 'టెక్నాలజీ', name_en: 'Tech & ISRO', slug: 'technology', icon: 'rocket' },
];
