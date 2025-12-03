/**
 * Centralized theme configuration for the Game Character Manager app
 * Contains colors, typography, spacing, and other design tokens
 */

// Modern Dark Color Palette
export const colors = {
  // Background colors
  primary: '#0F0F23', // Deep dark blue-purple (main background)
  secondary: '#1B1B3A', // Slightly lighter dark
  surface: '#262647', // Card/surface color
  elevated: '#2D2D54', // Elevated surfaces

  // Text colors
  text: {
    primary: '#FFFFFF', // Primary white text
    secondary: '#B8B8CC', // Secondary lighter text
    muted: '#8E8EA0', // Muted text
    accent: '#8A8A8A', // Accent text color
  },

  // Accent colors
  accent: {
    primary: '#6366F1', // Indigo primary
    secondary: '#8B5CF6', // Purple secondary
    success: '#10B981', // Green
    warning: '#F59E0B', // Amber
    danger: '#EF4444', // Red
    info: '#3B82F6', // Blue
  },

  // Status colors
  status: {
    success: '#00B894',
    warning: '#FDCB6E',
    error: '#E17055',
    info: '#74B9FF',
    present: '#059669', // Green for present
    absent: '#6B7280', // Gray for absent
  },

  // Standing/relationship colors
  standing: {
    allied: '#10B981', // Green
    friendly: '#3B82F6', // Blue
    neutral: '#6B7280', // Gray
    hostile: '#F59E0B', // Amber
    enemy: '#EF4444', // Red
  },

  // Certainty level colors
  certainty: {
    confirmed: '#2ECC71', // Green
    unconfirmed: '#F39C12', // Orange
    disputed: '#E74C3C', // Red
  },

  // Interactive colors
  interactive: {
    hover: 'rgba(108, 92, 231, 0.15)', // Light overlay for hover states
    pressed: 'rgba(108, 92, 231, 0.25)', // Slightly darker for pressed states
    disabled: '#404066', // Disabled state color
  },

  // Border and shadow
  border: '#3F3F65',
  borderLight: '#404066',
  shadow: '#000000',
};

// Typography scales
export const typography = {
  // Font sizes
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
  },

  // Font weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line heights
  lineHeight: {
    tight: 16,
    base: 20,
    relaxed: 22,
    loose: 24,
  },

  // Letter spacing
  letterSpacing: {
    tight: 0.2,
    normal: 0.3,
    wide: 0.5,
    wider: 1.2,
  },
};

// Spacing system (using a 4px base unit)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 50,
};

// Border radius values
export const borderRadius = {
  sm: 6,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999, // For circular elements
};

// Shadow configurations
export const shadows = {
  small: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
};

// Component-specific styling presets
export const componentStyles = {
  // Button variants
  button: {
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
  },

  // Input field styles
  input: {
    base: {
      backgroundColor: colors.elevated,
      borderColor: colors.border,
      color: colors.text.primary,
    },
    focused: {
      borderColor: colors.accent.primary,
    },
    error: {
      borderColor: colors.accent.danger,
    },
  },

  // Card styles
  card: {
    base: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    elevated: {
      backgroundColor: colors.elevated,
      borderColor: colors.border,
    },
    present: {
      borderLeftWidth: 4,
      borderLeftColor: colors.status.present,
      borderColor: colors.status.present,
    },
  },
};

// Export a default theme object
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  componentStyles,
};

export type Theme = typeof theme;
