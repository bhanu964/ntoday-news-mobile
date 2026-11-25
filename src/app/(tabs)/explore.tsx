import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ExploreView } from '@/components/ExploreView';
import { StorageService } from '@/services/storageService';
import { TopStory } from '@/types/news';

export default function ExploreTabScreen() {
  const router = useRouter();
  const [isTelugu, setIsTelugu] = useState<boolean>(true);

  useEffect(() => {
    StorageService.getLanguage().then((lang) => {
      setIsTelugu(lang === 'te');
    });
  }, []);

  const handleStorySelect = (story: TopStory) => {
    if (story.id) {
      router.push({ pathname: '/news/[id]', params: { id: story.id } });
    } else {
      router.push('/(tabs)');
    }
  };

  const handleOpenAccount = () => {
    router.push('/(tabs)/account');
  };

  return (
    <View style={styles.container}>
      <ExploreView
        isTelugu={isTelugu}
        onStorySelect={handleStorySelect}
        onOpenAccount={handleOpenAccount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
});
