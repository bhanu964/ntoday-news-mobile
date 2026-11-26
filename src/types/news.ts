export type MediaType = 'image' | 'video';

export interface NewsComment {
  id: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timeAgo: string;
  likesCount: number;
  isLiked?: boolean;
}

export interface NewsArticle {
  id: string;
  cardIndex: number;
  totalCards: number;
  authorName: string;
  authorDesk: string;
  authorDesk_en?: string;
  authorAvatar?: string;
  sourceName: string;
  sourceCredit?: string;
  sourceUrl?: string;
  externalId?: string;
  importStatus?: 'none' | 'imported' | 'manual' | 'rejected';
  timeAgo: string;
  title: string;
  title_en?: string;
  summary?: string;
  summary_en?: string;
  content: string;
  content_en?: string;
  mediaType: MediaType;
  imageUrl: string;
  videoUrl?: string;
  category: string;
  category_en?: string;
  category_id?: string;
  likesCount: number;
  dislikesCount?: number;
  commentsCount: number;
  audioDurationSeconds: number;
  isBookmarked?: boolean;
  isLiked?: boolean;
  isDisliked?: boolean;
  isRead?: boolean;
  isBreaking?: boolean;
  publishedAt?: string;
  status?: 'draft' | 'published' | 'archived';
  comments: NewsComment[];
}

export interface TopStory {
  rank: number;
  id?: string;
  title: string;
  title_en?: string;
  excerpt: string;
  excerpt_en?: string;
  imageUrl: string;
  timeAgo: string;
  category: string;
  views: string;
}

export interface PlaylistStory {
  id: string;
  title: string;
  title_en?: string;
  duration: string;
  imageUrl: string;
}

export interface FeedbackSubmission {
  type: 'suggestion' | 'bug' | 'content' | 'general';
  rating: number;
  message: string;
  contact?: string;
  submittedAt: string;
}

export interface NewsCategory {
  id: string;
  name: string;
  name_en: string;
  slug: string;
  icon?: string;
  sort_order?: number;
}
