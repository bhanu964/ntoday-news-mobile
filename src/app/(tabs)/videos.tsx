import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { VideosView } from '@/components/VideosView';
import { StorageService } from '@/services/storageService';

export default function VideosTabScreen() {
  const [isTelugu, setIsTelugu] = useState<boolean>(true);

  useEffect(() => {
    StorageService.getLanguage().then((lang) => {
      setIsTelugu(lang === 'te');
    });
  }, []);

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
