import { useState, useEffect, useCallback, useRef } from 'react';
import { NewsArticle } from '@/types/news';
import { ArticlesService, FetchArticlesParams } from '@/services/articlesService';
import { StorageService } from '@/services/storageService';
import { TranslationService } from '@/services/translationService';
import { useLanguage } from '@/context/LanguageContext';

export interface UseArticlesOptions {
  categoryId?: string;
  isBreaking?: boolean;
  searchQuery?: string;
  autoFetch?: boolean;
}

export function useArticles(options: UseArticlesOptions = {}) {
  const { categoryId, isBreaking, searchQuery, autoFetch = true } = options;
  const { language } = useLanguage();

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const isMountedRef = useRef(true);
  const activeRequestIdRef = useRef(0);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Decorate articles with local persistent states (read status, bookmarks, likes)
   */
  const decorateArticles = useCallback(async (rawArticles: NewsArticle[]): Promise<NewsArticle[]> => {
    try {
      const [readIds, bookmarkIds, likedIds] = await Promise.all([
        StorageService.getReadArticleIds(),
        StorageService.getBookmarks(),
        StorageService.getLikedArticleIds(),
      ]);

      return rawArticles.map((a) => ({
        ...a,
        isRead: a.isRead || readIds.includes(a.id),
        isBookmarked: bookmarkIds.includes(a.id),
        isLiked: likedIds.includes(a.id),
      }));
    } catch {
      return rawArticles;
    }
  }, []);

  /**
   * Background progressive translation when English mode is active (prioritizes top/first items)
   */
  const translateBatchInBackground = useCallback(
    async (items: NewsArticle[], reqId: number) => {
      if (language !== 'en' || items.length === 0) return;

      // Translate in small chunks of 3 so visible cards update first without blocking UI
      const chunkSize = 3;
      for (let i = 0; i < items.length; i += chunkSize) {
        if (!isMountedRef.current || reqId !== activeRequestIdRef.current) return;

        const slice = items.slice(i, i + chunkSize).filter(
          (a) => !a.title_en || !a.content_en
        );
        if (slice.length === 0) continue;

        const translatedSlice = await Promise.all(
          slice.map((item) => TranslationService.translateArticle(item))
        );

        if (!isMountedRef.current || reqId !== activeRequestIdRef.current) return;

        const byId = new Map(translatedSlice.map((t) => [t.id, t]));
        setArticles((prev) =>
          prev.map((existing) => (byId.has(existing.id) ? byId.get(existing.id)! : existing))
        );
      }
    },
    [language]
  );

  /**
   * Main fetcher with strict race-condition isolation per category
   */
  const fetchArticlesData = useCallback(
    async (pageNum: number, isRefresh = false) => {
      const reqId =
        pageNum === 1 ? ++activeRequestIdRef.current : activeRequestIdRef.current;

      if (pageNum === 1) {
        setPage(1);
        setHasMore(true);
        if (!isRefresh) {
          setArticles([]); // Immediately clear stale articles on strict category switch
          setLoading(true);
        }
      } else {
        if (loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
      }
      setError(null);

      const params: FetchArticlesParams = {
        categoryId,
        isBreaking,
        searchQuery,
        page: pageNum,
        forceRefresh: isRefresh,
      };

      try {
        const result = await ArticlesService.fetchArticles(params);
        if (!isMountedRef.current || reqId !== activeRequestIdRef.current) return;

        const decorated = await decorateArticles(result.articles);
        if (!isMountedRef.current || reqId !== activeRequestIdRef.current) return;

        // Immediately translate visible page-1 head item before rendering if English is active
        let finalBatch = decorated;
        if (language === 'en' && decorated.length > 0 && pageNum === 1) {
          const headCount = Math.min(2, decorated.length);
          const translatedHead = await Promise.all(
            decorated.slice(0, headCount).map((item) => TranslationService.translateArticle(item))
          );
          if (!isMountedRef.current || reqId !== activeRequestIdRef.current) return;
          finalBatch = [...translatedHead, ...decorated.slice(headCount)];
        }

        if (pageNum === 1) {
          setArticles(finalBatch);
        } else {
          setArticles((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const newOnes = finalBatch.filter((a) => !existingIds.has(a.id));
            const combined = [...prev, ...newOnes];
            return combined.map((item, idx) => ({
              ...item,
              cardIndex: idx + 1,
              totalCards: combined.length,
            }));
          });
        }

        setHasMore(result.hasMore);
        setTotal(result.total);
        setIsFallback(result.isFallback);
        setPage(pageNum);

        // Translate remaining items in background while user reads
        if (language === 'en') {
          translateBatchInBackground(finalBatch, reqId).catch(() => {});
        }
      } catch (err: any) {
        if (!isMountedRef.current || reqId !== activeRequestIdRef.current) return;
        setError(err?.message || 'Failed to load news');
      } finally {
        if (pageNum > 1) {
          loadingMoreRef.current = false;
        }
        if (isMountedRef.current && reqId === activeRequestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [categoryId, isBreaking, searchQuery, decorateArticles, language, translateBatchInBackground]
  );

  useEffect(() => {
    if (autoFetch) {
      fetchArticlesData(1);
    }
  }, [categoryId, isBreaking, searchQuery, autoFetch]);

  // Whenever user switches language to English, translate loaded articles progressively
  useEffect(() => {
    if (language === 'en' && articles.length > 0) {
      translateBatchInBackground(articles, activeRequestIdRef.current).catch(() => {});
    }
  }, [language]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchArticlesData(1, true);
    } catch (err) {
      console.warn('[useArticles] Refresh error:', err);
    } finally {
      if (isMountedRef.current) setRefreshing(false);
    }
  }, [fetchArticlesData]);

  const loadMore = useCallback(async () => {
    if (!loading && !loadingMore && !loadingMoreRef.current && hasMore) {
      await fetchArticlesData(page + 1);
    }
  }, [loading, loadingMore, hasMore, page, fetchArticlesData]);

  const markArticleAsRead = useCallback(async (articleId: string) => {
    setArticles((prev) => prev.map((a) => (a.id === articleId ? { ...a, isRead: true } : a)));
    await StorageService.markArticleAsRead(articleId);
  }, []);

  const updateArticleInState = useCallback((updatedArticle: NewsArticle) => {
    setArticles((prev) =>
      prev.map((a) => (a.id === updatedArticle.id ? { ...a, ...updatedArticle } : a))
    );
  }, []);

  return {
    articles,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    total,
    error,
    isFallback,
    refresh,
    loadMore,
    markArticleAsRead,
    setArticles,
    updateArticleInState,
  };
}
