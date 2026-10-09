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

      {/* Recent DevLogs Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My DevLogs</Text>
      </View>

      {profile?.recent_devlogs && profile.recent_devlogs.length > 0 ? (
        <FlatList
          data={profile.recent_devlogs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => onDevLogClick(item.id)}>
              <NeumorphView radius={12} style={styles.postItem}>
                <Text style={styles.postTitle}>{item.title}</Text>
                <Text style={styles.postMeta}>❤️ {item.likes} • {new Date(item.created_at).toLocaleDateString()}</Text>
              </NeumorphView>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No DevLogs posted yet.</Text>
        </View>
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
  header: { alignItems: 'center', paddingTop: 32, paddingBottom: 16 },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Theme.colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12
  },
  avatarText: { color: '#FFF', fontSize: 32, fontWeight: '800' },
  usernameText: { fontSize: 22, fontWeight: '800', color: Theme.colors.text, marginBottom: 4 },
  subText: { fontSize: 13, color: Theme.colors.textLight, fontWeight: '600' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, marginVertical: 16, gap: 12 },
  statCard: { flex: 1, padding: 14, alignItems: 'center', justifyContent: 'center' },
  statNumber: { fontSize: 18, fontWeight: '800', color: Theme.colors.primary, marginBottom: 4 },
  statLabel: { fontSize: 12, color: Theme.colors.textLight, fontWeight: '600' },
  sectionHeader: { paddingHorizontal: 20, marginVertical: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Theme.colors.text },
  postItem: { padding: 14, marginBottom: 12 },
  postTitle: { fontSize: 15, fontWeight: '700', color: Theme.colors.text, marginBottom: 4 },
  postMeta: { fontSize: 12, color: Theme.colors.textLight, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, color: Theme.colors.textLight, fontWeight: '600' },
  footer: { padding: 20 },
  logoutButton: { backgroundColor: '#FF4D4F', padding: 14, borderRadius: 14, alignItems: 'center' },
  logoutText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
