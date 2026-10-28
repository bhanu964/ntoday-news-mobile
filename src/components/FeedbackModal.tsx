import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FeedbackSubmission } from '@/types/news';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (feedback: FeedbackSubmission) => void;
}

export function FeedbackModal({ visible, onClose, onSubmit }: FeedbackModalProps) {
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<'suggestion' | 'bug' | 'content' | 'general'>(
    'suggestion'
  );
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { key: 'suggestion', label: '💡 Have a suggestion', teLabel: 'సలహా' },
    { key: 'bug', label: '🐛 Found a bug', teLabel: 'యాప్ లోపం' },
    { key: 'content', label: '📰 Content Issue', teLabel: 'వార్తా నాణ్యత' },
    { key: 'general', label: '💬 General Feedback', teLabel: 'ఇతరములు' },
  ] as const;

  const handleSend = () => {
    if (!message.trim()) {
      Alert.alert('గమనిక (Note)', 'దయచేసి మీ సందేశాన్ని టైప్ చేయండి (Please enter your message).');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      onSubmit({
        type: selectedType,
        rating,
        message: message.trim(),
        contact: contact.trim(),
        submittedAt: new Date().toISOString(),
      });

      Alert.alert(
        'ధన్యవాదాలు (Thank you!)',
        'మీ అభిప్రాయం NTODAY డెస్క్‌కు విజయవంతంగా చేరింది. మీ సూచనలు మాకు ఎంతో విలువైనవి!',
        [
          {
            text: 'సరే (OK)',
            onPress: () => {
              setMessage('');
              setContact('');
              onClose();
            },
          },
        ]
      );
    }, 600);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.dragHandle} />
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.headerTitle}>Submit Feedback</Text>
                <Text style={styles.headerSubtitle}>
                  Have a suggestion or found a bug? Let us know!
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#A1A1AA" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Category Chips */}
            <Text style={styles.label}>Select Category (విభాగం ఎంచుకోండి)</Text>
            <View style={styles.chipGrid}>
              {categories.map((c) => {
                const isSelected = selectedType === c.key;
                return (
                  <TouchableOpacity
                    key={c.key}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => setSelectedType(c.key)}>
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Star Rating */}
            <Text style={[styles.label, { marginTop: 16 }]}>How would you rate NTODAY App?</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starBtn}>
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={28}
                    color={star <= rating ? '#F59E0B' : '#52525B'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Message Input Box */}
            <Text style={[styles.label, { marginTop: 16 }]}>Your Feedback (మీ అభిప్రాయం)</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                maxLength={500}
                placeholder="Type your message here... మీ అభిప్రాయాన్ని లేదా సమస్యను ఇక్కడ టైప్ చేయండి..."
                placeholderTextColor="#71717A"
                value={message}
                onChangeText={setMessage}
              />
              <Text style={styles.charCount}>{message.length}/500</Text>
            </View>

            {/* Optional Email / Phone */}
            <Text style={[styles.label, { marginTop: 14 }]}>
              Contact Info (Optional - Email or Phone)
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="మీ ఇమెయిల్ లేదా ఫోన్ నంబర్"
              placeholderTextColor="#71717A"
              value={contact}
              onChangeText={setContact}
            />

            {/* Send Button */}
            <TouchableOpacity
              style={[styles.sendButton, isSubmitting && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.sendButtonText}>Send Feedback (అభిప్రాయం పంపండి)</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#27272a',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#52525B',
    alignSelf: 'center',
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#A1A1AA',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: 18,
  },
  label: {
    color: '#D4D4D8',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#27272a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  chipActive: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  chipText: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  starBtn: {
    padding: 4,
  },
  inputBox: {
    backgroundColor: '#121214',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 12,
  },
  textArea: {
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    color: '#71717A',
    fontSize: 11,
    marginTop: 4,
  },
  textInput: {
    backgroundColor: '#121214',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 13,
    marginBottom: 20,
  },
  sendButton: {
    backgroundColor: '#E50914',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#52525B',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
