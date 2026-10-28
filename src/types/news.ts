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
  imageUrl: string;
  category: string;
  likesCount: number;
  commentsCount: number;
  audioDurationSeconds: number;
  isBookmarked?: boolean;
  isLiked?: boolean;
  isDisliked?: boolean;
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
