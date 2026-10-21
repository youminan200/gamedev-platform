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
    <View style={[styles.container, { backgroundColor: Theme.colors.surface, borderTopColor: Theme.colors.border }]}>
      <TouchableOpacity
        style={[
          styles.tabItem,
          currentTab === 'DevLogs' && { backgroundColor: Theme.colors.pillBg, borderColor: Theme.colors.primary, borderWidth: 1.5 }
        ]}
        onPress={() => onTabChange('DevLogs')}
      >
        <Text style={[styles.tabCode, { color: currentTab === 'DevLogs' ? Theme.colors.primary : Theme.colors.textLight }]}>
          [01 // LOGS]
        </Text>
        <Text style={[styles.tabLabel, { color: Theme.colors.text }, currentTab === 'DevLogs' && { color: Theme.colors.primary }]}>
          개발일지 & 공방
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.postButton, { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.border }]}
        onPress={onPostClick}
        activeOpacity={0.85}
      >
        <Text style={styles.postButtonIcon}>+ WRITE</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tabItem,
          currentTab === 'AssetHub' && { backgroundColor: Theme.colors.pillBg, borderColor: Theme.colors.primary, borderWidth: 1.5 }
        ]}
        onPress={() => onTabChange('AssetHub')}
      >
        <Text style={[styles.tabCode, { color: currentTab === 'AssetHub' ? Theme.colors.primary : Theme.colors.textLight }]}>
          [02 // ASSETS]
        </Text>
        <Text style={[styles.tabLabel, { color: Theme.colors.text }, currentTab === 'AssetHub' && { color: Theme.colors.primary }]}>
          무료 에셋 창고
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tabItem,
          currentTab === 'Profile' && { backgroundColor: Theme.colors.pillBg, borderColor: Theme.colors.primary, borderWidth: 1.5 }
        ]}
        onPress={() => onTabChange('Profile')}
      >
        <Text style={[styles.tabCode, { color: currentTab === 'Profile' ? Theme.colors.primary : Theme.colors.textLight }]}>
          [03 // DEV_ID]
        </Text>
        <Text style={[styles.tabLabel, { color: Theme.colors.text }, currentTab === 'Profile' && { color: Theme.colors.primary }]}>
          내 스튜디오
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 62,
    borderTopWidth: 2,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    gap: 6,
  },
  tabItem: {
    flex: 1,
    height: 46,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabCode: {
    fontSize: 9.5,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  tabLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    marginTop: 1,
  },
  postButton: {
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  postButtonIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
});
