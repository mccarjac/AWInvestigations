import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { commonStyles } from '@/styles/commonStyles';

interface HeaderStatsButtonProps {
  onPress: () => void;
  label?: string;
}

export const HeaderStatsButton: React.FC<HeaderStatsButtonProps> = ({
  onPress,
  label = '%',
}) => {
  return (
    <TouchableOpacity style={styles.headerStatsButton} onPress={onPress}>
      <Text style={styles.headerStatsButtonText}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  headerStatsButton: commonStyles.headerButton.add,
  headerStatsButtonText: commonStyles.headerButton.addText,
});
