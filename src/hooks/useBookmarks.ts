import { useState, useEffect, useCallback } from 'react';
import { StorageService } from '@/services/storageService';

export function useBookmarks() {
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    StorageService.getBookmarks().then((ids) => {
      setBookmarkedIds(ids);
      setIsLoaded(true);
    });
  }, []);

  const toggleBookmark = useCallback(async (articleId: string) => {
    // Optimistic state update
    setBookmarkedIds((prev) => {
      const exists = prev.includes(articleId);
      return exists ? prev.filter((id) => id !== articleId) : [...prev, articleId];
    });

    const isNowBookmarked = await StorageService.toggleBookmark(articleId);
    return isNowBookmarked;
  }, []);

  const isBookmarked = useCallback(
    (articleId: string) => bookmarkedIds.includes(articleId),
    [bookmarkedIds]
  );

  return {
    bookmarkedIds,
    isLoaded,
    toggleBookmark,
    isBookmarked,
  };
}
