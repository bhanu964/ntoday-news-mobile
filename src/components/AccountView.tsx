import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AccountViewProps {
  onBack: () => void;
}

export function AccountView({ onBack }: AccountViewProps) {
  const insets = useSafeAreaInsets();

  const handleEditProfile = () => {
    Alert.prompt
      ? Alert.prompt('Edit Profile', 'Enter your name:', (name) => {
          Alert.alert('Updated', `Welcome, ${name}`);
        })
      : Alert.alert('Profile', 'Profile edit screen');
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      {/* 1. HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 2. USER PROFILE CARD */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarQuestionMark}>?</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>User</Text>
            <Text style={styles.userEmail}>bhanurajaka1qaz@gmail.com</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="pencil" size={17} color="#71717A" />
          </TouchableOpacity>
        </View>

        {/* 3. MY SUBMISSIONS / REPORTER ROW */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => Alert.alert('రిపోర్టర్ పోర్టల్', 'మీ వార్తా కథనాలు మరియు సమర్పణలు ఇక్కడ కనిపిస్తాయి.')}>
          <View style={styles.menuRowLeft}>
            <Ionicons name="newspaper-outline" size={20} color="#A1A1AA" />
            <Text style={styles.menuRowText}>నా సమర్పణలు</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#52525B" />
        </TouchableOpacity>

        {/* 4. SAVED SECTION */}
        <View style={styles.sectionDivider}>
          <Text style={styles.sectionLabel}>SAVED</Text>
        </View>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => Alert.alert('Bookmarks', 'Bookmarked stories list')}>
          <View style={styles.menuRowLeft}>
            <Ionicons name="bookmark-outline" size={20} color="#A1A1AA" />
            <Text style={styles.menuRowText}>Bookmarks</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#52525B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => Alert.alert('Saved Shorts', 'Saved video shorts list')}>
          <View style={styles.menuRowLeft}>
            <Ionicons name="play-circle-outline" size={20} color="#A1A1AA" />
            <Text style={styles.menuRowText}>Saved Shorts</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#52525B" />
        </TouchableOpacity>

        {/* 5. PREFERENCES SECTION */}
        <View style={styles.sectionDivider}>
          <Text style={styles.sectionLabel}>PREFERENCES</Text>
        </View>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => Alert.alert('Preferences', 'Select news categories and location')}>
          <View style={styles.menuRowLeft}>
            <Ionicons name="options-outline" size={20} color="#A1A1AA" />
            <Text style={styles.menuRowText}>Feed & Content</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#52525B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => Alert.alert('Font Size', 'Adjust reading font size')}>
          <View style={styles.menuRowLeft}>
            <Ionicons name="book-outline" size={20} color="#A1A1AA" />
            <Text style={styles.menuRowText}>Reading</Text>
          </View>
          <View style={styles.readingOptions}>
            <Text style={styles.readingAa}>Aa</Text>
            <View style={styles.circleIndicator} />
            <Ionicons name="chevron-forward" size={18} color="#52525B" />
          </View>
        </TouchableOpacity>

        {/* 6. MORE SECTION */}
        <View style={styles.sectionDivider}>
          <Text style={styles.sectionLabel}>MORE</Text>
        </View>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => Linking.openURL('https://ntodaynews.com/privacy_policy')}>
          <View style={styles.menuRowLeft}>
            <Ionicons name="lock-closed-outline" size={20} color="#A1A1AA" />
            <Text style={styles.menuRowText}>Privacy & Safety</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#52525B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => Linking.openURL('https://youtube.com/@ntodaynews')}>
          <View style={styles.menuRowLeft}>
            <Ionicons name="heart-outline" size={20} color="#A1A1AA" />
            <Text style={styles.menuRowText}>Follow us</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#52525B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => Alert.alert('Feedback', 'Send suggestions to editor@ntodaynews.com')}>
          <View style={styles.menuRowLeft}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#A1A1AA" />
            <Text style={styles.menuRowText}>My Feedback</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#52525B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => Alert.alert('Account Settings', 'Manage your NToday account & subscriptions')}>
          <View style={styles.menuRowLeft}>
            <Ionicons name="person-outline" size={20} color="#A1A1AA" />
            <Text style={styles.menuRowText}>Account</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#52525B" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#27272a',
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarQuestionMark: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  userEmail: {
    color: '#71717A',
    fontSize: 13,
  },
  editButton: {
    padding: 8,
  },
  sectionDivider: {
    marginTop: 22,
    marginBottom: 8,
  },
  sectionLabel: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1f1f23',
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuRowText: {
    color: '#F4F4F5',
    fontSize: 14,
    fontWeight: '600',
  },
  readingOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readingAa: {
    color: '#71717A',
    fontSize: 13,
    fontWeight: '700',
  },
  circleIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#71717A',
  },
});
