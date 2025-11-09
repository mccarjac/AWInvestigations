import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { commonStyles } from '@/styles/commonStyles';

interface CardProps {
  children: React.ReactNode;
  present?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  present = false,
  style,
  contentStyle,
}) => {
  return (
    <View style={[styles.card, present && styles.cardPresent, style]}>
      <View style={contentStyle}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: commonStyles.card.base,
  cardPresent: commonStyles.card.present,
});
