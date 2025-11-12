import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { commonStyles } from '@/styles/commonStyles';

interface HeaderDeleteButtonProps {
  onPress: () => void;
  label?: string;
}

export const HeaderDeleteButton: React.FC<HeaderDeleteButtonProps> = ({
  onPress,
  label = 'Delete',
}) => {
  return (
    <TouchableOpacity style={styles.deleteButton} onPress={onPress}>
      <Text style={styles.deleteButtonText}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  deleteButton: commonStyles.headerButton.delete,
  deleteButtonText: commonStyles.headerButton.text,
});
