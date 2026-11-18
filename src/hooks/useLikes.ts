import { useState, useEffect, useCallback } from 'react';
import { StorageService } from '@/services/storageService';
import { LikesService } from '@/services/likesService';

export function useLikes() {
  const [likedArticleIds, setLikedArticleIds] = useState<string[]>([]);
  const [deviceId, setDeviceId] = useState<string>('dev-init');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    Promise.all([StorageService.getDeviceId(), StorageService.getLikedArticleIds()]).then(
      ([devId, likes]) => {
        setDeviceId(devId);
        setLikedArticleIds(likes);
        setIsLoaded(true);
      }
    );
  }, []);

  const toggleLike = useCallback(
    async (articleId: string, currentLikesCount: number) => {
      const isCurrentlyLiked = likedArticleIds.includes(articleId);
      const nextLiked = !isCurrentlyLiked;
      const nextCount = nextLiked ? currentLikesCount + 1 : Math.max(0, currentLikesCount - 1);

      // Optimistic state update
      setLikedArticleIds((prev) =>
        nextLiked ? [...prev, articleId] : prev.filter((id) => id !== articleId)
      );

      // Persist locally and to Supabase
      await LikesService.toggleLike(articleId, deviceId, isCurrentlyLiked);

      return {
        isLiked: nextLiked,
        newCount: nextCount,
      };
    },
    [likedArticleIds, deviceId]
  );

  const isLiked = useCallback(
    (articleId: string) => likedArticleIds.includes(articleId),
    [likedArticleIds]
  );

  return {
    likedArticleIds,
    deviceId,
    isLoaded,
    toggleLike,
    isLiked,
  };
}
