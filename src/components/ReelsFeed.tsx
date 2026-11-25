import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
  useWindowDimensions,
} from 'react-native';
import { NewsArticle, NewsComment } from '@/types/news';
import { NewsCard } from './NewsCard';

export interface ReelsFeedRef {
  scrollToIndex: (index: number, animated?: boolean) => void;
  getActiveIndex: () => number;
}

interface ReelsFeedProps {
  articles: NewsArticle[];
  containerHeight?: number;
  isTelugu?: boolean;
  onBookmarkChange?: (id: string, isBookmarked: boolean) => void;
  onAddComment?: (articleId: string, comment: NewsComment) => void;
  onActiveIndexChange?: (index: number, article: NewsArticle) => void;
  onLoadMore?: () => void;
  onToggleLike?: (articleId: string, currentLikes: number) => Promise<{ newCount: number; isLiked: boolean } | void>;
  onCardPress?: () => void;
  initialIndex?: number;
}

export const ReelsFeed = forwardRef<ReelsFeedRef, ReelsFeedProps>(function ReelsFeed(
  {
    articles,
    containerHeight = 0,
    isTelugu = true,
    onBookmarkChange,
    onAddComment,
    onActiveIndexChange,
    onLoadMore,
    onToggleLike,
    onCardPress,
    initialIndex = 0,
  },
  ref
) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const cardWidth = Platform.OS === 'web' ? Math.min(windowWidth, 480) : windowWidth;
  const flatListRef = useRef<FlatList>(null);

  // Measure and track the exact visible feed height (area between top header and bottom nav bar)
  const [feedHeight, setFeedHeight] = useState<number>(() => containerHeight || 0);

  useEffect(() => {
    if (containerHeight > 0 && Math.abs(containerHeight - feedHeight) > 1) {
      setFeedHeight(containerHeight);
    }
  }, [containerHeight]);

  const handleContainerLayout = useCallback((e: LayoutChangeEvent) => {
    const { height } = e.nativeEvent.layout;
    if (height > 0 && Math.abs(height - feedHeight) > 1) {
      setFeedHeight(height);
    }
  }, [feedHeight]);

  const PAGE_HEIGHT = feedHeight > 0 ? feedHeight : (containerHeight > 0 ? containerHeight : windowHeight - 110);

  // Single authoritative active index
  const [activeIndex, setActiveIndex] = useState<number>(() =>
    Math.max(0, Math.min(initialIndex, Math.max(0, articles.length - 1)))
  );

  const activeIndexRef = useRef<number>(activeIndex);
  activeIndexRef.current = activeIndex;

  const isWheelLockedRef = useRef<boolean>(false);

  // Diagnostic logging helper
  const logFeed = (message: string) => {
    console.log(`[FEED] ${message}`);
  };

  // Synchronize when PAGE_HEIGHT is determined or changes (safe area or orientation changes)
  useEffect(() => {
    if (PAGE_HEIGHT > 0 && activeIndexRef.current > 0) {
      flatListRef.current?.scrollToIndex({
        index: activeIndexRef.current,
        animated: false,
      });
    }
  }, [PAGE_HEIGHT]);

  // Adjust active index if articles list changes/shrinks
  useEffect(() => {
    if (articles.length === 0) {
      setActiveIndex(0);
      activeIndexRef.current = 0;
    } else if (activeIndexRef.current >= articles.length) {
      const nextIdx = articles.length - 1;
      setActiveIndex(nextIdx);
      activeIndexRef.current = nextIdx;
      flatListRef.current?.scrollToIndex({
        index: nextIdx,
        animated: false,
      });
    }
  }, [articles.length]);

  // Expose imperative API for external control (e.g. story selection from Explore screen)
  useImperativeHandle(ref, () => ({
    scrollToIndex: (index: number, animated = true) => {
      const clampedIndex = Math.max(0, Math.min(index, articles.length - 1));
      logFeed(`Programmatic scroll to index=${clampedIndex} (animated=${animated})`);
      activeIndexRef.current = clampedIndex;
      setActiveIndex(clampedIndex);
      try {
        flatListRef.current?.scrollToIndex({
          index: clampedIndex,
          animated,
        });
      } catch (err) {
        // Safe fallback if layout is pending
      }
    },
    getActiveIndex: () => activeIndexRef.current,
  }));

  // GESTURE & SCROLL LIFECYCLE HANDLERS

  // A. Gesture release without momentum: commit destination index
  const handleScrollEndDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (PAGE_HEIGHT <= 0) return;
      const velocityY = Math.abs(e.nativeEvent.velocity?.y ?? 0);
      // Only handle slow drag releases where momentum does not take over
      if (velocityY < 0.05) {
        const offsetY = e.nativeEvent.contentOffset.y;
        const settledIndex = Math.max(0, Math.min(Math.round(offsetY / PAGE_HEIGHT), articles.length - 1));
        if (settledIndex !== activeIndexRef.current) {
          activeIndexRef.current = settledIndex;
          setActiveIndex(settledIndex);
          if (articles[settledIndex]) {
            onActiveIndexChange?.(settledIndex, articles[settledIndex]);
          }
        }
      }
    },
    [PAGE_HEIGHT, articles, onActiveIndexChange]
  );

  // B. Native Momentum settled: Authoritative commit of active index
  // Controls expo-video play/pause and unread tracking on mobile
  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (PAGE_HEIGHT <= 0) return;
      const offsetY = e.nativeEvent.contentOffset.y;
      const settledIndex = Math.max(0, Math.min(Math.round(offsetY / PAGE_HEIGHT), articles.length - 1));

      logFeed(`Paging snapped: index=${settledIndex}`);

      if (settledIndex !== activeIndexRef.current) {
        activeIndexRef.current = settledIndex;
        setActiveIndex(settledIndex);
        if (articles[settledIndex]) {
          onActiveIndexChange?.(settledIndex, articles[settledIndex]);
        }
      }

      // Pagination near the end
      if (settledIndex >= articles.length - 2) {
        onLoadMore?.();
      }
    },
    [PAGE_HEIGHT, articles, onActiveIndexChange, onLoadMore]
  );

  // C. Web scroll synchronization for mobile browsers (touch snapping) & desktop
  const handleWebScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (Platform.OS !== 'web' || PAGE_HEIGHT <= 0) return;
      const offsetY = e.nativeEvent.contentOffset.y;
      const settledIndex = Math.max(0, Math.min(Math.round(offsetY / PAGE_HEIGHT), articles.length - 1));
      if (settledIndex !== activeIndexRef.current) {
        activeIndexRef.current = settledIndex;
        setActiveIndex(settledIndex);
        if (articles[settledIndex]) {
          onActiveIndexChange?.(settledIndex, articles[settledIndex]);
        }
        if (settledIndex >= articles.length - 2) {
          onLoadMore?.();
        }
      }
    },
    [PAGE_HEIGHT, articles, onActiveIndexChange, onLoadMore]
  );

  // D. Desktop Web Wheel / Trackpad listener: strictly 1 story per wheel flick
  const handleWebWheel = useCallback(
    (e: any) => {
      if (Platform.OS !== 'web' || PAGE_HEIGHT <= 0) return;
      const deltaY = e?.nativeEvent?.deltaY ?? e?.deltaY ?? 0;
      if (Math.abs(deltaY) < 25) return;

      // Lock rapid wheel momentum events
      if (isWheelLockedRef.current) return;
      isWheelLockedRef.current = true;
      setTimeout(() => {
        isWheelLockedRef.current = false;
      }, 450);

      const currentIndex = activeIndexRef.current;
      const targetIndex =
        deltaY > 0
          ? Math.min(currentIndex + 1, articles.length - 1)
          : Math.max(currentIndex - 1, 0);

      if (targetIndex !== currentIndex) {
        logFeed(`Web wheel triggered: from=${currentIndex} to=${targetIndex}`);
        activeIndexRef.current = targetIndex;
        setActiveIndex(targetIndex);
        flatListRef.current?.scrollToIndex({
          index: targetIndex,
          animated: true,
        });
        if (articles[targetIndex]) {
          onActiveIndexChange?.(targetIndex, articles[targetIndex]);
        }
      }
    },
    [PAGE_HEIGHT, articles, onActiveIndexChange]
  );

  if (PAGE_HEIGHT <= 0) {
    return <View style={styles.placeholder} onLayout={handleContainerLayout} />;
  }

  return (
    <View
      style={[
        styles.container,
        { height: PAGE_HEIGHT, width: cardWidth },
        Platform.OS === 'web' && ({
          height: '100%',
          overflow: 'hidden',
          overscrollBehavior: 'contain',
          touchAction: 'pan-y',
        } as any),
      ]}
      onLayout={handleContainerLayout}
      // @ts-ignore: onWheel is supported on react-native-web
      onWheel={Platform.OS === 'web' ? handleWebWheel : undefined}>
      <FlatList
        ref={flatListRef}
        data={articles}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.cardWrapper,
              { height: PAGE_HEIGHT, width: cardWidth },
              Platform.OS === 'web' && ({
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                height: PAGE_HEIGHT,
              } as any),
            ]}>
            <NewsCard
              article={item}
              currentIndex={index + 1}
              totalCards={articles.length}
              cardHeight={PAGE_HEIGHT}
              cardWidth={cardWidth}
              isTelugu={isTelugu}
              isActive={index === activeIndex}
              onBookmarkChange={onBookmarkChange}
              onAddComment={onAddComment}
              onToggleLike={onToggleLike}
              onCardPress={onCardPress}
            />
          </View>
        )}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        // Native full-page paging configuration (Way2News / Instagram Reels physics)
        pagingEnabled
        snapToInterval={PAGE_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        // Strict deterministic item layout
        getItemLayout={(_, index) => ({
          length: PAGE_HEIGHT,
          offset: PAGE_HEIGHT * index,
          index,
        })}
        // Scroll event handlers
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScroll={Platform.OS === 'web' ? handleWebScroll : undefined}
        scrollEventThrottle={16}
        // Memory & Virtualization
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews={Platform.OS !== 'web'}
        // Safe fallback for scrollToIndex
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: false,
            });
          }, 80);
        }}
        style={[
          styles.flatList,
          Platform.OS === 'web' && ({
            height: '100%',
            overflowY: 'scroll',
            scrollSnapType: 'y mandatory',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          } as any),
        ]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  placeholder: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  flatList: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cardWrapper: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
});
