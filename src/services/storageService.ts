import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '@/config/appConfig';
import { UserProfile } from '@/types/user';

/**
 * Storage Service handles client-side offline persistence via AsyncStorage.
 * Persists bookmarks, read history, device identity, liked articles, and language preferences.
 */

const isServer = typeof window === 'undefined';

// Generate a random RFC4122-compliant v4 UUID fallback
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const StorageService = {
  // 1. Device ID
  async getDeviceId(): Promise<string> {
    if (isServer) return 'dev-server-static';
    try {
      const existing = await AsyncStorage.getItem(APP_CONFIG.storageKeys.deviceId);
      if (existing) return existing;
      const newId = `dev-${generateUUID()}`;
      await AsyncStorage.setItem(APP_CONFIG.storageKeys.deviceId, newId);
      return newId;
    } catch {
      return 'dev-anonymous-guest';
    }
  },

  // 2. Bookmarks
  async getBookmarks(): Promise<string[]> {
    if (isServer) return [];
    try {
      const raw = await AsyncStorage.getItem(APP_CONFIG.storageKeys.bookmarks);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  },

  async setBookmarks(bookmarks: string[]): Promise<void> {
    if (isServer) return;
    try {
      await AsyncStorage.setItem(APP_CONFIG.storageKeys.bookmarks, JSON.stringify(bookmarks));
    } catch (e) {
      console.warn('[Storage] Failed to save bookmarks:', e);
    }
  },

  async toggleBookmark(articleId: string): Promise<boolean> {
    const list = await StorageService.getBookmarks();
    const isBookmarked = list.includes(articleId);
    const updated = isBookmarked ? list.filter((id) => id !== articleId) : [...list, articleId];
    await StorageService.setBookmarks(updated);
    return !isBookmarked;
  },

  // 3. Read Articles History (for Unread snapshot & badge tracking)
  async getReadArticleIds(): Promise<string[]> {
    if (isServer) return [];
    try {
      const raw = await AsyncStorage.getItem(APP_CONFIG.storageKeys.readArticles);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  },

  async markArticleAsRead(articleId: string): Promise<void> {
    if (isServer) return;
    try {
      const list = await StorageService.getReadArticleIds();
      if (!list.includes(articleId)) {
        const updated = [...list, articleId];
        await AsyncStorage.setItem(APP_CONFIG.storageKeys.readArticles, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('[Storage] Failed to mark article as read:', e);
    }
  },

  // 4. User Likes
  async getLikedArticleIds(): Promise<string[]> {
    if (isServer) return [];
    try {
      const raw = await AsyncStorage.getItem(APP_CONFIG.storageKeys.userLikes);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  },

  async setLikedArticleIds(likedIds: string[]): Promise<void> {
    if (isServer) return;
    try {
      await AsyncStorage.setItem(APP_CONFIG.storageKeys.userLikes, JSON.stringify(likedIds));
    } catch (e) {
      console.warn('[Storage] Failed to save user likes:', e);
    }
  },

  // 5. Language Preference ('te' for Telugu, 'en' for English)
  async getLanguage(): Promise<'te' | 'en'> {
    if (isServer) return 'te';
    try {
      const lang = await AsyncStorage.getItem(APP_CONFIG.storageKeys.language);
      return lang === 'en' ? 'en' : 'te';
    } catch {
      return 'te';
    }
  },

  async setLanguage(lang: 'te' | 'en'): Promise<void> {
    if (isServer) return;
    try {
      await AsyncStorage.setItem(APP_CONFIG.storageKeys.language, lang);
    } catch (e) {
      console.warn('[Storage] Failed to save language:', e);
    }
  },

  // 6. User Profile (Mobile ID, OTP verified name & details)
  async getUserProfile(): Promise<UserProfile | null> {
    if (isServer) return null;
    try {
      const raw = await AsyncStorage.getItem(APP_CONFIG.storageKeys.userProfile);
      return raw ? (JSON.parse(raw) as UserProfile) : null;
    } catch {
      return null;
    }
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    if (isServer) return;
    try {
      await AsyncStorage.setItem(APP_CONFIG.storageKeys.userProfile, JSON.stringify(profile));
    } catch (e) {
      console.warn('[Storage] Failed to save user profile:', e);
    }
  },

  async clearUserProfile(): Promise<void> {
    if (isServer) return;
    try {
      await AsyncStorage.removeItem(APP_CONFIG.storageKeys.userProfile);
    } catch (e) {
      console.warn('[Storage] Failed to clear user profile:', e);
    }
  },
};
