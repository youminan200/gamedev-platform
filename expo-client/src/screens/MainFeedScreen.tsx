import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, Modal, ScrollView, Linking } from 'react-native';
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
  const [authorModalVisible, setAuthorModalVisible] = useState(false);
  const [authorModalProfile, setAuthorModalProfile] = useState<any>(null);
  const [authorModalLoading, setAuthorModalLoading] = useState(false);
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);
  const [toolboxVisible, setToolboxVisible] = useState(false);
  const [lang, setLang] = useState<'ko' | 'en'>('ko');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [visitStats, setVisitStats] = useState<{ today: number; total: number }>({ today: 0, total: 0 });
  const [shouts, setShouts] = useState<any[]>([]);
  const [shoutText, setShoutText] = useState('');
  const [sendingShout, setSendingShout] = useState(false);

  useEffect(() => {
    ApiClient.getShoutbox().then(setShouts).catch(() => {});
    fetch('https://gamedev-platform.onrender.com/api/system-status?track=0')
      .then((r) => r.json())
      .then((d) => {
        if (d.today_visits !== undefined) setVisitStats({ today: d.today_visits, total: d.total_visits });
      })
      .catch(() => {});
  }, []);

  const handleOpenLeaderboard = async () => {
    setLeaderboardVisible(true);
    try {
      const list = await ApiClient.getLeaderboard();
      setLeaderboard(list);
    } catch {}
  };

  const handleOpenAuthorModal = async (targetUsername: string) => {
    setAuthorModalVisible(true);
    setAuthorModalProfile(null);
    try {
      setAuthorModalLoading(true);
      const data = await ApiClient.getUserProfile(targetUsername);
      setAuthorModalProfile(data);
    } catch {} finally {
      setAuthorModalLoading(false);
    }
  };

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
    const pinDiff = (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0);
    if (pinDiff !== 0) return pinDiff;
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
        <View>
          <Text style={styles.headerTitle}>📜 DevLogs Hub</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: Theme.colors.textLight }}>
              {lang === 'en' ? `👁️ Today ${visitStats.today} • Total ${visitStats.total} visits` : `👁️ 오늘 ${visitStats.today}명 • 누적 ${visitStats.total}명 방문`}
            </Text>
            <TouchableOpacity
              onPress={handleOpenLeaderboard}
              style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#D97706' }}>{lang === 'en' ? '🏆 Top Creators' : '🏆 개발자 랭킹'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setToolboxVisible(true)}
              style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#4F46E5' }}>{lang === 'en' ? '🧰 Free Dev Tools' : '🧰 무료 개발도구함'}</Text>
            </TouchableOpacity>
          </View>
        </View>
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



      {/* Quick Category Filter Pills (All / Demo Play / Team Recruit / Engines) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 12 }}>
        {[
          { label: '📋 전체 글', tag: null },
          { label: '🏆 이달의 쇼케이스', tag: '쇼케이스' },
          { label: '🎮 데모 플레이', tag: '데모버전' },
          { label: '🤝 팀원 모집', tag: '팀원모집' },
          { label: 'Unity', tag: 'Unity' },
          { label: 'Unreal', tag: 'Unreal' },
          { label: 'Godot', tag: 'Godot' },
        ].map((item) => {
          const active = selectedTag === item.tag;
          return (
            <TouchableOpacity
              key={item.label}
              onPress={() => setSelectedTag(active ? null : item.tag)}
              style={{
                backgroundColor: active ? Theme.colors.primary : Theme.colors.pillBg,
                paddingHorizontal: 13,
                paddingVertical: 7,
                borderRadius: 16,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#FFF' : Theme.colors.text }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>


      {/* Live Developer Shoutbox Widget */}
      <View style={{ backgroundColor: Theme.colors.pillBg, borderRadius: 14, padding: 12, marginBottom: 14 }}>
        <Text style={{ fontSize: 12, fontWeight: '800', color: Theme.colors.primary, marginBottom: 6 }}>
          {lang === 'en' ? '⚡ Live Indie Dev Shoutbox (No login required)' : '⚡ 실시간 개발자 한줄 응원톡 (로그인 없이 작성 가능)'}
        </Text>
        {shouts.slice(0, 3).map((s: any) => (
          <Text key={s.id} numberOfLines={1} style={{ fontSize: 12, color: Theme.colors.text, marginBottom: 3 }}>
            <Text style={{ fontWeight: '800', color: Theme.colors.primary }}>{s.nickname}: </Text>
            {s.message}
          </Text>
        ))}
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
          <TextInput
            style={{ flex: 1, backgroundColor: Theme.colors.background, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, color: Theme.colors.text }}
            placeholder="오늘의 개발 진척도나 응원 한마디를 남겨보세요..."
            placeholderTextColor={Theme.colors.textLight}
            value={shoutText}
            onChangeText={setShoutText}
          />
          <TouchableOpacity
            disabled={sendingShout}
            onPress={async () => {
              if (!shoutText.trim()) return;
              try {
                setSendingShout(true);
                const list = await ApiClient.postShoutbox(username || '인디개발자', shoutText.trim());
                if (list.length > 0) setShouts(list);
                setShoutText('');
              } catch {} finally {
                setSendingShout(false);
              }
            }}
            style={{ backgroundColor: Theme.colors.primary, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 10 }}
          >
            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>등록</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Top 3 Popular DevLogs Banner */}
      {logs.length > 0 && (
        <View style={{ marginBottom: 14 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: Theme.colors.primary, marginBottom: 8 }}>
            {lang === 'en' ? '🔥 Top 3 Trending DevLogs' : '🔥 인기 개발일지 TOP 3'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {[...logs]
              .sort((a, b) => (b.likes || 0) - (a.likes || 0))
              .slice(0, 3)
              .map((topItem, index) => (
                <TouchableOpacity
                  key={topItem.id}
                  onPress={() => onDevLogClick(topItem.id)}
                  style={{
                    backgroundColor: Theme.colors.pillBg,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 14,
                    maxWidth: 240,
                  }}
                >
                  <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '800', color: Theme.colors.text }}>
                    {index === 0 ? '🥇 ' : index === 1 ? '🥈 ' : '🥉 '}
                    {topItem.title}
                  </Text>
                  <Text style={{ fontSize: 11, color: Theme.colors.textLight, marginTop: 4 }}>
                    by {topItem.author} • ❤️ {topItem.likes || 0}
                  </Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      )}

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
            onAuthorClick={handleOpenAuthorModal}
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

      <Modal visible={authorModalVisible} animationType="fade" transparent onRequestClose={() => setAuthorModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 440, backgroundColor: Theme.colors.background, borderRadius: 20, padding: 22 }}>
            {authorModalLoading || !authorModalProfile ? (
              <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginVertical: 24 }} />
            ) : (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <View>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: Theme.colors.text }}>
                      👤 {authorModalProfile.user.username}
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.colors.primary, marginTop: 2 }}>
                      🎮 {authorModalProfile.user.engine || 'Unity'} 크리에이터
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setAuthorModalVisible(false)}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.colors.textLight }}>✕</Text>
                  </TouchableOpacity>
                </View>

                {authorModalProfile.user.bio ? (
                  <Text style={{ fontSize: 13, color: Theme.colors.text, marginBottom: 12 }}>
                    "{authorModalProfile.user.bio}"
                  </Text>
                ) : null}

                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                  <View style={{ flex: 1, backgroundColor: Theme.colors.pillBg, padding: 10, borderRadius: 12, alignItems: 'center' }}>
                    <Text style={{ fontWeight: '800', fontSize: 16, color: Theme.colors.primary }}>{authorModalProfile.stats.devlog_count}</Text>
                    <Text style={{ fontSize: 11, color: Theme.colors.textLight }}>DevLogs</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: Theme.colors.pillBg, padding: 10, borderRadius: 12, alignItems: 'center' }}>
                    <Text style={{ fontWeight: '800', fontSize: 16, color: Theme.colors.primary }}>{authorModalProfile.stats.asset_count}</Text>
                    <Text style={{ fontSize: 11, color: Theme.colors.textLight }}>Assets</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: Theme.colors.pillBg, padding: 10, borderRadius: 12, alignItems: 'center' }}>
                    <Text style={{ fontWeight: '800', fontSize: 16, color: Theme.colors.primary }}>❤️ {authorModalProfile.stats.total_likes}</Text>
                    <Text style={{ fontSize: 11, color: Theme.colors.textLight }}>Likes</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {authorModalProfile.user.github_url ? (
                    <TouchableOpacity style={{ backgroundColor: Theme.colors.pillBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }} onPress={() => Linking.openURL(authorModalProfile.user.github_url)}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.colors.text }}>🐙 GitHub ↗</Text>
                    </TouchableOpacity>
                  ) : null}
                  {authorModalProfile.user.steam_url ? (
                    <TouchableOpacity style={{ backgroundColor: Theme.colors.pillBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }} onPress={() => Linking.openURL(authorModalProfile.user.steam_url)}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.colors.text }}>🎮 Steam ↗</Text>
                    </TouchableOpacity>
                  ) : null}
                  {authorModalProfile.user.itch_url ? (
                    <TouchableOpacity style={{ backgroundColor: Theme.colors.pillBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }} onPress={() => Linking.openURL(authorModalProfile.user.itch_url)}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.colors.text }}>🕹️ Itch.io ↗</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <Text style={{ fontSize: 13, fontWeight: '800', color: Theme.colors.text, marginBottom: 6 }}>📜 최근 작성한 개발일지</Text>
                {(authorModalProfile.recent_devlogs || []).slice(0, 3).map((d: any) => (
                  <TouchableOpacity
                    key={d.id}
                    onPress={() => {
                      setAuthorModalVisible(false);
                      onDevLogClick(d.id);
                    }}
                    style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Theme.colors.pillBg }}
                  >
                    <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '700', color: Theme.colors.text }}>{d.title}</Text>
                    <Text style={{ fontSize: 11, color: Theme.colors.textLight }}>❤️ {d.likes} • 💬 {d.comment_count ?? 0}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={leaderboardVisible} animationType="fade" transparent onRequestClose={() => setLeaderboardVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 440, backgroundColor: Theme.colors.background, borderRadius: 20, padding: 22 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.colors.text }}>🏆 인디 크리에이터 명예의 전당</Text>
              <TouchableOpacity onPress={() => setLeaderboardVisible(false)}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.colors.textLight }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 320 }}>
              {leaderboard.map((c, i) => (
                <TouchableOpacity
                  key={c.username}
                  onPress={() => {
                    setLeaderboardVisible(false);
                    handleOpenAuthorModal(c.username);
                  }}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    marginBottom: 8,
                    borderRadius: 12,
                    backgroundColor: Theme.colors.pillBg,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.colors.text }}>
                      {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : `#${i + 1} `}
                      {c.username}{' '}
                      <Text style={{ fontSize: 11, color: '#D97706' }}>
                        {c.total_likes >= 40 ? '[👑 마스터]' : c.total_likes >= 15 ? '[⚡ 인디장인]' : '[🌱 새싹]'}
                      </Text>
                    </Text>
                    <Text style={{ fontSize: 11, color: Theme.colors.textLight, marginTop: 2 }}>
                      🎮 {c.engine} • 개발일지 {c.devlog_count}개 • 에셋 {c.asset_count}개
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: Theme.colors.primary }}>❤️ {c.total_likes}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={toolboxVisible} animationType="fade" transparent onRequestClose={() => setToolboxVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 440, backgroundColor: Theme.colors.background, borderRadius: 20, padding: 22 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.colors.text }}>🧰 인디 개발자 필수 무료 도구함</Text>
              <TouchableOpacity onPress={() => setToolboxVisible(false)}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: Theme.colors.textLight }}>✕</Text>
              </TouchableOpacity>
            </View>
            {[
              { name: '🎨 Kenney.nl (CC0 무료 2D/3D/오디오 에셋 5만종)', url: 'https://kenney.nl/assets' },
              { name: '🔊 Jsfxr (웹에서 바로 만드는 8비트 효과음 생성기)', url: 'https://sfxr.me/' },
              { name: '🖌️ Piskel (설치 없이 웹에서 그리는 픽셀아트 툴)', url: 'https://www.piskelapp.com/' },
              { name: '🕺 Mixamo (무료 3D 캐릭터 리깅 & 애니메이션)', url: 'https://www.mixamo.com/' },
              { name: '✨ Shadertoy (실시간 셰이더 코드 레퍼런스)', url: 'https://www.shadertoy.com/' },
              { name: '🕹️ Itch.io (인디게임 웹 데모 무료 호스팅 & 게임잼)', url: 'https://itch.io/' },
            ].map((tool) => (
              <TouchableOpacity
                key={tool.name}
                onPress={() => Linking.openURL(tool.url)}
                style={{
                  backgroundColor: Theme.colors.pillBg,
                  paddingVertical: 11,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  marginBottom: 8,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: Theme.colors.text, flex: 1 }}>{tool.name}</Text>
                <Text style={{ fontSize: 12, fontWeight: '800', color: Theme.colors.primary }}>열기 ↗</Text>
              </TouchableOpacity>
            ))}
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
