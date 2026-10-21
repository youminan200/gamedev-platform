import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Theme } from '../theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
}

export const NeumorphView: React.FC<Props> = ({ children, style, radius = 6 }) => {
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
    backgroundColor,
    ...outerStyle
  } = flatStyle;

  const surfaceColor = backgroundColor || Theme.colors.surface;
  const boxRadius = Math.min(radius, 8);

  const innerContentStyle: ViewStyle = {
    borderRadius: Math.max(0, boxRadius - 2),
    backgroundColor: surfaceColor,
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
    <View
      style={[
        styles.arcadeBox,
        {
          borderRadius: boxRadius,
          borderColor: Theme.colors.border,
          shadowColor: Theme.colors.shadowDark,
          backgroundColor: surfaceColor,
        },
        outerStyle,
      ]}
    >
      <View style={[styles.content, innerContentStyle]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  arcadeBox: {
    borderWidth: 2,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  content: {
    overflow: 'hidden',
  },
});
