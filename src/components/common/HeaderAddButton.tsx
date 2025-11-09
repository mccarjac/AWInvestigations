import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { commonStyles } from '@/styles/commonStyles';

interface HeaderAddButtonProps {
  onPress: () => void;
  label?: string;
}

export const HeaderAddButton: React.FC<HeaderAddButtonProps> = ({
  onPress,
  label = '+',
}) => {
  return (
    <TouchableOpacity style={styles.headerAddButton} onPress={onPress}>
      <Text style={styles.headerAddButtonText}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  headerAddButton: commonStyles.headerButton.add,
  headerAddButtonText: commonStyles.headerButton.addText,
});
