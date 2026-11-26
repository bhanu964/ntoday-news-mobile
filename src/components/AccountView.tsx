import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StorageService } from '@/services/storageService';
import { AuthService } from '@/services/authService';
import { UserProfile } from '@/types/user';
import { TRANSLATIONS } from '@/constants/translations';

interface AccountViewProps {
  onBack: () => void;
  isTelugu?: boolean;
}

export function AccountView({ onBack, isTelugu = true }: AccountViewProps) {
  const insets = useSafeAreaInsets();
  const [bookmarkCount, setBookmarkCount] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const t = TRANSLATIONS[isTelugu ? 'te' : 'en'];

  // Onboarding Modal State
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [step, setStep] = useState<'mobile' | 'otp' | 'name'>('mobile');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [demoOtp, setDemoOtp] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [resendTimer, setResendTimer] = useState<number>(30);

  useEffect(() => {
    StorageService.getBookmarks().then((ids) => {
      setBookmarkCount(ids.length);
    });
    AuthService.getCurrentUser().then((user) => {
      setUserProfile(user);
    });
  }, []);

  // Timer for OTP countdown
  useEffect(() => {
    let timer: any;
    if (showAuthModal && step === 'otp' && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showAuthModal, step, resendTimer]);

  const handleOpenAuth = () => {
    setStep('mobile');
    setMobileNumber(userProfile?.mobile || '');
    setOtpCode('');
    setUserName(userProfile?.name || '');
    setDemoOtp('');
    setShowAuthModal(true);
  };

  const handleSendOtp = async () => {
    if (!AuthService.validateMobile(mobileNumber)) {
      Alert.alert(
        isTelugu ? 'చెల్లని మొబైల్ నంబర్' : 'Invalid Mobile Number',
        isTelugu
          ? 'దయచేసి సరైన 10-అంకెల భారతీయ మొబైల్ నంబర్‌ను నమోదు చేయండి.'
          : 'Please enter a valid 10-digit mobile number.'
      );
      return;
    }

    setLoading(true);
    const result = await AuthService.sendOtp(mobileNumber);
    setLoading(false);

    if (result.success) {
      setDemoOtp(result.otp);
      setStep('otp');
      setResendTimer(30);
    } else {
      Alert.alert(isTelugu ? 'లోపం' : 'Error', result.message);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length < 4) {
      Alert.alert(
        isTelugu ? 'OTP అవసరం' : 'OTP Required',
        isTelugu ? 'దయచేసి వచ్చిన 6-అంకెల OTP కోడ్‌ను నమోదు చేయండి.' : 'Please enter the 6-digit OTP code.'
      );
      return;
    }

    setLoading(true);
    const result = await AuthService.verifyOtp(mobileNumber, otpCode);
    setLoading(false);

    if (result.success) {
      setStep('name');
    } else {
      Alert.alert(isTelugu ? 'ధృవీకరణ విఫలమైంది' : 'Verification Failed', result.message);
    }
  };

  const handleSaveUserDetails = async () => {
    if (!userName.trim()) {
      Alert.alert(
        isTelugu ? 'పేరు అవసరం' : 'Name Required',
        isTelugu ? 'దయచేసి మీ పూర్తి పేరును నమోదు చేయండి.' : 'Please enter your full name.'
      );
      return;
    }

    setLoading(true);
    const profile = await AuthService.completeOnboarding(mobileNumber, userName);
    setUserProfile(profile);
    setLoading(false);
    setShowAuthModal(false);

    Alert.alert(
      isTelugu ? 'ధృవీకరణ విజయవంతమైంది!' : 'Verification Complete!',
      isTelugu
        ? `స్వాగతం ${profile.name}! మీ ఖాతా NTODAY డేటాబేస్‌లో విజయవంతంగా నమోదు చేయబడింది.`
        : `Welcome ${profile.name}! Your account is now verified and saved to the database.`
    );
  };

  const handleLogout = () => {
    Alert.alert(
      isTelugu ? 'లాగ్ అవుట్' : 'Logout',
      isTelugu ? 'మీరు ఖచ్చితంగా లాగ్ అవుట్ చేయాలనుకుంటున్నారా?' : 'Are you sure you want to log out?',
      [
        { text: isTelugu ? 'రద్దు' : 'Cancel', style: 'cancel' },
        {
          text: isTelugu ? 'లాగ్ అవుట్' : 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AuthService.logout();
            setUserProfile(null);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      {/* 1. HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.accountTitle}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 2. USER PROFILE CARD */}
        <View style={styles.profileCard}>
          <View style={[styles.avatarCircle, userProfile?.isVerified && styles.avatarVerified]}>
            {userProfile?.isVerified ? (
              <Ionicons name="person" size={26} color="#FFFFFF" />
            ) : (
              <Ionicons name="person-outline" size={24} color="#A1A1AA" />
            )}
            {userProfile?.isVerified && (
              <View style={styles.verifiedBadgeDot}>
                <Ionicons name="checkmark" size={10} color="#FFFFFF" />
              </View>
            )}
          </View>

          <View style={styles.profileInfo}>
            {userProfile?.isVerified ? (
              <>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>{userProfile.name}</Text>
                  <View style={styles.verifiedTag}>
                    <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                    <Text style={styles.verifiedTagText}>{isTelugu ? 'ధృవీకరించబడింది' : 'Verified'}</Text>
                  </View>
                </View>
                <Text style={styles.userPhone}>+91 {userProfile.mobile}</Text>
              </>
            ) : (
              <>
                <Text style={styles.userName}>{isTelugu ? 'ఖాతాను నమోదు చేయండి' : 'Setup Account'}</Text>
                <Text style={styles.userEmail}>
                  {isTelugu ? 'మొబైల్ ID తో లాగిన్ అవ్వండి' : 'Sign in with Mobile ID'}
                </Text>
              </>
            )}
          </View>

          <TouchableOpacity style={styles.editButton} onPress={handleOpenAuth}>
            {userProfile?.isVerified ? (
              <Ionicons name="pencil" size={18} color="#A1A1AA" />
            ) : (
              <View style={styles.loginPill}>
                <Text style={styles.loginPillText}>{isTelugu ? 'లాగిన్' : 'Sign In'}</Text>
                <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 3. MY SUBMISSIONS / REPORTER ROW */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() =>
            Alert.alert(
              isTelugu ? 'రిపోర్టర్ పోర్టల్' : 'Reporter Portal',
              isTelugu
                ? 'మీ వార్తా కథనాలు మరియు సమర్పణలు ఇక్కడ కనిపిస్తాయి.'
                : 'Your verified news submissions will be listed here.'
            )
          }>
          <View style={styles.menuRowLeft}>
            <Ionicons name="newspaper-outline" size={20} color="#A1A1AA" />
            <Text style={styles.menuRowText}>{t.mySubmissions}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#52525B" />
        </TouchableOpacity>

        {/* 4. SAVED SECTION */}
        <View style={styles.sectionDivider}>
          <Text style={styles.sectionLabel}>{t.savedSection}</Text>
        </View>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() =>
            Alert.alert(
              t.savedBookmarks,
              isTelugu
                ? `మీరు ${bookmarkCount} కథనాలను సేవ్ చేశారు.`
                : `You have ${bookmarkCount} saved stories.`
            )
          }>
          <View style={styles.menuRowLeft}>
            <Ionicons name="bookmark-outline" size={20} color="#A1A1AA" />
            <Text style={styles.menuRowText}>{t.savedBookmarks}</Text>
          </View>
          <View style={styles.readingOptions}>
            {bookmarkCount > 0 && <Text style={styles.countBadge}>{bookmarkCount}</Text>}
            <Ionicons name="chevron-forward" size={18} color="#52525B" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() =>
            Alert.alert(t.savedShorts, isTelugu ? 'సేవ్ చేసిన వీడియో షార్ట్స్' : 'Saved video shorts list')
          }>
          <View style={styles.menuRowLeft}>
            <Ionicons name="play-circle-outline" size={20} color="#A1A1AA" />
            <Text style={styles.menuRowText}>{t.savedShorts}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#52525B" />
        </TouchableOpacity>

        {/* 5. PREFERENCES SECTION */}
        <View style={styles.sectionDivider}>
          <Text style={styles.sectionLabel}>{t.preferencesSection}</Text>
        </View>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() =>
            Alert.alert(t.feedAndContent, isTelugu ? 'కేటగిరీలు మరియు ప్రాంతం' : 'Select categories and location')
          }>
          <View style={styles.menuRowLeft}>
            <Ionicons name="options-outline" size={20} color="#A1A1AA" />
            <Text style={styles.menuRowText}>{t.feedAndContent}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#52525B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() =>
            Alert.alert(t.readingFontSize, isTelugu ? 'అక్షర పరిమాణాన్ని మార్చండి' : 'Adjust reading font size')
          }>
          <View style={styles.menuRowLeft}>
            <Ionicons name="book-outline" size={20} color="#A1A1AA" />
            <Text style={styles.menuRowText}>{t.readingFontSize}</Text>
          </View>
          <View style={styles.readingOptions}>
            <Text style={styles.readingAa}>Aa</Text>
            <View style={styles.circleIndicator} />
            <Ionicons name="chevron-forward" size={18} color="#52525B" />
          </View>
        </TouchableOpacity>

        {/* 6. MORE SECTION */}
        <View style={styles.sectionDivider}>
          <Text style={styles.sectionLabel}>{t.moreSection}</Text>
        </View>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => Linking.openURL('https://ntodaynews.com/privacy_policy')}>
          <View style={styles.menuRowLeft}>
            <Ionicons name="lock-closed-outline" size={20} color="#A1A1AA" />
            <Text style={styles.menuRowText}>{t.privacySafety}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#52525B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => Linking.openURL('https://youtube.com/@ntodaynews')}>
          <View style={styles.menuRowLeft}>
            <Ionicons name="heart-outline" size={20} color="#A1A1AA" />
            <Text style={styles.menuRowText}>{t.followUs}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#52525B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() =>
            Alert.alert(
              t.myFeedback,
              isTelugu ? 'సూచనలను editor@ntodaynews.com కు పంపండి' : 'Send feedback to editor@ntodaynews.com'
            )
          }>
          <View style={styles.menuRowLeft}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#A1A1AA" />
            <Text style={styles.menuRowText}>{t.myFeedback}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#52525B" />
        </TouchableOpacity>

        {/* LOGOUT / SWITCH ACCOUNT IF VERIFIED */}
        {userProfile?.isVerified && (
          <TouchableOpacity style={[styles.menuRow, { marginTop: 12 }]} onPress={handleLogout}>
            <View style={styles.menuRowLeft}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text style={[styles.menuRowText, { color: '#EF4444' }]}>
                {isTelugu ? 'లాగ్ అవుట్ (ఖాతా మార్చండి)' : 'Log Out (Switch Account)'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#52525B" />
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* 7. INTERACTIVE USER ONBOARDING MODAL (MOBILE ID -> OTP -> NAME -> DATABASE) */}
      <Modal
        visible={showAuthModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAuthModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.authModalCard}>
            {/* Modal Header */}
            <View style={styles.authModalHeader}>
              <View style={styles.authModalHeaderLeft}>
                <View style={styles.authStepBadge}>
                  <Text style={styles.authStepBadgeText}>
                    {step === 'mobile' ? '1 / 3' : step === 'otp' ? '2 / 3' : '3 / 3'}
                  </Text>
                </View>
                <Text style={styles.authModalTitle}>
                  {step === 'mobile'
                    ? isTelugu
                      ? 'మొబైల్ ID నమోదు'
                      : 'Enter Mobile Number'
                    : step === 'otp'
                    ? isTelugu
                      ? 'OTP ధృవీకరణ'
                      : 'Verify OTP'
                    : isTelugu
                    ? 'మీ పేరు నమోదు చేయండి'
                    : 'Your Details'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAuthModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            {/* STEP 1: MOBILE NUMBER PROMPT */}
            {step === 'mobile' && (
              <View style={styles.authStepBody}>
                <Text style={styles.authSubtitle}>
                  {isTelugu
                    ? 'NTODAY న్యూస్ లో లాగిన్ అవ్వడానికి మీ 10-అంకెల మొబైల్ నంబర్ నమోదు చేయండి.'
                    : 'Enter your 10-digit mobile number to sign in or create your profile.'}
                </Text>

                <View style={styles.inputRow}>
                  <View style={styles.countryCodeBox}>
                    <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                  </View>
                  <TextInput
                    style={styles.mobileInput}
                    placeholder="9876543210"
                    placeholderTextColor="#52525B"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryActionBtn, loading && styles.btnDisabled]}
                  onPress={handleSendOtp}
                  disabled={loading}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryActionBtnText}>
                        {isTelugu ? 'OTP పంపండి' : 'Send OTP Code'}
                      </Text>
                      <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {step === 'otp' && (
              <View style={styles.authStepBody}>
                <Text style={styles.authSubtitle}>
                  {isTelugu
                    ? `+91 ${mobileNumber} కు పంపిన 6-అంకెల ధృవీకరణ కోడ్‌ను నమోదు చేయండి.`
                    : `Enter the 6-digit verification code sent to +91 ${mobileNumber}.`}
                </Text>

                {/* Instant Demo OTP Banner for Reviewers & Quick Testing */}
                {demoOtp ? (
                  <View style={styles.demoOtpBanner}>
                    <View style={styles.demoOtpLeft}>
                      <Ionicons name="key" size={16} color="#F59E0B" />
                      <Text style={styles.demoOtpText}>
                        {isTelugu ? 'డెమో OTP కోడ్:' : 'Demo OTP Code:'} <Text style={styles.demoOtpCode}>{demoOtp}</Text>
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.autoFillPill}
                      onPress={() => setOtpCode(demoOtp)}>
                      <Text style={styles.autoFillText}>{isTelugu ? 'ఆటో-ఫిల్' : 'Auto Fill'}</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                <TextInput
                  style={styles.otpInput}
                  placeholder="1 2 3 4 5 6"
                  placeholderTextColor="#52525B"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  autoFocus
                />

                <View style={styles.resendRow}>
                  {resendTimer > 0 ? (
                    <Text style={styles.resendTimerText}>
                      {isTelugu ? `మళ్లీ పంపడానికి ${resendTimer} సెకన్లు వేచి ఉండండి` : `Resend in ${resendTimer}s`}
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleSendOtp} disabled={loading}>
                      <Text style={styles.resendActiveText}>
                        {isTelugu ? 'OTP మళ్లీ పంపండి (Resend OTP)' : 'Resend OTP Code'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.primaryActionBtn, loading && styles.btnDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={loading}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryActionBtnText}>
                        {isTelugu ? 'ధృవీకరించండి' : 'Verify & Proceed'}
                      </Text>
                      <Ionicons name="checkmark-circle" size={17} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.backStepBtn} onPress={() => setStep('mobile')}>
                  <Text style={styles.backStepText}>
                    {isTelugu ? 'మొబైల్ నంబర్ మార్చండి' : 'Change Mobile Number'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 3: USER DETAILS (NAME) */}
            {step === 'name' && (
              <View style={styles.authStepBody}>
                <Text style={styles.authSubtitle}>
                  {isTelugu
                    ? 'మీ ప్రొఫైల్ మరియు వ్యాఖ్యల కోసం మీ పూర్తి పేరును నమోదు చేయండి.'
                    : 'Enter your full name to complete your profile setup.'}
                </Text>

                <View style={styles.inputRow}>
                  <View style={styles.countryCodeBox}>
                    <Ionicons name="person" size={18} color="#A1A1AA" />
                  </View>
                  <TextInput
                    style={styles.mobileInput}
                    placeholder={isTelugu ? 'మీ పేరు (ఉదా: చంద్రశేఖర్)' : 'Your Name (e.g. Srinivas)'}
                    placeholderTextColor="#52525B"
                    value={userName}
                    onChangeText={setUserName}
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryActionBtn, loading && styles.btnDisabled]}
                  onPress={handleSaveUserDetails}
                  disabled={loading}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryActionBtnText}>
                        {isTelugu ? 'పూర్తి చేయండి (డేటాబేస్ లో సేవ్)' : 'Save to Database'}
                      </Text>
                      <Ionicons name="cloud-upload" size={17} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#18181B',
    padding: 14,
    borderRadius: 14,
    borderWidth: 0.8,
    borderColor: '#27272A',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarVerified: {
    backgroundColor: '#E50914',
  },
  verifiedBadgeDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#18181B',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  userPhone: {
    color: '#A1A1AA',
    fontSize: 12.5,
    fontWeight: '600',
  },
  userEmail: {
    color: '#71717A',
    fontSize: 12,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  verifiedTagText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  editButton: {
    padding: 6,
  },
  loginPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E50914',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  loginPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  countBadge: {
    color: '#E50914',
    fontSize: 12,
    fontWeight: '800',
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  authModalCard: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  authModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  authModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authStepBadge: {
    backgroundColor: 'rgba(229, 9, 20, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  authStepBadgeText: {
    color: '#E50914',
    fontSize: 11,
    fontWeight: '800',
  },
  authModalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  authStepBody: {
    marginTop: 4,
  },
  authSubtitle: {
    color: '#A1A1AA',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#09090B',
    borderWidth: 1.2,
    borderColor: '#3F3F46',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 18,
  },
  countryCodeBox: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#1E1E24',
    borderRightWidth: 1,
    borderRightColor: '#27272A',
  },
  countryCodeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  mobileInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  otpInput: {
    backgroundColor: '#09090B',
    borderWidth: 1.5,
    borderColor: '#E50914',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 6,
    textAlign: 'center',
    marginBottom: 14,
  },
  demoOtpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  demoOtpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  demoOtpText: {
    color: '#D4D4D8',
    fontSize: 12,
    fontWeight: '600',
  },
  demoOtpCode: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  autoFillPill: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  autoFillText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
  },
  resendRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resendTimerText: {
    color: '#71717A',
    fontSize: 12,
  },
  resendActiveText: {
    color: '#E50914',
    fontSize: 13,
    fontWeight: '700',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E50914',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  backStepBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  backStepText: {
    color: '#A1A1AA',
    fontSize: 12.5,
    fontWeight: '600',
  },
});
