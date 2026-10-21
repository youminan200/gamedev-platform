import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, ScrollView, Platform, Modal } from 'react-native';
import { Theme } from '../theme';
import { ApiClient } from '../api/ApiClient';
import { NeumorphView } from '../components/NeumorphView';

interface Props {
  username: string;
  onCancel: () => void;
  onPostSuccess: () => void;
}

const PRESET_TAGS = ['쇼케이스', '데모버전', '팀원모집', 'Unity', 'Unreal', 'Godot', 'C#', 'Graphics', 'Release'];

export const PostingScreen: React.FC<Props> = ({ username, onCancel, onPostSuccess }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptionA, setPollOptionA] = useState('');
  const [pollOptionB, setPollOptionB] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Unity']);
  const [isPosting, setIsPosting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pixelModalOpen, setPixelModalOpen] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handler = (e: MessageEvent) => {
        if (e.data && e.data.type === 'PIXEL_ART_EXPORT' && e.data.dataUrl) {
          setImageUrl(e.data.dataUrl);
          setPixelModalOpen(false);
        }
      };
      window.addEventListener('message', handler);
      return () => window.removeEventListener('message', handler);
    }
  }, []);

  const handlePickImage = async () => {
    try {
      setIsUploading(true);
      const url = await ApiClient.pickAndUploadImage();
      if (url) setImageUrl(url);
    } catch (e: any) {
      if (typeof window !== 'undefined' && (window as any).alert) (window as any).alert(e.message || '업로드 실패');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handlePost = async () => {
    if (!title.trim()) return;
    try {
      setIsPosting(true);
      await ApiClient.postDevLog({
        title,
        content,
        image_url: imageUrl.trim() || undefined,
        demo_url: demoUrl.trim() || undefined,
        poll_question: pollQuestion.trim() || undefined,
        poll_option_a: pollOptionA.trim() || undefined,
        poll_option_b: pollOptionB.trim() || undefined,
        tags: selectedTags.length > 0 ? selectedTags : ['DevLog']
      });
      onPostSuccess();
    } catch (e) {
      console.error(e);
      setIsPosting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} disabled={isPosting}>
          <Text style={styles.headerButton}>[← CANCEL]</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>// NEW_DEVLOG_POST</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Title (제목)</Text>
        <NeumorphView radius={6} style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            editable={!isPosting}
            placeholder="오늘의 개발일지 제목을 입력하세요..."
            placeholderTextColor={Theme.colors.textLight}
          />
        </NeumorphView>

        <Text style={styles.label}>Thumbnail Image / GIF / 도트 스프라이트 (선택)</Text>
        <NeumorphView radius={6} style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={imageUrl}
            onChangeText={setImageUrl}
            editable={!isPosting}
            placeholder="https://... 또는 도트 공방에서 바로 전송"
            placeholderTextColor={Theme.colors.textLight}
            autoCapitalize="none"
          />
        </NeumorphView>

        {Platform.OS === 'web' && (
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <TouchableOpacity style={[styles.uploadFileBtn, { flex: 1, marginBottom: 0 }]} onPress={handlePickImage} disabled={isUploading || isPosting}>
              <Text style={styles.uploadFileBtnText}>
                {isUploading ? '업로드 중...' : '📁 내 PC에서 이미지 업로드'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.uploadFileBtn, { flex: 1, marginBottom: 0, backgroundColor: '#FFD166', borderWidth: 1.5, borderColor: '#11131C' }]}
              onPress={() => setPixelModalOpen(true)}
            >
              <Text style={[styles.uploadFileBtnText, { color: '#11131C', fontWeight: '900' }]}>
                🎨 웹 도트 직접 찍기 (16×16)
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {(imageUrl.trim().startsWith('http') || imageUrl.trim().startsWith('data:image/')) && (
          <View style={styles.previewWrapper}>
            <Image source={{ uri: imageUrl.trim() }} style={styles.previewImage} resizeMode="contain" />
          </View>
        )}

        <Text style={styles.label}>🎮 데모 플레이 / Steam / Itch.io 링크 (선택)</Text>
        <NeumorphView radius={6} style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={demoUrl}
            onChangeText={setDemoUrl}
            editable={!isPosting}
            placeholder="https://... (웹 데모 또는 스토어 링크 입력 시 플레이 버튼 생성)"
            placeholderTextColor={Theme.colors.textLight}
            autoCapitalize="none"
          />
        </NeumorphView>

        <Text style={styles.label}>Content (본문 · 코드블록 ``` 지원)</Text>
        <NeumorphView radius={6} style={[styles.inputContainer, styles.textAreaContainer]}>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={content}
            onChangeText={setContent}
            editable={!isPosting}
            multiline
            placeholder="개발 진척도, 시행착오, 스크린샷 설명, 유튜브 링크 등을 자유롭게 적어보세요..."
            placeholderTextColor={Theme.colors.textLight}
          />
        </NeumorphView>

        <Text style={styles.label}>📊 A안 vs B안 밸런스·디자인 투표함 추가 (선택 · 1클릭 프리셋)</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {[
            { label: '+ 도트/아트 디자인 A vs B', q: '이번 캐릭터/오브젝트 아트 스타일 중 어떤 쪽이 더 마음에 드시나요?', a: 'A안 (선명한 레트로 도트 감성)', b: 'B안 (부드러운 라이팅 & 효과)' },
            { label: '+ 게임 난이도·밸런스 투표', q: '데모 플레이 기준 현재 스테이지/보스 난이도는 어떤가요?', a: 'A안 (적당하고 쫄깃함!)', b: 'B안 (조금 더 쉽게 너프 필요)' },
            { label: '+ 다음 업데이트 우선순위', q: '다음 패치에서 가장 먼저 추가되었으면 하는 콘텐츠는?', a: 'A안 (신규 보스 & 스테이지)', b: 'B안 (신규 무기 & 스킬 트리)' },
          ].map((preset) => (
            <TouchableOpacity
              key={preset.label}
              onPress={() => {
                setPollQuestion(preset.q);
                setPollOptionA(preset.a);
                setPollOptionB(preset.b);
              }}
              style={{
                backgroundColor: Theme.colors.pillBg,
                borderWidth: 1.5,
                borderColor: Theme.colors.border,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 4,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFD166', fontFamily: 'monospace' }}>
                {preset.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <NeumorphView radius={6} style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={pollQuestion}
            onChangeText={setPollQuestion}
            editable={!isPosting}
            placeholder="투표 질문 (예: 보스 연출 A안 vs B안 중 어떤 게 더 좋나요?)"
            placeholderTextColor={Theme.colors.textLight}
          />
        </NeumorphView>
        {pollQuestion.trim().length > 0 && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <NeumorphView radius={6} style={[styles.inputContainer, { flex: 1 }]}>
              <TextInput
                style={styles.input}
                value={pollOptionA}
                onChangeText={setPollOptionA}
                placeholder="A안 (예: 빠르고 경쾌한 연출)"
                placeholderTextColor={Theme.colors.textLight}
              />
            </NeumorphView>
            <NeumorphView radius={6} style={[styles.inputContainer, { flex: 1 }]}>
              <TextInput
                style={styles.input}
                value={pollOptionB}
                onChangeText={setPollOptionB}
                placeholder="B안 (예: 묵직한 타격감 연출)"
                placeholderTextColor={Theme.colors.textLight}
              />
            </NeumorphView>
          </View>
        )}

        <Text style={styles.label}>Select Tags</Text>
        <View style={styles.tagsRow}>
          {PRESET_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.tagPill, isSelected && styles.activeTagPill]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[styles.tagPillText, isSelected && styles.activeTagPillText]}>
                  #{tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.postButtonContainer} onPress={handlePost} disabled={isPosting} activeOpacity={0.8}>
          <NeumorphView radius={6} style={styles.postButton}>
            {isPosting ? (
              <ActivityIndicator color={Theme.colors.primary} />
            ) : (
              <Text style={styles.postButtonText}>[PUBLISH_DEVLOG // 등록하기]</Text>
            )}
          </NeumorphView>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={pixelModalOpen} transparent animationType="fade" onRequestClose={() => setPixelModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 12 }}>
          <View style={{ width: '100%', maxWidth: 740, height: '88%', backgroundColor: '#11131C', borderWidth: 2, borderColor: '#FFD166', borderRadius: 6, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, backgroundColor: '#1A1D2B', borderBottomWidth: 2, borderBottomColor: '#3A415E' }}>
              <Text style={{ color: '#FFD166', fontWeight: '900', fontSize: 13, fontFamily: 'monospace' }}>
                🎨 PIXEL_SPRITE_WORKSHOP // 도트 찍고 게시글에 바로 첨부
              </Text>
              <TouchableOpacity onPress={() => setPixelModalOpen(false)} style={{ backgroundColor: '#FF4D6D', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 2,
    borderBottomColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  headerButton: {
    color: Theme.colors.primary,
    fontWeight: '900',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  headerTitle: {
    color: '#FFD166',
    fontSize: 15,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  label: {
    color: Theme.colors.textLight,
    fontWeight: '800',
    fontSize: 12.5,
    marginBottom: 8,
    marginLeft: 2,
  },
  inputContainer: {
    marginBottom: 18,
  },
  previewWrapper: {
    marginBottom: 18,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
    height: 160,
    backgroundColor: Theme.colors.pillBg,
  },
  uploadFileBtn: {
    backgroundColor: Theme.colors.pillBg,
    paddingVertical: 11,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadFileBtnText: { color: Theme.colors.text, fontWeight: '800', fontSize: 12 },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  textAreaContainer: {
    minHeight: 160,
  },
  input: {
    color: Theme.colors.text,
    padding: 14,
    fontSize: 14.5,
  },
  textArea: {
    minHeight: 160,
    textAlignVertical: 'top',
  },
  postButtonContainer: {
    marginTop: 8,
  },
  postButton: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primary,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.pillBg,
  },
  activeTagPill: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  tagPillText: {
    fontSize: 12,
    color: Theme.colors.textLight,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  activeTagPillText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});
