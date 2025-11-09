import React from 'react';
import { View, Text, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '@/styles/theme';

export interface ProgressModalProps {
  visible: boolean;
  progress: number; // 0-100
  message: string;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
  visible,
  progress,
  message,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.message}>{message}</Text>

          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, Math.max(0, progress))}%` },
              ]}
            />
          </View>

          {/* Progress percentage */}
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
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
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
    ...shadows.large,
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginTop: spacing.base,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: colors.elevated,
    borderRadius: borderRadius.base,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.base,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
});
