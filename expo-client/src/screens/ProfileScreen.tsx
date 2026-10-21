import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput, Linking } from 'react-native';
import { Theme } from '../theme';
import { ApiClient } from '../api/ApiClient';
import { NeumorphView } from '../components/NeumorphView';
import { UserProfile } from '../models/DevLog';

interface Props {
  username: string;
  onLogout: () => void;
  onDevLogClick: (id: string) => void;
}

export const ProfileScreen: React.FC<Props> = ({ username, onLogout, onDevLogClick }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'devlogs' | 'assets'>('devlogs');
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [engineInput, setEngineInput] = useState('Unity');
  const [githubInput, setGithubInput] = useState('');
  const [steamInput, setSteamInput] = useState('');
  const [itchInput, setItchInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getUserProfile(username);
      setProfile(data);
      setBioInput(data?.user?.bio || '');
      setEngineInput(data?.user?.engine || 'Unity');
      setGithubInput(data?.user?.github_url || '');
      setSteamInput(data?.user?.steam_url || '');
      setItchInput(data?.user?.itch_url || '');
      setBioInput(data?.user?.bio || '');
      setEngineInput(data?.user?.engine || 'Unity');
      setGithubInput(data?.user?.github_url || '');
      setSteamInput(data?.user?.steam_url || '');
      setItchInput(data?.user?.itch_url || '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDevLog = async (id: string) => {
    try {
      await ApiClient.deleteDevLog(id);
      fetchProfile();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      await ApiClient.deleteAsset(id);
      fetchProfile();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.usernameText}>{username}</Text>
        <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, marginTop: 4 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#D97706' }}>
            {(profile?.stats.total_likes || 0) >= 20 ? '👑 마스터 크리에이터' : (profile?.stats.total_likes || 0) >= 10 ? '⚡ 인디 장인' : '🌱 새싹 개발자'}
          </Text>
        </View>
        <Text style={styles.subText}>
          🎮 {profile?.user.engine || 'Unity'} Developer • Joined {profile?.user.created_at ? new Date(profile.user.created_at).toLocaleDateString() : 'Recently'}
        </Text>
        {profile?.user.bio ? (
          <Text style={{ fontSize: 13, color: Theme.colors.text, marginTop: 6, textAlign: 'center', paddingHorizontal: 24 }}>
            "{profile.user.bio}"
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, justifyContent: 'center' }}>
          {profile?.user.github_url ? (
            <TouchableOpacity style={{ backgroundColor: Theme.colors.pillBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }} onPress={() => Linking.openURL(profile.user.github_url!)}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.colors.text }}>🐙 GitHub ↗</Text>
            </TouchableOpacity>
          ) : null}
          {profile?.user.steam_url ? (
            <TouchableOpacity style={{ backgroundColor: Theme.colors.pillBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }} onPress={() => Linking.openURL(profile.user.steam_url!)}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.colors.text }}>🎮 Steam ↗</Text>
            </TouchableOpacity>
          ) : null}
          {profile?.user.itch_url ? (
            <TouchableOpacity style={{ backgroundColor: Theme.colors.pillBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }} onPress={() => Linking.openURL(profile.user.itch_url!)}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.colors.text }}>🕹️ Itch.io ↗</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={{ backgroundColor: Theme.colors.primary, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 }}
            onPress={() => setEditProfileVisible(true)}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFF' }}>✏️ 프로필/링크 편집</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <NeumorphView radius={16} style={styles.statCard}>
          <Text style={styles.statNumber}>{profile?.stats.devlog_count || 0}</Text>
          <Text style={styles.statLabel}>DevLogs</Text>
        </NeumorphView>

        <NeumorphView radius={16} style={styles.statCard}>
          <Text style={styles.statNumber}>{profile?.stats.asset_count || 0}</Text>
          <Text style={styles.statLabel}>Assets</Text>
        </NeumorphView>

        <NeumorphView radius={16} style={styles.statCard}>
          <Text style={styles.statNumber}>❤️ {profile?.stats.total_likes || 0}</Text>
          <Text style={styles.statLabel}>Total Likes</Text>
        </NeumorphView>
      </View>

      {/* Sub-Tabs for My DevLogs / My Assets */}
      <View style={styles.subTabsRow}>
        <TouchableOpacity
          style={[styles.subTabBtn, activeSubTab === 'devlogs' && styles.activeSubTabBtn]}
          onPress={() => setActiveSubTab('devlogs')}
        >
          <Text style={[styles.subTabText, activeSubTab === 'devlogs' && styles.activeSubTabText]}>
            📜 내가 쓴 개발일지 ({profile?.recent_devlogs?.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subTabBtn, activeSubTab === 'assets' && styles.activeSubTabBtn]}
          onPress={() => setActiveSubTab('assets')}
        >
          <Text style={[styles.subTabText, activeSubTab === 'assets' && styles.activeSubTabText]}>
            🎨 내가 공유한 에셋 ({profile?.recent_assets?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {activeSubTab === 'devlogs' ? (
        profile?.recent_devlogs && profile.recent_devlogs.length > 0 ? (
          <FlatList
            data={profile.recent_devlogs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => onDevLogClick(item.id)}>
                <NeumorphView radius={12} style={styles.postItem}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.postTitle}>{item.title}</Text>
                      <Text style={styles.postMeta}>
                        ❤️ {item.likes} • 💬 {item.comment_count ?? 0} • {new Date(item.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteMiniBtn}
                      onPress={(e: any) => {
                        e?.stopPropagation?.();
                        handleDeleteDevLog(item.id);
                      }}
                    >
                      <Text style={styles.deleteMiniText}>🗑️ 삭제</Text>
                    </TouchableOpacity>
                  </View>
                </NeumorphView>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>아직 작성한 개발일지가 없습니다.</Text>
          </View>
        )
      ) : (
        profile?.recent_assets && profile.recent_assets.length > 0 ? (
          <FlatList
            data={profile.recent_assets}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NeumorphView radius={12} style={styles.postItem}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.postTitle}>[{item.category}] {item.title}</Text>
                    <Text style={styles.postMeta}>
                      ❤️ {item.likes} • {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteMiniBtn}
                    onPress={() => handleDeleteAsset(item.id)}
                  >
                    <Text style={styles.deleteMiniText}>🗑️ 삭제</Text>
                  </TouchableOpacity>
                </View>
              </NeumorphView>
            )}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>아직 공유한 에셋이 없습니다.</Text>
          </View>
        )
      )}

      {/* Logout Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={editProfileVisible} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: Theme.colors.background, borderRadius: 20, padding: 22 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: Theme.colors.text, marginBottom: 12 }}>
              👤 개발자 프로필 & 포트폴리오 설정
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: Theme.colors.textLight, marginBottom: 6 }}>주력 게임 엔진</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {['Unity', 'Unreal', 'Godot', 'Custom'].map((eng) => (
                <TouchableOpacity
                  key={eng}
                  onPress={() => setEngineInput(eng)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 12,
                    backgroundColor: engineInput === eng ? Theme.colors.primary : Theme.colors.pillBg,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: engineInput === eng ? '#FFF' : Theme.colors.text }}>{eng}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={{ backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 10, fontSize: 14 }}
              placeholder="한줄 자기소개 (예: 2D 로그라이크 1인 개발자입니다)"
              value={bioInput}
              onChangeText={setBioInput}
            />
            <TextInput
              style={{ backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 10, fontSize: 14 }}
              placeholder="GitHub 주소 (https://github.com/...)"
              value={githubInput}
              onChangeText={setGithubInput}
              autoCapitalize="none"
            />
            <TextInput
              style={{ backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 10, fontSize: 14 }}
              placeholder="Steam 상점 페이지 주소 (https://store.steampowered.com/...)"
              value={steamInput}
              onChangeText={setSteamInput}
              autoCapitalize="none"
            />
            <TextInput
              style={{ backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 14, fontSize: 14 }}
              placeholder="Itch.io 주소 (https://...itch.io)"
              value={itchInput}
              onChangeText={setItchInput}
              autoCapitalize="none"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity onPress={() => setEditProfileVisible(false)} style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
                <Text style={{ color: Theme.colors.textLight, fontWeight: '700' }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={savingProfile}
                onPress={async () => {
                  try {
                    setSavingProfile(true);
                    await ApiClient.updateUserProfile({
                      bio: bioInput,
                      engine: engineInput,
                      github_url: githubInput,
                      steam_url: steamInput,
                      itch_url: itchInput,
                    });
                    setEditProfileVisible(false);
                    fetchProfile();
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setSavingProfile(false);
                  }
                }}
                style={{ backgroundColor: Theme.colors.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 }}
              >
                <Text style={{ color: '#FFF', fontWeight: '700' }}>{savingProfile ? '저장 중...' : '저장'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.background },
  header: { alignItems: 'center', paddingTop: 24, paddingBottom: 12 },
  avatar: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: Theme.colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10
  },
  avatarText: { color: '#FFF', fontSize: 30, fontWeight: '800' },
  usernameText: { fontSize: 22, fontWeight: '800', color: Theme.colors.text, marginBottom: 4 },
  subText: { fontSize: 13, color: Theme.colors.textLight, fontWeight: '600' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, marginVertical: 12, gap: 12 },
  statCard: { flex: 1, padding: 14, alignItems: 'center', justifyContent: 'center' },
  statNumber: { fontSize: 18, fontWeight: '800', color: Theme.colors.primary, marginBottom: 4 },
  statLabel: { fontSize: 12, color: Theme.colors.textLight, fontWeight: '600' },
  subTabsRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 14, gap: 10 },
  subTabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: Theme.colors.pillBg, alignItems: 'center' },
  activeSubTabBtn: { backgroundColor: Theme.colors.primary },
  subTabText: { fontSize: 13, fontWeight: '700', color: Theme.colors.textLight },
  activeSubTabText: { color: '#FFFFFF' },
  postItem: { padding: 14, marginBottom: 12 },
  postTitle: { fontSize: 15, fontWeight: '700', color: Theme.colors.text, marginBottom: 4 },
  postMeta: { fontSize: 12, color: Theme.colors.textLight, fontWeight: '600' },
  deleteMiniBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  deleteMiniText: { fontSize: 12, fontWeight: '700', color: '#DC2626' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, color: Theme.colors.textLight, fontWeight: '600' },
  footer: { padding: 20 },
  logoutButton: { backgroundColor: '#FF4D4F', padding: 14, borderRadius: 14, alignItems: 'center' },
  logoutText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
