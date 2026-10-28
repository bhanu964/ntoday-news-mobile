import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TabKey = 'home' | 'live' | 'feed' | 'videos' | 'explore';

interface BottomNavBarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export function BottomNavBar({ activeTab, onTabChange }: BottomNavBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.navContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {/* 1. Home */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => onTabChange('home')}
        activeOpacity={0.7}>
        <Ionicons
          name={activeTab === 'home' ? 'home' : 'home-outline'}
          size={24}
          color={activeTab === 'home' ? '#FFFFFF' : '#71717A'}
        />
      </TouchableOpacity>

      {/* 2. Live */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => onTabChange('live')}
        activeOpacity={0.7}>
        <Ionicons
          name="radio-outline"
          size={23}
          color={activeTab === 'live' ? '#E50914' : '#71717A'}
        />
      </TouchableOpacity>

      {/* 3. Feed Capsule Indicator */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => onTabChange('feed')}
        activeOpacity={0.7}>
        <View
          style={[
            styles.capsuleIcon,
            activeTab === 'feed' ? styles.capsuleActive : styles.capsuleInactive,
          ]}
        />
      </TouchableOpacity>

      {/* 4. Videos */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => onTabChange('videos')}
        activeOpacity={0.7}>
        <Ionicons
          name={activeTab === 'videos' ? 'play-circle' : 'play-circle-outline'}
          size={25}
          color={activeTab === 'videos' ? '#FFFFFF' : '#71717A'}
        />
      </TouchableOpacity>

      {/* 5. Explore */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => onTabChange('explore')}
        activeOpacity={0.7}>
        <Ionicons
          name={activeTab === 'explore' ? 'compass' : 'compass-outline'}
          size={25}
          color={activeTab === 'explore' ? '#FFFFFF' : '#71717A'}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#09090B',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#27272a',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 48,
  },
  capsuleIcon: {
    width: 32,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  capsuleActive: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  capsuleInactive: {
    borderColor: '#71717A',
    backgroundColor: 'transparent',
  },
});
