import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Modal,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { TopHeader } from '@/components/TopHeader';
import { NewsCard } from '@/components/NewsCard';
import { BottomNavBar, TabKey } from '@/components/BottomNavBar';
import { ExploreView } from '@/components/ExploreView';
import { AccountView } from '@/components/AccountView';
import { LiveView } from '@/components/LiveView';
import { VideosView } from '@/components/VideosView';
import { MOCK_NEWS_ARTICLES } from '@/data/mockNews';
import { TopStory } from '@/types/news';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MainAppScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Track active card index on vertical scroll
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleStorySelect = (story: TopStory) => {
    setActiveTab('home');
    const matchedIndex = MOCK_NEWS_ARTICLES.findIndex((a) =>
      a.title.includes(story.title.substring(0, 15))
    );
    if (matchedIndex !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: matchedIndex, animated: true });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 1. TOP HEADER (Shown on Home and Feed tabs) */}
      {(activeTab === 'home' || activeTab === 'feed') && (
        <TopHeader
          onBookmarksPress={() => setShowAccountModal(true)}
          onFilterPress={() => setShowAccountModal(true)}
        />
      )}

      {/* 2. MAIN CONTENT AREA */}
      <View style={styles.mainContent}>
        {activeTab === 'home' && (
          <FlatList
            ref={flatListRef}
            data={MOCK_NEWS_ARTICLES}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <View style={{ height: SCREEN_HEIGHT - 120 }}>
                <NewsCard
                  article={item}
                  currentIndex={index + 1}
                  totalCards={MOCK_NEWS_ARTICLES.length}
                />
              </View>
            )}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            snapToInterval={SCREEN_HEIGHT - 120}
            snapToAlignment="start"
            decelerationRate="fast"
          />
        )}

        {activeTab === 'live' && <LiveView />}

        {activeTab === 'feed' && (
          <FlatList
            data={MOCK_NEWS_ARTICLES}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <View style={{ height: SCREEN_HEIGHT - 120 }}>
                <NewsCard
                  article={item}
                  currentIndex={index + 1}
                  totalCards={MOCK_NEWS_ARTICLES.length}
                />
              </View>
            )}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            snapToInterval={SCREEN_HEIGHT - 120}
            snapToAlignment="start"
            decelerationRate="fast"
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

      {/* 3. BOTTOM NAVIGATION BAR */}
      <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 4. ACCOUNT MODAL SCREEN (Screenshot 4) */}
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
});
