import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_NEWS_ARTICLES } from '@/data/mockNews';
import { NewsArticle } from '@/types/news';
import { ArticlesService } from '@/services/articlesService';
import { useLanguage } from '@/context/LanguageContext';

interface LiveViewProps {
  isTelugu?: boolean;
}

export function LiveView({ isTelugu: propIsTelugu }: LiveViewProps) {
  const [updates, setUpdates] = useState<NewsArticle[]>(MOCK_NEWS_ARTICLES);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { isTelugu: ctxIsTelugu, t } = useLanguage();
  const isTelugu = propIsTelugu !== undefined ? propIsTelugu : ctxIsTelugu;

  const loadLiveFeed = useCallback(async () => {
    try {
      const res = await ArticlesService.fetchArticles({ limit: 10 });
      if (res.articles.length > 0) {
        setUpdates(res.articles);
      }
    } catch {
      // Keep existing
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLiveFeed();
  }, [loadLiveFeed]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLiveFeed();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E50914" />}>
      {/* Live Badge Banner */}
      <View style={styles.liveBanner}>
        <View style={styles.pulseDot} />
        <Text style={styles.liveBannerText}>{t.liveBannerText}</Text>
      </View>

      <TouchableOpacity
        style={styles.radioCard}
        activeOpacity={0.8}
        onPress={() => Linking.openURL('https://ntodaynews.com/live-radio')}>
        <View style={styles.radioIconCircle}>
          <Ionicons name="radio" size={24} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.radioTitle}>{t.liveRadioTitle}</Text>
          <Text style={styles.radioSubtitle}>{t.liveRadioSubtitle}</Text>
        </View>
        <Ionicons name="volume-high" size={22} color="#E50914" />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>{t.liveBreakingUpdates}</Text>

      {loading && !refreshing ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="small" color="#E50914" />
        </View>
      ) : (
        updates.map((article, idx) => {
          const displayTitle = !isTelugu && article.title_en ? article.title_en : article.title;
          const displayContent = !isTelugu && article.content_en ? article.content_en : article.content;

          return (
            <View key={article.id} style={styles.updateCard}>
              <View style={styles.updateHeader}>
                <View style={styles.badgeBreaking}>
                  <Text style={styles.badgeBreakingText}>BREAKING</Text>
                </View>
                <Text style={styles.updateTime}>
                  {article.timeAgo || `${idx * 15 + 3} ${t.minutesAgo}`}
                </Text>
              </View>
              <Text style={styles.updateHeadline}>{displayTitle}</Text>
              <Text style={styles.updateContent}>{displayContent}</Text>
              <Image source={{ uri: article.imageUrl }} style={styles.updateImage} resizeMode="cover" />
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loaderBox: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f1f23',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E50914',
    marginBottom: 16,
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E50914',
  },
  liveBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  radioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c20',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 20,
  },
  radioIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  radioSubtitle: {
    color: '#71717A',
    fontSize: 11,
    marginTop: 2,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 14,
  },
  updateCard: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  updateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeBreaking: {
    backgroundColor: '#E50914',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeBreakingText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  updateTime: {
    color: '#71717A',
    fontSize: 11,
  },
  updateHeadline: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 6,
  },
  updateContent: {
    color: '#D4D4D8',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  updateImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
});
