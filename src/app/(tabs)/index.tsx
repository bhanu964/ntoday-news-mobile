import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  LayoutChangeEvent,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { TopHeader, FeedFilterType } from '@/components/TopHeader';
import { ReelsFeed, ReelsFeedRef } from '@/components/ReelsFeed';
import { FeedbackModal } from '@/components/FeedbackModal';
import { CategoryFilterModal } from '@/components/CategoryFilterModal';
import { NewsArticle, NewsComment, FeedbackSubmission } from '@/types/news';
import { useArticles } from '@/hooks/useArticles';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useLikes } from '@/hooks/useLikes';
import { StorageService } from '@/services/storageService';
import { TRANSLATIONS } from '@/constants/translations';

export default function FeedTabScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FeedFilterType>('latest');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isTelugu, setIsTelugu] = useState<boolean>(true);

  // Modals state
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);

  // Unread snapshot list & layout measurement
  const [unreadSessionIds, setUnreadSessionIds] = useState<string[]>([]);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const reelsFeedRef = useRef<ReelsFeedRef>(null);

  // Hooks for Data & Services
  const {
    articles,
    loading,
    hasMore,
    loadMore,
    refresh,
    markArticleAsRead,
    setArticles,
  } = useArticles({
    categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
  });

  const { toggleBookmark } = useBookmarks();
  const { toggleLike } = useLikes();

  // Load language preference on startup
  useEffect(() => {
    StorageService.getLanguage().then((lang) => {
      setIsTelugu(lang === 'te');
    });
  }, []);

  const t = TRANSLATIONS[isTelugu ? 'te' : 'en'];

  // Dynamic layout measurement to guarantee 100% card snapping
  const handleLayout = (e: LayoutChangeEvent) => {
    const { height } = e.nativeEvent.layout;
    if (height > 0 && Math.abs(height - containerHeight) > 1) {
      setContainerHeight(height);
    }
  };

  // Calculate unread count
  const unreadCount = useMemo(() => {
    return articles.filter((a) => !a.isRead).length;
  }, [articles]);

  // Filtered news feed based on TopHeader filter or Category
  const filteredArticles = useMemo(() => {
    let list = articles;

    // Filter by Unread snapshot (prevents auto-deleting active item while user is reading it)
    if (activeFilter === 'unread') {
      list = list.filter((a) => unreadSessionIds.includes(a.id));
    }

    // Filter by Category
    if (selectedCategory !== 'all') {
      list = list.filter(
        (a) => a.category === selectedCategory || a.category_id === selectedCategory
      );
    }

    return list;
  }, [articles, activeFilter, unreadSessionIds, selectedCategory]);

  const handleActiveIndexChange = (index: number, article: NewsArticle) => {
    if (!article.isRead) {
      markArticleAsRead(article.id);
    }
  };

  const handleFilterChange = (filter: FeedFilterType) => {
    if (filter === 'feedback') {
      setShowFeedbackModal(true);
      return;
    }
    if (filter === 'unread') {
      const unread = articles.filter((a) => !a.isRead).map((a) => a.id);
      setUnreadSessionIds(unread);
    }
    setActiveFilter(filter);
    reelsFeedRef.current?.scrollToIndex(0, false);
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

  const handleFeedbackSubmit = (feedback: FeedbackSubmission) => {
    console.log('[NTODAY Feedback Submitted]:', feedback);
  };

  const handleLanguageToggle = () => {
    const next = !isTelugu;
    setIsTelugu(next);
    StorageService.setLanguage(next ? 'te' : 'en');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 1. TOP HEADER */}
      <TopHeader
        activeFilter={activeFilter}
        unreadCount={unreadCount}
        isTelugu={isTelugu}
        onFilterChange={handleFilterChange}
        onLanguageToggle={handleLanguageToggle}
        onUserPress={() => {
          router.push('/account' as any);
        }}
      />

      {/* 2. ACTIVE FILTER STATUS CHIP (When Category is applied) */}
      {selectedCategory !== 'all' && (
        <View style={styles.activeFilterBanner}>
          <Text style={styles.activeFilterText}>
            {`${t.categoryBanner}${selectedCategory}`}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setSelectedCategory('all');
            }}>
            <Ionicons name="close-circle" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* 3. MAIN CONTENT: REELS-STYLE VERTICAL SWIPING NEWS FEED */}
      <View style={styles.mainContent} onLayout={handleLayout}>
        {containerHeight <= 0 ? (
          <View style={{ flex: 1, backgroundColor: '#121214' }} />
        ) : loading && articles.length === 0 ? (
          <View style={styles.emptyFeedBox}>
            <ActivityIndicator size="large" color="#E50914" />
          </View>
        ) : filteredArticles.length === 0 ? (
          <View style={styles.emptyFeedBox}>
            <Ionicons name="checkmark-done-circle" size={56} color="#E50914" />
            <Text style={styles.emptyFeedTitle}>
              {activeFilter === 'unread' ? t.allCaughtUpTitle : t.noNewsTitle}
            </Text>
            <Text style={styles.emptyFeedSubtitle}>
              {activeFilter === 'unread' ? t.allCaughtUpSubtitle : t.noNewsSubtitle}
            </Text>
            <TouchableOpacity
              style={styles.resetFeedBtn}
              onPress={() => {
                setActiveFilter('latest');
                setSelectedCategory('all');
                refresh();
                reelsFeedRef.current?.scrollToIndex(0, false);
              }}>
              <Text style={styles.resetFeedBtnText}>{t.viewAllBtn}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ReelsFeed
            ref={reelsFeedRef}
            articles={filteredArticles}
            containerHeight={containerHeight}
            isTelugu={isTelugu}
            onBookmarkChange={handleBookmarkToggle}
            onAddComment={handleAddComment}
            onActiveIndexChange={handleActiveIndexChange}
            onLoadMore={loadMore}
            onToggleLike={toggleLike}
          />
        )}
      </View>

      {/* 4. FEEDBACK MODAL */}
      <FeedbackModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleFeedbackSubmit}
      />

      {/* 5. CATEGORY FILTER MODAL */}
      <CategoryFilterModal
        visible={showFilterModal}
        selectedCategory={selectedCategory}
        isTelugu={isTelugu}
        onSelectCategory={setSelectedCategory}
        onClose={() => setShowFilterModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
    ...(Platform.OS === 'web'
      ? {
          height: '100vh',
          // @ts-ignore
          height: '100dvh',
          overflow: 'hidden',
          overscrollBehavior: 'contain',
        }
      : {}),
  },
  mainContent: {
    flex: 1,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          height: '100%',
          overscrollBehavior: 'contain',
          touchAction: 'pan-y',
        }
      : {}),
  },
  activeFilterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E50914',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyFeedBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyFeedTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 14,
  },
  emptyFeedSubtitle: {
    color: '#A1A1AA',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  resetFeedBtn: {
    backgroundColor: '#E50914',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  resetFeedBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
