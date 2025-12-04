import React, { ReactNode } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
  ScrollViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '@/styles/theme';
import { commonStyles } from '@/styles/commonStyles';

export interface BaseFormScreenProps {
  children: ReactNode;
  contentContainerStyle?: ViewStyle;
  scrollViewProps?: Partial<ScrollViewProps>;
  enableKeyboardAvoidance?: boolean;
}

export function BaseFormScreen({
  children,
  contentContainerStyle,
  scrollViewProps = {},
  enableKeyboardAvoidance = true,
}: BaseFormScreenProps) {
  const insets = useSafeAreaInsets();

  const content = (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingBottom:
              Math.max(insets.bottom, layout.minSafeAreaPadding) +
              layout.extraScrollSpace,
          },
          contentContainerStyle,
        ]}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    </View>
  );

  if (enableKeyboardAvoidance) {
    return (
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    height: 882,
    overflow: 'scroll',
  },
  scrollView: commonStyles.layout.scrollView,
  contentContainer: commonStyles.layout.contentContainer,
});
