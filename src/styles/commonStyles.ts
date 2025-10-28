/**
 * Common reusable styles for the Game Character Manager app
 * These styles use the centralized theme and provide consistent UI patterns
 */

import { StyleSheet } from 'react-native';
import { theme, colors, typography, spacing, borderRadius, shadows } from './theme';

// Layout and container styles
export const layoutStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  
  scrollView: {
    backgroundColor: colors.primary,
  },
  
  contentContainer: {
    padding: spacing.base,
    paddingBottom: 100,
  },
  
  section: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
  },
  
  sectionDanger: {
    borderColor: colors.accent.danger,
    borderWidth: 2,
  },
  
  formSection: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  footerPadding: {
    height: spacing.huge,
  },
});

// Typography styles
export const textStyles = StyleSheet.create({
  // Headers
  h1: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.wide,
  },
  
  h2: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.normal,
  },
  
  h3: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.normal,
  },
  
  // Labels and body text
  label: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.tight,
  },
  
  body: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.base,
  },
  
  bodyLarge: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.relaxed,
  },
  
  description: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.base,
  },
  
  caption: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
  },
  
  // Special text styles
  muted: {
    color: colors.text.muted,
  },
  
  accent: {
    color: colors.accent.primary,
  },
  
  success: {
    color: colors.status.success,
  },
  
  warning: {
    color: colors.status.warning,
  },
  
  danger: {
    color: colors.accent.danger,
  },
});

// Card styles
export const cardStyles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
  },
  
  present: {
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.status.present,
    borderColor: colors.status.present,
    shadowColor: colors.status.present,
  },
  
  elevated: {
    backgroundColor: colors.elevated,
    borderColor: colors.border,
  },
  
  clickable: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.accent.primary,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  
  content: {
    flex: 1,
  },
});

// Button styles
export const buttonStyles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...shadows.small,
  },
  
  large: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    borderRadius: borderRadius.md,
  },
  
  small: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  
  // Button variants
  primary: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  
  secondary: {
    backgroundColor: colors.accent.secondary,
    borderColor: colors.accent.secondary,
  },
  
  success: {
    backgroundColor: colors.accent.success,
    borderColor: colors.accent.success,
  },
  
  warning: {
    backgroundColor: colors.accent.warning,
    borderColor: colors.accent.warning,
  },
  
  danger: {
    backgroundColor: colors.accent.danger,
    borderColor: colors.accent.danger,
  },
  
  info: {
    backgroundColor: colors.accent.info,
    borderColor: colors.accent.info,
  },
  
  outline: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  
  outlineActive: {
    backgroundColor: colors.accent.success,
    borderColor: colors.accent.success,
  },
  
  // Special purpose buttons
  add: {
    backgroundColor: colors.accent.success,
    borderColor: colors.accent.success,
  },
  
  remove: {
    backgroundColor: colors.accent.danger,
    borderColor: colors.accent.danger,
  },
  
  // Button text
  text: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.wide,
  },
  
  textSmall: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.wide,
  },
});

// Input field styles
export const inputStyles = StyleSheet.create({
  base: {
    backgroundColor: colors.elevated,
    padding: spacing.base,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  multiline: {
    height: 120,
    textAlignVertical: 'top',
  },
  
  picker: {
    backgroundColor: colors.elevated,
    height: 50,
    borderRadius: borderRadius.sm,
    color: colors.text.primary,
  },
});

// Header button styles (for navigation headers)
export const headerButtonStyles = StyleSheet.create({
  add: {
    marginRight: spacing.base,
    width: 32,
    height: 32,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.accent.success,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  
  edit: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    marginRight: spacing.md,
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.sm,
    ...shadows.small,
  },
  
  text: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: typography.letterSpacing.normal,
  },
  
  addText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: 24,
  },
});

// Badge styles (for tags, standings, etc.)
export const badgeStyles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  small: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  
  // Status badges
  present: {
    backgroundColor: colors.status.present,
  },
  
  absent: {
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  // Standing badges
  allied: {
    backgroundColor: colors.standing.allied,
  },
  
  friendly: {
    backgroundColor: colors.standing.friendly,
  },
  
  neutral: {
    backgroundColor: colors.standing.neutral,
  },
  
  hostile: {
    backgroundColor: colors.standing.hostile,
  },
  
  enemy: {
    backgroundColor: colors.standing.enemy,
  },
  
  // Tag badges
  tag: {
    backgroundColor: colors.interactive.hover,
    borderWidth: 1,
    borderColor: colors.accent.primary,
  },
  
  species: {
    backgroundColor: 'rgba(116, 185, 255, 0.15)',
    borderWidth: 1,
    borderColor: colors.status.info,
  },
  
  retired: {
    backgroundColor: colors.status.warning,
    borderWidth: 1,
    borderColor: colors.status.warning,
  },
  
  // Badge text
  text: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.tight,
  },
  
  textMuted: {
    color: colors.text.muted,
  },
  
  textDark: {
    color: colors.primary,
  },
});

// Search bar styles
export const searchStyles = StyleSheet.create({
  container: {
    position: 'relative',
    margin: spacing.base,
    marginBottom: spacing.sm,
  },
  
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    ...shadows.small,
  },
  
  clearButton: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    transform: [{ translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: borderRadius.md,
    backgroundColor: colors.text.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  clearText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
});

// Image styles
export const imageStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginHorizontal: spacing.base,
    marginTop: spacing.base,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  character: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
  },
  
  characterLarge: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: spacing.base,
    borderWidth: 2,
    borderColor: colors.border,
  },
  
  placeholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.base,
    borderWidth: 2,
    borderColor: colors.border,
  },
  
  pickerButton: {
    backgroundColor: colors.accent.primary,
    padding: spacing.base,
    borderRadius: borderRadius.md,
    width: 200,
    ...shadows.small,
  },
});

// Status indicator styles
export const statusStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    backgroundColor: colors.interactive.hover,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.accent.primary,
  },
  
  item: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    flex: 1,
    fontWeight: typography.fontWeight.medium,
  },
  
  value: {
    fontWeight: typography.fontWeight.bold,
    color: colors.accent.primary,
  },
});

// Export all styles as a single object for convenience
export const commonStyles = {
  layout: layoutStyles,
  text: textStyles,
  card: cardStyles,
  button: buttonStyles,
  input: inputStyles,
  headerButton: headerButtonStyles,
  badge: badgeStyles,
  search: searchStyles,
  image: imageStyles,
  status: statusStyles,
};