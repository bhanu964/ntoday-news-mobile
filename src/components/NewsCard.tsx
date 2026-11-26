import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Image,
  Share,
  Linking,
  Alert,
  Platform,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NewsArticle, NewsComment } from '@/types/news';
import { APP_CONFIG } from '@/config/appConfig';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MediaViewer } from './MediaViewer';
import { CommentsModal } from './CommentsModal';

export interface TemplateMetrics {
  photoRatio: number;
  photoHeight: number;
  headlineFontSize: number;
  headlineLineHeight: number;
  headlineBlockHeight: number;
  bodyFontSize: number;
  bodyLineHeight: number;
  bodyBlockHeight: number;
  photoTop: number;
  photoBottom: number;
  headlineStart: number;
  headlineEnd: number;
  bodyStart: number;
  bodyEnd: number;
  metaRowTop: number;
  metaRowBottom: number;
  actionBarTop: number;
  actionBarBottom: number;
  safetyGap: number;
}

/**
 * FIXED TEMPLATE ENGINE:
 * Calculates all layout blocks once per device screen from measured PAGE_HEIGHT.
 * Every card on that device receives the EXACT same pixel positions.
 */
export function computeCardTemplate(pageHeight: number): TemplateMetrics {
  const isShortScreen = pageHeight < 660;
  const photoRatio = isShortScreen ? 0.33 : 0.40;
  const headlineFontSize = isShortScreen ? 18 : 19.5;
  const headlineLineHeight = isShortScreen ? 25 : 28;
  const bodyFontSize = isShortScreen ? 14.5 : 16;
  const bodyLineHeight = isShortScreen ? 22 : 25;

  const topPadding = 10;      // 10px under photo
  const headlineGap = 6;      // 6px between headline and body
  const metaHeight = 32;      // meta row
  const actionHeight = 56;    // action bar

  const photoHeight = Math.round(pageHeight * photoRatio);
  const headlineBlockHeight = 2 * headlineLineHeight;
  const bodyBlockHeight = 10 * bodyLineHeight;

  const photoTop = 0;
  const photoBottom = photoHeight;
  const headlineStart = photoHeight + topPadding;
  const headlineEnd = headlineStart + headlineBlockHeight;
  const bodyStart = headlineEnd + headlineGap;
  const bodyEnd = bodyStart + bodyBlockHeight;
  const metaRowTop = pageHeight - 88;
  const metaRowBottom = pageHeight - 56;
  const actionBarTop = pageHeight - 56;
  const actionBarBottom = pageHeight;
  const safetyGap = metaRowTop - bodyEnd;

  return {
    photoRatio,
    photoHeight,
    headlineFontSize,
    headlineLineHeight,
    headlineBlockHeight,
    bodyFontSize,
    bodyLineHeight,
    bodyBlockHeight,
    photoTop,
    photoBottom,
    headlineStart,
    headlineEnd,
    bodyStart,
    bodyEnd,
    metaRowTop,
    metaRowBottom,
    actionBarTop,
    actionBarBottom,
    safetyGap,
  };
}

interface NewsCardProps {
  article: NewsArticle;
  currentIndex: number;
  totalCards: number;
  cardHeight?: number;
  cardWidth?: number;
  isTelugu?: boolean;
  isActive?: boolean;
  onBookmarkChange?: (id: string, isBookmarked: boolean) => void;
  onAddComment?: (articleId: string, comment: NewsComment) => void;
  onToggleLike?: (articleId: string, currentLikes: number) => Promise<{ newCount: number; isLiked: boolean } | void>;
  onCardPress?: () => void;
}

export function NewsCard({
  article,
  currentIndex,
  totalCards,
  cardHeight,
  cardWidth,
  isTelugu = true,
  isActive = true,
  onBookmarkChange,
  onAddComment,
  onToggleLike,
  onCardPress,
}: NewsCardProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const effectiveWidth = cardWidth || (Platform.OS === 'web' ? Math.min(windowWidth, 480) : windowWidth);
  // On home/feed the BottomNavBar is hidden, so the container fills the full available area.
  // cardHeight is the measured containerHeight passed from index.tsx; use it directly.
  const effectiveHeight = cardHeight || (windowHeight > 0 ? windowHeight - 56 : 700);

  // Compute fixed template metrics once from effectiveHeight (identical across ALL cards on this device)
  const template = computeCardTemplate(effectiveHeight);
  const {
    photoHeight,
    headlineFontSize,
    headlineLineHeight,
    headlineBlockHeight,
    bodyFontSize,
    bodyLineHeight,
    bodyBlockHeight,
  } = template;

  const [likes, setLikes] = useState(article.likesCount);
  const [hasLiked, setHasLiked] = useState(article.isLiked ?? false);
  const [hasDisliked, setHasDisliked] = useState(article.isDisliked ?? false);
  const [isBookmarked, setIsBookmarked] = useState(article.isBookmarked ?? false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(article.audioDurationSeconds);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [comments, setComments] = useState<NewsComment[]>(article.comments || []);

  // Sync state when article prop changes
  useEffect(() => {
    setLikes(article.likesCount);
    setHasLiked(article.isLiked ?? false);
    setIsBookmarked(article.isBookmarked ?? false);
    if (article.comments) {
      setComments(article.comments);
    }
  }, [article.id, article.likesCount, article.isLiked, article.isBookmarked, article.comments]);

  // Dynamic bilingual text
  const displayTitle = !isTelugu && article.title_en ? article.title_en : article.title;
  // Use summary for the card body (up to 10 lines), fallback to content
  const displayBody = !isTelugu
    ? (article.summary_en || article.summary || article.content_en || article.content)
    : (article.summary || article.content);

  // Check if article is from an external source to display in meta row
  const sourceName = article.sourceName || article.sourceCredit || '';
  const isExternalSource = Boolean(
    sourceName &&
    !sourceName.toLowerCase().includes('ntoday') &&
    sourceName.trim().length > 0
  );

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

  // Pause audio playback if card is no longer active in the Reels feed
  useEffect(() => {
    if (!isActive && isPlayingAudio) {
      setIsPlayingAudio(false);
    }
  }, [isActive]);

  const handleLike = () => {
    if (onToggleLike) {
      onToggleLike(article.id, likes).then((res) => {
        if (res) {
          setLikes(res.newCount);
          setHasLiked(res.isLiked);
        }
      });
      if (hasDisliked) setHasDisliked(false);
      return;
    }
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
    setShowMoreMenu(false);
    Alert.alert(
      nextState
        ? (isTelugu ? 'బుక్‌మార్క్‌లలో సేవ్ చేయబడింది' : 'Saved to Bookmarks')
        : (isTelugu ? 'బుక్‌మార్క్‌ల నుండి తొలగించబడింది' : 'Removed from Bookmarks')
    );
  };

  const getShareUrl = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}/news/${article.id}`;
    }
    return `${APP_CONFIG.webBaseUrl}/news/${article.id}`;
  };

  const handleShare = async () => {
    try {
      const shareUrl = getShareUrl();
      const prompt = isTelugu ? 'పూర్తి వివరాలు NTODAY NEWS లో చదవండి:' : 'Read full story on NTODAY NEWS:';
      await Share.share({
        message: `${displayTitle}\n\n${prompt}\n${shareUrl}`,
        url: shareUrl,
        title: displayTitle,
      });
    } catch {
      // ignore
    }
  };

  const handleWhatsAppShare = () => {
    const shareUrl = getShareUrl();
    const prompt = isTelugu ? '👉 పూర్తి వార్త కోసం NTODAY NEWS చూడండి:' : '👉 Read full story on NTODAY NEWS:';
    const text = encodeURIComponent(
      `*${displayTitle}*\n\n${displayBody.substring(0, 160)}...\n\n${prompt}\n${shareUrl}`
    );
    Linking.openURL(`whatsapp://send?text=${text}`).catch(() => {
      handleShare();
    });
  };

  const toggleAudio = () => {
    setIsPlayingAudio(!isPlayingAudio);
    setShowMoreMenu(false);
  };

  const handleAddNewComment = (newComment: NewsComment) => {
    const updated = [newComment, ...comments];
    setComments(updated);
    onAddComment?.(article.id, newComment);
  };

  // Format publication time: "8:01 AM" for today, "7d ago" for older
  const formatMetaTime = (publishedAt?: string, fallbackTimeAgo?: string): string => {
    if (!publishedAt) return fallbackTimeAgo || '8:01 AM';
    try {
      const pubDate = new Date(publishedAt);
      const now = new Date();
      const isToday =
        pubDate.getDate() === now.getDate() &&
        pubDate.getMonth() === now.getMonth() &&
        pubDate.getFullYear() === now.getFullYear();

      if (isToday) {
        return pubDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
      }
      return fallbackTimeAgo || '7d ago';
    } catch {
      return fallbackTimeAgo || '8:01 AM';
    }
  };

  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + ' k';
    }
    return String(count);
  };

  const reporterName = article.authorName || 'Srinivas';
  const reporterDesk = article.authorDesk || 'Desk';
  const showDesk = reporterDesk && !reporterName.toLowerCase().includes(reporterDesk.toLowerCase());

  return (
    <View
      style={[
        styles.cardContainer,
        {
          height: effectiveHeight,
          width: effectiveWidth,
          backgroundColor: theme.cardBackground,
        },
      ]}>
      {/* Interactive Card Body: Tap anywhere on photo, text, or meta to toggle header */}
      <Pressable
        onPress={onCardPress}
        style={[styles.cardInteractiveBody, { height: effectiveHeight - 56 }]}>
        {/* 1. UPPER SECTION: FIXED PHOTO/VIDEO (Exact height = photoHeight, full width, cover) */}
        <View
          style={[
            styles.mediaContainer,
            {
              height: photoHeight,
            },
          ]}>
          <MediaViewer
            article={article}
            height={photoHeight}
            isActive={isActive}
          />
          {/* Reporter name badge attached to bottom-left of photo with NO gap, like way2news */}
          <View style={styles.photoReporterBadge}>
            {/* 1. NToday News Brand (Logo + Name) */}
            <View style={styles.photoBrandSection}>
              <Image
                source={require('../../assets/images/ntoday-official-logo.png')}
                style={styles.photoReporterLogo}
                resizeMode="contain"
              />
              <Text style={styles.photoReporterChannel}>NTODAY NEWS</Text>
            </View>

            {/* 2. Sleek Divider */}
            <View style={styles.photoReporterDivider} />

            {/* 3. Reporter Section (Mic Disc + Name + Desk) */}
            <View style={styles.photoReporterSection}>
              <View style={styles.reporterMicDisc}>
                <Ionicons name="mic" size={10} color="#FFFFFF" />
              </View>
              <Text style={styles.photoReporterName} numberOfLines={1}>
                {reporterName}
              </Text>
              {showDesk && (
                <Text style={styles.photoReporterDesk} numberOfLines={1}>
                  {` • ${reporterDesk}`}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* 2. TEXT AREA: HEADLINE (MAX 2 LINES) + BODY (UP TO 10 LINES) */}
        <View style={styles.contentContainer}>
          {/* Headline: natural height up to 2 lines; when 1 line, body starts directly below with no extra gap */}
          <Text
            style={[
              styles.headlineText,
              {
                color: theme.text,
                fontSize: headlineFontSize,
                lineHeight: headlineLineHeight,
              },
            ]}
            numberOfLines={2}>
            {displayTitle}
          </Text>

          {/* Body Text: starts on the same left alignment directly under headline, up to 10 lines */}
          <Text
            style={[
              styles.bodyText,
              {
                color: theme.textSecondary,
                fontSize: bodyFontSize,
                lineHeight: bodyLineHeight,
              },
            ]}
            numberOfLines={10}>
            {displayBody}
          </Text>
        </View>

        {/* 3. META ROW: Fixed height 32, pinned just above action bar at bottom: 0 of interactive body */}
        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            <Ionicons name="time-outline" size={13} color={theme.textMuted} />
            <Text style={[styles.metaTimeText, { color: theme.textMuted }]}>
              {formatMetaTime(article.publishedAt, article.timeAgo)}
              {isExternalSource ? ` · ${sourceName}` : ''}
            </Text>
          </View>
          <Text style={[styles.metaPagesText, { color: theme.textMuted }]}>
            {currentIndex} of {totalCards} {isTelugu ? 'Pages' : 'Pages'}
          </Text>
        </View>
      </Pressable>

      {/* 5. FIXED ACTION BAR (Fixed at bottom of card, white/theme surface, thin top border) */}
      <View
        style={[
          styles.actionToolbar,
          {
            backgroundColor: theme.cardBackground,
            borderTopColor: theme.border,
          },
        ]}>
        {/* Left Group: Thumbs Up & Thumbs Down with Counts */}
        <View style={styles.leftActionGroup}>
          {/* Like */}
          <TouchableOpacity style={styles.actionItemRow} onPress={handleLike} activeOpacity={0.7}>
            <Ionicons
              name={hasLiked ? 'thumbs-up' : 'thumbs-up-outline'}
              size={19}
              color={hasLiked ? theme.brandRedBright : theme.iconColor}
            />
            <Text style={[styles.actionCountText, { color: hasLiked ? theme.brandRedBright : theme.iconColor }]}>
              {formatCount(likes)}
            </Text>
          </TouchableOpacity>

          {/* Dislike */}
          <TouchableOpacity style={styles.actionItemRow} onPress={handleDislike} activeOpacity={0.7}>
            <Ionicons
              name={hasDisliked ? 'thumbs-down' : 'thumbs-down-outline'}
              size={19}
              color={hasDisliked ? theme.brandRedBright : theme.iconColor}
            />
            <Text style={[styles.actionCountText, { color: hasDisliked ? theme.brandRedBright : theme.iconColor }]}>
              {hasDisliked ? '1' : '39'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Center: Raised Round Green WhatsApp Share Button (52px) */}
        <View style={styles.centerWhatsAppContainer}>
          <TouchableOpacity
            style={styles.whatsAppCircleBtn}
            onPress={handleWhatsAppShare}
            activeOpacity={0.85}>
            <Ionicons name="logo-whatsapp" size={30} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.whatsAppLabel}>SHARE</Text>
        </View>

        {/* Right Group: Comment count, Three-dot menu, Blue share arrow */}
        <View style={styles.rightActionGroup}>
          {/* Comment with count */}
          <TouchableOpacity style={styles.actionItemRow} onPress={() => setShowCommentsModal(true)} activeOpacity={0.7}>
            <Ionicons name="chatbubble-outline" size={19} color={theme.iconColor} />
            <Text style={[styles.actionCountText, { color: theme.iconColor }]}>
              {comments.length}
            </Text>
          </TouchableOpacity>

          {/* Three-dot menu */}
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowMoreMenu(true)} activeOpacity={0.7}>
            <Ionicons name="ellipsis-vertical" size={20} color={theme.iconColor} />
          </TouchableOpacity>

          {/* Blue Share Arrow */}
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare} activeOpacity={0.7}>
            <Ionicons name="arrow-redo" size={21} color={theme.shareBlue} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 5. THREE-DOT MORE MENU MODAL */}
      <Modal
        visible={showMoreMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMoreMenu(false)}>
        <TouchableOpacity
          style={styles.moreMenuBackdrop}
          activeOpacity={1}
          onPress={() => setShowMoreMenu(false)}>
          <View style={[styles.moreMenuSheet, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            {/* Bookmark option */}
            <TouchableOpacity style={styles.moreMenuItem} onPress={handleToggleBookmark}>
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isBookmarked ? theme.brandRedBright : theme.text}
              />
              <Text style={[styles.moreMenuText, { color: isBookmarked ? theme.brandRedBright : theme.text }]}>
                {isBookmarked
                  ? (isTelugu ? 'బుక్‌మార్క్ తొలగించండి' : 'Remove Bookmark')
                  : (isTelugu ? 'బుక్‌మార్క్ చేయండి' : 'Bookmark Story')}
              </Text>
            </TouchableOpacity>

            {/* Audio TTS option */}
            <TouchableOpacity style={styles.moreMenuItem} onPress={toggleAudio}>
              <Ionicons
                name={isPlayingAudio ? 'pause-circle' : 'volume-high-outline'}
                size={20}
                color={isPlayingAudio ? theme.brandRedBright : theme.text}
              />
              <Text style={[styles.moreMenuText, { color: isPlayingAudio ? theme.brandRedBright : theme.text }]}>
                {isPlayingAudio
                  ? (isTelugu ? `ఆడియో ఆపండి (${secondsLeft}s)` : `Pause Audio (${secondsLeft}s)`)
                  : (isTelugu ? 'వార్తను వినండి (Audio)' : 'Listen to News (Audio)')}
              </Text>
            </TouchableOpacity>

            {/* Close button */}
            <TouchableOpacity style={styles.moreMenuCancel} onPress={() => setShowMoreMenu(false)}>
              <Text style={[styles.moreMenuCancelText, { color: theme.textMuted }]}>
                {isTelugu ? 'రద్దు' : 'Close'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 6. COMMENTS BOTTOM SHEET */}
      <CommentsModal
        visible={showCommentsModal}
        articleId={article.id}
        storyTitle={displayTitle}
        comments={comments}
        isTelugu={isTelugu}
        onClose={() => setShowCommentsModal(false)}
        onAddComment={handleAddNewComment}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  cardInteractiveBody: {
    width: '100%',
    position: 'relative',
  },
  // Full-width edge-to-edge media container with exact fixed height
  mediaContainer: {
    width: '100%',
    padding: 0,
    margin: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  // Reporter name badge attached to bottom-left of photo with NO gap, like way2news
  photoReporterBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 12, 0.88)',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 0,
    zIndex: 10,
    maxWidth: '92%',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  photoBrandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  photoReporterLogo: {
    width: 22,
    height: 20,
  },
  photoReporterChannel: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  photoReporterDivider: {
    width: 1,
    height: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 7,
  },
  photoReporterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  reporterMicDisc: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4.5,
  },
  photoReporterName: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  photoReporterDesk: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '500',
  },
  // Text area starts about 10px below photo, aligned on the left
  contentContainer: {
    paddingLeft: 12,
    paddingRight: 14,
    paddingTop: 10,
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  headlineText: {
    fontWeight: '700',
    marginBottom: 6,
  },
  bodyText: {
    fontWeight: '400',
  },
  // Meta Row just above action bar (pinned at bottom: 0 of interactive body, height: 32)
  metaRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 12,
    paddingRight: 14,
    zIndex: 5,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaTimeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  metaPagesText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Fixed Action Bar (pinned at bottom: 0 of card, height: 56)
  actionToolbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 12,
    paddingRight: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  leftActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rightActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 36,
  },
  actionCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  iconBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Raised WhatsApp Button in the center
  centerWhatsAppContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    zIndex: 20,
  },
  whatsAppCircleBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  whatsAppLabel: {
    color: '#6B7280',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginTop: 2,
  },
  // Three-dot popup sheet
  moreMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 70,
  },
  moreMenuSheet: {
    width: '90%',
    maxWidth: 380,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  moreMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  moreMenuText: {
    fontSize: 15,
    fontWeight: '600',
  },
  moreMenuCancel: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  moreMenuCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
