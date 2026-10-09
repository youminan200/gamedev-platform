import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { DevLog } from '../models/DevLog';
import { ApiClient } from '../api/ApiClient';
import { Theme } from '../theme';
import { DevLogCard } from '../components/DevLogCard';
import { NeumorphView } from '../components/NeumorphView';

interface Props {
  onDevLogClick: (id: string) => void;
  onPostClick: () => void;
}

export const MainFeedScreen: React.FC<Props> = ({ onDevLogClick, onPostClick }) => {
  const [logs, setLogs] = useState<DevLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');

  useEffect(() => {
    fetchLogs();
  }, [searchQuery]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getDevLogs(searchQuery || undefined);
      setLogs(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const sortedLogs = [...logs].sort((a, b) => {
    if (sortBy === 'popular') {
      return (b.likes || 0) - (a.likes || 0);
    }
    return Number(b.id) - Number(a.id);
  });

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.titleRow}>
        <Text style={styles.headerTitle}>📜 DevLogs Hub</Text>
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
          <DevLogCard devLog={item} onClick={() => onDevLogClick(item.id)} />
        )}
        contentContainerStyle={styles.listContent}
        onRefresh={fetchLogs}
        refreshing={loading}
      />
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
    backgroundColor: '#E2E8F0',
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
  }
});
