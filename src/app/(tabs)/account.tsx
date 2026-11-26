import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AccountView } from '@/components/AccountView';
import { StorageService } from '@/services/storageService';

export default function AccountTabScreen() {
  const router = useRouter();
  const [isTelugu, setIsTelugu] = useState<boolean>(true);

  useEffect(() => {
    StorageService.getLanguage().then((lang) => {
      setIsTelugu(lang === 'te');
    });
  }, []);

  return (
    <View style={styles.container}>
      <AccountView
        isTelugu={isTelugu}
        onBack={() => {
          router.push('/' as any);
        }}
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
