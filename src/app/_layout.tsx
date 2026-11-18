import { DarkTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return <View style={{ flex: 1, backgroundColor: '#121214' }} />;
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <View style={styles.webOuter}>
        <View style={styles.webInner}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
          </Stack>
        </View>
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  webOuter: {
    flex: 1,
    backgroundColor: '#09090b',
    ...(Platform.OS === 'web'
      ? {
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
        }
      : {}),
  },
  webInner: {
    flex: 1,
    width: '100%',
    backgroundColor: '#121214',
    ...(Platform.OS === 'web'
      ? {
          maxWidth: 480,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.6,
          shadowRadius: 20,
          elevation: 10,
          overflow: 'hidden',
        }
      : {}),
  },
});
