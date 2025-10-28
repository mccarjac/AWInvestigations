import React, { useLayoutEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
  Text,
} from 'react-native';
import { GameCharacter } from '@models/types';
import {
  loadCharacters,
  deleteCharacter,
  toggleCharacterPresent,
  resetAllPresentStatus,
} from '@utils/characterStorage';
import {
  useNavigation,
  useFocusEffect,
  CompositeNavigationProp,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootStackParamList, RootDrawerParamList } from '@/navigation/types';
import { colors as themeColors } from '@/styles/theme';
import { commonStyles } from '@/styles/commonStyles';

type NavigationProp = CompositeNavigationProp<
  DrawerNavigationProp<RootDrawerParamList, 'CharacterList'>,
  StackNavigationProp<RootStackParamList>
>;

export const CharacterListScreen: React.FC = () => {
  const [characters, setCharacters] = React.useState<GameCharacter[]>([]);
  const [showOnlyPresent, setShowOnlyPresent] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const navigation = useNavigation<NavigationProp>();

  const loadData = React.useCallback(async () => {
    const data = await loadCharacters();
    setCharacters(data);
  }, []);

  // Reload characters whenever the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Set up the header with a plus button
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerAddButton}
          onPress={() => navigation.navigate('CharacterForm', {})}
        >
          <Text style={styles.headerAddButtonText}>+</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleDelete = async (id: string) => {
    await deleteCharacter(id);
    setCharacters(characters.filter(c => c.id !== id));
  };

  const handleTogglePresent = async (id: string) => {
    await toggleCharacterPresent(id);
    await loadData(); // Refresh the list
  };

  const handleResetAllPresent = async () => {
    const confirmReset = () => {
      if (Platform.OS === 'web') {
        return window.confirm(
          'Are you sure you want to reset present status for all characters?'
        );
      } else {
        return new Promise<boolean>(resolve => {
          Alert.alert(
            'Reset Present Status',
            'Are you sure you want to reset present status for all characters?',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => resolve(false),
              },
              {
                text: 'Reset All',
                onPress: () => resolve(true),
              },
            ]
          );
        });
      }
    };

    const shouldReset = await confirmReset();
    if (shouldReset) {
      await resetAllPresentStatus();
      await loadData();
    }
  };

  const getFilteredCharacters = React.useCallback(() => {
    // First filter out retired characters
    let filtered = characters.filter(c => !c.retired);

    // Filter by search query if provided
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(c => c.name.toLowerCase().includes(query));
    }

    // Filter by present status if enabled
    if (showOnlyPresent) {
      filtered = filtered.filter(c => c.present === true);
    }

    // Sort alphabetically
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [characters, searchQuery, showOnlyPresent]);

  const filteredCharacters = React.useMemo(
    () => getFilteredCharacters(),
    [getFilteredCharacters]
  );

  const renderItem = React.useCallback(
    ({ item }: { item: GameCharacter }) => (
      <TouchableOpacity
        style={[styles.card, item.present && styles.cardPresent]}
        onPress={() =>
          navigation.navigate('CharacterDetail', { character: item })
        }
      >
        <View style={styles.cardHeader}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {item.name}
          </Text>
          <TouchableOpacity
            style={[
              styles.presentButton,
              item.present && styles.presentButtonActive,
            ]}
            onPress={() => handleTogglePresent(item.id)}
          >
            <Text
              style={[
                styles.presentText,
                item.present && styles.presentTextActive,
              ]}
            >
              {item.present ? 'Present' : 'Absent'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.factions}>
          {(item.factions || []).map(f => f.name).join(', ') || 'No factions'}
        </Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [navigation, handleTogglePresent, handleDelete]
  );

  const renderHeader = React.useCallback(
    () => (
      <View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              showOnlyPresent ? styles.filterButtonActive : styles.filterButton,
            ]}
            onPress={() => setShowOnlyPresent(!showOnlyPresent)}
          >
            <Text style={styles.buttonText}>
              {showOnlyPresent ? 'Show All' : 'Present Only'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.resetButton]}
            onPress={handleResetAllPresent}
          >
            <Text style={styles.buttonText}>Reset Present</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [showOnlyPresent, handleResetAllPresent]
  );

  const renderFooter = React.useCallback(
    () => <View style={styles.footerPadding} />,
    []
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          key="search-input"
          style={styles.searchInput}
          placeholder="Search characters by name..."
          placeholderTextColor={themeColors.text.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit={false}
          autoFocus={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearchButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={filteredCharacters}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        style={styles.list}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.contentContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Use common layout styles where possible
  container: commonStyles.layout.container,

  contentContainer: commonStyles.layout.contentContainer,
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    ...commonStyles.button.base,
    flex: 1,
    marginHorizontal: 4,
  },
  headerAddButton: commonStyles.headerButton.add,
  headerAddButtonText: commonStyles.headerButton.addText,

  filterButton: commonStyles.button.outline,
  filterButtonActive: commonStyles.button.outlineActive,
  resetButton: commonStyles.button.warning,
  buttonText: commonStyles.button.text,
  list: {
    flex: 1,
  },
  card: commonStyles.card.base,
  cardPresent: commonStyles.card.present,
  cardHeader: commonStyles.card.header,
  name: {
    ...commonStyles.text.h3,
    flex: 1, // Allow name to take available space but not overflow
  },

  factions: {
    ...commonStyles.text.caption,
    marginTop: 8,
    fontStyle: 'italic',
  },
  deleteButton: {
    ...commonStyles.button.small,
    ...commonStyles.button.danger,
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  deleteText: commonStyles.button.textSmall,
  presentButton: {
    ...commonStyles.badge.base,
    ...commonStyles.badge.absent,
    minWidth: 70, // Ensure consistent button width
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  presentButtonActive: commonStyles.badge.present,
  presentText: commonStyles.badge.textMuted,
  presentTextActive: commonStyles.badge.text,

  searchContainer: commonStyles.search.container,
  searchInput: commonStyles.search.input,
  clearSearchButton: commonStyles.search.clearButton,
  clearSearchText: commonStyles.search.clearText,
  footerPadding: commonStyles.layout.footerPadding,
});
