import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { commonStyles } from '@/styles/commonStyles';

interface HeaderEditButtonProps {
  onPress: () => void;
  label?: string;
}

export const HeaderEditButton: React.FC<HeaderEditButtonProps> = ({
  onPress,
  label = 'Edit',
}) => {
  return (
    <TouchableOpacity style={styles.editButton} onPress={onPress}>
      <Text style={styles.editButtonText}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  editButton: commonStyles.headerButton.edit,
  editButtonText: commonStyles.headerButton.text,
});
