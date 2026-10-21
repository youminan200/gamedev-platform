import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { DevLog } from '../models/DevLog';
import { Theme } from '../theme';
import { NeumorphView } from './NeumorphView';
import { ApiClient } from '../api/ApiClient';
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
  const [votesA, setVotesA] = useState<number>(Number(devLog.poll_votes_a || 0));
  const [votesB, setVotesB] = useState<number>(Number(devLog.poll_votes_b || 0));
  const [votedChoice, setVotedChoice] = useState<'A' | 'B' | null>(null);

  const handleQuickVote = async (e: any, option: 'A' | 'B') => {
    e?.stopPropagation?.();
    if (votedChoice) return;
    setVotedChoice(option);
    if (option === 'A') setVotesA(v => v + 1);
    else setVotesB(v => v + 1);
    try {
      const res = await ApiClient.voteDevLogPoll(devLog.id, option);
      if (res) {
        setVotesA(Number(res.poll_votes_a || 0));
        setVotesB(Number(res.poll_votes_b || 0));
      }
    } catch {}
  };

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

          {devLog.poll_question ? (() => {
            const total = votesA + votesB;
            const pctA = total > 0 ? Math.round((votesA / total) * 100) : 50;
            const pctB = total > 0 ? 100 - pctA : 50;
            return (
              <View
                style={{
                  backgroundColor: Theme.colors.background,
                  borderWidth: 1.5,
                  borderColor: Theme.colors.border,
                  borderRadius: 4,
                  padding: 10,
                  marginBottom: 10,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 10.5, fontWeight: '900', color: '#FFD166', fontFamily: 'monospace' }}>
                    [A vs B // 플레이테스트 투표함]
                  </Text>
                  <Text style={{ fontSize: 10, color: Theme.colors.textLight, fontFamily: 'monospace' }}>
                    TOTAL: {total} VOTES
                  </Text>
                </View>
                <Text style={{ fontSize: 12.5, fontWeight: '800', color: Theme.colors.text, marginBottom: 8 }}>
                  Q. {devLog.poll_question}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
                  <TouchableOpacity
                    onPress={(e) => handleQuickVote(e, 'A')}
                    style={{
                      flex: 1,
                      backgroundColor: votedChoice === 'A' ? Theme.colors.primary : Theme.colors.pillBg,
                      borderWidth: 1.5,
                      borderColor: votedChoice === 'A' ? Theme.colors.primary : Theme.colors.border,
                      paddingVertical: 6,
                      paddingHorizontal: 8,
                      borderRadius: 4,
                    }}
                  >
                    <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '900', color: votedChoice === 'A' ? '#FFF' : Theme.colors.text, fontFamily: 'monospace' }}>
                      [A] {devLog.poll_option_a || 'A안'} ({pctA}%)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={(e) => handleQuickVote(e, 'B')}
                    style={{
                      flex: 1,
                      backgroundColor: votedChoice === 'B' ? '#00E5FF' : Theme.colors.pillBg,
                      borderWidth: 1.5,
                      borderColor: votedChoice === 'B' ? '#00E5FF' : Theme.colors.border,
                      paddingVertical: 6,
                      paddingHorizontal: 8,
                      borderRadius: 4,
                    }}
                  >
                    <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '900', color: votedChoice === 'B' ? '#11131C' : Theme.colors.text, fontFamily: 'monospace' }}>
                      [B] {devLog.poll_option_b || 'B안'} ({pctB}%)
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={{ height: 6, backgroundColor: '#00E5FF', borderRadius: 2, overflow: 'hidden', flexDirection: 'row' }}>
                  <View style={{ width: `${pctA}%`, backgroundColor: Theme.colors.primary }} />
                </View>
              </View>
            );
          })() : null}

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
