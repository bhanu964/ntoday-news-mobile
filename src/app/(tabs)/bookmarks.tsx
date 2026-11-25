import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  LayoutChangeEvent,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReelsFeed, ReelsFeedRef } from '@/components/ReelsFeed';
import { NewsArticle, NewsComment } from '@/types/news';
import { useArticles } from '@/hooks/useArticles';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useLikes } from '@/hooks/useLikes';
import { StorageService } from '@/services/storageService';
import { TRANSLATIONS } from '@/constants/translations';

export default function BookmarksTabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isTelugu, setIsTelugu] = useState<boolean>(true);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const reelsFeedRef = useRef<ReelsFeedRef>(null);

  const { articles, loading, setArticles } = useArticles();
  const { bookmarkedIds, toggleBookmark } = useBookmarks();
  const { toggleLike } = useLikes();

  useEffect(() => {
    StorageService.getLanguage().then((lang) => {
      setIsTelugu(lang === 'te');
    });
  }, []);

  const t = TRANSLATIONS[isTelugu ? 'te' : 'en'];

  const bookmarkedArticles = useMemo(() => {
    return articles.filter((a) => a.isBookmarked || bookmarkedIds.includes(a.id));
  }, [articles, bookmarkedIds]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { height } = e.nativeEvent.layout;
    if (height > 0 && Math.abs(height - containerHeight) > 1) {
      setContainerHeight(height);
    }
  };

  const handleBookmarkToggle = async (id: string, isBookmarked: boolean) => {
    await toggleBookmark(id);
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isBookmarked } : a))
    );
  };

  const handleAddComment = (articleId: string, comment: NewsComment) => {
    setArticles((prev) =>
      prev.map((a) =>
        a.id === articleId
          ? {
              ...a,
              commentsCount: a.commentsCount + 1,
              comments: [comment, ...a.comments],
            }
          : a
      )
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
        <View style={styles.headerLeft}>
          <Ionicons name="bookmark" size={22} color="#E50914" />
          <Text style={styles.headerTitle}>
            {isTelugu ? 'సేవ్ చేసిన కథనాలు' : 'Saved Bookmarks'}
          </Text>
        </View>
        <Text style={styles.countBadge}>
          {bookmarkedArticles.length} {isTelugu ? 'కథనాలు' : 'stories'}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.mainContent} onLayout={handleLayout}>
        {containerHeight <= 0 ? (
          <View style={{ flex: 1, backgroundColor: '#121214' }} />
        ) : loading && articles.length === 0 ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#E50914" />
          </View>
        ) : bookmarkedArticles.length === 0 ? (
          <View style={styles.centerBox}>
            <Ionicons name="bookmark-outline" size={56} color="#71717A" />
            <Text style={styles.emptyTitle}>
              {isTelugu ? 'బుక్‌మార్క్‌లు ఏవీ లేవు' : 'No Bookmarks Saved'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isTelugu
                ? 'మీకు నచ్చిన వార్తను సేవ్ చేసుకోవడానికి కథనంపై ఉన్న బుక్‌మార్క్ చిహ్నాన్ని నొక్కండి.'
                : 'Tap the bookmark icon on any story to save it here for reading later offline.'}
            </Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => router.push('/(tabs)')}>
              <Text style={styles.browseBtnText}>
                {isTelugu ? 'తాజా వార్తలను చూడండి' : 'Browse Latest News'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ReelsFeed
            ref={reelsFeedRef}
            articles={bookmarkedArticles}
            containerHeight={containerHeight}
            isTelugu={isTelugu}
            onBookmarkChange={handleBookmarkToggle}
            onAddComment={handleAddComment}
            onToggleLike={toggleLike}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#09090B',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#27272a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  countBadge: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#71717A',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  browseBtn: {
    backgroundColor: '#E50914',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  browseBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
