import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Easing,
  Platform,
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
  initialIndex?: number;
}

// Gesture State Machine states
type GestureState = 'IDLE' | 'TRACKING' | 'SETTLING' | 'READY';

export const ReelsFeed = forwardRef<ReelsFeedRef, ReelsFeedProps>(function ReelsFeed(
  {
    articles,
    containerHeight,
    isTelugu = true,
    onBookmarkChange,
    onAddComment,
    onActiveIndexChange,
    initialIndex = 0,
  },
  ref
) {
  const { width: windowWidth } = useWindowDimensions();

  // Single authoritative active news index (0 to N - 1)
  const [activeIndex, setActiveIndex] = useState<number>(() =>
    Math.max(0, Math.min(initialIndex, Math.max(0, articles.length - 1)))
  );

  const activeIndexRef = useRef<number>(activeIndex);
  activeIndexRef.current = activeIndex;

  // Gesture state machine
  const gestureStateRef = useRef<GestureState>('IDLE');
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const isSettlingRef = useRef<boolean>(false);
  const isWheelLocked = useRef<boolean>(false);

  // Single translation animated value for the feed
  const currentOffset = useRef(new Animated.Value(-activeIndex * containerHeight)).current;

  // Sync translation when container height or initial index changes
  useEffect(() => {
    if (containerHeight > 0) {
      currentOffset.setValue(-activeIndexRef.current * containerHeight);
    }
  }, [containerHeight]);

  // Adjust active index if articles list shrinks
  useEffect(() => {
    if (articles.length === 0) {
      setActiveIndex(0);
      activeIndexRef.current = 0;
      currentOffset.setValue(0);
    } else if (activeIndexRef.current >= articles.length) {
      const nextIdx = articles.length - 1;
      setActiveIndex(nextIdx);
      activeIndexRef.current = nextIdx;
      currentOffset.setValue(-nextIdx * containerHeight);
    }
  }, [articles.length, containerHeight]);

  // Notify parent of initially active article once ready
  useEffect(() => {
    if (articles.length > 0 && articles[activeIndexRef.current]) {
      onActiveIndexChange?.(activeIndexRef.current, articles[activeIndexRef.current]);
    }
  }, []);

  // Atomic transition to a specific index with animation and gesture locking
  const transitionToIndex = (targetIndex: number, animated = true) => {
    const clampedIndex = Math.max(0, Math.min(targetIndex, articles.length - 1));
    const targetOffset = -clampedIndex * containerHeight;

    if (!animated || containerHeight <= 0) {
      currentOffset.setValue(targetOffset);
      activeIndexRef.current = clampedIndex;
      setActiveIndex(clampedIndex);
      gestureStateRef.current = 'IDLE';
      isSettlingRef.current = false;
      if (articles[clampedIndex]) {
        onActiveIndexChange?.(clampedIndex, articles[clampedIndex]);
      }
      return;
    }

    // Enter SETTLING state and lock incoming gestures
    gestureStateRef.current = 'SETTLING';
    isSettlingRef.current = true;

    Animated.timing(currentOffset, {
      toValue: targetOffset,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start(({ finished }) => {
      if (finished) {
        activeIndexRef.current = clampedIndex;
        setActiveIndex(clampedIndex);
        gestureStateRef.current = 'READY';
        isSettlingRef.current = false;
        gestureStateRef.current = 'IDLE';

        if (articles[clampedIndex]) {
          onActiveIndexChange?.(clampedIndex, articles[clampedIndex]);
        }
      }
    });
  };

  // Imperative handle for parent control (Explore screen selection, reset, etc.)
  useImperativeHandle(ref, () => ({
    scrollToIndex: (index: number, animated = true) => {
      transitionToIndex(index, animated);
    },
    getActiveIndex: () => activeIndexRef.current,
  }));

  // PanResponder implementing the Instagram Reels Gesture State Machine
  const panResponder = useRef(
    PanResponder.create({
      // Do not capture on initial press so child buttons (Like, Comments, Share, Audio) get tap events
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,

      // Only capture when an intentional vertical drag is detected
      onMoveShouldSetPanResponder: (_, gesture) => {
        // Reject if currently settling
        if (gestureStateRef.current === 'SETTLING' || isSettlingRef.current) {
          return false;
        }
        // Capture only if vertical movement is dominant and exceeds 8px threshold
        const isVertical = Math.abs(gesture.dy) > Math.abs(gesture.dx);
        return isVertical && Math.abs(gesture.dy) > 8;
      },
      onMoveShouldSetPanResponderCapture: (_, gesture) => {
        if (gestureStateRef.current === 'SETTLING' || isSettlingRef.current) {
          return false;
        }
        const isVertical = Math.abs(gesture.dy) > Math.abs(gesture.dx);
        return isVertical && Math.abs(gesture.dy) > 8;
      },

      // A. Gesture Start
      onPanResponderGrant: (_, gesture) => {
        touchStartY.current = gesture.y0;
        touchStartTime.current = Date.now();
        gestureStateRef.current = 'TRACKING';
      },

      // B. Gesture Tracking
      onPanResponderMove: (_, gesture) => {
        if (gestureStateRef.current !== 'TRACKING') return;

        const dy = gesture.dy;
        const currentIndex = activeIndexRef.current;
        const totalItems = articles.length;

        let effectiveDy = dy;

        // Apply boundary resistance at the ends (Item 0 down, or Item N-1 up)
        if (currentIndex === 0 && dy > 0) {
          effectiveDy = dy * 0.25; // Resistance when pulling down past first item
        } else if (currentIndex === totalItems - 1 && dy < 0) {
          effectiveDy = dy * 0.25; // Resistance when pulling up past last item
        } else {
          // CLAMP DISPLACEMENT: Never drag beyond one adjacent screen height!
          // This guarantees that even a 1,000px finger drag can NEVER skip multiple items.
          effectiveDy = Math.max(-containerHeight, Math.min(containerHeight, dy));
        }

        currentOffset.setValue(-currentIndex * containerHeight + effectiveDy);
      },

      // C. Gesture Completion
      onPanResponderRelease: (_, gesture) => {
        if (gestureStateRef.current !== 'TRACKING') return;

        const dy = gesture.dy;
        const vy = gesture.vy;
        const gestureDuration = Date.now() - touchStartTime.current;
        const currentIndex = activeIndexRef.current;
        const totalItems = articles.length;

        // Threshold checks:
        // 1. Minimum displacement of 60px
        // 2. OR Fast flick: velocity > 0.4 and movement in same direction > 15px
        // 3. OR Quick swipe: duration < 280ms and movement > 25px
        const isUpwardSwipe =
          dy < -60 || (vy < -0.4 && dy < -15) || (gestureDuration < 280 && dy < -25);
        const isDownwardSwipe =
          dy > 60 || (vy > 0.4 && dy > 15) || (gestureDuration < 280 && dy > 25);

        let targetIndex = currentIndex;

        if (isUpwardSwipe && currentIndex < totalItems - 1) {
          // Exactly 1 item forward: min(currentIndex + 1, N - 1)
          targetIndex = Math.min(currentIndex + 1, totalItems - 1);
        } else if (isDownwardSwipe && currentIndex > 0) {
          // Exactly 1 item backward: max(currentIndex - 1, 0)
          targetIndex = Math.max(currentIndex - 1, 0);
        } else {
          // Snap back to the current item
          targetIndex = currentIndex;
        }

        transitionToIndex(targetIndex, true);
      },

      // E. Gesture Cancellation
      onPanResponderTerminate: () => {
        if (gestureStateRef.current === 'TRACKING') {
          transitionToIndex(activeIndexRef.current, true);
        }
      },
    })
  ).current;

  // Web Wheel / Trackpad listener for desktop/mobile browsers
  const handleWheel = (e: any) => {
    if (Platform.OS !== 'web') return;
    if (isSettlingRef.current || isWheelLocked.current) return;

    const deltaY = e?.nativeEvent?.deltaY ?? e?.deltaY ?? 0;
    if (Math.abs(deltaY) < 30) return;

    isWheelLocked.current = true;
    setTimeout(() => {
      isWheelLocked.current = false;
    }, 380);

    const currentIndex = activeIndexRef.current;
    if (deltaY > 0 && currentIndex < articles.length - 1) {
      transitionToIndex(currentIndex + 1, true);
    } else if (deltaY < 0 && currentIndex > 0) {
      transitionToIndex(currentIndex - 1, true);
    }
  };

  const totalCards = articles.length;

  return (
    <View
      style={[styles.viewport, { height: containerHeight, width: windowWidth }]}
      {...panResponder.panHandlers}
      // @ts-ignore: onWheel is supported on react-native-web
      onWheel={Platform.OS === 'web' ? handleWheel : undefined}>
      <Animated.View
        style={[
          styles.innerTrack,
          {
            height: containerHeight * Math.max(1, totalCards),
            transform: [{ translateY: currentOffset }],
          },
        ]}>
        {articles.map((item, index) => {
          // Virtualization window: mount only current, previous, and next cards
          // This preserves optimal 60fps/120fps memory and avoids multiple video streams
          const isNearby = Math.abs(index - activeIndex) <= 1;
          if (!isNearby) {
            return null;
          }

          return (
            <View
              key={item.id}
              style={[
                styles.cardSlot,
                {
                  top: index * containerHeight,
                  height: containerHeight,
                  width: windowWidth,
                },
              ]}>
              <NewsCard
                article={item}
                currentIndex={index + 1}
                totalCards={totalCards}
                cardHeight={containerHeight}
                isTelugu={isTelugu}
                isActive={index === activeIndex}
                onBookmarkChange={onBookmarkChange}
                onAddComment={onAddComment}
              />
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  viewport: {
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#121214',
  },
  innerTrack: {
    width: '100%',
    position: 'relative',
  },
  cardSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
});
