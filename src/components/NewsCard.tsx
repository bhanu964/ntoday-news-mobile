import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Linking,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { NewsArticle, NewsComment } from '@/types/news';
import { MediaViewer } from './MediaViewer';
import { CommentsModal } from './CommentsModal';

interface NewsCardProps {
  article: NewsArticle;
  currentIndex: number;
  totalCards: number;
  cardHeight?: number;
  isTelugu?: boolean;
  onBookmarkChange?: (id: string, isBookmarked: boolean) => void;
  onAddComment?: (articleId: string, comment: NewsComment) => void;
}

export function NewsCard({
  article,
  currentIndex,
  totalCards,
  cardHeight,
  isTelugu = true,
  onBookmarkChange,
  onAddComment,
}: NewsCardProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const effectiveHeight = cardHeight || windowHeight - 110;
  // Instagram reels-style media height: about 42% of the card height
  const mediaHeight = Math.max(Math.min(effectiveHeight * 0.43, 340), 220);

  const [likes, setLikes] = useState(article.likesCount);
  const [hasLiked, setHasLiked] = useState(article.isLiked ?? false);
  const [hasDisliked, setHasDisliked] = useState(article.isDisliked ?? false);
  const [isBookmarked, setIsBookmarked] = useState(article.isBookmarked ?? false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(article.audioDurationSeconds);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [comments, setComments] = useState<NewsComment[]>(article.comments || []);

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

  const handleToggleBookmark = () => {
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    onBookmarkChange?.(article.id, nextState);
    Alert.alert(nextState ? 'బుక్‌మార్క్‌లలో సేవ్ చేయబడింది' : 'బుక్‌మార్క్‌ల నుండి తొలగించబడింది');
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
      `*${article.title}*\n\n${article.content.substring(0, 160)}...\n\n👉 పూర్తి వార్త కోసం NTODAY NEWS చూడండి: https://ntodaynews.com/`
    );
    Linking.openURL(`whatsapp://send?text=${text}`).catch(() => {
      handleShare();
    });
  };

  const toggleAudio = () => {
    setIsPlayingAudio(!isPlayingAudio);
  };

  const handleAddNewComment = (newComment: NewsComment) => {
    const updated = [newComment, ...comments];
    setComments(updated);
    onAddComment?.(article.id, newComment);
  };

  return (
    <View style={[styles.cardContainer, { height: effectiveHeight, width: windowWidth }]}>
      {/* 1. UPPER SECTION: DYNAMIC PHOTO OR VIDEO WITH CURVED BORDERS */}
      <View style={styles.mediaContainer}>
        <MediaViewer
          article={article}
          currentIndex={currentIndex}
          totalCards={totalCards}
          height={mediaHeight}
          isBookmarked={isBookmarked}
          onToggleBookmark={handleToggleBookmark}
        />
      </View>

      {/* 2. RED SOURCE ATTRIBUTION STRIP */}
      <View style={styles.redStrip}>
        <View style={styles.redStripLeft}>
          <Ionicons name="flash" size={13} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.brandTitle}>{article.sourceName}</Text>
        </View>
        <View style={styles.redStripRight}>
          {article.sourceCredit ? (
            <Text style={styles.sourceCreditText}>{article.sourceCredit} • </Text>
          ) : null}
          <Text style={styles.timeAgoText}>{article.timeAgo}</Text>
          <Ionicons name="share-outline" size={13} color="#FFFFFF" style={{ marginLeft: 5 }} />
        </View>
      </View>

      {/* 3. NEWS BODY: TELUGU / ENGLISH HEADLINE & CONTENT */}
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

        {/* Comment Button with Counter */}
        <TouchableOpacity style={styles.actionItem} onPress={() => setShowCommentsModal(true)}>
          <Ionicons name="chatbubble-outline" size={22} color="#A1A1AA" />
          <Text style={styles.actionCount}>{comments.length}</Text>
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

        {/* Listen Audio / TTS Countdown Button */}
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

      {/* Comments Bottom Sheet */}
      <CommentsModal
        visible={showCommentsModal}
        storyTitle={article.title}
        comments={comments}
        onClose={() => setShowCommentsModal(false)}
        onAddComment={handleAddNewComment}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#121214',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  mediaContainer: {
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  redStrip: {
    backgroundColor: '#BA1A1A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 4,
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    justifyContent: 'center',
  },
  headlineText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 8,
  },
  bodyText: {
    color: '#E4E4E7',
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  actionToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
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
    paddingHorizontal: 8,
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
