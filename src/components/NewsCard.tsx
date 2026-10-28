import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Share,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NewsArticle } from '@/types/news';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NewsCardProps {
  article: NewsArticle;
  currentIndex: number;
  totalCards: number;
}

export function NewsCard({ article, currentIndex, totalCards }: NewsCardProps) {
  const [likes, setLikes] = useState(article.likesCount);
  const [hasLiked, setHasLiked] = useState(article.isLiked ?? false);
  const [hasDisliked, setHasDisliked] = useState(article.isDisliked ?? false);
  const [isBookmarked, setIsBookmarked] = useState(article.isBookmarked ?? false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(article.audioDurationSeconds);

  // Audio countdown simulation
  useEffect(() => {
    let interval: any;
    if (isPlayingAudio && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsPlayingAudio(false);
            return article.audioDurationSeconds;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio, secondsLeft, article.audioDurationSeconds]);

  const handleLike = () => {
    if (hasLiked) {
      setLikes(likes - 1);
      setHasLiked(false);
    } else {
      setLikes(likes + 1);
      setHasLiked(true);
      if (hasDisliked) setHasDisliked(false);
    }
  };

  const handleDislike = () => {
    if (hasDisliked) {
      setHasDisliked(false);
    } else {
      setHasDisliked(true);
      if (hasLiked) {
        setLikes(likes - 1);
        setHasLiked(false);
      }
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${article.title}\n\nపూర్తి వివరాలు NTODAY NEWS లో చదవండి:\nhttps://ntodaynews.com/`,
        title: article.title,
      });
    } catch (err) {
      // ignore
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `*${article.title}*\n\n${article.content.substring(0, 150)}...\n\n👉 పూర్తి వార్త కోసం NTODAY NEWS చూడండి: https://ntodaynews.com/`
    );
    Linking.openURL(`whatsapp://send?text=${text}`).catch(() => {
      handleShare();
    });
  };

  const toggleAudio = () => {
    setIsPlayingAudio(!isPlayingAudio);
  };

  return (
    <View style={styles.cardContainer}>
      {/* 1. TOP IMAGE SECTION */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: article.imageUrl }}
          style={styles.cardImage}
          resizeMode="cover"
        />

        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(18,18,20,0.95)']}
          style={styles.imageGradientOverlay}
        />

        {/* Floating Top Left: Author Tag */}
        <View style={styles.authorBadge}>
          <View style={styles.authorIconCircle}>
            <Ionicons name="flash" size={13} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.authorName}>{article.authorName}</Text>
            <Text style={styles.authorDesk}>{article.authorDesk}</Text>
          </View>
        </View>

        {/* Floating Top Right: Card Index Counter */}
        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>
            {currentIndex}/{totalCards}
          </Text>
        </View>

        {/* Bookmark Pin Tag on Bottom-Left of Image */}
        <TouchableOpacity
          style={styles.bookmarkPin}
          onPress={() => {
            setIsBookmarked(!isBookmarked);
            Alert.alert(isBookmarked ? 'Removed from Bookmarks' : 'Saved to Bookmarks');
          }}>
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark'}
            size={16}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      {/* 2. RED SOURCE STRIP */}
      <View style={styles.redStrip}>
        <View style={styles.redStripLeft}>
          <Ionicons name="flash" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.brandTitle}>{article.sourceName}</Text>
        </View>
        <View style={styles.redStripRight}>
          {article.sourceCredit ? (
            <Text style={styles.sourceCreditText}>{article.sourceCredit} • </Text>
          ) : null}
          <Text style={styles.timeAgoText}>{article.timeAgo}</Text>
          <Ionicons name="share-outline" size={13} color="#FFFFFF" style={{ marginLeft: 4 }} />
        </View>
      </View>

      {/* 3. NEWS BODY CONTENT */}
      <View style={styles.contentContainer}>
        <Text style={styles.headlineText} numberOfLines={3}>
          {article.title}
        </Text>
        <Text style={styles.bodyText}>
          {article.content}
        </Text>
      </View>

      {/* 4. BOTTOM ACTION TOOLBAR */}
      <View style={styles.actionToolbar}>
        {/* Share Button */}
        <TouchableOpacity style={styles.actionItem} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={24} color="#A1A1AA" />
        </TouchableOpacity>

        {/* Comment Button */}
        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => Alert.alert('కామెంట్లు', `${article.commentsCount} మంది అభిప్రాయాలు తెలిపారు.`)}>
          <Ionicons name="chatbubble-outline" size={22} color="#A1A1AA" />
        </TouchableOpacity>

        {/* Like Button */}
        <TouchableOpacity style={styles.actionItem} onPress={handleLike}>
          <Ionicons
            name={hasLiked ? 'thumbs-up' : 'thumbs-up-outline'}
            size={22}
            color={hasLiked ? '#E50914' : '#A1A1AA'}
          />
          <Text style={[styles.actionCount, hasLiked && { color: '#E50914' }]}>{likes}</Text>
        </TouchableOpacity>

        {/* Dislike Button */}
        <TouchableOpacity style={styles.actionItem} onPress={handleDislike}>
          <Ionicons
            name={hasDisliked ? 'thumbs-down' : 'thumbs-down-outline'}
            size={22}
            color={hasDisliked ? '#E50914' : '#A1A1AA'}
          />
        </TouchableOpacity>

        {/* WhatsApp Share Button */}
        <TouchableOpacity style={styles.actionItem} onPress={handleWhatsAppShare}>
          <FontAwesome name="whatsapp" size={24} color="#25D366" />
        </TouchableOpacity>

        {/* Listen Audio / TTS Button with countdown */}
        <TouchableOpacity
          style={[styles.audioButton, isPlayingAudio && styles.audioButtonActive]}
          onPress={toggleAudio}>
          <Ionicons
            name={isPlayingAudio ? 'pause' : 'volume-high'}
            size={20}
            color="#EF4444"
          />
          <Text style={styles.audioDurationText}>{secondsLeft}s</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: SCREEN_WIDTH,
    height: '100%',
    backgroundColor: '#121214',
    justifyContent: 'space-between',
  },
  imageWrapper: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.42,
    position: 'relative',
    backgroundColor: '#1c1c1f',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageGradientOverlay: {
    ...StyleSheet.absoluteFill,
  },
  authorBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 27, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  authorIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
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
  counterBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(24, 24, 27, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  bookmarkPin: {
    position: 'absolute',
    bottom: -2,
    left: 14,
    backgroundColor: '#E50914',
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    zIndex: 5,
  },
  redStrip: {
    backgroundColor: '#BA1A1A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  redStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  redStripRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceCreditText: {
    color: '#F4F4F5',
    fontSize: 11,
    fontWeight: '500',
  },
  timeAgoText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headlineText: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 30,
    marginBottom: 12,
  },
  bodyText: {
    color: '#E4E4E7',
    fontSize: 15,
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  actionToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#27272a',
    backgroundColor: '#121214',
  },
  actionItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  actionCount: {
    color: '#A1A1AA',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  audioButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  audioButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
  },
  audioDurationText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 1,
  },
});
