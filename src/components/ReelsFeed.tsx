import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
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
  containerHeight: number;
  isTelugu?: boolean;
  onBookmarkChange?: (id: string, isBookmarked: boolean) => void;
  onAddComment?: (articleId: string, comment: NewsComment) => void;
  onActiveIndexChange?: (index: number, article: NewsArticle) => void;
  onLoadMore?: () => void;
  onToggleLike?: (articleId: string, currentLikes: number) => Promise<{ newCount: number; isLiked: boolean } | void>;
  initialIndex?: number;
}

export const ReelsFeed = forwardRef<ReelsFeedRef, ReelsFeedProps>(function ReelsFeed(
  {
    articles,
    containerHeight,
    isTelugu = true,
    onBookmarkChange,
    onAddComment,
    onActiveIndexChange,
    onLoadMore,
    onToggleLike,
    initialIndex = 0,
  },
  ref
) {
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = Platform.OS === 'web' ? Math.min(windowWidth, 480) : windowWidth;
  const flatListRef = useRef<FlatList>(null);

  // Single authoritative active index
  const [activeIndex, setActiveIndex] = useState<number>(() =>
    Math.max(0, Math.min(initialIndex, Math.max(0, articles.length - 1)))
  );

  const activeIndexRef = useRef<number>(activeIndex);
  activeIndexRef.current = activeIndex;

  // Track the index where a touch/drag gesture starts to clamp movement to AT MOST 1 item
  const dragStartIndexRef = useRef<number>(activeIndex);
  const isTransitioningRef = useRef<boolean>(false);
  const isWheelLockedRef = useRef<boolean>(false);

  // Diagnostic logging helper
  const logFeed = (message: string) => {
    console.log(`[FEED] ${message}`);
  };

  // Synchronize when containerHeight changes (e.g., orientation or safe area measurement)
  useEffect(() => {
    if (containerHeight > 0) {
      logFeed(`Viewport measured: height=${containerHeight}px, activeIndex=${activeIndexRef.current}`);
      if (activeIndexRef.current > 0) {
        flatListRef.current?.scrollToIndex({
          index: activeIndexRef.current,
          animated: false,
        });
      }
    }
  }, [containerHeight]);

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
        // Safe fallback if view layout is still pending
      }
    },
    getActiveIndex: () => activeIndexRef.current,
  }));

  // GESTURE LIFECYCLE HANDLERS

  // A. Gesture Start: Record start index when the user touches and begins dragging
  const handleScrollBeginDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (containerHeight <= 0) return;
      const offsetY = e.nativeEvent.contentOffset.y;
      const startIndex = Math.max(0, Math.min(Math.round(offsetY / containerHeight), articles.length - 1));
      dragStartIndexRef.current = startIndex;
      isTransitioningRef.current = true;
      logFeed(`Gesture started: index=${startIndex}`);
    },
    [containerHeight, articles.length]
  );

  // B. Gesture End: Enforce that ONE gesture can navigate AT MOST ONE item away from startIndex
  const handleScrollEndDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (containerHeight <= 0) return;
      const offsetY = e.nativeEvent.contentOffset.y;
      const velocityY = e.nativeEvent.velocity?.y ?? 0;
      const startIndex = dragStartIndexRef.current;
      const rawTarget = Math.round(offsetY / containerHeight);

      // CRITICAL CLAMP: One swipe can advance by at most +1 or -1 from startIndex
      let targetIndex = rawTarget;
      if (targetIndex > startIndex + 1) {
        targetIndex = startIndex + 1;
      } else if (targetIndex < startIndex - 1) {
        targetIndex = startIndex - 1;
      }
      targetIndex = Math.max(0, Math.min(targetIndex, articles.length - 1));

      const direction = targetIndex > startIndex ? 'UP' : targetIndex < startIndex ? 'DOWN' : 'NONE';
      logFeed(
        `Gesture released: direction=${direction}, startIndex=${startIndex}, targetIndex=${targetIndex}, rawTarget=${rawTarget}, vy=${velocityY.toFixed(2)}`
      );

      // If velocity or distance attempted to skip past the adjacent item, clamp and enforce target
      if (targetIndex !== rawTarget) {
        flatListRef.current?.scrollToIndex({
          index: targetIndex,
          animated: true,
        });
      }
    },
    [containerHeight, articles.length]
  );

  // C. Transition Settled: Commit destination index exactly once when momentum finishes
  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (containerHeight <= 0) return;
      const offsetY = e.nativeEvent.contentOffset.y;
      const settledIndex = Math.max(0, Math.min(Math.round(offsetY / containerHeight), articles.length - 1));
      isTransitioningRef.current = false;

      logFeed(`Transition completed: index=${settledIndex}`);

      if (settledIndex !== activeIndexRef.current) {
        activeIndexRef.current = settledIndex;
        setActiveIndex(settledIndex);
        if (articles[settledIndex]) {
          onActiveIndexChange?.(settledIndex, articles[settledIndex]);
        }
      }

      if (settledIndex >= articles.length - 2) {
        onLoadMore?.();
      }
    },
    [containerHeight, articles, onActiveIndexChange, onLoadMore]
  );

  // Web Wheel / Trackpad listener for desktop & mobile browsers: strictly 1 item per wheel flick
  const handleWebWheel = useCallback(
    (e: any) => {
      if (Platform.OS !== 'web' || containerHeight <= 0) return;
      const deltaY = e?.nativeEvent?.deltaY ?? e?.deltaY ?? 0;
      if (Math.abs(deltaY) < 25) return;

      // Lock rapid wheel momentum events
      if (isWheelLockedRef.current) return;
      isWheelLockedRef.current = true;
      setTimeout(() => {
        isWheelLockedRef.current = false;
      }, 500);

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
    [containerHeight, articles, onActiveIndexChange]
  );

  if (containerHeight <= 0) {
    return <View style={styles.placeholder} />;
  }

  return (
    <View
      style={[styles.container, { height: containerHeight, width: cardWidth }]}
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
              { height: containerHeight, width: cardWidth },
              Platform.OS === 'web' && {
                // @ts-ignore: CSS scroll-snap properties for web browsers
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
              },
            ]}>
            <NewsCard
              article={item}
              currentIndex={index + 1}
              totalCards={articles.length}
              cardHeight={containerHeight}
              cardWidth={cardWidth}
              isTelugu={isTelugu}
              isActive={index === activeIndex}
              onBookmarkChange={onBookmarkChange}
              onAddComment={onAddComment}
              onToggleLike={onToggleLike}
            />
          </View>
        )}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        // Smooth Paging Configuration (slower and gentler glide)
        pagingEnabled={false}
        snapToInterval={containerHeight}
        snapToAlignment="start"
        decelerationRate="normal"
        disableIntervalMomentum={true}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        // Strict deterministic item layout
        getItemLayout={(_, index) => ({
          length: containerHeight,
          offset: containerHeight * index,
          index,
        })}
        // Gesture and Scroll event synchronization
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        // Memory & Virtualization
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews={Platform.OS !== 'web'}
        // Safe fallback for scrollToIndex during rapid transitions
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
          Platform.OS === 'web' && {
            // @ts-ignore
            scrollSnapType: 'y mandatory',
            overflowY: 'scroll',
            scrollBehavior: 'smooth',
          },
        ]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121214',
    overflow: 'hidden',
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#121214',
  },
  flatList: {
    flex: 1,
    backgroundColor: '#121214',
  },
  cardWrapper: {
    overflow: 'hidden',
    backgroundColor: '#121214',
  },
});
