import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ArticlesService } from '@/services/articlesService';
import { NewsArticle } from '@/types/news';
import { useLanguage } from '@/context/LanguageContext';

interface VideosViewProps {
  isTelugu?: boolean;
}

export function VideosView({ isTelugu: propIsTelugu }: VideosViewProps) {
  const { isTelugu: ctxIsTelugu, t } = useLanguage();
  const isTelugu = propIsTelugu !== undefined ? propIsTelugu : ctxIsTelugu;
  const { height: windowHeight } = useWindowDimensions();
  const [currentVideo, setCurrentVideo] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    ArticlesService.fetchArticles()
      .then((res) => {
        const videoArticle =
          res.articles.find((a) => a.videoUrl || a.mediaType === 'video') ||
          res.articles[0] ||
          null;
        setCurrentVideo(videoArticle);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !currentVideo) {
    return (
      <View style={[styles.container, { height: windowHeight - 120, alignItems: 'center', justifyContent: 'center' }]}>
        {loading ? (
          <ActivityIndicator size="large" color="#E50914" />
        ) : (
          <Text style={{ color: '#A1A1AA', fontSize: 14 }}>{t.noNewsTitle}</Text>
        )}
      </View>
    );
  }

  const displayTitle = !isTelugu && currentVideo.title_en ? currentVideo.title_en : currentVideo.title;
  const displayContent = !isTelugu && currentVideo.content_en ? currentVideo.content_en : currentVideo.content;

  return (
    <View style={[styles.container, { height: windowHeight - 120 }]}>
      <Image source={{ uri: currentVideo.imageUrl }} style={styles.videoBackground} resizeMode="cover" />

      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.85)']}
        style={StyleSheet.absoluteFill}
      />

      <TouchableOpacity
        style={[styles.centerPlayButton, { top: (windowHeight - 120) * 0.38 }]}
        onPress={() =>
          Alert.alert(
            isTelugu ? 'వీడియో' : 'Video Player',
            isTelugu ? 'ప్లేయర్ ప్రారంభమైంది.' : 'Streaming initialized.'
          )
        }>
        <Ionicons name="play" size={38} color="#FFFFFF" style={{ marginLeft: 4 }} />
      </TouchableOpacity>

      <View style={styles.bottomInfoContainer}>
        <View style={styles.badgeVideo}>
          <Text style={styles.badgeVideoText}>NTODAY VIDEO</Text>
        </View>
        <Text style={styles.videoTitle}>{displayTitle}</Text>
        <Text style={styles.videoSummary} numberOfLines={2}>
          {displayContent}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000000',
    position: 'relative',
  },
  videoBackground: {
    width: '100%',
    height: '100%',
  },
  centerPlayButton: {
    position: 'absolute',
    alignSelf: 'center',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(229, 9, 20, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomInfoContainer: {
    position: 'absolute',
    bottom: 24,
    left: 18,
    right: 18,
  },
  badgeVideo: {
    backgroundColor: '#E50914',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  badgeVideoText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  videoTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 6,
  },
  videoSummary: {
    color: '#D4D4D8',
    fontSize: 13,
    lineHeight: 18,
  },
});
