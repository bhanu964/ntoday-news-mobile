import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AccountView } from '@/components/AccountView';
import { useLanguage } from '@/context/LanguageContext';

export default function AccountTabScreen() {
  const router = useRouter();
  const { isTelugu } = useLanguage();

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
