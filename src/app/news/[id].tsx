import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArticlesService } from '@/services/articlesService';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useLikes } from '@/hooks/useLikes';
import { NewsArticle, NewsComment } from '@/types/news';
import { NewsCard } from '@/components/NewsCard';
import { APP_CONFIG } from '@/config/appConfig';
import { useLanguage } from '@/context/LanguageContext';

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { isTelugu, toggleLanguage } = useLanguage();

  const { toggleBookmark } = useBookmarks();
  const { toggleLike } = useLikes();

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    ArticlesService.fetchArticleById(id)
      .then((data) => {
        setArticle(data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleLanguageToggle = () => {
    toggleLanguage();
  };

  const handleBookmarkToggle = async (articleId: string, isBookmarked: boolean) => {
    await toggleBookmark(articleId);
    setArticle((prev) => (prev ? { ...prev, isBookmarked } : null));
  };

  const handleAddComment = (articleId: string, comment: NewsComment) => {
    setArticle((prev) =>
      prev
        ? {
            ...prev,
            commentsCount: prev.commentsCount + 1,
            comments: [comment, ...(prev.comments || [])],
          }
        : null
    );
  };

  const cardWidth = Platform.OS === 'web' ? Math.min(windowWidth, 480) : windowWidth;
  const headerHeight = 56;
  const cardHeight = windowHeight - headerHeight - insets.top;

  const displayTitle = article
    ? !isTelugu && article.title_en
      ? article.title_en
      : article.title
    : 'NTODAY NEWS';

  const displaySummary = article
    ? !isTelugu && article.summary_en
      ? article.summary_en
      : article.summary || article.content.substring(0, 160)
    : 'Latest authentic Telugu news bulletin on NTODAY.';

  const canonicalUrl = `${APP_CONFIG.webBaseUrl}/news/${id}`;

  return (
    <View style={styles.container}>
      {/* Open Graph Meta Tags for Web Build */}
      <Head>
        <title>{displayTitle} — NTODAY NEWS</title>
        <meta name="description" content={displaySummary} />
        <meta property="og:title" content={displayTitle} />
        <meta property="og:description" content={displaySummary} />
        {article?.imageUrl && <meta property="og:image" content={article.imageUrl} />}
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={displayTitle} />
        <meta name="twitter:description" content={displaySummary} />
        {article?.imageUrl && <meta name="twitter:image" content={article.imageUrl} />}
      </Head>

      {/* Top Navigation Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>NTODAY</Text>
          </View>
          <Text style={styles.headerTitle}>NEWS</Text>
        </View>

        <TouchableOpacity
          style={styles.langToggleBtn}
          onPress={handleLanguageToggle}
          activeOpacity={0.8}>
          <Text style={styles.langToggleText}>{isTelugu ? 'EN' : 'తెలుగు'}</Text>
        </TouchableOpacity>
      </View>

      {/* Body Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.loadingText}>
            {isTelugu ? 'వార్త లోడ్ అవుతోంది...' : 'Loading story...'}
          </Text>
        </View>
      ) : !article ? (
        <View style={styles.notFoundContainer}>
          <Ionicons name="alert-circle-outline" size={56} color="#E50914" />
          <Text style={styles.notFoundTitle}>
            {isTelugu ? 'వార్త కనుగొనబడలేదు' : 'Story Not Found'}
          </Text>
          <Text style={styles.notFoundSubtitle}>
            {isTelugu
              ? 'ఈ కథనం తొలగించబడి ఉండవచ్చు లేదా లింక్ చెల్లనిది కావచ్చు.'
              : 'This story may have been archived or the link is invalid.'}
          </Text>
          <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/')}>
            <Text style={styles.homeBtnText}>
              {isTelugu ? 'తాజా వార్తలను చూడండి' : 'Go to Latest News'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cardWrapper}>
          <NewsCard
            article={article}
            currentIndex={1}
            totalCards={1}
            cardHeight={cardHeight}
            cardWidth={cardWidth}
            isTelugu={isTelugu}
            isActive={true}
            onBookmarkChange={handleBookmarkToggle}
            onAddComment={handleAddComment}
            onToggleLike={toggleLike}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#09090B',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#27272a',
    zIndex: 10,
  },
  backBtn: {
    padding: 6,
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    backgroundColor: '#E50914',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  langToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  langToggleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#A1A1AA',
    fontSize: 13,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  notFoundTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 14,
    textAlign: 'center',
  },
  notFoundSubtitle: {
    color: '#A1A1AA',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  homeBtn: {
    backgroundColor: '#E50914',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  homeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  cardWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
});
