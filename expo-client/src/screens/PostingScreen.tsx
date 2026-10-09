import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Theme } from '../theme';
import { ApiClient } from '../api/ApiClient';
import { NeumorphView } from '../components/NeumorphView';

interface Props {
  username: string;
  onCancel: () => void;
  onPostSuccess: () => void;
}

const PRESET_TAGS = ['Unity', 'Unreal', 'Godot', 'C#', 'Graphics', 'BugFix', 'Release'];

export const PostingScreen: React.FC<Props> = ({ username, onCancel, onPostSuccess }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Unity']);
  const [isPosting, setIsPosting] = useState(false);

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
          <Text style={styles.headerButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New DevLog</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Title</Text>
        <NeumorphView radius={12} style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            editable={!isPosting}
            placeholder="Enter title..."
            placeholderTextColor={Theme.colors.textLight}
          />
        </NeumorphView>

        <Text style={styles.label}>Content</Text>
        <NeumorphView radius={12} style={[styles.inputContainer, styles.textAreaContainer]}>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={content}
            onChangeText={setContent}
            editable={!isPosting}
            multiline
            placeholder="Enter content..."
            placeholderTextColor={Theme.colors.textLight}
          />
        </NeumorphView>

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
          <NeumorphView radius={12} style={styles.postButton}>
            {isPosting ? (
              <ActivityIndicator color={Theme.colors.primary} />
            ) : (
              <Text style={styles.postButtonText}>Post DevLog</Text>
            )}
          </NeumorphView>
        </TouchableOpacity>
      </View>
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
    paddingTop: 24,
  },
  headerButton: {
    color: Theme.colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  headerTitle: {
    color: Theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 24,
    flex: 1,
  },
  label: {
    color: Theme.colors.textLight,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  inputContainer: {
    marginBottom: 24,
  },
  textAreaContainer: {
    flex: 1,
  },
  input: {
    color: Theme.colors.text,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    flex: 1,
    textAlignVertical: 'top',
  },
  postButtonContainer: {
    marginTop: 16,
  },
  postButton: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonText: {
    color: Theme.colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
  },
  activeTagPill: {
    backgroundColor: Theme.colors.primary,
  },
  tagPillText: {
    fontSize: 13,
    color: Theme.colors.textLight,
    fontWeight: '600',
  },
  activeTagPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
