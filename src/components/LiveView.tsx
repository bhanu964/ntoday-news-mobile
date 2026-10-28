import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_NEWS_ARTICLES } from '@/data/mockNews';

export function LiveView() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Live Badge Banner */}
      <View style={styles.liveBanner}>
        <View style={styles.pulseDot} />
        <Text style={styles.liveBannerText}>NTODAY LIVE 24x7 NEWS TICKER</Text>
      </View>

      <TouchableOpacity
        style={styles.radioCard}
        activeOpacity={0.8}
        onPress={() => Linking.openURL('https://ntodaynews.com/live-radio')}>
        <View style={styles.radioIconCircle}>
          <Ionicons name="radio" size={24} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.radioTitle}>NTODAY Live Audio Stream</Text>
          <Text style={styles.radioSubtitle}>Listen live directly from Hyderabad studio</Text>
        </View>
        <Ionicons name="volume-high" size={22} color="#E50914" />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>తాజా లైవ్ అప్‌డేట్స్ (Breaking Updates)</Text>

      {MOCK_NEWS_ARTICLES.map((article, idx) => (
        <View key={article.id} style={styles.updateCard}>
          <View style={styles.updateHeader}>
            <View style={styles.badgeBreaking}>
              <Text style={styles.badgeBreakingText}>BREAKING</Text>
            </View>
            <Text style={styles.updateTime}>{idx * 15 + 3} నిమిషాల క్రితం</Text>
          </View>
          <Text style={styles.updateHeadline}>{article.title}</Text>
          <Text style={styles.updateContent}>{article.content}</Text>
          <Image source={{ uri: article.imageUrl }} style={styles.updateImage} resizeMode="cover" />
        </View>
      ))}
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
