import { useState, useCallback, useEffect } from 'react';
import { NewsComment } from '@/types/news';
import { CommentsService } from '@/services/commentsService';

export function useComments(initialArticleId?: string, initialComments?: NewsComment[]) {
  const [comments, setComments] = useState<NewsComment[]>(initialComments || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async (articleId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await CommentsService.fetchComments(articleId);
      setComments(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialArticleId) {
      loadComments(initialArticleId);
    }
  }, [initialArticleId, loadComments]);

  const addComment = useCallback(
    async (articleId: string, userName: string, text: string): Promise<NewsComment> => {
      // Optimistic temp item
      const tempId = `temp-${Date.now()}`;
      const optimisticComment: NewsComment = {
        id: tempId,
        userName: userName.trim() || 'నేను (మీరు)',
        text: text.trim(),
        timeAgo: 'Just now',
        likesCount: 0,
      };

      setComments((prev) => [optimisticComment, ...prev]);

      try {
        const saved = await CommentsService.addComment(articleId, userName, text);
        // Replace temp with saved row
        setComments((prev) => prev.map((c) => (c.id === tempId ? saved : c)));
        return saved;
      } catch {
        return optimisticComment;
      }
    },
    []
  );

  return {
    comments,
    loading,
    error,
    loadComments,
    addComment,
    setComments,
  };
}
