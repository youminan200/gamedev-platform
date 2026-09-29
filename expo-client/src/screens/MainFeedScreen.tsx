import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
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

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getDevLogs();
      setLogs(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={logs}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <DevLogCard devLog={item} onClick={() => onDevLogClick(item.id)} />
        )}
        contentContainerStyle={styles.listContent}
        onRefresh={fetchLogs}
        refreshing={loading}
      />
      
      <TouchableOpacity activeOpacity={0.8} style={styles.fabContainer} onPress={onPostClick}>
        <NeumorphView radius={28} style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </NeumorphView>
      </TouchableOpacity>
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
  errorText: {
    color: Theme.colors.error,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Make room for FAB
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fab: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: {
    fontSize: 28,
    color: Theme.colors.primary,
    fontWeight: '300',
  }
});
