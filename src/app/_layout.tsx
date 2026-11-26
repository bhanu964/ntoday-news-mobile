import { DarkTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from '@/context/LanguageContext';

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

  // Set web document styles for 100dvh viewport and prevent pull-to-refresh interference on mobile browsers
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      try {
        const rootHtml = document.documentElement;
        const rootBody = document.body;
        if (rootHtml) {
          rootHtml.style.height = '100%';
          rootHtml.style.height = '100dvh';
          // @ts-ignore
          rootHtml.style.overscrollBehavior = 'contain';
        }
        if (rootBody) {
          rootBody.style.height = '100%';
          rootBody.style.height = '100dvh';
          rootBody.style.margin = '0';
          rootBody.style.padding = '0';
          rootBody.style.overflow = 'hidden';
          // @ts-ignore
          rootBody.style.overscrollBehavior = 'contain';
          // @ts-ignore
          rootBody.style.WebkitOverflowScrolling = 'touch';
        }
      } catch {
        // Safe fallback in non-standard DOM environments
      }
    }
  }, []);

  if (!loaded && !error) {
    return <View style={{ flex: 1, backgroundColor: '#121214' }} />;
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider value={DarkTheme}>
          <View style={styles.webOuter}>
            <View style={styles.webInner}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
              </Stack>
            </View>
          </View>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
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
          height: '100vh',
          // @ts-ignore
          height: '100dvh',
          overflow: 'hidden',
          overscrollBehavior: 'contain',
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
          height: '100vh',
          // @ts-ignore
          height: '100dvh',
          overscrollBehavior: 'contain',
        }
      : {}),
  },
});
