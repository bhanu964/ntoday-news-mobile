import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  useWindowDimensions,
  LayoutChangeEvent,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { TopHeader, FeedFilterType } from '@/components/TopHeader';
import { ReelsFeed, ReelsFeedRef } from '@/components/ReelsFeed';
import { BottomNavBar, TabKey } from '@/components/BottomNavBar';
import { ExploreView } from '@/components/ExploreView';
import { AccountView } from '@/components/AccountView';
import { LiveView } from '@/components/LiveView';
import { VideosView } from '@/components/VideosView';
import { FeedbackModal } from '@/components/FeedbackModal';
import { CategoryFilterModal } from '@/components/CategoryFilterModal';
import { NewsArticle, NewsCategory, NewsComment, TopStory, FeedbackSubmission } from '@/types/news';
import { useArticles } from '@/hooks/useArticles';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useLikes } from '@/hooks/useLikes';
import { useLanguage } from '@/context/LanguageContext';

export default function MainAppScreen() {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isTelugu, t, toggleLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [activeFilter, setActiveFilter] = useState<FeedFilterType>('latest');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCategoryObj, setSelectedCategoryObj] = useState<NewsCategory | null>(null);

  // Modals state
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [showOnlyBookmarks, setShowOnlyBookmarks] = useState<boolean>(false);

  // Unread snapshot list & layout measurement
  const [unreadSessionIds, setUnreadSessionIds] = useState<string[]>([]);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const reelsFeedRef = useRef<ReelsFeedRef>(null);

  // Immersive Mode Animation (TopHeader & BottomNavBar hidden by default, slide in/out smoothly on tap)
  const chromeAnim = useRef(new Animated.Value(0)).current;
  const [isChromeVisible, setIsChromeVisible] = useState<boolean>(false);

  // Smooth slide toggle for top header & bottom nav bar on screen click
  const handleToggleChrome = useCallback(() => {
    setIsChromeVisible((prev) => {
      const next = !prev;
      Animated.timing(chromeAnim, {
        toValue: next ? 1 : 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
      return next;
    });
  }, [chromeAnim]);

  // Hooks for Data & Services
  const {
    articles,
    loading,
    refreshing,
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

  // Strict filtered news feed based on TopHeader filter, exact Category, or Bookmarks
  const filteredArticles = useMemo(() => {
    let list = articles;

    if (showOnlyBookmarks) {
      list = list.filter((a) => a.isBookmarked);
    }

    if (activeFilter === 'unread') {
      list = list.filter((a) => unreadSessionIds.includes(a.id));
    }

    if (selectedCategory !== 'all') {
      const q = selectedCategory.trim().toLowerCase();
      const catName = selectedCategoryObj?.name?.trim().toLowerCase();
      list = list.filter((a) => {
        const aCat = (a.category || '').trim().toLowerCase();
        const aCatId = (a.category_id || '').trim().toLowerCase();
        return aCatId === q || aCat === q || (Boolean(catName) && aCat === catName);
      });
    }

    return list;
  }, [articles, activeFilter, unreadSessionIds, selectedCategory, selectedCategoryObj, showOnlyBookmarks]);

  // Mark article as read when user settles on it without disrupting scroll or deleting active card
  const handleActiveIndexChange = (index: number, article: NewsArticle) => {
    if (!article.isRead) {
      markArticleAsRead(article.id);
    }
    // Auto-hide navigation chrome when user swipes to next story (Way2News behavior)
    if (isChromeVisible) {
      setIsChromeVisible(false);
      Animated.timing(chromeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  // Handle header filter clicks
  const handleFilterChange = (filter: FeedFilterType) => {
    if (filter === 'feedback') {
      setShowFeedbackModal(true);
      return;
    }
    if (filter === 'unread') {
      // Capture stable snapshot of unread articles for this browsing session
      const unread = articles.filter((a) => !a.isRead).map((a) => a.id);
      setUnreadSessionIds(unread);
    }
    setActiveFilter(filter);
    setShowOnlyBookmarks(false);
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

  const handleStorySelect = (story: TopStory) => {
    setActiveTab('home');
    setActiveFilter('latest');
    setShowOnlyBookmarks(false);
    const matchedIndex = articles.findIndex(
      (a) =>
        (story.id && a.id === story.id) ||
        a.title.includes(story.title.substring(0, 15))
    );
    if (matchedIndex !== -1) {
      setTimeout(() => {
        reelsFeedRef.current?.scrollToIndex(matchedIndex, true);
      }, 60);
    }
  };

  const handleFeedbackSubmit = (feedback: FeedbackSubmission) => {
    console.log('[NTODAY Feedback Submitted]:', feedback);
  };

  const handleLanguageToggle = () => {
    toggleLanguage();
  };

  const handleSelectCategory = (catId: string, catObj?: NewsCategory) => {
    setSelectedCategory(catId);
    setSelectedCategoryObj(catId === 'all' ? null : catObj || null);
    setActiveTab('home');
    setActiveFilter('latest');
    setShowOnlyBookmarks(false);
    reelsFeedRef.current?.scrollToIndex(0, false);
  };

  const activeCategoryLabel = selectedCategoryObj
    ? isTelugu
      ? selectedCategoryObj.name
      : selectedCategoryObj.name_en || selectedCategoryObj.name
    : selectedCategory;

  const handleReload = useCallback(async () => {
    reelsFeedRef.current?.scrollToIndex(0, true);
    await refresh();
  }, [refresh]);

  return (
    <View style={styles.container}>
      {/* Solid black status bar area – photo starts cleanly below it, like Way2News */}
      <View style={{ height: insets.top, backgroundColor: '#000000', width: '100%' }} />
      <StatusBar style="light" />

      {/* 1. TOP HEADER OVERLAY (Hidden on app open; smoothly slides down on single-tap, like Way2News) */}
      <Animated.View
        pointerEvents={isChromeVisible && (activeTab === 'home' || activeTab === 'feed') ? 'auto' : 'none'}
        style={[
          styles.headerOverlay,
          {
            transform: [
              {
                translateY: chromeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-100, 0],
                }),
              },
            ],
            opacity: chromeAnim.interpolate({
              inputRange: [0, 0.2, 1],
              outputRange: [0, 0.5, 1],
            }),
          },
        ]}>
        <View style={styles.headerOverlayInner}>
          <TopHeader
            activeFilter={activeFilter}
            unreadCount={unreadCount}
            isTelugu={isTelugu}
            onFilterChange={handleFilterChange}
            onLanguageToggle={handleLanguageToggle}
            onUserPress={() => setShowAccountModal(true)}
          />
          {/* ACTIVE FILTER STATUS CHIP (When Category or Bookmarks are applied) */}
          {(selectedCategory !== 'all' || showOnlyBookmarks) && activeTab === 'home' && (
            <View style={styles.activeFilterBanner}>
              <Text style={styles.activeFilterText}>
                {showOnlyBookmarks ? t.savedBookmarksBanner : `${t.categoryBanner}${activeCategoryLabel}`}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSelectedCategory('all');
                  setSelectedCategoryObj(null);
                  setShowOnlyBookmarks(false);
                }}>
                <Ionicons name="close-circle" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>

      {/* 3. MAIN CONTENT: REELS-STYLE VERTICAL SWIPING NEWS FEED */}
      <Animated.View
        style={[
          styles.mainContent,
          {
            transform: [
              {
                translateY: chromeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -56],
                }),
              },
            ],
          },
        ]}
        onLayout={handleLayout}>
        {containerHeight <= 0 ? (
          <View style={{ flex: 1, backgroundColor: '#121214' }} />
        ) : (
          <>
            {activeTab === 'home' &&
              (loading && articles.length === 0 ? (
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
                      setSelectedCategoryObj(null);
                      setShowOnlyBookmarks(false);
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
                  onCardPress={handleToggleChrome}
                />
              ))}

            {activeTab === 'live' && <LiveView isTelugu={isTelugu} />}

            {activeTab === 'feed' && (
              <ReelsFeed
                articles={filteredArticles}
                containerHeight={containerHeight}
                isTelugu={isTelugu}
                onBookmarkChange={handleBookmarkToggle}
                onAddComment={handleAddComment}
                onActiveIndexChange={handleActiveIndexChange}
                onLoadMore={loadMore}
                onToggleLike={toggleLike}
                onCardPress={handleToggleChrome}
              />
            )}

            {activeTab === 'videos' && <VideosView isTelugu={isTelugu} />}

            {activeTab === 'explore' && (
              <ExploreView
                onStorySelect={handleStorySelect}
                onOpenAccount={() => setShowAccountModal(true)}
                isTelugu={isTelugu}
              />
            )}
          </>
        )}
      </Animated.View>

      {/* 4. WAY2NEWS STYLE FOOTER BAR (Hidden by default in immersive mode; smoothly slides up on tap) */}
      <Animated.View
        pointerEvents={isChromeVisible ? 'auto' : 'none'}
        style={[
          styles.bottomNavOverlay,
          {
            transform: [
              {
                translateY: chromeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [90, 0],
                }),
              },
            ],
            opacity: chromeAnim.interpolate({
              inputRange: [0, 0.2, 1],
              outputRange: [0, 0.5, 1],
            }),
          },
        ]}>
        <BottomNavBar
          isTelugu={isTelugu}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onHomePress={() => {
            setActiveTab('home');
            reelsFeedRef.current?.scrollToIndex(0, true);
          }}
          onNewsPlusPress={() => setShowFilterModal(true)}
          onReloadPress={handleReload}
          isReloading={refreshing}
        />
      </Animated.View>

      {/* 5. FEEDBACK MODAL (Opens on Feedback button click) */}
      <FeedbackModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleFeedbackSubmit}
      />

      {/* 6. CATEGORY FILTER MODAL (Opens on News+ click) */}
      <CategoryFilterModal
        visible={showFilterModal}
        selectedCategory={selectedCategory}
        isTelugu={isTelugu}
        onSelectCategory={handleSelectCategory}
        onClose={() => setShowFilterModal(false)}
      />

      {/* 7. ACCOUNT MODAL SCREEN */}
      <Modal
        visible={showAccountModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowAccountModal(false)}>
        <View style={styles.accountModalWrapper}>
          <View style={styles.accountModalContainer}>
            <AccountView isTelugu={isTelugu} onBack={() => setShowAccountModal(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
    position: 'relative',
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
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 10,
    backgroundColor: '#121214',
    alignItems: 'center',
  },
  headerOverlayInner: {
    width: '100%',
    maxWidth: 480,
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
  bottomNavWrapper: {
    width: '100%',
    backgroundColor: '#0E0E12',
    overflow: 'hidden',
  },
  bottomNavOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 90,
    elevation: 9,
  },
  accountModalWrapper: {
    flex: 1,
    backgroundColor: '#09090b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountModalContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#121214',
  },
});
