import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Image, Modal } from 'react-native';
import { Theme } from '../theme';
import { ApiClient } from '../api/ApiClient';
import { NeumorphView } from '../components/NeumorphView';

interface Props {
  id: string;
  onBack: () => void;
  onRequireLogin?: () => void;
}

export const DetailScreen: React.FC<Props> = ({ id, onBack, onRequireLogin }) => {
  const [devlog, setDevlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(() => ApiClient.isBookmarked(id, 'devlog'));

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const currentUsername = ApiClient.getUsername();
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    const shareUrl = 'https://gamedev-platform-expo-client.vercel.app';
    const shareText = `[DevGround] ${devlog?.title || 'DevLog'} 🎮`;
    try {
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share({ title: 'DevGround', text: shareText, url: shareUrl });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      }
    } catch {}
  };

  useEffect(() => {
    fetchDetail();
    setIsBookmarked(ApiClient.isBookmarked(id, 'devlog'));
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getDevLogDetails(id);
      setDevlog(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!ApiClient.getToken()) {
      onRequireLogin?.();
      return;
    }
    if (!comment.trim()) return;
    try {
      setIsPosting(true);
      await ApiClient.postComment(id, comment);
      setComment('');
      fetchDetail(); // refresh comments
    } catch (e) {
      console.error(e);
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await ApiClient.deleteComment(id, commentId);
      fetchDetail();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenEdit = () => {
    if (!devlog) return;
    setEditTitle(devlog.title || '');
    setEditContent(devlog.content || '');
    setEditImageUrl(devlog.image_url || '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    try {
      setIsSavingEdit(true);
      await ApiClient.updateDevLog(id, {
        title: editTitle.trim(),
        content: editContent,
        image_url: editImageUrl.trim() || null,
        tags: devlog.tags || ['DevLog'],
      });
      setEditModalVisible(false);
      fetchDetail();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeletePost = async () => {
    try {
      await ApiClient.deleteDevLog(id);
      onBack();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleBookmark = () => {
    const next = ApiClient.toggleBookmark(id, 'devlog');
    setIsBookmarked(next);
  };

  if (loading || !devlog) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  const isAuthor = currentUsername && devlog.author === currentUsername;

  const handleToggleLike = async () => {
    if (!ApiClient.getToken()) {
      onRequireLogin?.();
      return;
    }
    try {
      const res = await ApiClient.toggleLikeDevLog(id);
      setDevlog((prev: any) => prev ? { ...prev, likes: res.likes, is_liked: res.liked } : prev);
    } catch (e) {
      console.error(e);
    }
  };

  const renderHeader = () => (
    <View style={styles.postContent}>
      <Text style={styles.title}>{devlog.title}</Text>
      <View style={styles.authorRow}>
        <Text style={styles.author}>by {devlog.author} • {devlog.created_at ? new Date(devlog.created_at).toLocaleDateString() : ''}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={[styles.likeButton, isBookmarked && { backgroundColor: '#FEF3C7' }]}
            onPress={handleToggleBookmark}
          >
            <Text style={[styles.likeButtonText, isBookmarked && { color: '#D97706' }]}>
              {isBookmarked ? '⭐ 찜됨' : '☆ 찜'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.likeButton, devlog.is_liked && styles.likedButton]} onPress={handleToggleLike}>
            <Text style={[styles.likeButtonText, devlog.is_liked && styles.likedButtonText]}>
              {devlog.is_liked ? '❤️' : '🤍'} {devlog.likes || 0}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.ownerActionsRow}>
        <TouchableOpacity style={styles.editBtn} onPress={handleShare}>
          <Text style={styles.editBtnText}>{shared ? '✅ 링크 복사됨' : '🔗 이 글 공유하기'}</Text>
        </TouchableOpacity>
      </View>

      {isAuthor && (
        <View style={styles.ownerActionsRow}>
          <TouchableOpacity style={styles.editBtn} onPress={handleOpenEdit}>
            <Text style={styles.editBtnText}>✏️ 수정</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeletePost}>
            <Text style={styles.deleteBtnText}>🗑️ 삭제</Text>
          </TouchableOpacity>
        </View>
      )}

      {devlog.image_url ? (
        <View style={styles.bannerImageWrapper}>
          <Image source={{ uri: devlog.image_url }} style={styles.bannerImage} resizeMode="cover" />
        </View>
      ) : null}

      <Text style={styles.body}>{devlog.content}</Text>
      <View style={styles.divider} />
      <Text style={styles.commentsTitle}>💬 Comments ({devlog.comments?.length || 0})</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.headerButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DevLog</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={devlog.comments || []}
        keyExtractor={(item, idx) => item.id || String(idx)}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <View style={styles.commentItem}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.commentAuthor}>{item.author}</Text>
              {currentUsername && item.author === currentUsername && (
                <TouchableOpacity onPress={() => handleDeleteComment(item.id)}>
                  <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '700' }}>삭제</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.commentContent}>{item.content}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <View style={styles.commentInputContainer}>
        <NeumorphView radius={24} style={styles.commentInputBox}>
          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder="Add feedback..."
            placeholderTextColor={Theme.colors.textLight}
            editable={!isPosting}
          />
        </NeumorphView>
        <TouchableOpacity style={styles.sendButton} onPress={handlePostComment} disabled={isPosting}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Post Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✏️ 개발일지 수정</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Title"
              value={editTitle}
              onChangeText={setEditTitle}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Thumbnail Image URL (https://...)"
              value={editImageUrl}
              onChangeText={setEditImageUrl}
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.modalInput, { height: 120, textAlignVertical: 'top' }]}
              placeholder="Content"
              multiline
              value={editContent}
              onChangeText={setEditContent}
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelModalText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveModalBtn} onPress={handleSaveEdit} disabled={isSavingEdit}>
                <Text style={styles.saveModalText}>{isSavingEdit ? '저장 중...' : '저장'}</Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: Theme.colors.background,
  },
  headerButton: { color: Theme.colors.primary, fontWeight: '600' },
  headerTitle: { color: Theme.colors.text, fontSize: 18, fontWeight: '700' },
  postContent: { padding: 16 },
  title: { fontSize: 24, color: Theme.colors.text, fontWeight: '800', marginBottom: 8 },
  authorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 },
  author: { fontSize: 14, color: Theme.colors.textLight },
  ownerActionsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  editBtn: { backgroundColor: Theme.colors.pillBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  editBtnText: { fontSize: 13, fontWeight: '700', color: Theme.colors.text },
  deleteBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  deleteBtnText: { fontSize: 13, fontWeight: '700', color: '#DC2626' },
  bannerImageWrapper: { width: '100%', height: 220, borderRadius: 16, overflow: 'hidden', marginBottom: 16, backgroundColor: Theme.colors.pillBg },
  bannerImage: { width: '100%', height: '100%' },
  likeButton: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: Theme.colors.pillBg },
  likedButton: { backgroundColor: '#FFE4E6' },
  likeButtonText: { fontSize: 14, fontWeight: '700', color: Theme.colors.text },
  likedButtonText: { color: '#E11D48' },
  body: { fontSize: 16, color: Theme.colors.text, lineHeight: 24, minHeight: 100 },
  divider: { height: 1, backgroundColor: Theme.colors.border, marginVertical: 24 },
  commentsTitle: { fontSize: 18, fontWeight: '700', color: Theme.colors.text, marginBottom: 16 },
  commentItem: { paddingHorizontal: 16, marginBottom: 16 },
  commentAuthor: { fontSize: 14, fontWeight: '700', color: Theme.colors.text, marginBottom: 4 },
  commentContent: { fontSize: 15, color: Theme.colors.text },
  commentInputContainer: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderTopWidth: 1, borderTopColor: Theme.colors.border, backgroundColor: Theme.colors.background
  },
  commentInputBox: { flex: 1, marginRight: 12 },
  input: { paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: Theme.colors.text },
  sendButton: { padding: 12 },
  sendButtonText: { color: Theme.colors.primary, fontWeight: '700', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: Theme.colors.background, borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Theme.colors.text, marginBottom: 16 },
  modalInput: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 15, color: Theme.colors.text },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelModalBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelModalText: { color: Theme.colors.textLight, fontWeight: '700' },
  saveModalBtn: { backgroundColor: Theme.colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  saveModalText: { color: '#FFF', fontWeight: '700' },
});
