import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { NewsArticle } from '@/types/news';

interface MediaViewerProps {
  article: NewsArticle;
  height?: number | string;
  isActive?: boolean;
}

export function MediaViewer({
  article,
  height = '100%',
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
      : fallbackImages[0];

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
        {/* Full-bleed Photo (Edge to edge, resizeMode cover, no rounded corners, no badges/text overlays) */}
        <Image
          source={{ uri: safeImageUri }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setHasImageError(true)}
        />

        {/* Video Player & Controls (Only for video cards) */}
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

            {/* Video Center Play/Pause Tap Indicator */}
            <TouchableOpacity
              style={styles.centerTapZone}
              activeOpacity={0.9}
              onPress={togglePlayPause}>
              {!isPlaying && (
                <View style={styles.pausedIconBadge}>
                  <Ionicons name="play" size={28} color="#FFFFFF" style={{ marginLeft: 3 }} />
                </View>
              )}
            </TouchableOpacity>

            {/* Small Mute Button at photo's bottom-right */}
            <TouchableOpacity style={styles.mutePill} onPress={toggleMute}>
              <Ionicons
                name={isMuted ? 'volume-mute' : 'volume-high'}
                size={12}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            {/* Tiny Video Indicator at top-right (video cards only) */}
            <View style={styles.videoIndicatorBadge}>
              <Ionicons name="videocam" size={11} color="#FFFFFF" />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#09090b',
    borderRadius: 0, // Edge-to-edge, no rounded corners
    overflow: 'hidden',
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  mutePill: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 10,
  },
  // Top-right tiny video play chip (video cards only)
  videoIndicatorBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 10,
  },
});
