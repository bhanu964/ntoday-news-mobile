import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/context/LanguageContext';

export type FeedFilterType = 'latest' | 'unread' | 'feedback';

interface TopHeaderProps {
  activeFilter: FeedFilterType;
  unreadCount: number;
  isTelugu?: boolean;
  onFilterChange: (filter: FeedFilterType) => void;
  onLanguageToggle?: () => void;
  onUserPress: () => void;
}

export function TopHeader({
  activeFilter,
  unreadCount,
  isTelugu: propIsTelugu,
  onFilterChange,
  onLanguageToggle,
  onUserPress,
}: TopHeaderProps) {
  const insets = useSafeAreaInsets();
  const { isTelugu: ctxIsTelugu, t, toggleLanguage } = useLanguage();
  const isTelugu = propIsTelugu !== undefined ? propIsTelugu : ctxIsTelugu;

  const handleLangPress = () => {
    if (onLanguageToggle) {
      onLanguageToggle();
    } else {
      toggleLanguage();
    }
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 8) }]}>
      {/* 1. Left: Human/User Profile Button (Opens User Settings, Name, Profile) */}
      <TouchableOpacity
        style={styles.userButton}
        onPress={onUserPress}
        activeOpacity={0.7}
        accessibilityLabel="User Profile and Settings">
        <Ionicons name="person-outline" size={19} color="#FFFFFF" />
      </TouchableOpacity>

      {/* 2. Center: Clean Segmented Filter Capsule (News | Unread) */}
      <View style={styles.segmentedContainer}>
        {/* News */}
        <TouchableOpacity
          style={[styles.segmentPill, activeFilter === 'latest' && styles.segmentPillActive]}
          onPress={() => onFilterChange('latest')}
          activeOpacity={0.8}>
          <Text style={[styles.segmentText, activeFilter === 'latest' && styles.segmentTextActive]}>
            {t.newsTab}
          </Text>
        </TouchableOpacity>

        {/* Unread with Red Badge */}
        <TouchableOpacity
          style={[styles.segmentPill, activeFilter === 'unread' && styles.segmentPillActive]}
          onPress={() => onFilterChange('unread')}
          activeOpacity={0.8}>
          <Text style={[styles.segmentText, activeFilter === 'unread' && styles.segmentTextActive]}>
            {t.unreadTab}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.badgeRed}>
              <Text style={styles.badgeRedText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 3. Right: Clean Logo + [తె | A] Language Toggle Pill */}
      <View style={styles.rightSection}>
        <Image
          source={require('../../assets/images/ntoday-official-logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={styles.langPill}
          activeOpacity={0.75}
          onPress={handleLangPress}
          accessibilityLabel={isTelugu ? 'Switch language to English' : 'Switch language to Telugu'}>
          <View style={[styles.langSegment, isTelugu && styles.langSegmentActive]}>
            <Text style={[styles.langText, isTelugu && styles.langTextActive]}>తె</Text>
          </View>
          <View style={styles.langDivider} />
          <View style={[styles.langSegment, !isTelugu && styles.langSegmentActive]}>
            <Text style={[styles.langText, !isTelugu && styles.langTextActive]}>A</Text>
          </View>
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
  userButton: {
    width: 35,
    height: 35,
    borderRadius: 8,
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f1f23',
    borderRadius: 24,
    padding: 3,
    gap: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  segmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  segmentPillActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    color: '#A1A1AA',
    fontSize: 12.5,
    fontWeight: '700',
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
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    width: 38,
    height: 23,
    borderRadius: 3,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    padding: 2,
    borderRadius: 16,
  },
  langSegment: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  langSegmentActive: {
    backgroundColor: '#E50914',
  },
  langDivider: {
    width: 1,
    height: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginHorizontal: 1,
  },
  langText: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '700',
  },
  langTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
