import { useState, useEffect, useCallback, useRef } from 'react';
import { NewsArticle } from '@/types/news';
import { ArticlesService, FetchArticlesParams } from '@/services/articlesService';
import { StorageService } from '@/services/storageService';

export interface UseArticlesOptions {
  categoryId?: string;
  isBreaking?: boolean;
  searchQuery?: string;
  autoFetch?: boolean;
}

export function useArticles(options: UseArticlesOptions = {}) {
  const { categoryId, isBreaking, searchQuery, autoFetch = true } = options;

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
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Decorate articles with local persistent states (read status, bookmarks, likes)
   */
  const decorateArticles = useCallback(
    async (rawArticles: NewsArticle[]): Promise<NewsArticle[]> => {
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
    },
    []
  );

  /**
   * Main fetcher
   */
  const fetchArticlesData = useCallback(
    async (pageNum: number, isRefresh = false) => {
      if (pageNum === 1) {
        if (!isRefresh) setLoading(true);
      } else {
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
        if (!isMountedRef.current) return;

        const decorated = await decorateArticles(result.articles);
        if (!isMountedRef.current) return;

        if (pageNum === 1) {
          setArticles(decorated);
        } else {
          setArticles((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const newOnes = decorated.filter((a) => !existingIds.has(a.id));
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
      } catch (err: any) {
        if (!isMountedRef.current) return;
        setError(err?.message || 'Failed to load news');
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [categoryId, isBreaking, searchQuery, decorateArticles]
  );

  useEffect(() => {
    if (autoFetch) {
      fetchArticlesData(1);
    }
  }, [fetchArticlesData, autoFetch]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchArticlesData(1, true);
  }, [fetchArticlesData]);

  const loadMore = useCallback(async () => {
    if (!loading && !loadingMore && hasMore) {
      await fetchArticlesData(page + 1);
    }
  }, [loading, loadingMore, hasMore, page, fetchArticlesData]);

  const markArticleAsRead = useCallback(async (articleId: string) => {
    // 1. Immediately update in-memory article state
    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, isRead: true } : a))
    );
    // 2. Persist to AsyncStorage
    await StorageService.markArticleAsRead(articleId);
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
  };
}
