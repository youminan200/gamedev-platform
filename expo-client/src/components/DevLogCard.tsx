import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { DevLog } from '../models/DevLog';
import { Theme } from '../theme';
import { NeumorphView } from './NeumorphView';

import { formatRelativeTime } from '../utils/time';

interface DevLogCardProps {
  devLog: DevLog;
  onClick: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (id: string) => void;
  onTagClick?: (tag: string) => void;
  selectedTag?: string | null;
}

export const DevLogCard: React.FC<DevLogCardProps> = ({
  devLog,
  onClick,
  isBookmarked,
  onToggleBookmark,
  onTagClick,
  selectedTag,
}) => {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onClick} style={styles.cardContainer}>
      <NeumorphView radius={20} style={styles.card}>
        {/* Thumbnail */}
        {devLog.image_url ? (
          <Image
            source={{ uri: devLog.image_url }}
            style={[styles.thumbnailImage, { backgroundColor: Theme.colors.pillBg }]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnail, { backgroundColor: Theme.colors.pillBg }]}>
            <Text style={[styles.thumbnailText, { color: Theme.colors.textLight }]}>🎮 DEVLOG</Text>
          </View>
        )}
        
        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleHeaderRow}>
            <Text style={[styles.title, { flex: 1, color: Theme.colors.text }]}>{devLog.title}</Text>
            {onToggleBookmark && (
              <TouchableOpacity
                onPress={(e: any) => {
                  e?.stopPropagation?.();
                  onToggleBookmark(devLog.id);
                }}
                style={[styles.bookmarkBtn, { backgroundColor: Theme.colors.pillBg }, isBookmarked && styles.bookmarkBtnActive]}
              >
                <Text style={[styles.bookmarkBtnText, { color: Theme.colors.textLight }, isBookmarked && styles.bookmarkBtnTextActive]}>
                  {isBookmarked ? '⭐ 찜됨' : '☆ 찜'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: Theme.colors.textLight }]}>By {devLog.author} • {formatRelativeTime(devLog.created_at)}</Text>
            <View style={styles.statsBadgesRow}>
              <Text style={[styles.metaText, { color: Theme.colors.textLight }]}>💬 {devLog.comment_count ?? 0}</Text>
              <Text style={[styles.metaText, { color: Theme.colors.textLight }]}>❤️ {devLog.likes}</Text>
            </View>
          </View>

          <View style={styles.tagsContainer}>
            {devLog.tags.map((tag, index) => {
              const isTagSelected = selectedTag === tag;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.tag,
                    { backgroundColor: isTagSelected ? Theme.colors.primary : Theme.colors.pillBg },
                  ]}
                  onPress={(e: any) => {
                    if (onTagClick) {
                      e?.stopPropagation?.();
                      onTagClick(tag);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.tagText,
                      { color: isTagSelected ? '#FFFFFF' : Theme.colors.accent },
                    ]}
                  >
                    #{tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </NeumorphView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 24,
    marginHorizontal: 8,
  },
  card: {
    width: '100%',
    overflow: 'hidden',
  },
  thumbnail: {
    height: 150,
    backgroundColor: Theme.colors.pillBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: Theme.colors.pillBg,
  },
  thumbnailText: {
    color: Theme.colors.textLight,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  content: {
    padding: 20,
  },
  titleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  bookmarkBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: Theme.colors.pillBg,
  },
  bookmarkBtnActive: {
    backgroundColor: '#FEF3C7',
  },
  bookmarkBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textLight,
  },
  bookmarkBtnTextActive: {
    color: '#D97706',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaText: {
    fontSize: 14,
    color: Theme.colors.textLight,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: Theme.colors.pillBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: Theme.colors.accent,
    fontWeight: '600',
  }
});
