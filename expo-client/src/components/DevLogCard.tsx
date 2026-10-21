import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
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
  onAuthorClick?: (author: string) => void;
}

const getCreatorRank = (likes?: number): string => {
  const n = likes || 0;
  if (n >= 20) return 'MASTER_DEV';
  if (n >= 10) return 'INDIE_PRO';
  return 'ROOKIE';
};

export const DevLogCard: React.FC<DevLogCardProps> = ({
  devLog,
  onClick,
  isBookmarked,
  onToggleBookmark,
  onTagClick,
  selectedTag,
  onAuthorClick,
}) => {
  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onClick} style={styles.cardContainer}>
      <NeumorphView radius={6} style={styles.card}>
        {/* Top Cartridge Strip */}
        <View style={[styles.cartridgeHeader, { backgroundColor: Theme.colors.pillBg, borderBottomColor: Theme.colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ backgroundColor: Theme.colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 }}>
              <Text style={{ fontSize: 10, fontWeight: '900', color: '#FFF', fontFamily: 'monospace' }}>
                LOG #{devLog.id}
              </Text>
            </View>
            {Boolean(devLog.is_pinned) && (
              <View style={{ backgroundColor: '#FFD166', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 }}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: '#11131C', fontFamily: 'monospace' }}>
                  ★ FEATURED
                </Text>
              </View>
            )}
            {devLog.tags?.includes('쇼케이스') && (
              <View style={{ backgroundColor: '#00E5FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 }}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: '#11131C', fontFamily: 'monospace' }}>
                  SHOWCASE
                </Text>
              </View>
            )}
          </View>

          {onToggleBookmark && (
            <TouchableOpacity
              onPress={(e: any) => {
                e?.stopPropagation?.();
                onToggleBookmark(devLog.id);
              }}
              style={[
                styles.bookmarkBtn,
                { borderColor: Theme.colors.border, backgroundColor: isBookmarked ? '#FFD166' : Theme.colors.surface }
              ]}
            >
              <Text style={{ fontSize: 10.5, fontWeight: '900', fontFamily: 'monospace', color: isBookmarked ? '#11131C' : Theme.colors.textLight }}>
                {isBookmarked ? '[★ SAVED]' : '[☆ SAVE]'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Thumbnail */}
        {devLog.image_url ? (
          <Image
            source={{ uri: devLog.image_url }}
            style={[styles.thumbnailImage, { backgroundColor: Theme.colors.pillBg, borderBottomColor: Theme.colors.border }]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnail, { backgroundColor: Theme.colors.pillBg, borderBottomColor: Theme.colors.border }]}>
            <Text style={[styles.thumbnailText, { color: Theme.colors.textLight }]}>// NO_SIGNAL // DEVLOG_ARCHIVE</Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.title, { color: Theme.colors.text }]}>{devLog.title}</Text>

          <View style={styles.metaRow}>
            <TouchableOpacity
              onPress={(e: any) => {
                if (onAuthorClick) {
                  e?.stopPropagation?.();
                  onAuthorClick(devLog.author);
                }
              }}
            >
              <Text style={[styles.metaText, { color: Theme.colors.primary, fontFamily: 'monospace' }]}>
                @{devLog.author} [{getCreatorRank(devLog.likes)}] • {formatRelativeTime(devLog.created_at)}
              </Text>
            </TouchableOpacity>

            <View style={styles.statsBadgesRow}>
              <View style={[styles.statChip, { backgroundColor: Theme.colors.pillBg, borderColor: Theme.colors.border }]}>
                <Text style={[styles.statChipText, { color: Theme.colors.text }]}>CMT {devLog.comment_count ?? 0}</Text>
              </View>
              <View style={[styles.statChip, { backgroundColor: Theme.colors.pillBg, borderColor: Theme.colors.border }]}>
                <Text style={[styles.statChipText, { color: Theme.colors.primary }]}>♥ {devLog.likes}</Text>
              </View>
            </View>
          </View>

          {devLog.demo_url ? (
            <TouchableOpacity
              onPress={(e: any) => {
                e?.stopPropagation?.();
                Linking.openURL(devLog.demo_url!);
              }}
              style={{
                backgroundColor: '#00E5FF',
                borderWidth: 1.5,
                borderColor: '#11131C',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 4,
                alignSelf: 'flex-start',
                marginBottom: 10,
              }}
            >
              <Text style={{ color: '#11131C', fontSize: 11.5, fontWeight: '900', fontFamily: 'monospace' }}>
                ▶ PLAY_WEB_DEMO ↗
              </Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.tagsContainer}>
            {devLog.tags.map((tag, index) => {
              const isTagSelected = selectedTag === tag;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: isTagSelected ? Theme.colors.primary : Theme.colors.pillBg,
                      borderColor: isTagSelected ? Theme.colors.primary : Theme.colors.border,
                    },
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
                      { color: isTagSelected ? '#FFFFFF' : Theme.colors.textLight },
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
    marginBottom: 18,
    marginHorizontal: 4,
  },
  card: {
    width: '100%',
  },
  cartridgeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1.5,
  },
  thumbnail: {
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1.5,
  },
  thumbnailImage: {
    width: '100%',
    height: 165,
    borderBottomWidth: 1.5,
  },
  thumbnailText: {
    fontWeight: '800',
    fontSize: 12,
    fontFamily: 'monospace',
    letterSpacing: 1.5,
  },
  content: {
    padding: 14,
  },
  title: {
    fontSize: 16.5,
    fontWeight: '800',
    lineHeight: 23,
    marginBottom: 8,
  },
  bookmarkBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  statsBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  statChipText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  metaText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
});
