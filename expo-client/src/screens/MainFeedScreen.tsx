import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, Modal, ScrollView } from 'react-native';
import { DevLog } from '../models/DevLog';
import { ApiClient } from '../api/ApiClient';
import { Theme } from '../theme';
import { DevLogCard } from '../components/DevLogCard';
import { NeumorphView } from '../components/NeumorphView';

interface Props {
  onDevLogClick: (id: string) => void;
  onPostClick: () => void;
  username?: string | null;
  onAuthClick?: () => void;
  onAssetNotificationClick?: (id: string) => void;
}

export const MainFeedScreen: React.FC<Props> = ({ onDevLogClick, onPostClick, username, onAuthClick, onAssetNotificationClick }) => {
  const [logs, setLogs] = useState<DevLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'bookmarked'>('latest');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => ApiClient.getBookmarks('devlog'));
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    if (!username || !ApiClient.getToken()) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const data = await ApiClient.getNotifications();
      setNotifications(data.items);
      setUnreadCount(data.unread);
    } catch {}
  };

  useEffect(() => {
    loadNotifications();
  }, [username]);

  const handleOpenNotifications = async () => {
    setNotifOpen(true);
    await loadNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      await ApiClient.markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleNotificationClick = async (n: any) => {
    setNotifOpen(false);
    if (!n.is_read) {
      try {
        await ApiClient.markNotificationRead(n.id);
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {}
    }
    if (n.ref_type === 'devlog' && n.ref_id) onDevLogClick(n.ref_id);
    else if (n.ref_type === 'asset' && n.ref_id) onAssetNotificationClick?.(n.ref_id);
  };

  useEffect(() => {
    fetchLogs();
  }, [searchQuery, selectedTag]);

  const handleTagClick = (tag: string) => {
    setSelectedTag((prev) => (prev === tag ? null : tag));
    if (sortBy === 'bookmarked') setSortBy('latest');
  };

  const handleToggleTheme = () => {
    Theme.toggleMode();
    // StyleSheets are evaluated at load time, so reload to apply the palette everywhere (web).
    if (typeof window !== 'undefined' && window.location && typeof window.location.reload === 'function') {
      window.location.reload();
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getDevLogs(searchQuery || undefined, selectedTag || undefined);
      setLogs(data);
      setBookmarkedIds(ApiClient.getBookmarks('devlog'));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBookmark = (id: string) => {
    ApiClient.toggleBookmark(id, 'devlog');
    setBookmarkedIds(ApiClient.getBookmarks('devlog'));
  };

  const filteredLogs = sortBy === 'bookmarked'
    ? logs.filter((item) => bookmarkedIds.includes(String(item.id)))
    : logs;

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    if (sortBy === 'popular') {
      return (b.likes || 0) - (a.likes || 0);
    }
    return Number(b.id) - Number(a.id);
  });

  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = 'https://gamedev-platform-expo-client.vercel.app';
    const shareText = 'DevGround - 인디 게임 개발자들의 개발일지(DevLog) & 무료 에셋 공유 커뮤니티 🎮';
    try {
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share({
          title: 'DevGround',
          text: shareText,
          url: shareUrl,
        });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {}
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={[styles.titleRow, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={styles.headerTitle}>📜 DevLogs Hub</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {username ? (
            <TouchableOpacity
              style={{ backgroundColor: Theme.colors.pillBg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}
              onPress={handleOpenNotifications}
            >
              <Text style={{ color: Theme.colors.text, fontWeight: '700', fontSize: 13 }}>
                🔔{unreadCount > 0 ? ` ${unreadCount}` : ''}
              </Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={{
              backgroundColor: Theme.colors.pillBg,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
            }}
            onPress={handleToggleTheme}
          >
            <Text style={{ color: Theme.colors.text, fontWeight: '700', fontSize: 13 }}>
              {Theme.isDark ? '☀️ Light' : '🌙 Dark'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: copied ? '#10B981' : Theme.colors.pillBg,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
            }}
            onPress={handleShare}
          >
            <Text style={{ color: copied ? '#FFFFFF' : '#334155', fontWeight: '700', fontSize: 13 }}>
              {copied ? '✅ 링크 복사됨' : '🔗 공유'}
            </Text>
          </TouchableOpacity>
          {onAuthClick && (
            <TouchableOpacity
              style={{
                backgroundColor: username ? Theme.colors.pillBg : Theme.colors.primary,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
              }}
              onPress={onAuthClick}
            >
              <Text style={{ color: username ? Theme.colors.text : '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                {username ? `👤 ${username}` : '🔑 로그인 / 가입'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Input */}
      <NeumorphView radius={12} style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search devlogs, games, tags..."
          placeholderTextColor={Theme.colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </NeumorphView>

      {/* Sort Buttons */}
      <View style={styles.sortRow}>
        <TouchableOpacity 
          style={[styles.sortButton, sortBy === 'latest' && styles.activeSortButton]}
          onPress={() => setSortBy('latest')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'latest' && styles.activeSortButtonText]}>⚡ Latest</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.sortButton, sortBy === 'popular' && styles.activeSortButton]}
          onPress={() => setSortBy('popular')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'popular' && styles.activeSortButtonText]}>🔥 Most Liked</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.sortButton, sortBy === 'bookmarked' && styles.activeSortButton]}
          onPress={() => setSortBy('bookmarked')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'bookmarked' && styles.activeSortButtonText]}>
            ⭐ 찜한 글 ({bookmarkedIds.length})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && logs.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedLogs}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <DevLogCard
            devLog={item}
            onClick={() => onDevLogClick(item.id)}
            isBookmarked={bookmarkedIds.includes(String(item.id))}
            onToggleBookmark={handleToggleBookmark}
            onTagClick={handleTagClick}
            selectedTag={selectedTag}
          />
        )}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: Theme.colors.textLight, fontWeight: '600', fontSize: 15 }}>
              {sortBy === 'bookmarked' ? '아직 ⭐ 찜한 개발일지가 없습니다.' : '등록된 개발일지가 없습니다.'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        onRefresh={fetchLogs}
        refreshing={loading}
      />

      <Modal visible={notifOpen} animationType="fade" transparent onRequestClose={() => setNotifOpen(false)}>
        <View style={styles.notifOverlay}>
          <View style={[styles.notifPanel, { backgroundColor: Theme.colors.background }]}>
            <Text style={[styles.notifTitle, { color: Theme.colors.text }]}>🔔 알림</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {notifications.length === 0 ? (
                <Text style={{ color: Theme.colors.textLight, paddingVertical: 20, textAlign: 'center' }}>새 알림이 없습니다.</Text>
              ) : (
                notifications.map((n) => (
                  <TouchableOpacity
                    key={n.id}
                    style={[styles.notifItem, { borderBottomColor: Theme.colors.border }]}
                    onPress={() => handleNotificationClick(n)}
                  >
                    <Text style={{ color: Theme.colors.text, fontWeight: n.is_read ? '500' : '800' }}>{n.message}</Text>
                    <Text style={{ color: Theme.colors.textLight, fontSize: 11, marginTop: 2 }}>
                      {n.created_at ? new Date(n.created_at.replace(' ', 'T') + 'Z').toLocaleString() : ''}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6 }}>
              <TouchableOpacity style={{ paddingVertical: 10 }} onPress={handleMarkAllRead}>
                <Text style={{ color: Theme.colors.textLight, fontWeight: '700' }}>모두 읽음</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ paddingVertical: 10 }} onPress={() => setNotifOpen(false)}>
                <Text style={{ color: Theme.colors.primary, fontWeight: '800' }}>닫기</Text>
              </TouchableOpacity>
            </View>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  titleRow: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  searchBox: {
    width: '100%',
    marginBottom: 12,
  },
  searchInput: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Theme.colors.text,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  sortButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: Theme.colors.pillBg,
  },
  activeSortButton: {
    backgroundColor: Theme.colors.primary,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textLight,
  },
  activeSortButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 100,
  },
  notifOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  notifPanel: { borderRadius: 20, padding: 20 },
  notifTitle: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  notifItem: { paddingVertical: 12, borderBottomWidth: 1 },
});
