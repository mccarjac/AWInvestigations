import React from 'react';
import { View, Text, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { colors as themeColors } from '@/styles/theme';

export interface ProgressBarProps {
  visible: boolean;
  progress: number; // 0-100
  message?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  visible,
  progress,
  message = 'Processing...',
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={themeColors.accent.primary} />
          <Text style={styles.message}>{message}</Text>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, Math.max(0, progress))}%` },
              ]}
            />
          </View>
          <Text style={styles.percentage}>{Math.round(progress)}%</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    padding: 24,
    minWidth: 280,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.text.primary,
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: themeColors.elevated,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: themeColors.accent.primary,
    borderRadius: 4,
  },
  percentage: {
    fontSize: 14,
    color: themeColors.text.secondary,
    marginTop: 8,
    fontWeight: '500',
  },
});
