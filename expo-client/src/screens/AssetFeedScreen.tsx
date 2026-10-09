import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal } from 'react-native';
import { Theme } from '../theme';
import { ApiClient } from '../api/ApiClient';
import { NeumorphView } from '../components/NeumorphView';
import { Asset } from '../models/DevLog';

interface Props {
  onAssetClick?: (id: string) => void;
}

const CATEGORIES = ['All', '2D', '3D', 'Audio', 'UI', 'Code'];

export const AssetFeedScreen: React.FC<Props> = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // New Asset Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<'2D' | '3D' | 'Audio' | 'UI' | 'Code'>('2D');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, [selectedCategory, searchQuery]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const categoryParam = selectedCategory === 'All' ? undefined : selectedCategory;
      const data = await ApiClient.getAssets(categoryParam, searchQuery || undefined);
      setAssets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAsset = async () => {
    if (!newTitle.trim()) return;
    try {
      setIsSubmitting(true);
      await ApiClient.postAsset({
        title: newTitle,
        description: newDescription,
        category: newCategory,
        tags: [newCategory, 'Asset']
      });
      setModalVisible(false);
      setNewTitle('');
      setNewDescription('');
      fetchAssets();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCategoryPill = (category: string) => {
    const isSelected = selectedCategory === category;
    return (
      <TouchableOpacity
        key={category}
        onPress={() => setSelectedCategory(category)}
        style={[styles.pill, isSelected && styles.activePill]}
      >
        <Text style={[styles.pillText, isSelected && styles.activePillText]}>
          {category}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderAssetCard = ({ item }: { item: Asset }) => (
    <NeumorphView radius={16} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{item.category}</Text>
        </View>
        <Text style={styles.ratingText}>⭐ {item.avg_rating || '5.0'} ({item.feedback_count || 0})</Text>
      </View>

      <Text style={styles.assetTitle}>{item.title}</Text>
      <Text style={styles.assetDesc} numberOfLines={2}>{item.description || 'No description provided.'}</Text>

      <View style={styles.cardFooter}>
        <Text style={styles.authorText}>by {item.author}</Text>
        <Text style={styles.likesText}>❤️ {item.likes || 0}</Text>
      </View>
    </NeumorphView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎨 Asset Hub</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.uploadButtonText}>+ Share Asset</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <NeumorphView radius={12} style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search 2D, 3D, Audio assets..."
            placeholderTextColor={Theme.colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </NeumorphView>
      </View>

      {/* Category Pills */}
      <View style={styles.categoryRow}>
        {CATEGORIES.map(renderCategoryPill)}
      </View>

      {/* Asset List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : assets.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No assets found.</Text>
        </View>
      ) : (
        <FlatList
          data={assets}
          keyExtractor={(item) => item.id}
          renderItem={renderAssetCard}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Upload Asset Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share Game Asset</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Asset Title"
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <TextInput
              style={[styles.modalInput, { height: 80 }]}
              placeholder="Description..."
              multiline
              value={newDescription}
              onChangeText={setNewDescription}
            />

            <Text style={styles.modalLabel}>Category:</Text>
            <View style={styles.categorySelectRow}>
              {(['2D', '3D', 'Audio', 'UI', 'Code'] as const).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catSelectBadge, newCategory === cat && styles.activeCatSelectBadge]}
                  onPress={() => setNewCategory(cat)}
                >
                  <Text style={[styles.catSelectText, newCategory === cat && styles.activeCatSelectText]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.cancelModalButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitModalButton} onPress={handleCreateAsset} disabled={isSubmitting}>
                <Text style={styles.submitModalText}>{isSubmitting ? 'Posting...' : 'Share'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Theme.colors.primary },
  uploadButton: { backgroundColor: Theme.colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  uploadButtonText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  searchContainer: { paddingHorizontal: 20, marginVertical: 8 },
  searchBox: { width: '100%' },
  searchInput: { paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: Theme.colors.text },
  categoryRow: { flexDirection: 'row', paddingHorizontal: 20, marginVertical: 8, gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#E2E8F0' },
  activePill: { backgroundColor: Theme.colors.primary },
  pillText: { fontSize: 13, color: Theme.colors.textLight, fontWeight: '600' },
  activePillText: { color: '#FFF', fontWeight: '700' },
  listContent: { padding: 20 },
  card: { padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryBadge: { backgroundColor: '#E2E8F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  categoryBadgeText: { fontSize: 12, fontWeight: '700', color: Theme.colors.accent },
  ratingText: { fontSize: 13, fontWeight: '700', color: Theme.colors.text },
  assetTitle: { fontSize: 18, fontWeight: '700', color: Theme.colors.text, marginBottom: 4 },
  assetDesc: { fontSize: 14, color: Theme.colors.textLight, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 8 },
  authorText: { fontSize: 13, color: Theme.colors.textLight, fontWeight: '600' },
  likesText: { fontSize: 13, fontWeight: '700', color: Theme.colors.text },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 16, color: Theme.colors.textLight, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: Theme.colors.background, borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Theme.colors.text, marginBottom: 16 },
  modalInput: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 15 },
  modalLabel: { fontSize: 14, fontWeight: '700', color: Theme.colors.text, marginBottom: 8 },
  categorySelectRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  catSelectBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#E2E8F0' },
  activeCatSelectBadge: { backgroundColor: Theme.colors.primary },
  catSelectText: { fontSize: 13, color: Theme.colors.textLight, fontWeight: '600' },
  activeCatSelectText: { color: '#FFF', fontWeight: '700' },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelModalButton: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelModalText: { color: Theme.colors.textLight, fontWeight: '700' },
  submitModalButton: { backgroundColor: Theme.colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  submitModalText: { color: '#FFF', fontWeight: '700' },
});
