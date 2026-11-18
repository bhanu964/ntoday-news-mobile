import React, { useState, useEffect } from 'react';
import { StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExploreView } from '@/components/ExploreView';
import { AccountView } from '@/components/AccountView';
import { router } from 'expo-router';
import { StorageService } from '@/services/storageService';

export default function ExploreScreen() {
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [isTelugu, setIsTelugu] = useState(true);

  useEffect(() => {
    StorageService.getLanguage().then((lang) => {
      setIsTelugu(lang === 'te');
    });
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ExploreView
        isTelugu={isTelugu}
        onStorySelect={() => {
          router.replace('/');
        }}
        onOpenAccount={() => setShowAccountModal(true)}
      />

      <Modal
        visible={showAccountModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowAccountModal(false)}>
        <AccountView isTelugu={isTelugu} onBack={() => setShowAccountModal(false)} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
});
