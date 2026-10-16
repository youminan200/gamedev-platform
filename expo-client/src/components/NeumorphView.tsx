import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Theme } from '../theme';

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
    backgroundColor,
    ...outerStyle
  } = flatStyle;

  const surfaceColor = backgroundColor || Theme.colors.surface;

  const innerContentStyle: ViewStyle = {
    borderRadius: radius,
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
        styles.outerShadow,
        {
          borderRadius: radius,
          shadowColor: Theme.colors.shadowDark,
          backgroundColor: surfaceColor,
        },
        outerStyle,
      ]}
    >
      <View
        style={[
          styles.innerShadow,
          {
            borderRadius: radius,
            shadowColor: Theme.colors.shadowLight,
            backgroundColor: surfaceColor,
          },
        ]}
      >
        <View style={[styles.content, innerContentStyle]}>
          {children}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerShadow: {
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  innerShadow: {
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
  },
  content: {
    overflow: 'hidden',
  },
});
