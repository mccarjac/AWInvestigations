import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { commonStyles } from '@/styles/commonStyles';
import { colors as themeColors } from '@/styles/theme';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
  defaultCollapsed?: boolean;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  style,
  defaultCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <View style={[styles.section, style]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsCollapsed(!isCollapsed)}
        activeOpacity={0.7}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.indicator}>{isCollapsed ? '▶' : '▼'}</Text>
      </TouchableOpacity>
      {!isCollapsed && <View style={styles.content}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  section: commonStyles.layout.section,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: commonStyles.text.h2,
  indicator: {
    color: themeColors.text.secondary,
    fontSize: 14,
    marginLeft: 8,
  },
  content: {
    marginTop: 8,
  },
});
