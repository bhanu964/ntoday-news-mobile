import React, { useEffect, useState } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StorageService } from '@/services/storageService';

export default function TabLayout() {
  const [isTelugu, setIsTelugu] = useState<boolean>(true);

  useEffect(() => {
    StorageService.getLanguage().then((lang) => {
      setIsTelugu(lang === 'te');
    });
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#09090B',
          borderTopColor: '#27272a',
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 84 : 62,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#71717A',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      }}>
      {/* 1. Feed */}
      <Tabs.Screen
        name="index"
        options={{
          title: isTelugu ? 'ఫీడ్' : 'Feed',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'newspaper' : 'newspaper-outline'}
              size={22}
              color={focused ? '#E50914' : (color as string)}
            />
          ),
        }}
      />

      {/* 2. Explore */}
      <Tabs.Screen
        name="explore"
        options={{
          title: isTelugu ? 'శోధన' : 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'compass' : 'compass-outline'}
              size={23}
              color={focused ? '#FFFFFF' : (color as string)}
            />
          ),
        }}
      />

      {/* 3. Videos */}
      <Tabs.Screen
        name="videos"
        options={{
          title: isTelugu ? 'వీడియోలు' : 'Videos',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'play-circle' : 'play-circle-outline'}
              size={24}
              color={focused ? '#E50914' : (color as string)}
            />
          ),
        }}
      />

      {/* 4. Bookmarks */}
      <Tabs.Screen
        name="bookmarks"
        options={{
          title: isTelugu ? 'సేవ్ చేసినవి' : 'Saved',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={focused ? '#FFFFFF' : (color as string)}
            />
          ),
        }}
      />

      {/* 5. Account */}
      <Tabs.Screen
        name="account"
        options={{
          title: isTelugu ? 'ఖాతా' : 'Account',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={focused ? '#FFFFFF' : (color as string)}
            />
          ),
        }}
      />
    </Tabs>
  );
}
