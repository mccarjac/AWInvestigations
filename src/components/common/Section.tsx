import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { commonStyles } from '@/styles/commonStyles';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Section: React.FC<SectionProps> = ({ title, children, style }) => {
  return (
    <View style={[styles.section, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  section: commonStyles.layout.section,
  sectionTitle: commonStyles.text.h2,
});
