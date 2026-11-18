import { supabase, isSupabaseReady } from './supabaseClient';
import { StorageService } from './storageService';

export const LikesService = {
  /**
   * Toggle like state for a specific article and device.
   * Updates local persistent storage immediately and synchronizes with Supabase.
   */
  async toggleLike(
    articleId: string,
    deviceId: string,
    currentlyLiked: boolean
  ): Promise<{ success: boolean; isLiked: boolean }> {
    const nextLikedState = !currentlyLiked;

    // 1. Immediately persist to local device storage
    try {
      const storedLikes = await StorageService.getLikedArticleIds();
      const updated = nextLikedState
        ? Array.from(new Set([...storedLikes, articleId]))
        : storedLikes.filter((id) => id !== articleId);
      await StorageService.setLikedArticleIds(updated);
    } catch (e) {
      console.warn('[LikesService] Failed to persist like locally:', e);
    }

    // 2. Synchronize with Supabase if online and configured
    if (!isSupabaseReady() || !supabase) {
      return { success: true, isLiked: nextLikedState };
    }

    try {
      if (nextLikedState) {
        const { error } = await supabase.from('likes').insert({
          article_id: articleId,
          device_id: deviceId,
        });
        if (error && !error.message.includes('duplicate')) {
          console.warn('[LikesService] Insert error:', error.message);
        }
      } else {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('article_id', articleId)
          .eq('device_id', deviceId);
        if (error) {
          console.warn('[LikesService] Delete error:', error.message);
        }
      }
      return { success: true, isLiked: nextLikedState };
    } catch (err) {
      console.warn('[LikesService] Network synchronization error:', err);
      // Fallback succeeds locally
      return { success: true, isLiked: nextLikedState };
    }
  },
};
