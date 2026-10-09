import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DevLog } from '../models/DevLog';
import { Theme } from '../theme';
import { NeumorphView } from './NeumorphView';

import { formatRelativeTime } from '../utils/time';

interface DevLogCardProps {
  devLog: DevLog;
  onClick: () => void;
}

export const DevLogCard: React.FC<DevLogCardProps> = ({ devLog, onClick }) => {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onClick} style={styles.cardContainer}>
      <NeumorphView radius={20} style={styles.card}>
        {/* Thumbnail Placeholder */}
        <View style={styles.thumbnail}>
          <Text style={styles.thumbnailText}>IMAGE</Text>
        </View>
        
        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{devLog.title}</Text>
          
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>By {devLog.author} • {formatRelativeTime(devLog.created_at)}</Text>
            <Text style={styles.metaText}>♥ {devLog.likes}</Text>
          </View>

          <View style={styles.tagsContainer}>
            {devLog.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </NeumorphView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 24,
    marginHorizontal: 8,
  },
  card: {
    width: '100%',
  },
  thumbnail: {
    height: 140,
    backgroundColor: '#D1D9E6',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailText: {
    color: Theme.colors.textLight,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metaText: {
    fontSize: 14,
    color: Theme.colors.textLight,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#D1D9E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: Theme.colors.accent,
    fontWeight: '600',
  }
});
