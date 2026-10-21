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
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => ApiClient.getBookmarks('asset'));

  // New Asset Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [pixelModalVisible, setPixelModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [newCategory, setNewCategory] = useState<'2D' | '3D' | 'Audio' | 'UI' | 'Code'>('2D');
  const [newCodeSnippet, setNewCodeSnippet] = useState('');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUsername = ApiClient.getUsername();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handler = (e: MessageEvent) => {
        if (e.data && e.data.type === 'PIXEL_ART_EXPORT' && e.data.dataUrl) {
          setNewImageUrl(e.data.dataUrl);
          setNewFileUrl(e.data.dataUrl);
          setNewCategory('2D');
          setPixelModalVisible(false);
          setModalVisible(true);
        }
      };
      window.addEventListener('message', handler);
      return () => window.removeEventListener('message', handler);
    }
  }, []);

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
        <NeumorphView radius={6} style={styles.card}>
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.assetBannerImage}
              resizeMode={item.image_url.startsWith('data:image/') ? 'contain' : 'cover'}
            />
          ) : null}

          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>[{item.category}]</Text>
              </View>
              <Text style={styles.ratingText}>★ {item.avg_rating || '5.0'} ({item.feedback_count || 0})</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                style={[styles.bookmarkPill, isBookmarked && { backgroundColor: '#FFD166' }]}
                onPress={() => handleToggleBookmark(item.id)}
              >
                <Text style={[styles.bookmarkPillText, isBookmarked && { color: '#11131C' }]}>
                  {isBookmarked ? '[★ SAVED]' : '[☆ SAVE]'}
                </Text>
              </TouchableOpacity>
              {isOwner && (
                <TouchableOpacity
                  style={{ backgroundColor: '#3F1D24', borderWidth: 1, borderColor: '#FF4D6D', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}
                  onPress={() => handleDeleteAsset(item.id)}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#FF4D6D', fontFamily: 'monospace' }}>[DEL]</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.assetTitle}>{item.title}</Text>
          <Text style={styles.assetDesc}>{item.description || 'No description provided.'}</Text>

          {(item.category === 'Code' || Boolean((item as any).code_snippet)) && (
            <View style={{ backgroundColor: '#090B10', borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 6, padding: 12, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ color: '#00E5FF', fontSize: 11, fontWeight: '900', fontFamily: 'monospace' }}>// C# & SHADER SNIPPET</Text>
                <TouchableOpacity
                  onPress={(e: any) => {
                    e?.stopPropagation?.();
                    const codeText = (item as any).code_snippet || '// Script snippet';
                    try { navigator?.clipboard?.writeText(codeText); } catch {}
                    setCopiedSnippetId(item.id);
                    setTimeout(() => setCopiedSnippetId(null), 2000);
                  }}
                  style={{ backgroundColor: copiedSnippetId === item.id ? '#10B981' : Theme.colors.pillBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }}
                >
                  <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800', fontFamily: 'monospace' }}>
                    {copiedSnippetId === item.id ? '[COPIED!]' : '[COPY_CODE]'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text numberOfLines={6} style={{ color: '#E2E8F0', fontSize: 11, fontFamily: 'monospace', lineHeight: 16 }}>
                {(item as any).code_snippet || 'using UnityEngine;\n// 클릭하여 전체 스크립트 및 다운로드 링크를 확인하세요.'}
              </Text>
            </View>
          )}
          {item.category === 'Audio' && (
            <TouchableOpacity
              onPress={(e: any) => {
                e?.stopPropagation?.();
                playAudioPreview(item);
              }}
              style={{ backgroundColor: Theme.colors.pillBg, borderWidth: 1.5, borderColor: '#00E5FF', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 4, marginBottom: 12, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 11.5, fontWeight: '900', color: '#00E5FF', fontFamily: 'monospace' }}>
                {playingAudioId === item.id ? '🔊 PLAYING_SFX...' : '▶ PREVIEW_8BIT_SFX (미리듣기)'}
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.cardFooter}>
            <Text style={styles.authorText}>@{item.author} • DL {item.downloads ?? 0}</Text>
            <TouchableOpacity onPress={() => handleQuickLike(item.id)}>
              <Text style={[styles.likesText, item.is_liked && { color: Theme.colors.primary }]}>
                ♥ {item.likes || 0}
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
        <View>
          <Text style={styles.headerTitle}>ASSET_VAULT // 무료 에셋 창고</Text>
          <Text style={{ fontSize: 11.5, color: Theme.colors.textLight, marginTop: 2 }}>
            2D 도트 스프라이트 · 3D 모델 · 8비트 효과음 · C# 스크립트 무료 공유소
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {Platform.OS === 'web' && (
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: '#FFD166', borderColor: '#11131C' }]}
              onPress={() => setPixelModalVisible(true)}
            >
              <Text style={[styles.uploadButtonText, { color: '#11131C' }]}>🎨 도트 찍기</Text>
            </TouchableOpacity>
          )}
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
            <Text style={styles.uploadButtonText}>[+ 에셋 등록]</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <NeumorphView radius={6} style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="> SEARCH_ASSETS (2D, 3D, Audio, C# 스크립트 검색...)"
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
                  ? '아직 찜한 에셋이 없습니다.'
                  : selectedCategory === LIKED_CATEGORY
                    ? '아직 좋아요한 에셋이 없습니다.'
                    : '// NO_ASSETS_FOUND //'}
              </Text>
            </View>
          )
        }
        onRefresh={fetchAssets}
        refreshing={loading}
      />

      {/* Pixel Studio Modal */}
      <Modal visible={pixelModalVisible} animationType="fade" transparent onRequestClose={() => setPixelModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 12 }}>
          <View style={{ width: '100%', maxWidth: 740, height: '88%', backgroundColor: '#11131C', borderWidth: 2, borderColor: '#FFD166', borderRadius: 6, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, backgroundColor: '#1A1D2B', borderBottomWidth: 2, borderBottomColor: '#3A415E' }}>
              <Text style={{ color: '#FFD166', fontWeight: '900', fontSize: 13, fontFamily: 'monospace' }}>
                🎨 PIXEL_SPRITE_WORKSHOP // 도트 찍고 에셋 창고에 바로 공유
              </Text>
              <TouchableOpacity onPress={() => setPixelModalVisible(false)} style={{ backgroundColor: '#FF4D6D', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }}>
                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 11, fontFamily: 'monospace' }}>[X CLOSE]</Text>
              </TouchableOpacity>
            </View>
            {Platform.OS === 'web' ? (
              React.createElement('iframe', {
                src: '/pixel-studio.html',
                style: { width: '100%', height: '100%', border: 'none', backgroundColor: '#11131C' },
              })
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Asset Detail Modal */}
      <Modal visible={!!detailAsset} animationType="slide" transparent onRequestClose={() => setDetailAsset(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <ScrollView>
              {detailAsset && (
                <>
                  {detailAsset.image_url ? (
                    <Image
                      source={{ uri: detailAsset.image_url }}
                      style={styles.assetBannerImage}
                      resizeMode={detailAsset.image_url.startsWith('data:image/') ? 'contain' : 'cover'}
                    />
                  ) : null}
                  <Text style={styles.modalTitle}>{detailAsset.title}</Text>
                  <Text style={styles.assetDesc}>{detailAsset.description || 'No description provided.'}</Text>
                  <Text style={styles.authorText}>
                    [{detailAsset.category}] by @{detailAsset.author} • ★ {detailAsset.avg_rating || '-'} ({detailAsset.feedback_count || 0})
                  </Text>

                  {detailAsset.file_url ? (
                    <TouchableOpacity style={styles.openLinkBtn} onPress={() => handleOpenLink(detailAsset.file_url, detailAsset.id)}>
                      <Text style={styles.openLinkText}>[📥 DOWNLOAD_ASSET ({detailAsset.downloads ?? 0})]</Text>
                    </TouchableOpacity>
                  ) : null}

                  <View style={styles.detailActionRow}>
                    <TouchableOpacity
                      style={[styles.detailActionBtn, detailAsset.is_liked && { backgroundColor: Theme.colors.primary }]}
                      onPress={handleLikeAsset}
                    >
                      <Text style={[styles.detailActionText, detailAsset.is_liked && { color: '#FFF' }]}>
                        ♥ {detailAsset.likes || 0}
                      </Text>
                    </TouchableOpacity>
                    {currentUsername && detailAsset.author === currentUsername && !editing && (
                      <TouchableOpacity style={styles.detailActionBtn} onPress={handleStartEdit}>
                        <Text style={styles.detailActionText}>[✏️ EDIT]</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {editing && (
                    <View style={{ marginTop: 14 }}>
                      <TextInput style={styles.modalInput} placeholder="Title" placeholderTextColor="#6B7280" value={editTitle} onChangeText={setEditTitle} />
                      <TextInput
                        style={[styles.modalInput, { height: 70 }]}
                        placeholder="Description"
                        placeholderTextColor="#6B7280"
                        multiline
                        value={editDesc}
                        onChangeText={setEditDesc}
                      />
                      <TextInput
                        style={styles.modalInput}
                        placeholder="Download / Repo Link URL"
                        placeholderTextColor="#6B7280"
                        value={editFileUrl}
                        onChangeText={setEditFileUrl}
                        autoCapitalize="none"
                      />
                      <TextInput
                        style={styles.modalInput}
                        placeholder="Thumbnail Image URL"
                        placeholderTextColor="#6B7280"
                        value={editImageUrl}
                        onChangeText={setEditImageUrl}
                        autoCapitalize="none"
                      />
                      {Platform.OS === 'web' && (
                        <TouchableOpacity style={styles.uploadFileBtn} onPress={() => pickImageInto(setEditImageUrl)} disabled={isUploading}>
                          <Text style={styles.uploadFileBtnText}>{isUploading ? '업로드 중...' : '📁 이미지 파일 업로드'}</Text>
                        </TouchableOpacity>
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
                        <Text style={{ fontSize: 24 }}>{n <= rating ? '⭐' : '☆'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={[styles.modalInput, { height: 70 }]}
                    placeholder="피드백을 남겨주세요..."
                    placeholderTextColor="#6B7280"
                    multiline
                    value={feedbackText}
                    onChangeText={setFeedbackText}
                  />
                  <TouchableOpacity style={styles.submitModalButton} onPress={handleSendFeedback} disabled={isSendingFeedback}>
                    <Text style={[styles.submitModalText, { textAlign: 'center' }]}>
                      {isSendingFeedback ? '등록 중...' : '[리뷰 등록]'}
                    </Text>
                  </TouchableOpacity>

                  <Text style={[styles.modalLabel, { marginTop: 20 }]}>💬 리뷰 ({detailAsset.feedbacks?.length || 0})</Text>
                  {detailLoading ? <ActivityIndicator color={Theme.colors.primary} /> : null}
                  {(detailAsset.feedbacks || []).map((f: any) => (
                    <View key={f.id} style={{ marginBottom: 12 }}>
                      <Text style={{ fontWeight: '700', color: Theme.colors.text }}>
                        @{f.author} {'⭐'.repeat(f.rating || 0)}
                      </Text>
                      <Text style={{ color: Theme.colors.text, marginTop: 2 }}>{f.content}</Text>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
            <TouchableOpacity style={[styles.cancelModalButton, { alignSelf: 'flex-end' }]} onPress={() => setDetailAsset(null)}>
              <Text style={styles.cancelModalText}>[닫기]</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Upload Asset Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>// SHARE_GAME_ASSET</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="에셋 제목 (예: 16x16 슬라임 도트 스프라이트)"
              placeholderTextColor="#6B7280"
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="썸네일/스프라이트 URL 또는 도트 공방에서 전송"
              placeholderTextColor="#6B7280"
              value={newImageUrl}
              onChangeText={setNewImageUrl}
              autoCapitalize="none"
            />
            {Platform.OS === 'web' && (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <TouchableOpacity style={[styles.uploadFileBtn, { flex: 1, marginBottom: 0 }]} onPress={() => pickImageInto(setNewImageUrl)} disabled={isUploading}>
                  <Text style={styles.uploadFileBtnText}>{isUploading ? '업로드 중...' : '📁 PC 파일 업로드'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.uploadFileBtn, { flex: 1, marginBottom: 0, backgroundColor: '#FFD166' }]}
                  onPress={() => {
                    setModalVisible(false);
                    setPixelModalVisible(true);
                  }}
                >
                  <Text style={[styles.uploadFileBtnText, { color: '#11131C', fontWeight: '900' }]}>🎨 웹 도트 직접 찍기</Text>
                </TouchableOpacity>
              </View>
            )}

            <TextInput
              style={styles.modalInput}
              placeholder="다운로드 링크 / GitHub 주소 (선택)"
              placeholderTextColor="#6B7280"
              value={newFileUrl}
              onChangeText={setNewFileUrl}
              autoCapitalize="none"
            />

            <TextInput
              style={[styles.modalInput, { height: 70 }]}
              placeholder="에셋 설명 및 라이선스 안내 (예: 상업적 무료 사용 가능)..."
              placeholderTextColor="#6B7280"
              multiline
              value={newDescription}
              onChangeText={setNewDescription}
            />

            {newCategory === 'Code' && (
              <TextInput
                style={[styles.modalInput, { height: 85, fontFamily: 'monospace', fontSize: 12 }]}
                placeholder="핵심 C# / GDScript / Shader 코드 스니펫 붙여넣기 (선택)"
                placeholderTextColor="#6B7280"
                multiline
                value={newCodeSnippet}
                onChangeText={setNewCodeSnippet}
              />
            )}

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
                <Text style={styles.submitModalText}>{isSubmitting ? 'Posting...' : '[SHARE_ASSET]'}</Text>
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
  headerSection: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12, flexWrap: 'wrap', gap: 8,
    backgroundColor: Theme.colors.surface,
    borderWidth: 2, borderColor: Theme.colors.border,
    borderRadius: 6, padding: 12,
  },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFD166', fontFamily: 'monospace' },
  uploadButton: { backgroundColor: Theme.colors.primary, borderWidth: 1.5, borderColor: Theme.colors.border, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 4 },
  uploadButtonText: { color: '#FFF', fontWeight: '900', fontSize: 11.5, fontFamily: 'monospace' },
  searchContainer: { marginBottom: 10 },
  searchBox: { width: '100%' },
  searchInput: { paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: Theme.colors.text, fontFamily: 'monospace' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 4, gap: 6 },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4, borderWidth: 1.5, borderColor: Theme.colors.border, backgroundColor: Theme.colors.pillBg },
  activePill: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  pillText: { fontSize: 11.5, color: Theme.colors.textLight, fontWeight: '800', fontFamily: 'monospace' },
  activePillText: { color: '#FFF', fontWeight: '900' },
  listContent: { paddingBottom: 110 },
  cardWrapper: { paddingHorizontal: 16, marginBottom: 16 },
  card: { padding: 14, width: '100%', overflow: 'hidden' },
  assetBannerImage: { width: '100%', height: 150, borderRadius: 4, marginBottom: 10, backgroundColor: Theme.colors.pillBg },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 },
  categoryBadge: { backgroundColor: Theme.colors.pillBg, borderWidth: 1, borderColor: Theme.colors.border, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  categoryBadgeText: { fontSize: 11, fontWeight: '900', color: '#00E5FF', fontFamily: 'monospace' },
  ratingText: { fontSize: 12, fontWeight: '800', color: '#FFD166', fontFamily: 'monospace' },
  bookmarkPill: { backgroundColor: Theme.colors.pillBg, borderWidth: 1, borderColor: Theme.colors.border, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  bookmarkPillText: { fontSize: 10.5, fontWeight: '900', color: Theme.colors.textLight, fontFamily: 'monospace' },
  assetTitle: { fontSize: 16, fontWeight: '800', color: Theme.colors.text, marginBottom: 6, lineHeight: 22 },
  assetDesc: { fontSize: 13, color: Theme.colors.textLight, marginBottom: 12, lineHeight: 19 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1.5, borderTopColor: Theme.colors.border, paddingTop: 8 },
  authorText: { fontSize: 11.5, color: Theme.colors.textLight, fontWeight: '800', fontFamily: 'monospace' },
  likesText: { fontSize: 12, fontWeight: '900', color: Theme.colors.text, fontFamily: 'monospace' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 14, color: Theme.colors.textLight, fontWeight: '800', fontFamily: 'monospace' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 18 },
  modalContent: { backgroundColor: Theme.colors.surface, borderWidth: 2, borderColor: Theme.colors.border, borderRadius: 6, padding: 18 },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#FFD166', fontFamily: 'monospace', marginBottom: 14 },
  modalInput: { backgroundColor: Theme.colors.background, borderWidth: 1.5, borderColor: Theme.colors.border, borderRadius: 4, padding: 10, marginBottom: 10, fontSize: 13.5, color: Theme.colors.text },
  modalLabel: { fontSize: 12.5, fontWeight: '800', color: Theme.colors.textLight, marginBottom: 8, fontFamily: 'monospace' },
  categorySelectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  catSelectBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4, borderWidth: 1.5, borderColor: Theme.colors.border, backgroundColor: Theme.colors.pillBg },
  activeCatSelectBadge: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  catSelectText: { fontSize: 12, color: Theme.colors.textLight, fontWeight: '800', fontFamily: 'monospace' },
  activeCatSelectText: { color: '#FFF', fontWeight: '900' },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelModalButton: { paddingHorizontal: 14, paddingVertical: 9 },
  cancelModalText: { color: Theme.colors.textLight, fontWeight: '800', fontFamily: 'monospace' },
  submitModalButton: { backgroundColor: Theme.colors.primary, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 4 },
  submitModalText: { color: '#FFF', fontWeight: '900', fontFamily: 'monospace' },
  openLinkBtn: { backgroundColor: '#00E5FF', paddingVertical: 11, borderRadius: 4, alignItems: 'center', marginTop: 10 },
  openLinkText: { color: '#11131C', fontWeight: '900', fontSize: 13, fontFamily: 'monospace' },
  uploadFileBtn: { backgroundColor: Theme.colors.pillBg, borderWidth: 1.5, borderColor: Theme.colors.border, paddingVertical: 9, borderRadius: 4, alignItems: 'center', marginBottom: 10 },
  uploadFileBtnText: { color: Theme.colors.text, fontWeight: '800', fontSize: 12 },
  detailActionRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  detailActionBtn: { backgroundColor: Theme.colors.pillBg, borderWidth: 1.5, borderColor: Theme.colors.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  detailActionText: { fontWeight: '900', fontSize: 12, color: Theme.colors.text, fontFamily: 'monospace' },
});
