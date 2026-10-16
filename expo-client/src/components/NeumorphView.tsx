import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
}

export const NeumorphView: React.FC<Props> = ({ children, style, radius = 16 }) => {
  const flatStyle = (StyleSheet.flatten(style) || {}) as any;
  const {
    padding,
    paddingHorizontal,
    paddingVertical,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
    alignItems,
    justifyContent,
    flexDirection,
    gap,
    ...outerStyle
  } = flatStyle;

  const innerContentStyle: ViewStyle = {
    borderRadius: radius,
    ...(padding !== undefined ? { padding } : {}),
    ...(paddingHorizontal !== undefined ? { paddingHorizontal } : {}),
    ...(paddingVertical !== undefined ? { paddingVertical } : {}),
    ...(paddingTop !== undefined ? { paddingTop } : {}),
    ...(paddingBottom !== undefined ? { paddingBottom } : {}),
    ...(paddingLeft !== undefined ? { paddingLeft } : {}),
    ...(paddingRight !== undefined ? { paddingRight } : {}),
    ...(alignItems !== undefined ? { alignItems } : {}),
    ...(justifyContent !== undefined ? { justifyContent } : {}),
    ...(flexDirection !== undefined ? { flexDirection } : {}),
    ...(gap !== undefined ? { gap } : {}),
  };

  return (
    <View style={[styles.outerShadow, { borderRadius: radius }, outerStyle]}>
      <View style={[styles.innerShadow, { borderRadius: radius }]}>
        <View style={[styles.content, innerContentStyle]}>
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
