import React, { useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExploreView } from '@/components/ExploreView';
import { AccountView } from '@/components/AccountView';
import { router } from 'expo-router';

export default function ExploreScreen() {
  const [showAccountModal, setShowAccountModal] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ExploreView
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
        <AccountView onBack={() => setShowAccountModal(false)} />
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
