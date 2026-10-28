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
  authorAvatar?: string;
  sourceName: string;
  sourceCredit?: string;
  timeAgo: string;
  title: string;
  content: string;
  mediaType: MediaType;
  imageUrl: string;
  videoUrl?: string;
  category: string;
  likesCount: number;
  commentsCount: number;
  audioDurationSeconds: number;
  isBookmarked?: boolean;
  isLiked?: boolean;
  isDisliked?: boolean;
  isRead?: boolean;
  comments: NewsComment[];
}

export interface TopStory {
  rank: number;
  title: string;
  excerpt: string;
  imageUrl: string;
  timeAgo: string;
  category: string;
  views: string;
}

export interface PlaylistStory {
  id: string;
  title: string;
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
