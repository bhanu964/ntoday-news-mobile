import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  useWindowDimensions,
  LayoutChangeEvent,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { TopHeader, FeedFilterType } from '@/components/TopHeader';
import { NewsCard } from '@/components/NewsCard';
import { BottomNavBar, TabKey } from '@/components/BottomNavBar';
import { ExploreView } from '@/components/ExploreView';
import { AccountView } from '@/components/AccountView';
import { LiveView } from '@/components/LiveView';
import { VideosView } from '@/components/VideosView';
import { FeedbackModal } from '@/components/FeedbackModal';
import { CategoryFilterModal } from '@/components/CategoryFilterModal';
import { MOCK_NEWS_ARTICLES } from '@/data/mockNews';
import { NewsArticle, NewsComment, TopStory, FeedbackSubmission } from '@/types/news';

export default function MainAppScreen() {
  const { height: windowHeight } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [activeFilter, setActiveFilter] = useState<FeedFilterType>('latest');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isTelugu, setIsTelugu] = useState<boolean>(true);

  // Modals state
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [showOnlyBookmarks, setShowOnlyBookmarks] = useState<boolean>(false);

  // Dynamic articles state (tracks read/unread, bookmarks, likes, comments)
  const [articles, setArticles] = useState<NewsArticle[]>(MOCK_NEWS_ARTICLES);
  const [containerHeight, setContainerHeight] = useState<number>(windowHeight - 110);
  const flatListRef = useRef<FlatList>(null);

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

  // Filtered news feed based on TopHeader filter, Category, or Bookmarks
  const filteredArticles = useMemo(() => {
    let list = articles;

    // Filter by Bookmarks if active
    if (showOnlyBookmarks) {
      list = list.filter((a) => a.isBookmarked);
    }

    // Filter by Unread / Latest
    if (activeFilter === 'unread') {
      list = list.filter((a) => !a.isRead);
    }

    // Filter by Category
    if (selectedCategory !== 'all') {
      list = list.filter((a) => a.category === selectedCategory);
    }

    return list;
  }, [articles, activeFilter, selectedCategory, showOnlyBookmarks]);

  // Mark article as read when scrolled into view
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].item) {
        const item: NewsArticle = viewableItems[0].item;
        if (!item.isRead) {
          setArticles((prev) =>
            prev.map((a) => (a.id === item.id ? { ...a, isRead: true } : a))
          );
        }
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  // Handle header filter clicks
  const handleFilterChange = (filter: FeedFilterType) => {
    if (filter === 'feedback') {
      setShowFeedbackModal(true);
      return;
    }
    setActiveFilter(filter);
    setShowOnlyBookmarks(false);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleBookmarkToggle = (id: string, isBookmarked: boolean) => {
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
    const matchedIndex = articles.findIndex((a) =>
      a.title.includes(story.title.substring(0, 15))
    );
    if (matchedIndex !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: matchedIndex, animated: true });
    }
  };

  const handleFeedbackSubmit = (feedback: FeedbackSubmission) => {
    // Stores feedback in state / logs it
    console.log('[NTODAY Feedback Submitted]:', feedback);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 1. TOP HEADER (Shown on Home & Feed tabs) */}
      {(activeTab === 'home' || activeTab === 'feed') && (
        <TopHeader
          activeFilter={activeFilter}
          unreadCount={unreadCount}
          isTelugu={isTelugu}
          onFilterChange={handleFilterChange}
          onLanguageToggle={() => setIsTelugu(!isTelugu)}
          onTunePress={() => setShowFilterModal(true)}
          onBookmarksPress={() => {
            const next = !showOnlyBookmarks;
            setShowOnlyBookmarks(next);
            Alert.alert(
              next ? 'బుక్‌మార్క్స్ మోడ్' : 'అన్ని వార్తలు',
              next ? 'సేవ్ చేసిన వార్తలను చూపిస్తున్నాము.' : 'తిరిగి పూర్తి వార్తలకు వచ్చారు.'
            );
          }}
        />
      )}

      {/* 2. ACTIVE FILTER STATUS CHIP (When Category or Bookmarks are applied) */}
      {(selectedCategory !== 'all' || showOnlyBookmarks) && activeTab === 'home' && (
        <View style={styles.activeFilterBanner}>
          <Text style={styles.activeFilterText}>
            {showOnlyBookmarks ? '🔖 సేవ్ చేసిన బుక్‌మార్క్స్' : `📂 కేటగిరీ: ${selectedCategory}`}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setSelectedCategory('all');
              setShowOnlyBookmarks(false);
            }}>
            <Ionicons name="close-circle" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* 3. MAIN CONTENT: REELS-STYLE VERTICAL SWIPING NEWS FEED */}
      <View style={styles.mainContent} onLayout={handleLayout}>
        {activeTab === 'home' && (
          filteredArticles.length === 0 ? (
            <View style={styles.emptyFeedBox}>
              <Ionicons name="checkmark-done-circle" size={56} color="#E50914" />
              <Text style={styles.emptyFeedTitle}>
                {activeFilter === 'unread'
                  ? 'మీరు అన్ని తాజా వార్తలను చదివేశారు! 🎉'
                  : 'వార్తలు అందుబాటులో లేవు'}
              </Text>
              <Text style={styles.emptyFeedSubtitle}>
                {activeFilter === 'unread'
                  ? "You're all caught up! No unread news left."
                  : 'No stories found in this section.'}
              </Text>
              <TouchableOpacity
                style={styles.resetFeedBtn}
                onPress={() => {
                  setActiveFilter('latest');
                  setSelectedCategory('all');
                  setShowOnlyBookmarks(false);
                }}>
                <Text style={styles.resetFeedBtnText}>అన్ని వార్తలను చూడండి (View All)</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={filteredArticles}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <View style={{ height: containerHeight }}>
                  <NewsCard
                    article={item}
                    currentIndex={index + 1}
                    totalCards={filteredArticles.length}
                    cardHeight={containerHeight}
                    isTelugu={isTelugu}
                    onBookmarkChange={handleBookmarkToggle}
                    onAddComment={handleAddComment}
                  />
                </View>
              )}
              pagingEnabled
              showsVerticalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              snapToInterval={containerHeight}
              snapToAlignment="start"
              decelerationRate="fast"
              getItemLayout={(_, index) => ({
                length: containerHeight,
                offset: containerHeight * index,
                index,
              })}
            />
          )
        )}

        {activeTab === 'live' && <LiveView />}

        {activeTab === 'feed' && (
          <FlatList
            data={filteredArticles}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <View style={{ height: containerHeight }}>
                <NewsCard
                  article={item}
                  currentIndex={index + 1}
                  totalCards={filteredArticles.length}
                  cardHeight={containerHeight}
                  isTelugu={isTelugu}
                  onBookmarkChange={handleBookmarkToggle}
                  onAddComment={handleAddComment}
                />
              </View>
            )}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            snapToInterval={containerHeight}
            snapToAlignment="start"
            decelerationRate="fast"
            getItemLayout={(_, index) => ({
              length: containerHeight,
              offset: containerHeight * index,
              index,
            })}
          />
        )}

        {activeTab === 'videos' && <VideosView />}

        {activeTab === 'explore' && (
          <ExploreView
            onStorySelect={handleStorySelect}
            onOpenAccount={() => setShowAccountModal(true)}
          />
        )}
      </View>

      {/* 4. BOTTOM NAVIGATION BAR (5 Icons) */}
      <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 5. FEEDBACK MODAL (Opens on Feedback button click) */}
      <FeedbackModal
        visible={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleFeedbackSubmit}
      />

      {/* 6. CATEGORY FILTER MODAL (Opens on Tune icon click) */}
      <CategoryFilterModal
        visible={showFilterModal}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onClose={() => setShowFilterModal(false)}
      />

      {/* 7. ACCOUNT MODAL SCREEN */}
      <Modal
        visible={showAccountModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowAccountModal(false)}>
        <AccountView onBack={() => setShowAccountModal(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  mainContent: {
    flex: 1,
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
