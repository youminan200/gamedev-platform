import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, Modal, ScrollView, Linking, Image, Platform } from 'react-native';
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
  const [showcases, setShowcases] = useState<any[]>([]);
  const [showcaseModalOpen, setShowcaseModalOpen] = useState(false);
  const [scTitle, setScTitle] = useState('');
  const [scEngine, setScEngine] = useState('Unity');
  const [scUrl, setScUrl] = useState('');
  const [scThumb, setScThumb] = useState('');
  const [scDesc, setScDesc] = useState('');
  const [submittingSc, setSubmittingSc] = useState(false);
  const [previewGame, setPreviewGame] = useState<any>(null);
  const [badgeCopied, setBadgeCopied] = useState(false);
  const [arcadeOpen, setArcadeOpen] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);

  const handleInstallAppClick = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).__deferredInstallPrompt) {
        const promptEvent = (window as any).__deferredInstallPrompt;
        promptEvent.prompt();
        await promptEvent.userChoice;
        (window as any).__deferredInstallPrompt = null;
        return;
      }
    } catch {}
    setInstallModalOpen(true);
  };
  const [arcadeScores, setArcadeScores] = useState<any[]>([]);
  const [teamBoardOpen, setTeamBoardOpen] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [teamTitle, setTeamTitle] = useState('');
  const [teamRole, setTeamRole] = useState('🎨 2D 픽셀 아티스트');
  const [teamEngine, setTeamEngine] = useState('Unity');
  const [teamContact, setTeamContact] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [submittingTeam, setSubmittingTeam] = useState(false);

  const handleOpenArcade = async () => {
    setArcadeOpen(true);
    try {
      const s = await ApiClient.getArcadeScores();
      setArcadeScores(s);
    } catch {}
  };

  const handleOpenTeamBoard = async () => {
    setTeamBoardOpen(true);
    try {
      const t = await ApiClient.getTeams();
      setTeams(t);
    } catch {}
  };

  const handleCopyFeaturedBadge = () => {
    const badgeMd = '[![Featured on DevGround](https://img.shields.io/badge/🎮_Featured_on-DevGround-4F46E5?style=for-the-badge)](https://gamedev-platform-expo-client.vercel.app)';
    try {
      navigator?.clipboard?.writeText(badgeMd);
    } catch {}
    setBadgeCopied(true);
    setTimeout(() => setBadgeCopied(false), 2200);
  };
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [visitStats, setVisitStats] = useState<{ today: number; total: number }>({ today: 0, total: 0 });
  const [shouts, setShouts] = useState<any[]>([]);
  const [shoutText, setShoutText] = useState('');
  const [sendingShout, setSendingShout] = useState(false);

  useEffect(() => {
    ApiClient.getShowcases().then(setShowcases).catch(() => {});
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

  const blockedList = ApiClient.getBlockedUsers();
  const visibleLogs = logs.filter((item) => !blockedList.includes(item.author));
  const filteredLogs = sortBy === 'bookmarked'
    ? visibleLogs.filter((item) => bookmarkedIds.includes(String(item.id)))
    : visibleLogs;

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
            <TouchableOpacity
              onPress={handleOpenArcade}
              style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#15803D' }}>{lang === 'en' ? '🕹️ Mini Arcade' : '🕹️ 미니오락실'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleOpenTeamBoard}
              style={{ backgroundColor: '#FCE7F3', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#BE185D' }}>{lang === 'en' ? '🤝 Team Board' : '🤝 팀원모집 보드'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleInstallAppClick}
              style={{ backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#0369A1' }}>{lang === 'en' ? '📲 Install App' : '📲 무료 앱 설치'}</Text>
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




      {/* Global GameDev Free Assets & Game Jam News Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 12 }}>
        {[
          { label: lang === 'en' ? '🎁 Unreal/Fab Monthly Free Assets' : '🎁 언리얼/Fab 이달의 무료 에셋', url: 'https://www.fab.com/' },
          { label: lang === 'en' ? '🎁 Unity Top Free Assets' : '🎁 유니티 인기 무료 에셋 모음', url: 'https://assetstore.unity.com/top-assets/top-free' },
          { label: lang === 'en' ? '🏆 Global Indie Game Jams (Itch.io)' : '🏆 글로벌 인디 게임잼 일정 (Itch.io)', url: 'https://itch.io/jams' },
          { label: lang === 'en' ? '🔥 Steam Upcoming Indie Games' : '🔥 스팀 출시 예정 인디게임 트렌드', url: 'https://store.steampowered.com/genre/Indie/' },
        ].map((news) => (
          <TouchableOpacity
            key={news.label}
            onPress={() => Linking.openURL(news.url)}
            style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}
          >
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#4F46E5' }}>{news.label} ↗</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Indie Game Homepage & Web Demo Showcase Strip */}
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: Theme.colors.primary }}>
            {lang === 'en' ? '🕹️ Indie Game Websites & Web Demos' : '🕹️ 인디게임 공식 홈페이지 & 웹데모 홍보관'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <TouchableOpacity
              onPress={handleCopyFeaturedBadge}
              style={{ backgroundColor: badgeCopied ? '#10B981' : '#EEF2FF', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 }}
            >
              <Text style={{ color: badgeCopied ? '#FFF' : '#4F46E5', fontSize: 11, fontWeight: '800' }}>
                {badgeCopied ? '✅ 배지코드 복사됨!' : lang === 'en' ? '🎖️ Copy Badge' : '🎖️ 공식 배지 복사'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowcaseModalOpen(true)}
              style={{ backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}
            >
              <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>
                {lang === 'en' ? '+ Add My Game Site' : '+ 내 게임 홈페이지 등록'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {showcases.map((game: any) => (
            <View
              key={game.id}
              style={{
                width: 240,
                backgroundColor: Theme.colors.pillBg,
                borderRadius: 16,
                overflow: 'hidden',
                paddingBottom: 12,
              }}
            >
              {game.thumbnail_url ? (
                <Image source={{ uri: game.thumbnail_url }} style={{ width: '100%', height: 100 }} resizeMode="cover" />
              ) : null}
              <View style={{ paddingHorizontal: 12, paddingTop: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: Theme.colors.primary }}>{game.engine}</Text>
                  <Text style={{ fontSize: 10, color: Theme.colors.textLight }}>👁️ {game.plays || 0}회 방문</Text>
                </View>
                <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '800', color: Theme.colors.text }}>
                  {game.title}
                </Text>
                <Text numberOfLines={2} style={{ fontSize: 11, color: Theme.colors.textLight, marginTop: 3, height: 30 }}>
                  {game.description || '인디게임 공식 홈페이지 및 데모 페이지'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        const r = await ApiClient.visitShowcase(game.id);
                        setShowcases((prev) => prev.map((x) => (x.id === game.id ? { ...x, plays: r.plays } : x)));
                      } catch {}
                      setPreviewGame(game);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: '#4F46E5',
                      paddingVertical: 7,
                      borderRadius: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>
                      {lang === 'en' ? '🖥️ Preview Here' : '🖥️ 안에서 바로보기'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        const r = await ApiClient.visitShowcase(game.id);
                        setShowcases((prev) => prev.map((x) => (x.id === game.id ? { ...x, plays: r.plays } : x)));
                      } catch {}
                      Linking.openURL(game.homepage_url).catch(() => {});
                    }}
                    style={{
                      backgroundColor: Theme.colors.pillBg,
                      paddingHorizontal: 10,
                      paddingVertical: 7,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: Theme.colors.text, fontSize: 11, fontWeight: '800' }}>↗ 새창</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

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

      <Modal visible={showcaseModalOpen} animationType="fade" transparent onRequestClose={() => setShowcaseModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 440, backgroundColor: Theme.colors.background, borderRadius: 20, padding: 22 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.colors.text, marginBottom: 12 }}>
              🕹️ 내 인디게임 홈페이지 / 웹데모 홍보 등록
            </Text>
            <TextInput
              style={{ backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 10, fontSize: 14 }}
              placeholder="게임 제목 (예: Shadow Dungeon)"
              value={scTitle}
              onChangeText={setScTitle}
            />
            <TextInput
              style={{ backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 10, fontSize: 14 }}
              placeholder="게임 홈페이지 / Itch.io / Steam 주소 (https://...)"
              value={scUrl}
              onChangeText={setScUrl}
              autoCapitalize="none"
            />
            <TextInput
              style={{ backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 10, fontSize: 14 }}
              placeholder="대표 썸네일 이미지 주소 (https://... 선택사항)"
              value={scThumb}
              onChangeText={setScThumb}
              autoCapitalize="none"
            />
            <TextInput
              style={{ backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 10, fontSize: 14 }}
              placeholder="사용 엔진 (예: Unity / Unreal 5 / Godot)"
              value={scEngine}
              onChangeText={setScEngine}
            />
            <TextInput
              style={{ backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 14, fontSize: 14 }}
              placeholder="한줄 게임 소개"
              value={scDesc}
              onChangeText={setScDesc}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity onPress={() => setShowcaseModalOpen(false)} style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
                <Text style={{ color: Theme.colors.textLight, fontWeight: '700' }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={submittingSc}
                onPress={async () => {
                  if (!scTitle.trim() || !scUrl.trim()) return;
                  try {
                    setSubmittingSc(true);
                    const updated = await ApiClient.postShowcase({
                      title: scTitle.trim(),
                      developer: username || 'Indie Creator',
                      engine: scEngine.trim() || 'Unity',
                      homepage_url: scUrl.trim(),
                      thumbnail_url: scThumb.trim() || undefined,
                      description: scDesc.trim(),
                    });
                    if (updated.length > 0) setShowcases(updated);
                    setShowcaseModalOpen(false);
                    setScTitle('');
                    setScUrl('');
                    setScThumb('');
                    setScDesc('');
                  } catch {} finally {
                    setSubmittingSc(false);
                  }
                }}
                style={{ backgroundColor: '#10B981', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 }}
              >
                <Text style={{ color: '#FFF', fontWeight: '800' }}>{submittingSc ? '등록 중...' : '홍보관에 등록하기'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(previewGame)} animationType="fade" transparent onRequestClose={() => setPreviewGame(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.75)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{ width: '100%', maxWidth: 900, height: '85%', backgroundColor: '#0F172A', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#1E293B' }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text numberOfLines={1} style={{ color: '#F8FAFC', fontSize: 15, fontWeight: '800' }}>
                  🕹️ {previewGame?.title} ({previewGame?.engine})
                </Text>
                <Text numberOfLines={1} style={{ color: '#94A3B8', fontSize: 11 }}>
                  {previewGame?.homepage_url} (외부 보안 정책으로 화면이 안 보이면 우측 '새 탭으로 열기'를 눌러주세요)
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => previewGame?.homepage_url && Linking.openURL(previewGame.homepage_url)}
                  style={{ backgroundColor: '#38BDF8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}
                >
                  <Text style={{ color: '#0F172A', fontSize: 12, fontWeight: '800' }}>🌐 새 탭으로 열기 ↗</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPreviewGame(null)}
                  style={{ backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }}
                >
                  <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '800' }}>✕ 닫기</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ flex: 1, backgroundColor: '#FFF' }}>
              {Platform.OS === 'web' && previewGame?.homepage_url
                ? React.createElement('iframe', {
                    src: previewGame.homepage_url,
                    style: { width: '100%', height: '100%', border: 'none' },
                    allow: 'fullscreen; autoplay; gamepad',
                  })
                : null}
            </View>
          </View>
        </View>
            </Modal>

      <Modal visible={arcadeOpen} animationType="fade" transparent onRequestClose={() => setArcadeOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.8)', justifyContent: 'center', alignItems: 'center', padding: 14 }}>
          <View style={{ width: '100%', maxWidth: 880, backgroundColor: '#0F172A', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#334155', maxHeight: '92%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View>
                <Text style={{ color: '#38BDF8', fontSize: 18, fontWeight: '800' }}>🕹️ DevGround 미니 오락실: Bug Slayer (버그 피하기)</Text>
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>게임 오버 시 내 최고 점수가 실시간 랭킹에 자동 등록됩니다!</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={async () => {
                    const s = await ApiClient.getArcadeScores();
                    setArcadeScores(s);
                  }}
                  style={{ backgroundColor: '#1E293B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#475569' }}
                >
                  <Text style={{ color: '#38BDF8', fontSize: 12, fontWeight: '800' }}>🔄 랭킹 새로고침</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setArcadeOpen(false)}
                  style={{ backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}
                >
                  <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>✕ 닫기</Text>
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView>
              <View style={{ height: 400, backgroundColor: '#020617', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
                {Platform.OS === 'web'
                  ? React.createElement('iframe', {
                      src: '/arcade.html?user=' + encodeURIComponent(username || 'IndieDev'),
                      style: { width: '100%', height: '100%', border: 'none' },
                    })
                  : null}
              </View>
              <Text style={{ color: '#FACC15', fontSize: 14, fontWeight: '800', marginBottom: 8 }}>🏆 실시간 최고 점수 TOP 10</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {arcadeScores.map((r, idx) => (
                  <View
                    key={r.username + idx}
                    style={{ backgroundColor: '#1E293B', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#334155', minWidth: 150 }}
                  >
                    <Text style={{ color: '#F8FAFC', fontSize: 13, fontWeight: '800' }}>
                      {idx === 0 ? '🥇 ' : idx === 1 ? '🥈 ' : idx === 2 ? '🥉 ' : '#' + (idx + 1) + ' '}
                      {r.username}
                    </Text>
                    <Text style={{ color: '#38BDF8', fontSize: 12, fontWeight: '800', marginTop: 2 }}>{r.score} pts</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={teamBoardOpen} animationType="fade" transparent onRequestClose={() => setTeamBoardOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.75)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{ width: '100%', maxWidth: 640, backgroundColor: Theme.colors.background, borderRadius: 20, padding: 22, maxHeight: '90%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 19, fontWeight: '800', color: Theme.colors.text }}>🤝 인디 게임 개발 팀원 모집 전용 보드</Text>
                <Text style={{ fontSize: 12, color: Theme.colors.textLight }}>프로그래머 · 2D/3D 아트 · 사운드 · 기획자 협업 파트너를 찾아보세요!</Text>
              </View>
              <TouchableOpacity onPress={() => setTeamBoardOpen(false)}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.colors.textLight }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 520 }}>
              {teams.map((t) => (
                <View
                  key={t.id}
                  style={{ backgroundColor: Theme.colors.pillBg, borderRadius: 14, padding: 14, marginBottom: 10 }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <View style={{ backgroundColor: '#FCE7F3', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#BE185D' }}>{t.role_needed}</Text>
                      </View>
                      <View style={{ backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#0369A1' }}>{t.engine}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, color: Theme.colors.textLight, fontWeight: '700' }}>by {t.author}</Text>
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: Theme.colors.text, marginBottom: 4 }}>{t.project_title}</Text>
                  <Text style={{ fontSize: 13, color: Theme.colors.textLight, marginBottom: 10, lineHeight: 18 }}>{t.description}</Text>
                  <TouchableOpacity
                    onPress={() => t.contact_url && Linking.openURL(t.contact_url)}
                    style={{ backgroundColor: Theme.colors.primary, paddingVertical: 8, borderRadius: 10, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>💬 디스코드 / 오픈채팅으로 지원·연락하기 ↗</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Theme.colors.pillBg }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: Theme.colors.text, marginBottom: 8 }}>➕ 새 팀원 모집 공고 등록하기</Text>
                <TextInput
                  style={{ backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 8, fontSize: 13 }}
                  placeholder="프로젝트 제목 (예: 2D 로그라이크 스팀 출시 팀원 구합니다)"
                  value={teamTitle}
                  onChangeText={setTeamTitle}
                />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {['💻 프로그래머', '🎨 2D 픽셀 아티스트', '🧊 3D 모델러', '🎵 사운드/작곡', '📝 기획자'].map((role) => (
                    <TouchableOpacity
                      key={role}
                      onPress={() => setTeamRole(role)}
                      style={{
                        backgroundColor: teamRole === role ? Theme.colors.primary : Theme.colors.pillBg,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '800', color: teamRole === role ? '#FFF' : Theme.colors.text }}>{role}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <TextInput
                    style={{ flex: 1, backgroundColor: '#FFF', borderRadius: 10, padding: 10, fontSize: 13 }}
                    placeholder="엔진 (Unity / Unreal / Godot)"
                    value={teamEngine}
                    onChangeText={setTeamEngine}
                  />
                  <TextInput
                    style={{ flex: 1, backgroundColor: '#FFF', borderRadius: 10, padding: 10, fontSize: 13 }}
                    placeholder="오픈카톡 / 디스코드 초대 링크 (https://...)"
                    value={teamContact}
                    onChangeText={setTeamContact}
                    autoCapitalize="none"
                  />
                </View>
                <TextInput
                  style={{ backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 10, fontSize: 13, height: 64 }}
                  placeholder="모집 상세 내용 및 협업 방식 소개..."
                  multiline
                  value={teamDesc}
                  onChangeText={setTeamDesc}
                />
                <TouchableOpacity
                  disabled={submittingTeam}
                  onPress={async () => {
                    if (!teamTitle.trim()) return;
                    try {
                      setSubmittingTeam(true);
                      const next = await ApiClient.postTeam({
                        project_title: teamTitle.trim(),
                        role_needed: teamRole,
                        engine: teamEngine.trim() || 'Unity',
                        author: username || 'IndieDev',
                        contact_url: teamContact.trim() || 'https://discord.com',
                        description: teamDesc.trim(),
                      });
                      if (next.length > 0) setTeams(next);
                      setTeamTitle('');
                      setTeamContact('');
                      setTeamDesc('');
                    } catch {} finally {
                      setSubmittingTeam(false);
                    }
                  }}
                  style={{ backgroundColor: '#10B981', paddingVertical: 11, borderRadius: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 14 }}>{submittingTeam ? '등록 중...' : '🤝 팀원 모집 공고 올리기'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={installModalOpen} animationType="fade" transparent onRequestClose={() => setInstallModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.75)', justifyContent: 'center', alignItems: 'center', padding: 18 }}>
          <View style={{ width: '100%', maxWidth: 460, backgroundColor: Theme.colors.background, borderRadius: 20, padding: 22 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.colors.text }}>📲 DevGround 모바일·PC 앱 무료 설치</Text>
              <TouchableOpacity onPress={() => setInstallModalOpen(false)}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.colors.textLight }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: Theme.colors.textLight, marginBottom: 10, lineHeight: 19 }}>
              스토어 결제나 무거운 다운로드 없이 스마트폰 카메라로 아래 QR코드를 스캔하거나 홈 화면에 추가해 바로 실행하세요!
            </Text>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <Image
                source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https%3A%2F%2Fgamedev-platform-expo-client.vercel.app' }}
                style={{ width: 120, height: 120, borderRadius: 12, backgroundColor: '#FFF', padding: 6 }}
              />
              <Text style={{ fontSize: 11, fontWeight: '700', color: Theme.colors.primary, marginTop: 4 }}>📷 휴대폰 카메라로 스캔하면 앱이 바로 열립니다</Text>
            </View>
            <View style={{ backgroundColor: Theme.colors.pillBg, padding: 11, borderRadius: 12, marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: Theme.colors.primary, marginBottom: 3 }}>🤖 안드로이드 (갤럭시 · Chrome)</Text>
              <Text style={{ fontSize: 12, color: Theme.colors.text, lineHeight: 17 }}>
                우측 상단 메뉴(⋮) 탭 👉 [앱 설치] 또는 [홈 화면에 추가] 선택 시 바탕화면에 전용 앱으로 즉시 설치됩니다.
              </Text>
            </View>
            <View style={{ backgroundColor: Theme.colors.pillBg, padding: 11, borderRadius: 12, marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#10B981', marginBottom: 3 }}>🍎 아이폰 · 아이패드 (Safari)</Text>
              <Text style={{ fontSize: 12, color: Theme.colors.text, lineHeight: 17 }}>
                하단 중앙 [공유(⬆️)] 버튼 탭 👉 [홈 화면에 추가]를 누르면 상단 주소창이 없는 진짜 앱으로 실행됩니다.
              </Text>
            </View>
            <View style={{ backgroundColor: Theme.colors.pillBg, padding: 11, borderRadius: 12, marginBottom: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#D97706', marginBottom: 3 }}>💻 PC (Chrome · Edge 브라우저)</Text>
              <Text style={{ fontSize: 12, color: Theme.colors.text, lineHeight: 17 }}>
                주소창 오른쪽 끝의 [📥 앱 설치] 아이콘을 클릭하면 윈도우/맥 독립 프로그램으로 설치됩니다.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => Linking.openURL('https://gamedev-platform-expo-client.vercel.app/privacy.html')}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.colors.textLight }}>📜 개인정보처리방침 · 이용약관 보기 ↗</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setInstallModalOpen(false)}
                style={{ backgroundColor: Theme.colors.primary, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10 }}
              >
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>확인</Text>
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
