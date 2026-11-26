import React from 'react';
import { StyleSheet, View } from 'react-native';
import { VideosView } from '@/components/VideosView';
import { useLanguage } from '@/context/LanguageContext';

export default function VideosTabScreen() {
  const { isTelugu } = useLanguage();

  return (
    <View style={styles.container}>
      <VideosView isTelugu={isTelugu} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
});
