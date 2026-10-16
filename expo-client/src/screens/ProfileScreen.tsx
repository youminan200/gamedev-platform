import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
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

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getUserProfile(username);
      setProfile(data);
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
        <Text style={styles.subText}>Indie Creator • Joined {profile?.user.created_at ? new Date(profile.user.created_at).toLocaleDateString() : 'Recently'}</Text>
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
  subTabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#E2E8F0', alignItems: 'center' },
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
