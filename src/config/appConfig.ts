export const APP_CONFIG = {
  // Channel identifier for NTODAY NEWS
  channelId: 'ntoday-news',
  channelName: 'NTODAY NEWS',
  channelSlug: 'ntoday',

  // Supabase public configuration
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || '',

  // Public web base URL for sharing and deep links
  webBaseUrl: process.env.EXPO_PUBLIC_WEB_URL?.trim() || 'https://ntoday-news-mobile.vercel.app',
  deepLinkScheme: 'ntoday',

  // Pagination defaults
  articlesPerPage: 10,

  // Cache & Storage keys
  storageKeys: {
    bookmarks: '@ntoday_bookmarks_v1',
    readArticles: '@ntoday_read_history_v1',
    userLikes: '@ntoday_likes_v1',
    language: '@ntoday_language_v1',
    deviceId: '@ntoday_device_id_v1',
    settings: '@ntoday_settings_v1',
  },
} as const;

export function isSupabaseConfigured(): boolean {
  const url = APP_CONFIG.supabaseUrl;
  const key = APP_CONFIG.supabaseAnonKey;
  return (
    Boolean(url && key) &&
    !url.includes('your-project-id') &&
    url.startsWith('https://') &&
    !key.includes('your-anon-key')
  );
}
