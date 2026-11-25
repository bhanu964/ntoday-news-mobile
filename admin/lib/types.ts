export interface Article {
  id: string;
  channel_id: string;
  category_id: string;
  title: string;
  title_en: string | null;
  summary: string | null;
  summary_en: string | null;
  content: string;
  content_en: string | null;
  image_url: string;
  video_url: string | null;
  source: string | null;
  source_name?: string | null;
  source_url?: string | null;
  external_id?: string | null;
  imported_at?: string | null;
  import_status?: 'none' | 'imported' | 'manual' | 'rejected' | null;
  author: string | null;
  status: 'draft' | 'published' | 'archived';
  is_breaking: boolean;
  published_at: string;
  like_count: number;
  comment_count: number;
  created_at: string;
}

export interface Category {
  id: string;
  channel_id: string;
  name: string;
  name_en: string;
  slug: string;
  icon?: string;
  sort_order: number;
}

export interface Comment {
  id: string;
  article_id: string;
  user_name: string;
  content: string;
  likes_count: number;
  status: 'approved' | 'pending' | 'rejected';
  created_at: string;
  articles?: {
    title: string;
  };
}

export interface Editor {
  id: string;
  email: string;
  role: 'admin' | 'editor';
  channel_id: string;
  is_active: boolean;
  created_at: string;
}
