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
import { FullArticleModal } from './FullArticleModal';
import { TranslationService } from '@/services/translationService';
import { useLanguage } from '@/context/LanguageContext';

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
  const photoRatio = isShortScreen ? 0.33 : 0.39;
  const headlineFontSize = isShortScreen ? 17.5 : 18.5;
  const headlineLineHeight = isShortScreen ? 24 : 25.5;
  const bodyFontSize = isShortScreen ? 14 : 15;
  const bodyLineHeight = isShortScreen ? 21.5 : 23;

  const topPadding = 8;       // 8px under photo
  const headlineGap = 4;      // 4px between headline and body
  const metaHeight = 32;      // meta row
  const actionHeight = 56;    // action bar

  const photoHeight = Math.round(pageHeight * photoRatio);
  const headlineBlockHeight = 2 * headlineLineHeight;
  const bodyBlockHeight = 8 * bodyLineHeight;

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
  isTelugu: _propIsTelugu,
  isActive = true,
  onBookmarkChange,
  onAddComment,
  onToggleLike,
  onCardPress,
}: NewsCardProps) {
  const { isTelugu, t } = useLanguage();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const effectiveWidth = cardWidth || (Platform.OS === 'web' ? Math.min(windowWidth, 480) : windowWidth);
  const effectiveHeight = cardHeight || (windowHeight > 0 ? windowHeight - 56 : 700);

  // Compute fixed template metrics once from effectiveHeight
  const template = computeCardTemplate(effectiveHeight);
  const {
    photoHeight,
    headlineFontSize,
    headlineLineHeight,
    bodyFontSize,
    bodyLineHeight,
  } = template;

  // Dynamic exact body line count so text fills available vertical space without ever overlapping the Read More pill
  const reservedChromeHeight = 56 + photoHeight + 46 + 40 + (2 * headlineLineHeight + 6);
  const availableBodyHeight = Math.max(80, effectiveHeight - reservedChromeHeight);
  const maxBodyLines = Math.max(4, Math.floor(availableBodyHeight / bodyLineHeight));

  const [likes, setLikes] = useState(article.likesCount || 0);
  const [hasLiked, setHasLiked] = useState(article.isLiked ?? false);
  const [hasDisliked, setHasDisliked] = useState(article.isDisliked ?? false);
  const [dislikes, setDislikes] = useState(article.dislikesCount || 0);
  const [isBookmarked, setIsBookmarked] = useState(article.isBookmarked ?? false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(article.audioDurationSeconds);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showFullArticleModal, setShowFullArticleModal] = useState(false);
  const [comments, setComments] = useState<NewsComment[]>(article.comments || []);
  const [translatedPatch, setTranslatedPatch] = useState<Partial<NewsArticle> | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Sync state when article prop changes
  useEffect(() => {
    setLikes(article.likesCount || 0);
    setDislikes(article.dislikesCount || 0);
    setHasLiked(article.isLiked ?? false);
    setHasDisliked(article.isDisliked ?? false);
    setIsBookmarked(article.isBookmarked ?? false);
    setTranslatedPatch(null);
    if (article.comments) {
      setComments(article.comments);
    }
  }, [article.id, article.likesCount, article.dislikesCount, article.isLiked, article.isDisliked, article.isBookmarked, article.comments]);

  // Dynamic on-demand translation to English when English mode is active
  useEffect(() => {
    if (isTelugu) return;
    if (article.title_en && article.content_en) return;

    let cancelled = false;
    setIsTranslating(true);
    TranslationService.translateArticle(article)
      .then((enriched) => {
        if (!cancelled) {
          setTranslatedPatch({
            title_en: enriched.title_en,
            content_en: enriched.content_en,
            summary_en: enriched.summary_en,
            category_en: enriched.category_en,
            authorDesk_en: enriched.authorDesk_en,
          });
        }
      })
      .finally(() => {
        if (!cancelled) setIsTranslating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isTelugu, article.id, article.title_en, article.content_en]);

  const effectiveArticle: NewsArticle = translatedPatch
    ? { ...article, ...translatedPatch }
    : article;

  // Dynamic bilingual text
  const displayTitle = !isTelugu && effectiveArticle.title_en
    ? effectiveArticle.title_en
    : effectiveArticle.title;
  const rawBody = !isTelugu
    ? (effectiveArticle.content_en || effectiveArticle.summary_en || effectiveArticle.content || effectiveArticle.summary || '')
    : (effectiveArticle.content || effectiveArticle.summary || '');
  const displayBody = rawBody
    .replace(/\r\n/g, '\n')
    .replace(/\n\s*\n+/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

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
      if (hasDisliked) {
        setHasDisliked(false);
        setDislikes((d) => Math.max(0, d - 1));
      }
      return;
    }
    if (hasLiked) {
      setLikes(Math.max(0, likes - 1));
      setHasLiked(false);
    } else {
      setLikes(likes + 1);
      setHasLiked(true);
      if (hasDisliked) {
        setHasDisliked(false);
        setDislikes((d) => Math.max(0, d - 1));
      }
    }
  };

  const handleDislike = () => {
    if (hasDisliked) {
      setHasDisliked(false);
      setDislikes((d) => Math.max(0, d - 1));
    } else {
      setHasDisliked(true);
      setDislikes((d) => d + 1);
      if (hasLiked) {
        setLikes(Math.max(0, likes - 1));
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

  // In the bottom-left photo badge, display actual reporter name from live website
  const rawAuthor = (effectiveArticle.authorName || '').trim();
  const rawDesk = (
    (!isTelugu ? effectiveArticle.authorDesk_en : effectiveArticle.authorDesk) ||
    effectiveArticle.authorDesk ||
    ''
  ).trim();
  const rawCatLabel = (
    (!isTelugu ? effectiveArticle.category_en : effectiveArticle.category) ||
    effectiveArticle.category ||
    t.newsTab
  ).trim();
  const isGenericChannelName = !rawAuthor || rawAuthor.toLowerCase().includes('ntoday');
  const reporterPersonName = isGenericChannelName ? '' : rawAuthor;
  const deskOrLocation = rawDesk && !rawDesk.toLowerCase().includes('ntoday')
    ? rawDesk
    : rawCatLabel;

  const bottomBadgeLabel = reporterPersonName
    ? (deskOrLocation && !reporterPersonName.toLowerCase().includes(deskOrLocation.toLowerCase())
        ? `${reporterPersonName} • ${deskOrLocation}`
        : reporterPersonName)
    : deskOrLocation;

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
          {/* 1. Channel Brand Badge at TOP-LEFT of photo */}
          <View style={styles.photoTopBrandBadge}>
            <Image
              source={require('../../assets/images/ntoday-official-logo.png')}
              style={styles.photoTopBrandLogo}
              resizeMode="contain"
            />
            <Text style={styles.photoTopBrandText}>NTODAY NEWS</Text>
          </View>

          {/* 2. Reporter / Location Badge at BOTTOM-LEFT of photo (No redundant "NToday News") */}
          {bottomBadgeLabel ? (
            <View style={styles.photoReporterBottomBadge}>
              <Image
                source={require('../../assets/images/ntoday-reporter-mic.png')}
                style={styles.reporterMicSmallIcon}
                resizeMode="contain"
              />
              <Text style={styles.photoReporterSmallName} numberOfLines={1}>
                {bottomBadgeLabel}
              </Text>
            </View>
          ) : null}
        </View>

        {/* 2. TEXT AREA: HEADLINE (MAX 2 LINES) + EXPANDED BODY PREVIEW + BOTTOM READ MORE PILL */}
        <View style={styles.contentContainer}>
          <View style={styles.textWrapper}>
            {/* Headline */}
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

            {/* Body Preview Text - dynamically fills the available vertical space without colliding with pill */}
            <Text
              style={[
                styles.bodyText,
                {
                  color: theme.textSecondary,
                  fontSize: bodyFontSize,
                  lineHeight: bodyLineHeight,
                },
              ]}
              numberOfLines={maxBodyLines}>
              {displayBody}
            </Text>
          </View>

          {/* Highly Visible Read More Button - anchored neatly below clipped textWrapper */}
          <View style={styles.readMoreRow}>
            <TouchableOpacity
              style={styles.readMorePill}
              onPress={() => setShowFullArticleModal(true)}
              activeOpacity={0.75}
              hitSlop={{ top: 8, bottom: 8, left: 10, right: 10 }}>
              <Text style={styles.readMorePillText}>{t.readMore}</Text>
              <Ionicons name="arrow-forward-circle" size={16} color="#E50914" />
            </TouchableOpacity>
            {isTranslating && !isTelugu && (
              <Text style={styles.translatingLabel}>{t.translating}</Text>
            )}
          </View>
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
            {likes > 0 ? (
              <Text style={[styles.actionCountText, { color: hasLiked ? theme.brandRedBright : theme.iconColor }]}>
                {formatCount(likes)}
              </Text>
            ) : null}
          </TouchableOpacity>

          {/* Dislike - completely removed hardcoded fake 39 count */}
          <TouchableOpacity style={styles.actionItemRow} onPress={handleDislike} activeOpacity={0.7}>
            <Ionicons
              name={hasDisliked ? 'thumbs-down' : 'thumbs-down-outline'}
              size={19}
              color={hasDisliked ? theme.brandRedBright : theme.iconColor}
            />
            {dislikes > 0 ? (
              <Text style={[styles.actionCountText, { color: hasDisliked ? theme.brandRedBright : theme.iconColor }]}>
                {formatCount(dislikes)}
              </Text>
            ) : null}
          </TouchableOpacity>
        </View>

        {/* Center: Neat WhatsApp Share Button (size 36px, clean and compact) */}
        <View style={styles.centerWhatsAppContainer}>
          <TouchableOpacity
            style={styles.whatsAppCircleBtn}
            onPress={handleWhatsAppShare}
            activeOpacity={0.85}>
            <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Right Group: Comment count, Three-dot menu, Blue share arrow */}
        <View style={styles.rightActionGroup}>
          {/* Comment with count (hidden if zero) */}
          <TouchableOpacity style={styles.actionItemRow} onPress={() => setShowCommentsModal(true)} activeOpacity={0.7}>
            <Ionicons name="chatbubble-outline" size={19} color={theme.iconColor} />
            {comments.length > 0 ? (
              <Text style={[styles.actionCountText, { color: theme.iconColor }]}>
                {comments.length}
              </Text>
            ) : null}
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

      {/* 7. FULL ARTICLE SCROLLABLE MODAL */}
      <FullArticleModal
        visible={showFullArticleModal}
        article={effectiveArticle}
        isTelugu={isTelugu}
        onClose={() => setShowFullArticleModal(false)}
        onBookmarkChange={onBookmarkChange}
        isBookmarked={isBookmarked}
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
  // Channel Brand Badge at TOP-LEFT of photo
  photoTopBrandBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 4,
    gap: 5,
    zIndex: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  photoTopBrandLogo: {
    width: 17,
    height: 15,
  },
  photoTopBrandText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  // Small Reporter badge attached to bottom-left of photo (like Way2News)
  photoReporterBottomBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 12, 0.84)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderTopRightRadius: 5,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 0,
    zIndex: 10,
    maxWidth: '85%',
    borderWidth: 0.8,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  reporterMicSmallIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  photoReporterSmallName: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  photoReporterSmallDesk: {
    color: '#A1A1AA',
    fontSize: 10,
    fontWeight: '500',
  },
  // Text area starts about 8px below photo, filling available vertical space down to metaRow
  contentContainer: {
    flex: 1,
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 8,
    paddingBottom: 38,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  textWrapper: {
    flexShrink: 1,
    overflow: 'hidden',
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 2,
    zIndex: 2,
  },
  translatingLabel: {
    color: '#A1A1AA',
    fontSize: 11,
    fontStyle: 'italic',
  },
  headlineText: {
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  bodyText: {
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  readMorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#1E1E24',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 6,
    marginTop: 6,
    marginBottom: 2,
    borderWidth: 0.8,
    borderColor: '#3F3F46',
  },
  readMorePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
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
  // Compact WhatsApp Button in the center (proportionate, no overflow)
  centerWhatsAppContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  whatsAppCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
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
