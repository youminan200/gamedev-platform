import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal, Image, Linking, ScrollView } from 'react-native';
import { Theme } from '../theme';
import { ApiClient } from '../api/ApiClient';
import { NeumorphView } from '../components/NeumorphView';
import { Asset } from '../models/DevLog';

interface Props {
  onAssetClick?: (id: string) => void;
  onRequireLogin?: () => void;
}

const CATEGORIES = ['All', '⭐ 찜한 에셋', '2D', '3D', 'Audio', 'UI', 'Code'];

export const AssetFeedScreen: React.FC<Props> = ({ onRequireLogin }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => ApiClient.getBookmarks('asset'));

  // New Asset Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [newCategory, setNewCategory] = useState<'2D' | '3D' | 'Audio' | 'UI' | 'Code'>('2D');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUsername = ApiClient.getUsername();

  useEffect(() => {
    fetchAssets();
  }, [selectedCategory, searchQuery]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const categoryParam = (selectedCategory === 'All' || selectedCategory === '⭐ 찜한 에셋') ? undefined : selectedCategory;
      const data = await ApiClient.getAssets(categoryParam, searchQuery || undefined);
      setAssets(data);
      setBookmarkedIds(ApiClient.getBookmarks('asset'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBookmark = (id: string) => {
    ApiClient.toggleBookmark(id, 'asset');
    setBookmarkedIds(ApiClient.getBookmarks('asset'));
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      await ApiClient.deleteAsset(id);
      fetchAssets();
    } catch (e) {
      console.error(e);
    }
  };

  // Asset Detail Modal State
  const [detailAsset, setDetailAsset] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  const openDetail = async (asset: Asset) => {
    setDetailAsset({ ...asset, feedbacks: [] });
    setRating(5);
    setFeedbackText('');
    try {
      setDetailLoading(true);
      const data = await ApiClient.getAssetDetails(asset.id);
      setDetailAsset(data);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenLink = (url?: string) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {});
  };

  const handleSendFeedback = async () => {
    if (!ApiClient.getToken()) {
      setDetailAsset(null);
      onRequireLogin?.();
      return;
    }
    if (!feedbackText.trim() || !detailAsset) return;
    try {
      setIsSendingFeedback(true);
      await ApiClient.postAssetFeedback(detailAsset.id, { rating, content: feedbackText.trim() });
      setFeedbackText('');
      const data = await ApiClient.getAssetDetails(detailAsset.id);
      setDetailAsset(data);
      fetchAssets();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingFeedback(false);
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
        image_url: newImageUrl.trim() || undefined,
        file_url: newFileUrl.trim() || undefined,
        tags: [newCategory, 'Asset']
      });
      setModalVisible(false);
      setNewTitle('');
      setNewDescription('');
      setNewImageUrl('');
      setNewFileUrl('');
      fetchAssets();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedAssets = selectedCategory === '⭐ 찜한 에셋'
    ? assets.filter((a) => bookmarkedIds.includes(String(a.id)))
    : assets;

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

  const renderAssetCard = ({ item }: { item: Asset }) => {
    const isBookmarked = bookmarkedIds.includes(String(item.id));
    const isOwner = currentUsername && item.author === currentUsername;

    return (
      <TouchableOpacity activeOpacity={0.9} style={styles.cardWrapper} onPress={() => openDetail(item)}>
        <NeumorphView radius={18} style={styles.card}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.assetBannerImage} resizeMode="cover" />
          ) : null}

          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{item.category}</Text>
              </View>
              <Text style={styles.ratingText}>⭐ {item.avg_rating || '5.0'} ({item.feedback_count || 0})</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                style={[styles.bookmarkPill, isBookmarked && { backgroundColor: '#FEF3C7' }]}
                onPress={() => handleToggleBookmark(item.id)}
              >
                <Text style={[styles.bookmarkPillText, isBookmarked && { color: '#D97706' }]}>
                  {isBookmarked ? '⭐ 찜됨' : '☆ 찜'}
                </Text>
              </TouchableOpacity>
              {isOwner && (
                <TouchableOpacity
                  style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}
                  onPress={() => handleDeleteAsset(item.id)}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#DC2626' }}>🗑️ 삭제</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.assetTitle}>{item.title}</Text>
          <Text style={styles.assetDesc}>{item.description || 'No description provided.'}</Text>

          <View style={styles.cardFooter}>
            <Text style={styles.authorText}>by {item.author}</Text>
            <Text style={styles.likesText}>❤️ {item.likes || 0}</Text>
          </View>
        </NeumorphView>
      </TouchableOpacity>
    );
  };

  const renderListHeader = () => (
    <View style={styles.headerSection}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎨 Asset Hub</Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => {
            if (!ApiClient.getToken()) {
              onRequireLogin?.();
              return;
            }
            setModalVisible(true);
          }}
        >
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
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={displayedAssets}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderListHeader}
        renderItem={renderAssetCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={Theme.colors.primary} />
            </View>
          ) : (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>
                {selectedCategory === '⭐ 찜한 에셋' ? '아직 ⭐ 찜한 에셋이 없습니다.' : 'No assets found.'}
              </Text>
            </View>
          )
        }
        onRefresh={fetchAssets}
        refreshing={loading}
      />

      {/* Asset Detail Modal */}
      <Modal visible={!!detailAsset} animationType="slide" transparent onRequestClose={() => setDetailAsset(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <ScrollView>
              {detailAsset && (
                <>
                  {detailAsset.image_url ? (
                    <Image source={{ uri: detailAsset.image_url }} style={styles.assetBannerImage} resizeMode="cover" />
                  ) : null}
                  <Text style={styles.modalTitle}>{detailAsset.title}</Text>
                  <Text style={styles.assetDesc}>{detailAsset.description || 'No description provided.'}</Text>
                  <Text style={styles.authorText}>
                    [{detailAsset.category}] by {detailAsset.author} • ⭐ {detailAsset.avg_rating || '-'} ({detailAsset.feedback_count || 0})
                  </Text>

                  {detailAsset.file_url ? (
                    <TouchableOpacity style={styles.openLinkBtn} onPress={() => handleOpenLink(detailAsset.file_url)}>
                      <Text style={styles.openLinkText}>🔗 다운로드 / 링크 열기</Text>
                    </TouchableOpacity>
                  ) : null}

                  <Text style={[styles.modalLabel, { marginTop: 18 }]}>리뷰 남기기</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <TouchableOpacity key={n} onPress={() => setRating(n)}>
                        <Text style={{ fontSize: 28 }}>{n <= rating ? '⭐' : '☆'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={[styles.modalInput, { height: 70 }]}
                    placeholder="피드백을 남겨주세요..."
                    multiline
                    value={feedbackText}
                    onChangeText={setFeedbackText}
                  />
                  <TouchableOpacity style={styles.submitModalButton} onPress={handleSendFeedback} disabled={isSendingFeedback}>
                    <Text style={[styles.submitModalText, { textAlign: 'center' }]}>
                      {isSendingFeedback ? '등록 중...' : '리뷰 등록'}
                    </Text>
                  </TouchableOpacity>

                  <Text style={[styles.modalLabel, { marginTop: 20 }]}>💬 리뷰 ({detailAsset.feedbacks?.length || 0})</Text>
                  {detailLoading ? <ActivityIndicator color={Theme.colors.primary} /> : null}
                  {(detailAsset.feedbacks || []).map((f: any) => (
                    <View key={f.id} style={{ marginBottom: 12 }}>
                      <Text style={{ fontWeight: '700', color: Theme.colors.text }}>
                        {f.author} {'⭐'.repeat(f.rating || 0)}
                      </Text>
                      <Text style={{ color: Theme.colors.text, marginTop: 2 }}>{f.content}</Text>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
            <TouchableOpacity style={[styles.cancelModalButton, { alignSelf: 'flex-end' }]} onPress={() => setDetailAsset(null)}>
              <Text style={styles.cancelModalText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
              style={styles.modalInput}
              placeholder="Thumbnail Image URL (https://... Optional)"
              value={newImageUrl}
              onChangeText={setNewImageUrl}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Download / Repo Link URL (https://... Optional)"
              value={newFileUrl}
              onChangeText={setNewFileUrl}
              autoCapitalize="none"
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
  container: { flex: 1, minHeight: 0, backgroundColor: Theme.colors.background },
  headerSection: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12, flexWrap: 'wrap', gap: 8,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Theme.colors.primary },
  uploadButton: { backgroundColor: Theme.colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  uploadButtonText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  searchContainer: { marginBottom: 12 },
  searchBox: { width: '100%' },
  searchInput: { paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: Theme.colors.text },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 4, gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: Theme.colors.pillBg },
  activePill: { backgroundColor: Theme.colors.primary },
  pillText: { fontSize: 13, color: Theme.colors.textLight, fontWeight: '600' },
  activePillText: { color: '#FFF', fontWeight: '700' },
  listContent: { paddingBottom: 110 },
  cardWrapper: { paddingHorizontal: 16, marginBottom: 20 },
  card: { padding: 20, width: '100%', overflow: 'hidden' },
  assetBannerImage: { width: '100%', height: 150, borderRadius: 12, marginBottom: 12, backgroundColor: Theme.colors.pillBg },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 },
  categoryBadge: { backgroundColor: Theme.colors.pillBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  categoryBadgeText: { fontSize: 12, fontWeight: '700', color: Theme.colors.accent },
  ratingText: { fontSize: 13, fontWeight: '700', color: Theme.colors.text },
  bookmarkPill: { backgroundColor: Theme.colors.pillBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  bookmarkPillText: { fontSize: 12, fontWeight: '700', color: Theme.colors.textLight },
  assetTitle: { fontSize: 18, fontWeight: '700', color: Theme.colors.text, marginBottom: 8, lineHeight: 24 },
  assetDesc: { fontSize: 14, color: Theme.colors.textLight, marginBottom: 14, lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Theme.colors.pillBg, paddingTop: 10 },
  authorText: { fontSize: 13, color: Theme.colors.textLight, fontWeight: '600' },
  likesText: { fontSize: 13, fontWeight: '700', color: Theme.colors.text },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 16, color: Theme.colors.textLight, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: Theme.colors.background, borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Theme.colors.text, marginBottom: 16 },
  modalInput: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 15 },
  modalLabel: { fontSize: 14, fontWeight: '700', color: Theme.colors.text, marginBottom: 8 },
  categorySelectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catSelectBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: Theme.colors.pillBg },
  activeCatSelectBadge: { backgroundColor: Theme.colors.primary },
  catSelectText: { fontSize: 13, color: Theme.colors.textLight, fontWeight: '600' },
  activeCatSelectText: { color: '#FFF', fontWeight: '700' },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelModalButton: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelModalText: { color: Theme.colors.textLight, fontWeight: '700' },
  submitModalButton: { backgroundColor: Theme.colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  submitModalText: { color: '#FFF', fontWeight: '700' },
  openLinkBtn: { backgroundColor: Theme.colors.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  openLinkText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});
