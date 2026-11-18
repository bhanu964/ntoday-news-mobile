export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type GenericRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export type ChannelRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  created_at: string;
};

export type CategoryRow = {
  id: string;
  channel_id: string;
  name: string;
  name_en: string;
  slug: string;
  icon: string | null;
  sort_order: number;
  created_at: string;
};

export type ArticleRow = {
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
  author: string | null;
  status: 'draft' | 'published' | 'archived';
  is_breaking: boolean;
  published_at: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
};

export type CommentRow = {
  id: string;
  article_id: string;
  user_name: string;
  content: string;
  likes_count: number;
  status: 'approved' | 'pending' | 'rejected';
  created_at: string;
};

export type LikeRow = {
  id: string;
  article_id: string;
  device_id: string;
  created_at: string;
};

export type DeviceRow = {
  id: string;
  device_id: string;
  platform: 'android' | 'ios' | 'web' | 'unknown';
  fcm_token: string | null;
  last_active_at: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      channels: {
        Row: ChannelRow;
        Insert: {
          id: string;
          name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          created_at?: string;
        };
        Relationships: GenericRelationship[];
      };
      categories: {
        Row: CategoryRow;
        Insert: {
          id: string;
          channel_id: string;
          name: string;
          name_en: string;
          slug: string;
          icon?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          channel_id?: string;
          name?: string;
          name_en?: string;
          slug?: string;
          icon?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: GenericRelationship[];
      };
      articles: {
        Row: ArticleRow;
        Insert: {
          id?: string;
          channel_id: string;
          category_id: string;
          title: string;
          title_en?: string | null;
          summary?: string | null;
          summary_en?: string | null;
          content: string;
          content_en?: string | null;
          image_url: string;
          video_url?: string | null;
          source?: string | null;
          author?: string | null;
          status?: 'draft' | 'published' | 'archived';
          is_breaking?: boolean;
          published_at?: string;
          like_count?: number;
          comment_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          channel_id?: string;
          category_id?: string;
          title?: string;
          title_en?: string | null;
          summary?: string | null;
          summary_en?: string | null;
          content?: string;
          content_en?: string | null;
          image_url?: string;
          video_url?: string | null;
          source?: string | null;
          author?: string | null;
          status?: 'draft' | 'published' | 'archived';
          is_breaking?: boolean;
          published_at?: string;
          like_count?: number;
          comment_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: GenericRelationship[];
      };
      comments: {
        Row: CommentRow;
        Insert: {
          id?: string;
          article_id: string;
          user_name: string;
          content: string;
          likes_count?: number;
          status?: 'approved' | 'pending' | 'rejected';
          created_at?: string;
        };
        Update: {
          id?: string;
          article_id?: string;
          user_name?: string;
          content?: string;
          likes_count?: number;
          status?: 'approved' | 'pending' | 'rejected';
          created_at?: string;
        };
        Relationships: GenericRelationship[];
      };
      likes: {
        Row: LikeRow;
        Insert: {
          id?: string;
          article_id: string;
          device_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          article_id?: string;
          device_id?: string;
          created_at?: string;
        };
        Relationships: GenericRelationship[];
      };
      devices: {
        Row: DeviceRow;
        Insert: {
          id?: string;
          device_id: string;
          platform?: 'android' | 'ios' | 'web' | 'unknown';
          fcm_token?: string | null;
          last_active_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          platform?: 'android' | 'ios' | 'web' | 'unknown';
          fcm_token?: string | null;
          last_active_at?: string;
          created_at?: string;
        };
        Relationships: GenericRelationship[];
      };
    };
    Views: Record<string, {
      Row: Record<string, unknown>;
      Relationships: GenericRelationship[];
    }>;
    Functions: Record<string, {
      Args: Record<string, unknown>;
      Returns: unknown;
    }>;
  };
};
