import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TopHeaderProps {
  onLanguageToggle?: () => void;
  onFilterPress?: () => void;
  onBookmarksPress?: () => void;
}

export function TopHeader({ onLanguageToggle, onFilterPress, onBookmarksPress }: TopHeaderProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'latest' | 'unread' | 'feedback'>('latest');
  const [isTelugu, setIsTelugu] = useState(true);

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 8) }]}>
      {/* Language Switcher Pill */}
      <TouchableOpacity
        style={styles.langPill}
        activeOpacity={0.7}
        onPress={() => {
          setIsTelugu(!isTelugu);
          onLanguageToggle?.();
        }}>
        <View style={styles.langBadge}>
          <Text style={styles.langBadgeText}>{isTelugu ? 'తె' : 'En'}</Text>
        </View>
        <Text style={styles.langSecondaryText}>{isTelugu ? 'A' : 'తె'}</Text>
      </TouchableOpacity>

      {/* Segmented Filter Pills */}
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[styles.segmentPill, activeTab === 'latest' && styles.segmentPillActive]}
          onPress={() => setActiveTab('latest')}>
          <Text style={[styles.segmentText, activeTab === 'latest' && styles.segmentTextActive]}>
            Latest
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentPill, activeTab === 'unread' && styles.segmentPillActive]}
          onPress={() => setActiveTab('unread')}>
          <Text style={[styles.segmentText, activeTab === 'unread' && styles.segmentTextActive]}>
            Unread
          </Text>
          <View style={styles.badgeRed}>
            <Text style={styles.badgeRedText}>99+</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentPill, activeTab === 'feedback' && styles.segmentPillActive]}
          onPress={() => {
            setActiveTab('feedback');
            Alert.alert('Feedback', 'Thank you for reading NTODAY NEWS! Feedback submitted.');
          }}>
          <Text style={[styles.segmentText, activeTab === 'feedback' && styles.segmentTextActive]}>
            Feedback
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Icons */}
      <View style={styles.rightIconsContainer}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onBookmarksPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="flag-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={onFilterPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialCommunityIcons name="tune" size={21} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 8,
    backgroundColor: '#121214',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#26262a',
    zIndex: 10,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  langBadge: {
    backgroundColor: '#E50914',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  langBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  langSecondaryText: {
    color: '#D4D4D8',
    fontSize: 12,
    fontWeight: '700',
  },
  segmentedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f1f23',
    borderRadius: 24,
    padding: 3,
    gap: 2,
  },
  segmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  segmentPillActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#09090B',
    fontWeight: '800',
  },
  badgeRed: {
    backgroundColor: '#E50914',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 4,
  },
  badgeRedText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  rightIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
});
