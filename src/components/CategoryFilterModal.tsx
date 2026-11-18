import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArticlesService } from '@/services/articlesService';
import { NewsCategory } from '@/types/news';

interface CategoryFilterModalProps {
  visible: boolean;
  selectedCategory: string;
  isTelugu?: boolean;
  onSelectCategory: (category: string) => void;
  onClose: () => void;
}

export const DEFAULT_NEWS_CATEGORIES = [
  { id: 'all', name: 'అన్నీ (All Stories)', name_en: 'All Stories', icon: 'apps' },
  { id: 'రాజకీయాలు', name: 'రాజకీయాలు (Politics)', name_en: 'Politics', icon: 'megaphone' },
  { id: 'క్రైమ్', name: 'క్రైమ్ (Crime)', name_en: 'Crime', icon: 'shield-alert' },
  { id: 'వాతావరణం', name: 'వాతావరణం (Weather)', name_en: 'Weather', icon: 'cloudy-night' },
  { id: 'బిజినెస్', name: 'బిజినెస్ (Business)', name_en: 'Business', icon: 'trending-up' },
  { id: 'విద్య', name: 'విద్య & ఉద్యోగాలు (Jobs & Education)', name_en: 'Jobs & Education', icon: 'school' },
  { id: 'తెలంగాణ', name: 'తెలంగాణ (Telangana)', name_en: 'Telangana', icon: 'location' },
  { id: 'సినిమా', name: 'సినిమా (Cinema)', name_en: 'Cinema', icon: 'film' },
  { id: 'క్రీడలు', name: 'క్రీడలు (Sports)', name_en: 'Sports', icon: 'football' },
  { id: 'వ్యవసాయం', name: 'వ్యవసాయం (Agriculture)', name_en: 'Agriculture', icon: 'leaf' },
  { id: 'టెక్నాలజీ', name: 'టెక్నాలజీ (Tech & ISRO)', name_en: 'Tech & ISRO', icon: 'rocket' },
] as const;

export function CategoryFilterModal({
  visible,
  selectedCategory,
  isTelugu = true,
  onSelectCategory,
  onClose,
}: CategoryFilterModalProps) {
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<Array<{ id: string; name: string; name_en?: string; icon?: string }>>(
    [...DEFAULT_NEWS_CATEGORIES]
  );

  useEffect(() => {
    ArticlesService.fetchCategories().then((cats) => {
      if (cats && cats.length > 0) {
        // Ensure 'all' is always first
        const hasAll = cats.some((c) => c.id === 'all');
        const formatted = hasAll
          ? cats
          : [{ id: 'all', name: 'అన్నీ (All Stories)', name_en: 'All Stories', slug: 'all', icon: 'apps' }, ...cats];
        setCategories(formatted);
      }
    });
  }, []);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.header}>
            <View style={styles.dragHandle} />
            <View style={styles.headerRow}>
              <Text style={styles.title}>
                {isTelugu ? 'కేటగిరీలు ఎంచుకోండి (Categories)' : 'Select Categories'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#A1A1AA" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.list}>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const displayName = isTelugu ? cat.name : cat.name_en || cat.name;

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
                        name={(cat.icon || 'apps') as any}
                        size={18}
                        color={isSelected ? '#FFFFFF' : '#A1A1AA'}
                      />
                    </View>
                    <Text style={[styles.categoryName, isSelected && styles.categoryNameActive]}>
                      {displayName}
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
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
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
