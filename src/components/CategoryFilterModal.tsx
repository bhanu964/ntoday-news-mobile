import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArticlesService } from '@/services/articlesService';
import { ScraperService } from '@/services/scraperService';
import { NewsCategory } from '@/types/news';
import { useLanguage } from '@/context/LanguageContext';

interface CategoryFilterModalProps {
  visible: boolean;
  selectedCategory: string;
  isTelugu?: boolean;
  onSelectCategory: (categoryId: string, categoryObj?: NewsCategory) => void;
  onClose: () => void;
}

export function CategoryFilterModal({
  visible,
  selectedCategory,
  isTelugu: propIsTelugu,
  onSelectCategory,
  onClose,
}: CategoryFilterModalProps) {
  const insets = useSafeAreaInsets();
  const { isTelugu: ctxIsTelugu, t } = useLanguage();
  const isTelugu = propIsTelugu !== undefined ? propIsTelugu : ctxIsTelugu;

  const [categories, setCategories] = useState<NewsCategory[]>([
    { id: 'all', name: 'అన్నీ', name_en: 'All Stories', slug: 'all', icon: 'apps' },
  ]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadLiveCategories = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    try {
      const cats = await ArticlesService.fetchCategories(forceRefresh);
      if (cats && cats.length > 0) {
        const hasAll = cats.some((c) => c.id === 'all');
        const formatted: NewsCategory[] = hasAll
          ? cats
          : [
              { id: 'all', name: 'అన్నీ', name_en: 'All Stories', slug: 'all', icon: 'apps' },
              ...cats,
            ];
        setCategories(formatted);
      }
    } catch {
      // Keep existing categories cleanly
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load any cached categories immediately without racing the startup feed request
    ScraperService.getCachedCategories()
      .then((cached) => {
        if (cached && cached.length > 1) {
          setCategories(cached);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (visible && categories.length <= 1) {
      loadLiveCategories(true);
    }
  }, [visible, categories.length, loadLiveCategories]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.header}>
            <View style={styles.dragHandle} />
            <View style={styles.headerRow}>
              <Text style={styles.title}>{t.categoriesTitle}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#A1A1AA" />
              </TouchableOpacity>
            </View>
          </View>

          {loading && categories.length <= 1 ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#E50914" />
              <Text style={styles.loadingText}>{t.loadingCategories}</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.list}>
              {categories.map((cat) => {
                const isSelected =
                  selectedCategory === cat.id ||
                  selectedCategory === cat.slug ||
                  selectedCategory === cat.name;
                const displayName =
                  cat.id === 'all'
                    ? t.allCategories
                    : isTelugu
                    ? cat.name
                    : cat.name_en || cat.name;

                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryItem, isSelected && styles.categoryItemActive]}
                    onPress={() => {
                      onSelectCategory(cat.id, cat);
                      onClose();
                    }}>
                    <View style={styles.categoryLeft}>
                      <View
                        style={[
                          styles.iconCircle,
                          isSelected ? styles.iconCircleActive : styles.iconCircleInactive,
                        ]}>
                        <Ionicons
                          name={(cat.icon || 'newspaper-outline') as any}
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
          )}
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
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '600',
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
