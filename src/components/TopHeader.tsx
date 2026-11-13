import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type FeedFilterType = 'latest' | 'unread' | 'feedback';

interface TopHeaderProps {
  activeFilter: FeedFilterType;
  unreadCount: number;
  isTelugu: boolean;
  onFilterChange: (filter: FeedFilterType) => void;
  onLanguageToggle: () => void;
  onTunePress: () => void;
  onBookmarksPress: () => void;
}

export function TopHeader({
  activeFilter,
  unreadCount,
  isTelugu,
  onFilterChange,
  onLanguageToggle,
  onTunePress,
  onBookmarksPress,
}: TopHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 8) }]}>
      {/* 1. Brand Logo + Language Switcher Pill */}
      <View style={styles.leftSection}>
        <Image
          source={require('../../assets/images/ntoday-official-logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={styles.langPill}
          activeOpacity={0.7}
          onPress={onLanguageToggle}>
          <View style={styles.langBadge}>
            <Text style={styles.langBadgeText}>{isTelugu ? 'తె' : 'En'}</Text>
          </View>
          <Text style={styles.langSecondaryText}>{isTelugu ? 'A' : 'తె'}</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Segmented Filter Pills */}
      <View style={styles.segmentedContainer}>
        {/* Latest */}
        <TouchableOpacity
          style={[styles.segmentPill, activeFilter === 'latest' && styles.segmentPillActive]}
          onPress={() => onFilterChange('latest')}
          activeOpacity={0.8}>
          <Text style={[styles.segmentText, activeFilter === 'latest' && styles.segmentTextActive]}>
            Latest
          </Text>
        </TouchableOpacity>

        {/* Unread with Badge */}
        <TouchableOpacity
          style={[styles.segmentPill, activeFilter === 'unread' && styles.segmentPillActive]}
          onPress={() => onFilterChange('unread')}
          activeOpacity={0.8}>
          <Text style={[styles.segmentText, activeFilter === 'unread' && styles.segmentTextActive]}>
            Unread
          </Text>
          {unreadCount > 0 && (
            <View style={styles.badgeRed}>
              <Text style={styles.badgeRedText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Feedback */}
        <TouchableOpacity
          style={[styles.segmentPill, activeFilter === 'feedback' && styles.segmentPillActive]}
          onPress={() => onFilterChange('feedback')}
          activeOpacity={0.8}>
          <Text style={[styles.segmentText, activeFilter === 'feedback' && styles.segmentTextActive]}>
            Feedback
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Action Icons */}
      <View style={styles.rightIconsContainer}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onBookmarksPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="flag-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={onTunePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="options-outline" size={21} color="#FFFFFF" />
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
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: '#121214',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#26262a',
    zIndex: 10,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    width: 44,
    height: 26,
    borderRadius: 3,
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
