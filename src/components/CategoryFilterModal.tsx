import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CategoryFilterModalProps {
  visible: boolean;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onClose: () => void;
}

export const NEWS_CATEGORIES = [
  { id: 'all', name: 'అన్నీ (All Stories)', icon: 'apps' },
  { id: 'రాజకీయాలు', name: 'రాజకీయాలు (Politics)', icon: 'megaphone' },
  { id: 'క్రైమ్', name: 'క్రైమ్ (Crime)', icon: 'shield-alert' },
  { id: 'వాతావరణం', name: 'వాతావరణం (Weather)', icon: 'cloudy-night' },
  { id: 'బిజినెస్', name: 'బిజినెస్ (Business)', icon: 'trending-up' },
  { id: 'విద్య', name: 'విద్య & ఉద్యోగాలు (Jobs & Education)', icon: 'school' },
  { id: 'తెలంగాణ', name: 'తెలంగాణ (Telangana)', icon: 'location' },
  { id: 'సినిమా', name: 'సినిమా (Cinema)', icon: 'film' },
  { id: 'క్రీడలు', name: 'క్రీడలు (Sports)', icon: 'football' },
  { id: 'వ్యవసాయం', name: 'వ్యవసాయం (Agriculture)', icon: 'leaf' },
  { id: 'టెక్నాలజీ', name: 'టెక్నాలజీ (Tech & ISRO)', icon: 'rocket' },
] as const;

export function CategoryFilterModal({
  visible,
  selectedCategory,
  onSelectCategory,
  onClose,
}: CategoryFilterModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.header}>
            <View style={styles.dragHandle} />
            <View style={styles.headerRow}>
              <Text style={styles.title}>కేటగిరీలు ఎంచుకోండి (Categories)</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#A1A1AA" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.list}>
            {NEWS_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryItem, isSelected && styles.categoryItemActive]}
                  onPress={() => {
                    onSelectCategory(cat.id);
                    onClose();
                  }}>
                  <View style={styles.categoryLeft}>
                    <View
                      style={[
                        styles.iconCircle,
                        isSelected ? styles.iconCircleActive : styles.iconCircleInactive,
                      ]}>
                      <Ionicons
                        name={cat.icon as any}
                        size={18}
                        color={isSelected ? '#FFFFFF' : '#A1A1AA'}
                      />
                    </View>
                    <Text style={[styles.categoryName, isSelected && styles.categoryNameActive]}>
                      {cat.name}
                    </Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={22} color="#E50914" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  header: {
    paddingHorizontal: 18,
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
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
  },
  list: {
    padding: 16,
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#1c1c20',
  },
  categoryItemActive: {
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#E50914',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: {
    backgroundColor: '#E50914',
  },
  iconCircleInactive: {
    backgroundColor: '#27272a',
  },
  categoryName: {
    color: '#D4D4D8',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryNameActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
