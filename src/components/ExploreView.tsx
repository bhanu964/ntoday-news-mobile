import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TOP_STORIES, PLAYLIST_STORIES } from '@/data/mockNews';
import { TopStory } from '@/types/news';

interface ExploreViewProps {
  onStorySelect: (story: TopStory) => void;
  onOpenAccount: () => void;
}

export function ExploreView({ onStorySelect, onOpenAccount }: ExploreViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlayingHeadlines, setIsPlayingHeadlines] = useState(false);

  const filteredStories = searchQuery.trim()
    ? TOP_STORIES.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : TOP_STORIES;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* 1. SEARCH BAR & PROFILE BUTTON */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={18} color="#71717A" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search all news, including older stories"
            placeholderTextColor="#71717A"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#71717A" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity style={styles.profileButton} onPress={onOpenAccount}>
          <Ionicons name="person" size={19} color="#D4D4D8" />
        </TouchableOpacity>
      </View>

      {/* 2. "LISTEN TO THE NEWS" AUDIO BANNER */}
      <TouchableOpacity
        style={styles.audioBanner}
        activeOpacity={0.8}
        onPress={() => {
          setIsPlayingHeadlines(!isPlayingHeadlines);
          Alert.alert(
            isPlayingHeadlines ? 'Audio Paused' : 'Playing News Audio',
            'NTODAY Audio Bulletins: Hands-free news stream starting.'
          );
        }}>
        <View style={styles.audioBannerLeft}>
          <View style={styles.headphonesCircle}>
            <Ionicons name="headset" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.audioBannerTextContainer}>
            <Text style={styles.audioBannerTitle}>Listen to the news</Text>
            <Text style={styles.audioBannerSubtitle}>Hands-free, one story after another</Text>
          </View>
        </View>
        <Ionicons
          name={isPlayingHeadlines ? 'pause' : 'play'}
          size={24}
          color="#FFFFFF"
          style={{ marginRight: 8 }}
        />
      </TouchableOpacity>

      {/* 3. TOP NOW SECTION */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Top now</Text>
        <Text style={styles.sectionSubtitle}>What readers are opening right now</Text>
      </View>

      <View style={styles.topNowList}>
        {filteredStories.map((story) => (
          <TouchableOpacity
            key={story.rank}
            style={styles.topNowItem}
            activeOpacity={0.7}
            onPress={() => onStorySelect(story)}>
            {/* Rank Number */}
            <Text style={[styles.rankNumber, story.rank === 1 && styles.rankNumberFirst]}>
              {story.rank}
            </Text>

            {/* Story Details */}
            <View style={styles.storyDetails}>
              <Text style={styles.storyTitle} numberOfLines={2}>
                {story.title}
              </Text>
              <Text style={styles.storyExcerpt} numberOfLines={2}>
                {story.excerpt}
              </Text>
            </View>

            {/* Thumbnail Image */}
            <Image source={{ uri: story.imageUrl }} style={styles.storyThumbnail} resizeMode="cover" />
          </TouchableOpacity>
        ))}
      </View>

      {/* 4. PLAYLISTS SECTION */}
      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Text style={styles.sectionTitle}>Playlists</Text>
        <Text style={styles.sectionSubtitle}>Plays on, one story after another</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.playlistScroll}>
        {PLAYLIST_STORIES.map((playlist) => (
          <TouchableOpacity
            key={playlist.id}
            style={styles.playlistCard}
            activeOpacity={0.8}
            onPress={() => Alert.alert('Playlist', `Playing ${playlist.title}`)}>
            <View style={styles.playlistImageWrapper}>
              <Image source={{ uri: playlist.imageUrl }} style={styles.playlistImage} resizeMode="cover" />
              <View style={styles.playlistHeadphoneBadge}>
                <Ionicons name="headset" size={14} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c20',
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1c1c20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  audioBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1c1c20',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  audioBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headphonesCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioBannerTextContainer: {
    flex: 1,
  },
  audioBannerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  audioBannerSubtitle: {
    color: '#A1A1AA',
    fontSize: 11,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: '#71717A',
    fontSize: 12,
    marginTop: 2,
  },
  topNowList: {
    gap: 16,
  },
  topNowItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  rankNumber: {
    color: '#71717A',
    fontSize: 22,
    fontWeight: '900',
    minWidth: 18,
    marginTop: 2,
  },
  rankNumberFirst: {
    color: '#E50914',
  },
  storyDetails: {
    flex: 1,
  },
  storyTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 4,
  },
  storyExcerpt: {
    color: '#A1A1AA',
    fontSize: 11,
    lineHeight: 16,
  },
  storyThumbnail: {
    width: 68,
    height: 68,
    borderRadius: 8,
    backgroundColor: '#27272a',
  },
  playlistScroll: {
    flexDirection: 'row',
  },
  playlistCard: {
    marginRight: 12,
  },
  playlistImageWrapper: {
    width: 130,
    height: 130,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#27272a',
  },
  playlistImage: {
    width: '100%',
    height: '100%',
  },
  playlistHeadphoneBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
