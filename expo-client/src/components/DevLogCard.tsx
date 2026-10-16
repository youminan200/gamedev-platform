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
}

export const DevLogCard: React.FC<DevLogCardProps> = ({ devLog, onClick, isBookmarked, onToggleBookmark }) => {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onClick} style={styles.cardContainer}>
      <NeumorphView radius={20} style={styles.card}>
        {/* Thumbnail */}
        {devLog.image_url ? (
          <Image
            source={{ uri: devLog.image_url }}
            style={styles.thumbnailImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.thumbnail}>
            <Text style={styles.thumbnailText}>🎮 DEVLOG</Text>
          </View>
        )}
        
        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleHeaderRow}>
            <Text style={[styles.title, { flex: 1 }]}>{devLog.title}</Text>
            {onToggleBookmark && (
              <TouchableOpacity
                onPress={(e: any) => {
                  e?.stopPropagation?.();
                  onToggleBookmark(devLog.id);
                }}
                style={[styles.bookmarkBtn, isBookmarked && styles.bookmarkBtnActive]}
              >
                <Text style={[styles.bookmarkBtnText, isBookmarked && styles.bookmarkBtnTextActive]}>
                  {isBookmarked ? '⭐ 찜됨' : '☆ 찜'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>By {devLog.author} • {formatRelativeTime(devLog.created_at)}</Text>
            <View style={styles.statsBadgesRow}>
              <Text style={styles.metaText}>💬 {devLog.comment_count ?? 0}</Text>
              <Text style={styles.metaText}>❤️ {devLog.likes}</Text>
            </View>
          </View>

          <View style={styles.tagsContainer}>
            {devLog.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
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
    backgroundColor: '#D1D9E6',
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
    backgroundColor: '#D1D9E6',
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
    backgroundColor: '#E2E8F0',
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
    backgroundColor: '#D1D9E6',
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
