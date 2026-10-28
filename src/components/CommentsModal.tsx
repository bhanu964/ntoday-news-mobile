import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NewsComment } from '@/types/news';

interface CommentsModalProps {
  visible: boolean;
  storyTitle: string;
  comments: NewsComment[];
  onClose: () => void;
  onAddComment: (comment: NewsComment) => void;
}

export function CommentsModal({
  visible,
  storyTitle,
  comments,
  onClose,
  onAddComment,
}: CommentsModalProps) {
  const insets = useSafeAreaInsets();
  const [commentText, setCommentText] = useState('');

  const handleSend = () => {
    if (!commentText.trim()) return;

    const newComment: NewsComment = {
      id: `comment-${Date.now()}`,
      userName: 'నేను (మీరు)',
      text: commentText.trim(),
      timeAgo: 'Just now',
      likesCount: 0,
    };

    onAddComment(newComment);
    setCommentText('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.dragHandle} />
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>వ్యాఖ్యలు (Comments)</Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {storyTitle}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#A1A1AA" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments List */}
          {comments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={42} color="#52525B" />
              <Text style={styles.emptyText}>మొదటి వ్యాఖ్యను మీరే రాయండి!</Text>
              <Text style={styles.emptySubtext}>Be the first to share your thoughts.</Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.userName.charAt(0)}</Text>
                  </View>
                  <View style={styles.commentContent}>
                    <View style={styles.commentUserRow}>
                      <Text style={styles.userName}>{item.userName}</Text>
                      <Text style={styles.timeAgo}>{item.timeAgo}</Text>
                    </View>
                    <Text style={styles.commentText}>{item.text}</Text>
                  </View>
                </View>
              )}
            />
          )}

          {/* Add Comment Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="మీ అభిప్రాయాన్ని రాయండి..."
              placeholderTextColor="#71717A"
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
              disabled={!commentText.trim()}
              onPress={handleSend}>
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: 380,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
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
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#71717A',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  commentContent: {
    flex: 1,
  },
  commentUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    color: '#F4F4F5',
    fontSize: 13,
    fontWeight: '700',
  },
  timeAgo: {
    color: '#71717A',
    fontSize: 11,
  },
  commentText: {
    color: '#D4D4D8',
    fontSize: 13,
    lineHeight: 19,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySubtext: {
    color: '#71717A',
    fontSize: 12,
    marginTop: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#121214',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#27272a',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#1c1c20',
    color: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    maxHeight: 80,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#3f3f46',
    opacity: 0.5,
  },
});
