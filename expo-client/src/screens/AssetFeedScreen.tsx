import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal, Image, Linking, ScrollView, Platform } from 'react-native';
import { Theme } from '../theme';
import { ApiClient } from '../api/ApiClient';
import { NeumorphView } from '../components/NeumorphView';
import { Asset } from '../models/DevLog';

interface Props {
  onAssetClick?: (id: string) => void;
  onRequireLogin?: () => void;
  openAssetId?: string | null;
  onOpenAssetHandled?: () => void;
}

const LIKED_CATEGORY = '❤️ 좋아요한 에셋';
const CATEGORIES = ['All', '⭐ 찜한 에셋', LIKED_CATEGORY, '2D', '3D', 'Audio', 'UI', 'Code'];

export const AssetFeedScreen: React.FC<Props> = ({ onRequireLogin, openAssetId, onOpenAssetHandled }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => ApiClient.getBookmarks('asset'));

  // New Asset Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [newCategory, setNewCategory] = useState<'2D' | '3D' | 'Audio' | 'UI' | 'Code'>('2D');
  const [newCodeSnippet, setNewCodeSnippet] = useState('');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUsername = ApiClient.getUsername();

  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const playAudioPreview = (item: Asset) => {
    setPlayingAudioId(item.id);
    try {
      if (typeof window !== 'undefined') {
        if (item.file_url && /\.(mp3|wav|ogg)(\?|$)/i.test(item.file_url)) {
          const audio = new (window as any).Audio(item.file_url);
          audio.onended = () => setPlayingAudioId(null);
          audio.play();
          return;
        }
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const notes = [523.25, 659.25, 783.99, 1046.5];
          notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.09);
            gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.09);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.09 + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.09);
            osc.stop(ctx.currentTime + i * 0.09 + 0.08);
          });
        }
      }
    } catch {}
    setTimeout(() => setPlayingAudioId(null), 600);
  };


  useEffect(() => {
    fetchAssets();
  }, [selectedCategory, searchQuery]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const isSpecialTab = selectedCategory === 'All' || selectedCategory === '⭐ 찜한 에셋' || selectedCategory === LIKED_CATEGORY;
      const categoryParam = isSpecialTab ? undefined : selectedCategory;
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
    setEditing(false);
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

  const handleOpenLink = (url?: string, id?: string) => {
    if (!url) return;
    if (id) ApiClient.recordAssetDownload(id).catch(() => {});
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

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editFileUrl, setEditFileUrl] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleLikeAsset = async () => {
    if (!detailAsset) return;
    if (!ApiClient.getToken()) {
      setDetailAsset(null);
      onRequireLogin?.();
      return;
    }
    try {
      const res = await ApiClient.toggleLikeAsset(detailAsset.id);
      setDetailAsset((prev: any) => (prev ? { ...prev, likes: res.likes, is_liked: res.liked } : prev));
      fetchAssets();
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartEdit = () => {
    if (!detailAsset) return;
    setEditTitle(detailAsset.title || '');
    setEditDesc(detailAsset.description || '');
    setEditFileUrl(detailAsset.file_url || '');
    setEditImageUrl(detailAsset.image_url || '');
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!detailAsset || !editTitle.trim()) return;
    try {
      setIsSavingEdit(true);
      await ApiClient.updateAsset(detailAsset.id, {
        title: editTitle.trim(),
        description: editDesc,
        file_url: editFileUrl.trim(),
        image_url: editImageUrl.trim() || null,
      });
      const data = await ApiClient.getAssetDetails(detailAsset.id);
      setDetailAsset(data);
      setEditing(false);
      fetchAssets();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const pickImageInto = async (setter: (url: string) => void) => {
    try {
      setIsUploading(true);
      const url = await ApiClient.pickAndUploadImage();
      if (url) setter(url);
    } catch (e: any) {
      if (typeof window !== 'undefined' && (window as any).alert) (window as any).alert(e.message || '업로드 실패');
    } finally {
      setIsUploading(false);
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
        code_snippet: newCodeSnippet.trim() || undefined,
        tags: [newCategory, 'Asset']
      });
      setModalVisible(false);
      setNewTitle('');
      setNewDescription('');
      setNewImageUrl('');
      setNewFileUrl('');
      setNewCodeSnippet('');
      fetchAssets();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedAssets = selectedCategory === '⭐ 찜한 에셋'
    ? assets.filter((a) => bookmarkedIds.includes(String(a.id)))
    : selectedCategory === LIKED_CATEGORY
      ? assets.filter((a) => a.is_liked)
      : assets;

  const handleQuickLike = async (id: string) => {
    if (!ApiClient.getToken()) {
      onRequireLogin?.();
      return;
    }
    try {
      const res = await ApiClient.toggleLikeAsset(id);
      setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, likes: res.likes, is_liked: res.liked } : a)));
    } catch (e) {
      console.error(e);
    }
  };

  // Open an asset's detail when navigated from a notification
  useEffect(() => {
    if (!openAssetId) return;
    (async () => {
      try {
        const data = await ApiClient.getAssetDetails(openAssetId);
        setDetailAsset(data);
        setEditing(false);
      } catch (e) {
        console.error(e);
      } finally {
        onOpenAssetHandled?.();
      }
    })();
  }, [openAssetId]);

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


          {(item.category === 'Code' || Boolean(item.code_snippet)) && (
            <View style={{ backgroundColor: '#0F172A', borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ color: '#38BDF8', fontSize: 11, fontWeight: '800' }}>💻 C# / Shader 스크립트 미리보기</Text>
                <TouchableOpacity
                  onPress={(e: any) => {
                    e?.stopPropagation?.();
                    const codeText = item.code_snippet || '// Script snippet';
                    try { navigator?.clipboard?.writeText(codeText); } catch {}
                    setCopiedSnippetId(item.id);
                    setTimeout(() => setCopiedSnippetId(null), 2000);
                  }}
                  style={{ backgroundColor: copiedSnippetId === item.id ? '#10B981' : '#1E293B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}
                >
                  <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>
                    {copiedSnippetId === item.id ? '✅ 코드 복사됨!' : '📋 코드 복사'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text numberOfLines={6} style={{ color: '#E2E8F0', fontSize: 11, fontFamily: 'monospace', lineHeight: 16 }}>
                {item.code_snippet || 'using UnityEngine;\n// 클릭하여 전체 스크립트 및 다운로드 링크를 확인하세요.'}
              </Text>
            </View>
          )}
          {item.category === 'Audio' && (
            <TouchableOpacity
              onPress={(e: any) => {
                e?.stopPropagation?.();
                playAudioPreview(item);
              }}
              style={{ backgroundColor: '#EEF2FF', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, marginBottom: 12, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#4F46E5' }}>
                {playingAudioId === item.id ? '🔊 효과음 재생 중...' : '🎵 효과음/오디오 즉시 미리듣기 (▶️ Play)'}
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.cardFooter}>
            <Text style={styles.authorText}>by {item.author} • 📥 {item.downloads ?? 0}회 다운로드</Text>
            <TouchableOpacity onPress={() => handleQuickLike(item.id)}>
              <Text style={[styles.likesText, item.is_liked && { color: '#E11D48' }]}>
                {item.is_liked ? '❤️' : '🤍'} {item.likes || 0}
              </Text>
            </TouchableOpacity>
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
                {selectedCategory === '⭐ 찜한 에셋'
                  ? '아직 ⭐ 찜한 에셋이 없습니다.'
                  : selectedCategory === LIKED_CATEGORY
                    ? '아직 ❤️ 좋아요한 에셋이 없습니다.'
                    : 'No assets found.'}
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
                    <TouchableOpacity style={styles.openLinkBtn} onPress={() => handleOpenLink(detailAsset.file_url, detailAsset.id)}>
                      <Text style={styles.openLinkText}>📥 다운로드 / 링크 열기 ({detailAsset.downloads ?? 0}회)</Text>
                    </TouchableOpacity>
                  ) : null}

                  <View style={styles.detailActionRow}>
                    <TouchableOpacity
                      style={[styles.detailActionBtn, detailAsset.is_liked && { backgroundColor: '#FFE4E6' }]}
                      onPress={handleLikeAsset}
                    >
                      <Text style={[styles.detailActionText, detailAsset.is_liked && { color: '#E11D48' }]}>
                        {detailAsset.is_liked ? '❤️' : '🤍'} {detailAsset.likes || 0}
                      </Text>
                    </TouchableOpacity>
                    {currentUsername && detailAsset.author === currentUsername && !editing && (
                      <TouchableOpacity style={styles.detailActionBtn} onPress={handleStartEdit}>
                        <Text style={styles.detailActionText}>✏️ 수정</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {editing && (
                    <View style={{ marginTop: 14 }}>
                      <TextInput style={styles.modalInput} placeholder="Title" value={editTitle} onChangeText={setEditTitle} />
                      <TextInput
                        style={[styles.modalInput, { height: 70 }]}
                        placeholder="Description"
                        multiline
                        value={editDesc}
                        onChangeText={setEditDesc}
                      />
                      <TextInput
                        style={styles.modalInput}
                        placeholder="Download / Repo Link URL"
                        value={editFileUrl}
                        onChangeText={setEditFileUrl}
                        autoCapitalize="none"
                      />
                      <TextInput
                        style={styles.modalInput}
                        placeholder="Thumbnail Image URL"
                        value={editImageUrl}
                        onChangeText={setEditImageUrl}
                        autoCapitalize="none"
                      />
                      {Platform.OS === 'web' && (
                        <TouchableOpacity style={styles.uploadFileBtn} onPress={() => pickImageInto(setEditImageUrl)} disabled={isUploading}>
                          <Text style={styles.uploadFileBtnText}>{isUploading ? '업로드 중...' : '📁 이미지 파일 업로드'}</Text>
                        </TouchableOpacity>
                      )}
          
            {newCategory === 'Code' && (
              <TextInput
                style={[styles.modalInput, { height: 90, fontFamily: 'monospace', fontSize: 12 }]}
                placeholder="핵심 C# / GDScript / Shader 코드 스니펫 붙여넣기 (선택사항)"
                multiline
                value={newCodeSnippet}
                onChangeText={setNewCodeSnippet}
              />
            )}
            <View style={styles.modalButtonRow}>
                        <TouchableOpacity style={styles.cancelModalButton} onPress={() => setEditing(false)}>
                          <Text style={styles.cancelModalText}>취소</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.submitModalButton} onPress={handleSaveEdit} disabled={isSavingEdit}>
                          <Text style={styles.submitModalText}>{isSavingEdit ? '저장 중...' : '저장'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

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
            {Platform.OS === 'web' && (
              <TouchableOpacity style={styles.uploadFileBtn} onPress={() => pickImageInto(setNewImageUrl)} disabled={isUploading}>
                <Text style={styles.uploadFileBtnText}>{isUploading ? '업로드 중...' : '📁 이미지 파일 업로드'}</Text>
              </TouchableOpacity>
            )}

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
  uploadFileBtn: { backgroundColor: Theme.colors.pillBg, paddingVertical: 10, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  uploadFileBtnText: { color: Theme.colors.text, fontWeight: '700', fontSize: 13 },
  detailActionRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  detailActionBtn: { backgroundColor: Theme.colors.pillBg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  detailActionText: { fontWeight: '700', fontSize: 13, color: Theme.colors.text },
});
