import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
}

export const NeumorphView: React.FC<Props> = ({ children, style, radius = 16 }) => {
  return (
    <View style={[styles.outerShadow, { borderRadius: radius }, style]}>
      <View style={[styles.innerShadow, { borderRadius: radius }]}>
        <View style={[styles.content, { borderRadius: radius }]}>
          {children}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerShadow: {
    shadowColor: '#A3B1C6',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8, // For Android approximation
    backgroundColor: '#E0E5EC',
  },
  innerShadow: {
    shadowColor: '#FFFFFF',
    shadowOffset: { width: -6, height: -6 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    backgroundColor: '#E0E5EC',
  },
  content: {
    backgroundColor: '#E0E5EC',
    overflow: 'hidden',
  },
});
