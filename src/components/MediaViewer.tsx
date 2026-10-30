import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { NewsArticle } from '@/types/news';

interface MediaViewerProps {
  article: NewsArticle;
  currentIndex: number;
  totalCards: number;
  height: number;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  isActive?: boolean;
}

export function MediaViewer({
  article,
  currentIndex,
  totalCards,
  height,
  isBookmarked,
  onToggleBookmark,
  isActive = true,
}: MediaViewerProps) {
  const isVideo = article.mediaType === 'video' && !!article.videoUrl;
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasImageError, setHasImageError] = useState(false);
  const webVideoRef = useRef<any>(null);

  // Fallback random news images if an image fails or is empty
  const fallbackImages = [
    'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
  ];
  const safeImageUri =
    article.imageUrl && !hasImageError
      ? article.imageUrl
      : fallbackImages[currentIndex % fallbackImages.length];

  // Initialize expo-video player for video news
  const player = useVideoPlayer(isVideo ? article.videoUrl! : '', (p) => {
    p.loop = true;
    p.muted = isMuted;
    if (isVideo && isActive) {
      p.play();
    }
  });

  // Play/pause depending on whether this card is currently active in the Reels feed
  useEffect(() => {
    if (!player) return;
    if (isActive) {
      player.play();
      setIsPlaying(true);
    } else {
      player.pause();
      setIsPlaying(false);
    }
  }, [isActive, player]);

  // Sync web video element
  useEffect(() => {
    if (Platform.OS === 'web' && webVideoRef.current) {
      if (isActive) {
        webVideoRef.current.play?.().catch(() => {});
        setIsPlaying(true);
      } else {
        webVideoRef.current.pause?.();
        setIsPlaying(false);
      }
    }
  }, [isActive]);

  const togglePlayPause = () => {
    if (!player) return;
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!player) return;
    player.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.mediaBox}>
        {/* Background News Image (Always rendered so the user never sees a black screen) */}
        <Image
          source={{ uri: safeImageUri }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setHasImageError(true)}
        />

        {isVideo && (
          <>
            {Platform.OS === 'web' ? (
              <video
                ref={webVideoRef}
                src={article.videoUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
                autoPlay={isActive}
                loop
                muted={isMuted}
                playsInline
              />
            ) : (
              <VideoView
                player={player}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                nativeControls={false}
              />
            )}

            {/* Video Center Play/Pause Indicator (tappable) */}
            <TouchableOpacity
              style={styles.centerTapZone}
              activeOpacity={0.9}
              onPress={togglePlayPause}>
              {!isPlaying && (
                <View style={styles.pausedIconBadge}>
                  <Ionicons name="play" size={32} color="#FFFFFF" style={{ marginLeft: 3 }} />
                </View>
              )}
            </TouchableOpacity>

            {/* Video Mute/Unmute Pill */}
            <TouchableOpacity style={styles.mutePill} onPress={toggleMute}>
              <Ionicons
                name={isMuted ? 'volume-mute' : 'volume-high'}
                size={14}
                color="#FFFFFF"
              />
              <Text style={styles.muteText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Modern Gradient Overlays for Badges */}
      <LinearGradient
        colors={['rgba(0,0,0,0.65)', 'transparent', 'rgba(18,18,20,0.85)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Floating Top Left: Author Tag with Official Logo replacing thunder */}
      <View style={styles.authorBadge}>
        <View style={styles.authorIconCircle}>
          <Image
            source={require('../../assets/images/ntoday-official-logo.png')}
            style={styles.authorLogo}
            resizeMode="contain"
          />
        </View>
        <View>
          <Text style={styles.authorName}>{article.authorName}</Text>
          <Text style={styles.authorDesk}>{article.authorDesk}</Text>
        </View>
      </View>

      {/* Floating Top Right: Card Index Counter & Media Tag */}
      <View style={styles.topRightRow}>
        <View style={styles.mediaTypeBadge}>
          <Ionicons
            name={isVideo ? 'videocam' : 'image'}
            size={12}
            color={isVideo ? '#EF4444' : '#60A5FA'}
          />
          <Text style={styles.mediaTypeText}>{isVideo ? 'VIDEO' : 'PHOTO'}</Text>
        </View>
        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>
            {currentIndex}/{totalCards}
          </Text>
        </View>
      </View>

      {/* Bookmark Pin Tag on Bottom-Left of Media */}
      <TouchableOpacity
        style={[styles.bookmarkPin, isBookmarked && styles.bookmarkPinActive]}
        onPress={onToggleBookmark}>
        <Ionicons
          name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
          size={16}
          color="#FFFFFF"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#18181b',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  mediaBox: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#09090b',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  centerTapZone: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pausedIconBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  mutePill: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  muteText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  authorBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 27, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  authorIconCircle: {
    width: 24,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  authorLogo: {
    width: 24,
    height: 15,
  },
  authorName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  authorDesk: {
    color: '#D4D4D8',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  topRightRow: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mediaTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 27, 0.88)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  mediaTypeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  counterBadge: {
    backgroundColor: 'rgba(24, 24, 27, 0.88)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  bookmarkPin: {
    position: 'absolute',
    bottom: -1,
    left: 14,
    backgroundColor: '#BA1A1A',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    zIndex: 5,
  },
  bookmarkPinActive: {
    backgroundColor: '#E50914',
  },
});
