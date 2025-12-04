import React, { ReactNode, useLayoutEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  ScrollViewProps,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { commonStyles } from '@/styles/commonStyles';
import { HeaderEditButton } from '@/components/common/HeaderEditButton';
import { HeaderDeleteButton } from '@/components/common/HeaderDeleteButton';

export interface BaseDetailScreenProps {
  children: ReactNode;
  contentContainerStyle?: ViewStyle;
  scrollViewProps?: Partial<ScrollViewProps>;
  headerRight?: ReactNode;
  onEditPress?: () => void;
  deleteConfig?: {
    itemName: string;
    onDelete: () => Promise<void>;
    confirmTitle?: string;
    confirmMessage?: string;
  };
}

export function BaseDetailScreen({
  children,
  contentContainerStyle,
  scrollViewProps = {},
  headerRight,
  onEditPress,
  deleteConfig,
}: BaseDetailScreenProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleDelete = useCallback(async () => {
    if (!deleteConfig) return;

    const confirmDelete = (): Promise<boolean> => {
      const title = deleteConfig.confirmTitle || 'Delete Item';
      const message =
        deleteConfig.confirmMessage ||
        `Are you sure you want to delete ${deleteConfig.itemName}? This action cannot be undone.`;

      if (Platform.OS === 'web') {
        return Promise.resolve(window.confirm(message));
      } else {
        return new Promise<boolean>(resolve => {
          Alert.alert(title, message, [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(false),
            },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => resolve(true),
            },
          ]);
        });
      }
    };

    const shouldDelete = await confirmDelete();
    if (shouldDelete) {
      await deleteConfig.onDelete();
      navigation.goBack();
    }
  }, [deleteConfig, navigation]);

  // Set up the header with the provided headerRight component, or edit/delete buttons
  useLayoutEffect(() => {
    if (headerRight) {
      navigation.setOptions({
        headerRight: () => (
          <View style={headerStyles.rightContainer}>{headerRight}</View>
        ),
      });
    } else if (onEditPress || deleteConfig) {
      navigation.setOptions({
        headerRight: () => (
          <View style={headerStyles.rightContainer}>
            <View style={headerStyles.container}>
              {onEditPress && <HeaderEditButton onPress={onEditPress} />}
              {deleteConfig && <HeaderDeleteButton onPress={handleDelete} />}
            </View>
          </View>
        ),
      });
    }
  }, [navigation, headerRight, onEditPress, deleteConfig, handleDelete]);
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: Math.max(insets.bottom, 16) + 100 },
          contentContainerStyle,
        ]}
        showsVerticalScrollIndicator={true}
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 882,
    overflow: 'scroll',
  },
  scrollView: commonStyles.layout.scrollView,
  contentContainer: commonStyles.layout.contentContainer,
});

const headerStyles = StyleSheet.create({
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
    minWidth: 90,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
