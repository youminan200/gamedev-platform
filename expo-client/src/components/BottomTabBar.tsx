import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Theme } from '../theme';

export type TabType = 'DevLogs' | 'AssetHub' | 'Profile';

interface Props {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onPostClick: () => void;
}

export const BottomTabBar: React.FC<Props> = ({ currentTab, onTabChange, onPostClick }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={() => onTabChange('DevLogs')}
      >
        <Text style={styles.tabIcon}>{currentTab === 'DevLogs' ? '📜' : '📄'}</Text>
        <Text style={[styles.tabLabel, currentTab === 'DevLogs' && styles.activeTabLabel]}>
          DevLogs
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={() => onTabChange('AssetHub')}
      >
        <Text style={styles.tabIcon}>{currentTab === 'AssetHub' ? '🎨' : '🖌️'}</Text>
        <Text style={[styles.tabLabel, currentTab === 'AssetHub' && styles.activeTabLabel]}>
          Asset Hub
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.postButton} 
        onPress={onPostClick}
        activeOpacity={0.85}
      >
        <Text style={styles.postButtonIcon}>+</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={() => onTabChange('Profile')}
      >
        <Text style={styles.tabIcon}>{currentTab === 'Profile' ? '👤' : '👤'}</Text>
        <Text style={[styles.tabLabel, currentTab === 'Profile' && styles.activeTabLabel]}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: Theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textLight,
  },
  activeTabLabel: {
    color: Theme.colors.primary,
    fontWeight: '800',
  },
  postButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  postButtonIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 26,
  }
});
