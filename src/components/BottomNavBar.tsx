import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TabKey = 'home' | 'live' | 'feed' | 'videos' | 'explore';

export interface BottomNavBarProps {
  activeTab?: TabKey;
  onTabChange?: (tab: TabKey) => void;
  isTelugu?: boolean;
  onHomePress?: () => void;
  onNewsPlusPress?: () => void;
  onReloadPress?: () => void;
  isReloading?: boolean;
}

export function BottomNavBar({
  activeTab = 'home',
  onTabChange,
  isTelugu = true,
  onHomePress,
  onNewsPlusPress,
  onReloadPress,
  isReloading = false,
}: BottomNavBarProps) {
  const insets = useSafeAreaInsets();

  const handleHome = () => {
    if (onHomePress) {
      onHomePress();
    } else if (onTabChange) {
      onTabChange('home');
    }
  };

  const handleNewsPlus = () => {
    if (onNewsPlusPress) {
      onNewsPlusPress();
    } else if (onTabChange) {
      onTabChange('home');
    }
  };

  const handleReload = () => {
    if (onReloadPress) {
      onReloadPress();
    }
  };

  return (
    <View style={[styles.navContainer, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {/* 1. Left: Home (Back to Top / Home) */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={handleHome}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 15, right: 15 }}
        accessibilityLabel="Home">
        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        <Text style={styles.navLabel}>{isTelugu ? 'హోమ్' : 'Home'}</Text>
      </TouchableOpacity>

      {/* 2. Middle: Creative News+ Pill Button (Custom branded touch) */}
      <TouchableOpacity
        style={styles.newsPlusPill}
        onPress={handleNewsPlus}
        activeOpacity={0.85}
        accessibilityLabel="News Categories and Topics">
        <Text style={styles.newsPlusText}>{isTelugu ? 'న్యూస్+' : 'News+'}</Text>
        <Ionicons name="chevron-up" size={16} color="#FFFFFF" style={styles.chevronIcon} />
      </TouchableOpacity>

      {/* 3. Right: Reload / Refresh */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={handleReload}
        disabled={isReloading}
        activeOpacity={0.6}
        hitSlop={{ top: 12, bottom: 12, left: 20, right: 20 }}
        accessibilityLabel="Reload News Feed">
        {isReloading ? (
          <ActivityIndicator size="small" color="#E50914" style={{ height: 22 }} />
        ) : (
          <Ionicons name="reload" size={21} color="#FFFFFF" />
        )}
        <Text style={[styles.navLabel, isReloading && { color: '#E50914' }]}>
          {isReloading ? (isTelugu ? 'లోడింగ్...' : 'Loading...') : (isTelugu ? 'రీలోడ్' : 'Reload')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0E0E12',
    paddingHorizontal: 32,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#25252B',
    minHeight: 56,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    gap: 3,
  },
  navLabel: {
    color: '#A1A1AA',
    fontSize: 10.5,
    fontWeight: '600',
  },
  // Creative News+ Pill Button
  newsPlusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E24',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 7,
    gap: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  newsPlusText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  chevronIcon: {
    marginLeft: 1,
  },
});
