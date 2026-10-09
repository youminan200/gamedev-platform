import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { Theme } from '../theme';
import { ApiClient } from '../api/ApiClient';
import { NeumorphView } from '../components/NeumorphView';

interface Props {
  id: string;
  onBack: () => void;
}

export const DetailScreen: React.FC<Props> = ({ id, onBack }) => {
  const [devlog, setDevlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    fetchDetail();
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

  if (loading || !devlog) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  const handleToggleLike = async () => {
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
        <TouchableOpacity style={[styles.likeButton, devlog.is_liked && styles.likedButton]} onPress={handleToggleLike}>
          <Text style={[styles.likeButtonText, devlog.is_liked && styles.likedButtonText]}>
            {devlog.is_liked ? '❤️' : '🤍'} {devlog.likes || 0}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.body}>{devlog.content}</Text>
      <View style={styles.divider} />
      <Text style={styles.commentsTitle}>Comments ({devlog.comments?.length || 0})</Text>
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
            <Text style={styles.commentAuthor}>{item.author}</Text>
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
  author: { fontSize: 14, color: Theme.colors.textLight, marginBottom: 24 },
  body: { fontSize: 16, color: Theme.colors.text, lineHeight: 24, minHeight: 100 },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 24 },
  commentsTitle: { fontSize: 18, fontWeight: '700', color: Theme.colors.text, marginBottom: 16 },
  commentItem: { paddingHorizontal: 16, marginBottom: 16 },
  commentAuthor: { fontSize: 14, fontWeight: '700', color: Theme.colors.text, marginBottom: 4 },
  commentContent: { fontSize: 15, color: Theme.colors.text },
  commentInputContainer: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderTopWidth: 1, borderTopColor: '#EEEEEE', backgroundColor: Theme.colors.background
  },
  commentInputBox: { flex: 1, marginRight: 12 },
  input: { paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: Theme.colors.text },
  sendButton: { padding: 12 },
  sendButtonText: { color: Theme.colors.primary, fontWeight: '700', fontSize: 16 }
});
