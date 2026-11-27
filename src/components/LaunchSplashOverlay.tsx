import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const SPLASH_HOLD_MS = 1500;
const SPLASH_FADE_MS = 350;

// Module-level guard guarantees the launch splash renders strictly once per cold app start
let hasCompletedColdLaunch = false;

interface LaunchSplashOverlayProps {
  readyToStartTimer: boolean;
  onImageReady: () => void;
}

export function LaunchSplashOverlay({
  readyToStartTimer,
  onImageReady,
}: LaunchSplashOverlayProps) {
  const [visible, setVisible] = useState<boolean>(() => !hasCompletedColdLaunch);
  const [isFading, setIsFading] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const opacity = useRef(new Animated.Value(1)).current;
  const hasNotifiedImageReady = useRef(false);

  const notifyReady = () => {
    if (!hasNotifiedImageReady.current) {
      hasNotifiedImageReady.current = true;
      setImageLoaded(true);
      onImageReady();
    }
  };

  // Safety guard so a slow/blocked image callback never blocks native splash dismissal
  useEffect(() => {
    if (!visible) return;
    const guard = setTimeout(notifyReady, 800);
    return () => clearTimeout(guard);
  }, [visible]);

  useEffect(() => {
    if (!visible || !readyToStartTimer || !imageLoaded) return;

    const timer = setTimeout(() => {
      setIsFading(true);
      Animated.timing(opacity, {
        toValue: 0,
        duration: SPLASH_FADE_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          hasCompletedColdLaunch = true;
          setVisible(false);
        }
      });
    }, SPLASH_HOLD_MS);

    return () => clearTimeout(timer);
  }, [visible, readyToStartTimer, imageLoaded, opacity]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents={isFading ? 'none' : 'auto'}
      style={[styles.overlay, { opacity }]}>
      <StatusBar style="light" />
      <Image
        source={require('../../assets/images/splash-screen.png')}
        style={styles.splashImage}
        resizeMode="cover"
        fadeDuration={0}
        onLoadEnd={notifyReady}
        accessibilityLabel="NToday News Splash Screen"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#050B2E',
    zIndex: 9999,
    elevation: 9999,
  },
  splashImage: {
    width: '100%',
    height: '100%',
  },
});
