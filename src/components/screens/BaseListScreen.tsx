import React, { ReactNode, useLayoutEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Text,
  ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors as themeColors, layout } from '@/styles/theme';
import { commonStyles } from '@/styles/commonStyles';
import { HeaderAddButton } from '@/components/common/HeaderAddButton';

export interface BaseListScreenProps<T> {
  data: T[];
  renderItem: (item: T) => ReactNode;
  keyExtractor: (item: T) => string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  headerRight?: ReactNode;
  onAddPress?: () => void;
  emptyStateTitle?: string;
  emptyStateSubtitle?: string;
  contentContainerStyle?: ViewStyle;
  showSearch?: boolean;
  ListHeaderComponent?: ReactNode;
}

export function BaseListScreen<T>({
  data,
  renderItem,
  keyExtractor,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  headerRight,
  onAddPress,
  emptyStateTitle = 'No items found',
  emptyStateSubtitle,
  contentContainerStyle,
  showSearch = true,
  ListHeaderComponent,
}: BaseListScreenProps<T>) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Set up the header with the provided headerRight component or add button
  useLayoutEffect(() => {
    if (headerRight) {
      navigation.setOptions({
        headerRight: () => <>{headerRight}</>,
      });
    } else if (onAddPress) {
      navigation.setOptions({
        headerRight: () => <HeaderAddButton onPress={onAddPress} />,
      });
    }
  }, [navigation, headerRight, onAddPress]);

  const renderListItem = ({ item }: { item: T }) => <>{renderItem(item)}</>;

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{emptyStateTitle}</Text>
      {emptyStateSubtitle && (
        <Text style={styles.emptySubText}>{emptyStateSubtitle}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {showSearch && onSearchChange && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor={themeColors.text.muted}
            value={searchQuery}
            onChangeText={onSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
            blurOnSubmit={false}
            autoFocus={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => onSearchChange('')}
            >
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        data={data}
        renderItem={renderListItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={renderEmptyState}
        ListHeaderComponent={
          ListHeaderComponent ? () => <>{ListHeaderComponent}</> : undefined
        }
        style={styles.list}
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: commonStyles.layout.container,
  list: {
    flex: 1,
  },
  contentContainer: commonStyles.layout.contentContainer,
  searchContainer: commonStyles.search.container,
  searchInput: commonStyles.search.input,
  clearSearchButton: commonStyles.search.clearButton,
  clearSearchText: commonStyles.search.clearText,
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    ...commonStyles.text.h2,
    color: themeColors.text.muted,
    marginBottom: 8,
  },
  emptySubText: {
    ...commonStyles.text.body,
    color: themeColors.text.muted,
    textAlign: 'center',
  },
});
