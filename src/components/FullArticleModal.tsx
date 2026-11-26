import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Share,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NewsArticle } from '@/types/news';
import { APP_CONFIG } from '@/config/appConfig';
import { useLanguage } from '@/context/LanguageContext';
import { TranslationService } from '@/services/translationService';

interface FullArticleModalProps {
  visible: boolean;
  article: NewsArticle | null;
  isTelugu?: boolean;
  onClose: () => void;
  onBookmarkChange?: (id: string, isBookmarked: boolean) => void;
  isBookmarked?: boolean;
}

export function FullArticleModal({
  visible,
  article,
  isTelugu: propIsTelugu,
  onClose,
  onBookmarkChange,
  isBookmarked = false,
}: FullArticleModalProps) {
  const insets = useSafeAreaInsets();
  const { isTelugu: ctxIsTelugu, t } = useLanguage();
  const isTelugu = propIsTelugu !== undefined ? propIsTelugu : ctxIsTelugu;
  const [translatedPatch, setTranslatedPatch] = useState<Partial<NewsArticle> | null>(null);

  useEffect(() => {
    setTranslatedPatch(null);
  }, [article?.id]);

  useEffect(() => {
    if (!visible || !article || isTelugu) return;
    if (article.title_en && article.content_en) return;
    let cancelled = false;
    TranslationService.translateArticle(article).then((enriched) => {
      if (!cancelled) {
        setTranslatedPatch({
          title_en: enriched.title_en,
          content_en: enriched.content_en,
          category_en: enriched.category_en,
          authorDesk_en: enriched.authorDesk_en,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [visible, article?.id, isTelugu]);

  if (!article) return null;

  const effectiveArticle: NewsArticle = translatedPatch
    ? { ...article, ...translatedPatch }
    : article;

  const displayTitle = !isTelugu && effectiveArticle.title_en
    ? effectiveArticle.title_en
    : effectiveArticle.title;
  const fullContent = !isTelugu && effectiveArticle.content_en
    ? effectiveArticle.content_en
    : effectiveArticle.content || effectiveArticle.summary || '';
  const displayCategory = !isTelugu
    ? (effectiveArticle.category_en || effectiveArticle.category || 'News')
    : (effectiveArticle.category || 'వార్తలు');
  const paragraphs = fullContent
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

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
      `*${displayTitle}*\n\n${paragraphs[0] || ''}\n\n${prompt}\n${shareUrl}`
    );
    Linking.openURL(`whatsapp://send?text=${text}`).catch(() => {
      handleShare();
    });
  };

  const rawAuthor = (effectiveArticle.authorName || '').trim();
  const rawDesk = (
    (!isTelugu ? effectiveArticle.authorDesk_en : effectiveArticle.authorDesk) ||
    effectiveArticle.authorDesk ||
    ''
  ).trim();
  const isGenericChannelName = !rawAuthor || rawAuthor.toLowerCase().includes('ntoday');
  const reporterName = isGenericChannelName ? (rawDesk || (isTelugu ? 'డెస్క్' : 'Desk')) : rawAuthor;
  const reporterDesk = isGenericChannelName ? '' : rawDesk;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={[styles.modalRoot, { paddingTop: Math.max(insets.top, 16) }]}>
        <StatusBar style="light" />

        {/* 1. TOP NAV HEADER */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
            accessibilityLabel="Close article">
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerBrandBox}>
            <Image
              source={require('../../assets/images/ntoday-official-logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.headerBrandText}>NTODAY NEWS</Text>
          </View>

          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={handleWhatsAppShare}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={handleShare}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. SCROLLABLE ARTICLE BODY */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 60 },
          ]}
          showsVerticalScrollIndicator={true}
          bounces={true}>
          {/* Hero News Photo */}
          <View style={styles.heroImageWrapper}>
            <Image
              source={{ uri: article.imageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            {/* Category tag on image */}
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{displayCategory}</Text>
            </View>
          </View>

          {/* Article Title */}
          <Text style={styles.articleTitle}>{displayTitle}</Text>

          {/* Reporter & Metadata Bar */}
          <View style={styles.reporterMetaBar}>
            <View style={styles.reporterInfoLeft}>
              <Image
                source={require('../../assets/images/ntoday-reporter-mic.png')}
                style={styles.reporterMicIcon}
                resizeMode="contain"
              />
              <View>
                <Text style={styles.reporterNameText}>{reporterName}</Text>
                <Text style={styles.reporterDeskText}>{reporterDesk}</Text>
              </View>
            </View>

            <View style={styles.pubTimeBox}>
              <Ionicons name="time-outline" size={13} color="#A1A1AA" />
              <Text style={styles.pubTimeText}>{article.timeAgo || 'Just now'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Full Telugu Article Paragraphs */}
          <View style={styles.articleBodyContainer}>
            {paragraphs.map((p, idx) => (
              <Text key={idx} style={styles.paragraphText}>
                {p}
              </Text>
            ))}
          </View>

          {/* Bottom Share Box */}
          <View style={styles.bottomShareCard}>
            <Text style={styles.bottomShareTitle}>
              {isTelugu ? 'ఈ వార్తను మీ మిత్రులతో పంచుకోండి' : 'Share this news story with your friends'}
            </Text>
            <View style={styles.bottomShareBtnRow}>
              <TouchableOpacity
                style={styles.whatsAppSharePill}
                onPress={handleWhatsAppShare}
                activeOpacity={0.8}>
                <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                <Text style={styles.whatsAppPillText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.nativeSharePill}
                onPress={handleShare}
                activeOpacity={0.8}>
                <Ionicons name="share-outline" size={18} color="#FFFFFF" />
                <Text style={styles.nativeSharePillText}>{isTelugu ? 'షేర్ చేయండి' : 'Share'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Dismiss button at bottom */}
          <TouchableOpacity style={styles.dismissBtn} onPress={onClose} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={16} color="#FFFFFF" />
            <Text style={styles.dismissBtnText}>{isTelugu ? 'ఫీడ్‌కి తిరిగి వెళ్లండి' : 'Back to Feed'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0E0E12',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#27272A',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E1E24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBrandBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  headerLogo: {
    width: 20,
    height: 18,
  },
  headerBrandText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E1E24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  heroImageWrapper: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#18181B',
    marginBottom: 14,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#E50914',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  articleTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 12,
  },
  reporterMetaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141418',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 0.8,
    borderColor: '#27272A',
    marginBottom: 14,
  },
  reporterInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reporterMicIcon: {
    width: 20,
    height: 20,
  },
  reporterNameText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  reporterDeskText: {
    color: '#A1A1AA',
    fontSize: 10.5,
    fontWeight: '500',
  },
  pubTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pubTimeText: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#27272A',
    marginBottom: 16,
  },
  articleBodyContainer: {
    gap: 14,
    marginBottom: 24,
  },
  paragraphText: {
    color: '#E4E4E7',
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '400',
  },
  bottomShareCard: {
    backgroundColor: '#141418',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 0.8,
    borderColor: '#27272A',
    marginBottom: 16,
    gap: 12,
  },
  bottomShareTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  bottomShareBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  whatsAppSharePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#25D366',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  whatsAppPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  nativeSharePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#27272A',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  nativeSharePillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  dismissBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1F1F24',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 0.8,
    borderColor: '#3F3F46',
  },
  dismissBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
