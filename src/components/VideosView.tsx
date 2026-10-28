import React from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MOCK_NEWS_ARTICLES } from '@/data/mockNews';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function VideosView() {
  const currentVideo = MOCK_NEWS_ARTICLES[0];

  return (
    <View style={styles.container}>
      <Image source={{ uri: currentVideo.imageUrl }} style={styles.videoBackground} resizeMode="cover" />

      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.85)']}
        style={StyleSheet.absoluteFill}
      />

      <TouchableOpacity
        style={styles.centerPlayButton}
        onPress={() => Alert.alert('వీడియో', 'ప్లేయర్ ప్రారంభమైంది.')}>
        <Ionicons name="play" size={38} color="#FFFFFF" style={{ marginLeft: 4 }} />
      </TouchableOpacity>

      <View style={styles.bottomInfoContainer}>
        <View style={styles.badgeVideo}>
          <Text style={styles.badgeVideoText}>NTODAY VIDEO</Text>
        </View>
        <Text style={styles.videoTitle}>{currentVideo.title}</Text>
        <Text style={styles.videoSummary} numberOfLines={2}>
          {currentVideo.content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: '100%',
    backgroundColor: '#000000',
    position: 'relative',
  },
  videoBackground: {
    width: '100%',
    height: '100%',
  },
  centerPlayButton: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.35,
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
