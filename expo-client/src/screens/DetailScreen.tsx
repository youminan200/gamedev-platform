import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Image, Modal, Platform, Linking } from 'react-native';
import { Theme } from '../theme';
import { ApiClient } from '../api/ApiClient';
import { NeumorphView } from '../components/NeumorphView';

interface Props {
  id: string;
  onBack: () => void;
  onRequireLogin?: () => void;
}


const extractYouTubeId = (text?: string): string | null => {
  if (!text) return null;
  const m = text.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
};

const renderFormattedContent = (raw?: string, textStyle?: any) => {
  if (!raw) return null;
  const parts = raw.split(/(```[\s\S]*?```)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const code = part.replace(/^```[a-zA-Z0-9_-]*\n?/, '').replace(/```$/, '').trim();
      return (
        <View key={idx} style={{ backgroundColor: '#0F172A', borderRadius: 12, padding: 14, marginVertical: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ color: '#38BDF8', fontSize: 11, fontWeight: '700' }}>💻 CODE SNIPPET</Text>
            <TouchableOpacity onPress={() => { try { navigator?.clipboard?.writeText(code); } catch {} }}>
              <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700' }}>📋 코드 복사</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ color: '#F8FAFC', fontFamily: Platform.OS === 'web' ? 'monospace' : undefined, fontSize: 13, lineHeight: 20 }}>
            {code}
          </Text>
        </View>
      );
    }
    return <Text key={idx} style={textStyle}>{part}</Text>;
  });
};

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
  const [reportedDone, setReportedDone] = useState(false);
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [translatedBody, setTranslatedBody] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  const handleTranslate = async () => {
    if (translatedBody) {
      setTranslatedTitle(null);
      setTranslatedBody(null);
      return;
    }
    if (!devlog?.content && !devlog?.title) return;
    try {
      setTranslating(true);
      const isKorean = /[가-힣]/.test((devlog.title || '') + (devlog.content || ''));
      const targetLang = isKorean ? 'en' : 'ko';
      const translateText = async (txt: string) => {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(txt)}`;
        const r = await fetch(url);
        const j = await r.json();
        return (j?.[0] || []).map((seg: any) => seg?.[0] || '').join('');
      };
      const [tTitle, tBody] = await Promise.all([
        translateText(devlog.title || ''),
        translateText(devlog.content || '')
      ]);
      setTranslatedTitle(tTitle);
      setTranslatedBody(tBody);
    } catch {} finally {
      setTranslating(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `https://gamedev-platform-expo-client.vercel.app/?devlog=${id}`;
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
      <Text style={styles.title}>{translatedTitle || devlog.title}</Text>
      <View style={styles.authorRow}>
        <Text style={styles.author}>👤 {devlog.author} • 👁️ {devlog.views ?? 0}회 조회 • {devlog.created_at ? new Date(devlog.created_at).toLocaleDateString() : ''}</Text>
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
        {devlog.demo_url ? (
          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: '#10B981' }]}
            onPress={() => Linking.openURL(devlog.demo_url)}
          >
            <Text style={[styles.editBtnText, { color: '#FFF' }]}>🎮 데모 플레이 ↗</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.editBtn, { backgroundColor: '#FEF3C7' }]}
          onPress={() => Linking.openURL(devlog.support_url || devlog.demo_url || 'https://store.steampowered.com/genre/Indie/')}
        >
          <Text style={[styles.editBtnText, { color: '#B45309' }]}>☕ 창작자 후원 / 스팀 찜하기 ↗</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.editBtn, { backgroundColor: '#EEF2FF' }]} onPress={handleTranslate} disabled={translating}>
          <Text style={[styles.editBtnText, { color: '#4F46E5' }]}>
            {translating ? '🌐 번역 중...' : translatedBody ? '🔄 원문 보기 (Original)' : '🌐 한↔영 원클릭 번역 (Translate)'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.editBtn} onPress={handleShare}>
          <Text style={styles.editBtnText}>{shared ? '✅ 링크 복사됨' : '🔗 이 글 공유하기'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.editBtn, { backgroundColor: reportedDone ? '#DCFCE7' : '#FEF2F2' }]}
          onPress={async () => {
            await ApiClient.reportContent({
              target_type: 'devlog',
              target_id: String(id),
              target_author: devlog.author,
              reason: '부적절한 게시물/스팸 신고',
              reporter: currentUsername || 'Anonymous',
            });
            setReportedDone(true);
          }}
        >
          <Text style={[styles.editBtnText, { color: reportedDone ? '#15803D' : '#DC2626' }]}>
            {reportedDone ? '✅ 신고 접수됨' : '🚨 신고하기'}
          </Text>
        </TouchableOpacity>
        {!isAuthor && (
          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: '#F1F5F9' }]}
            onPress={() => {
              ApiClient.blockUser(devlog.author);
              onBack();
            }}
          >
            <Text style={[styles.editBtnText, { color: '#475569' }]}>🚫 작성자 차단</Text>
          </TouchableOpacity>
        )}
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

      {extractYouTubeId(devlog.content) && Platform.OS === 'web' ? (
        <View style={{ width: '100%', height: 260, borderRadius: 14, overflow: 'hidden', marginBottom: 16, backgroundColor: '#000' }}>
          {React.createElement('iframe', {
            src: `https://www.youtube.com/embed/${extractYouTubeId(devlog.content)}`,
            style: { width: '100%', height: '100%', border: 'none' },
            allowFullScreen: true,
          })}
        </View>
      ) : extractYouTubeId(devlog.content) ? (
        <TouchableOpacity
          style={{ backgroundColor: '#EF4444', padding: 12, borderRadius: 12, marginBottom: 14, alignItems: 'center' }}
          onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${extractYouTubeId(devlog.content)}`)}
        >
          <Text style={{ color: '#FFF', fontWeight: '800' }}>▶️ 유튜브 플레이 영상 보기</Text>
        </TouchableOpacity>
      ) : null}
      {renderFormattedContent(translatedBody || devlog.content, styles.body)}
      {devlog.poll_question ? (
        <NeumorphView radius={16} style={{ padding: 16, marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.colors.primary, marginBottom: 6 }}>
            📊 실시간 개발 피드백 투표
          </Text>
          <Text style={{ fontSize: 15, fontWeight: '700', color: Theme.colors.text, marginBottom: 12 }}>
            {devlog.poll_question}
          </Text>
          {(() => {
            const votesA = Number(devlog.poll_votes_a || 0);
            const votesB = Number(devlog.poll_votes_b || 0);
            const total = votesA + votesB;
            const pctA = total > 0 ? Math.round((votesA / total) * 100) : 50;
            const pctB = total > 0 ? 100 - pctA : 50;
            return (
              <View style={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={async () => {
                    const res = await ApiClient.voteDevLogPoll(id, 'A');
                    setDevlog((prev: any) => prev ? { ...prev, poll_votes_a: res.poll_votes_a, poll_votes_b: res.poll_votes_b } : prev);
                  }}
                  style={{ backgroundColor: Theme.colors.pillBg, padding: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: Theme.colors.text }}>{devlog.poll_option_a || 'A안'}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: Theme.colors.primary }}>{pctA}% ({votesA}표)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    const res = await ApiClient.voteDevLogPoll(id, 'B');
                    setDevlog((prev: any) => prev ? { ...prev, poll_votes_a: res.poll_votes_a, poll_votes_b: res.poll_votes_b } : prev);
                  }}
                  style={{ backgroundColor: Theme.colors.pillBg, padding: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: Theme.colors.text }}>{devlog.poll_option_b || 'B안'}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#10B981' }}>{pctB}% ({votesB}표)</Text>
                </TouchableOpacity>
              </View>
            );
          })()}
        </NeumorphView>
      ) : null}
      <View style={styles.divider} />
            <Text style={styles.commentsTitle}>💬 DEV_FEEDBACK & STICKERS ({devlog.comments?.length || 0})</Text>
      <Text style={{ fontSize: 11.5, color: Theme.colors.textLight, fontFamily: 'monospace', marginBottom: 8 }}>
        {'> 1클릭 도트 응원 스티커 & 버그제보 리액션 (클릭 시 입력 / ⚡ 클릭 시 즉시 등록)'}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {[
          { badge: '🔥 [타격감 최고]', text: '🔥 [타격감 최고] 연출이랑 타격감이 정말 시원하네요! 다음 업데이트도 기대됩니다!' },
          { badge: '🎨 [도트 장인]', text: '🎨 [도트 장인] 픽셀 아트 색감이랑 디테일이 너무 매력적이에요!' },
          { badge: '🕹️ [데모 꿀잼]', text: '🕹️ [데모 꿀잼] 방금 데모 해봤는데 조작감도 깔끔하고 중독성 있네요!' },
          { badge: '🙌 [출시 존버단]', text: '🙌 [출시 존버단] 스팀/스토어 출시되면 무조건 위시리스트 찜하겠습니다!' },
          { badge: '💡 [밸런스 제안]', text: '💡 [밸런스 제안] 플레이해보니 이 부분 난이도/속도가 조금만 조절되면 더 재밌을 것 같아요: ' },
          { badge: '🐛 [버그 제보]', text: '🐛 [버그 제보] 플레이 중 발견한 오류/버그 현상 공유드립니다: ' },
        ].map((stk) => (
          <View
            key={stk.badge}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: Theme.colors.pillBg,
              borderWidth: 1.5,
              borderColor: Theme.colors.border,
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <TouchableOpacity
              onPress={() => setComment(stk.text)}
              style={{ paddingHorizontal: 9, paddingVertical: 6 }}
            >
              <Text style={{ fontSize: 11.5, fontWeight: '900', color: '#FFD166', fontFamily: 'monospace' }}>
                {stk.badge}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={isPosting}
              onPress={async () => {
                if (!ApiClient.getToken()) {
                  onRequireLogin?.();
                  return;
                }
                try {
                  setIsPosting(true);
                  await ApiClient.postComment(id, stk.text);
                  fetchDetail();
                } catch {} finally {
                  setIsPosting(false);
                }
              }}
              style={{ backgroundColor: Theme.colors.primary, paddingHorizontal: 7, paddingVertical: 6 }}
            >
              <Text style={{ fontSize: 10.5, fontWeight: '900', color: '#FFF', fontFamily: 'monospace' }}>⚡즉시등록</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
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
  ownerActionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
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
