import { supabase, isSupabaseReady } from './supabaseClient';
import { NewsComment } from '@/types/news';
import { CommentRow } from '@/types/database';
import { MOCK_NEWS_ARTICLES } from '@/data/mockNews';

function formatRelativeTime(iso?: string): string {
  if (!iso) return 'Just now';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}hr ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const CommentsService = {
  /**
   * Fetch approved comments for an article from Supabase, or fall back to mock data.
   */
  async fetchComments(articleId: string): Promise<NewsComment[]> {
    if (!isSupabaseReady() || !supabase) {
      return CommentsService.getFallbackComments(articleId);
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('article_id', articleId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error || !data) {
        return CommentsService.getFallbackComments(articleId);
      }

      return (data as CommentRow[]).map((row) => ({
        id: row.id,
        userName: row.user_name,
        text: row.content,
        timeAgo: formatRelativeTime(row.created_at),
        likesCount: row.likes_count ?? 0,
      }));
    } catch {
      return CommentsService.getFallbackComments(articleId);
    }
  },

  /**
   * Submit a new reader comment with optimistic response.
   */
  async addComment(
    articleId: string,
    userName: string,
    text: string
  ): Promise<NewsComment> {
    const fallbackComment: NewsComment = {
      id: `comment-${Date.now()}`,
      userName: userName.trim() || 'నేను (మీరు)',
      text: text.trim(),
      timeAgo: 'Just now',
      likesCount: 0,
    };

    if (!isSupabaseReady() || !supabase) {
      return fallbackComment;
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          article_id: articleId,
          user_name: userName.trim() || 'నేను (మీరు)',
          content: text.trim(),
          status: 'approved',
          likes_count: 0,
        })
        .select()
        .single();

      if (error || !data) {
        return fallbackComment;
      }

      const row = data as CommentRow;
      return {
        id: row.id,
        userName: row.user_name,
        text: row.content,
        timeAgo: 'Just now',
        likesCount: 0,
      };
    } catch {
      return fallbackComment;
    }
  },

  getFallbackComments(articleId: string): NewsComment[] {
    const matched = MOCK_NEWS_ARTICLES.find((a) => a.id === articleId);
    return matched ? [...matched.comments] : [];
  },
};
