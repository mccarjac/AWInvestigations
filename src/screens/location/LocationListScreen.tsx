import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Text,
} from 'react-native';
import { GameCharacter, GameLocation } from '@models/types';
import {
  loadCharacters,
  loadLocations,
  deleteLocationCompletely,
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

type LocationNavigationProp = CompositeNavigationProp<
  DrawerNavigationProp<RootDrawerParamList, 'Locations'>,
  StackNavigationProp<RootStackParamList>
>;

interface LocationInfo {
  location: GameLocation;
  characters: GameCharacter[];
  totalCount: number;
  presentCount: number;
}

export const LocationListScreen: React.FC = () => {
  const [locationInfos, setLocationInfos] = useState<LocationInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const navigation = useNavigation<LocationNavigationProp>();

  const loadData = useCallback(async () => {
    const characters = await loadCharacters();
    const locations = await loadLocations();

    // Create location info map
    const locationMap = new Map<string, LocationInfo>();

    // Initialize all locations
    locations.forEach(location => {
      locationMap.set(location.id, {
        location,
        characters: [],
        totalCount: 0,
        presentCount: 0,
      });
    });

    // Count characters at each location
    characters.forEach(character => {
      if (character.locationId) {
        const locationInfo = locationMap.get(character.locationId);
        if (locationInfo) {
          locationInfo.characters.push(character);
          locationInfo.totalCount++;
          if (character.present) {
            locationInfo.presentCount++;
          }
        }
      }
    });

    // Convert to array and sort alphabetically
    const locationInfosArray = Array.from(locationMap.values()).sort((a, b) =>
      a.location.name.localeCompare(b.location.name)
    );

    setLocationInfos(locationInfosArray);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const getFilteredLocations = useCallback(() => {
    let filtered = locationInfos;

    // Filter by search query if provided
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        locationInfo =>
          locationInfo.location.name.toLowerCase().includes(query) ||
          (locationInfo.location.description &&
            locationInfo.location.description.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [locationInfos, searchQuery]);

  const filteredLocations = React.useMemo(
    () => getFilteredLocations(),
    [getFilteredLocations]
  );

  // Set up the header with a plus button
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerAddButton}
          onPress={handleCreateLocation}
        >
          <Text style={styles.headerAddButtonText}>+</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleLocationSelect = (locationInfo: LocationInfo) => {
    navigation.navigate('LocationDetails', {
      locationId: locationInfo.location.id,
    });
  };

  const handleCreateLocation = () => {
    navigation.navigate('LocationForm');
  };

  const handleDeleteLocation = async (
    locationId: string,
    locationName: string
  ) => {
    Alert.alert(
      'Delete Location',
      `Are you sure you want to delete "${locationName}"? This will remove it from all characters and cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteLocationCompletely(locationId);

              if (result.success) {
                // Refresh the location list
                await loadData();

                // Show success message
                const message =
                  result.charactersUpdated > 0
                    ? `Location "${locationName}" deleted successfully. Removed from ${result.charactersUpdated} character(s).`
                    : `Location "${locationName}" deleted successfully.`;

                Alert.alert('Success', message, [{ text: 'OK' }]);
              } else {
                Alert.alert(
                  'Error',
                  'Failed to delete location. Please try again.',
                  [{ text: 'OK' }]
                );
              }
            } catch {
              Alert.alert(
                'Error',
                'An unexpected error occurred while deleting the location.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const renderLocationItem = ({ item }: { item: LocationInfo }) => (
    <View style={styles.locationCard}>
      <TouchableOpacity
        style={styles.locationContent}
        onPress={() => handleLocationSelect(item)}
      >
        <View style={styles.locationHeader}>
          <Text style={styles.locationName}>{item.location.name}</Text>
          <View style={styles.locationCounts}>
            <Text style={styles.countText}>
              {item.totalCount} character{item.totalCount !== 1 ? 's' : ''}
            </Text>
            <Text style={styles.presentText}>{item.presentCount} present</Text>
          </View>
        </View>

        {item.location.description && (
          <Text style={styles.locationDescription} numberOfLines={2}>
            {item.location.description}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() =>
          handleDeleteLocation(item.location.id, item.location.name)
        }
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search locations by name..."
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
        data={filteredLocations}
        renderItem={renderLocationItem}
        keyExtractor={item => item.location.id}
        style={styles.locationList}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No locations found</Text>
            <Text style={styles.emptySubText}>
              Create a location to get started
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: commonStyles.layout.container,
  contentContainer: commonStyles.layout.contentContainer,
  locationList: {
    flex: 1,
  },
  locationCard: commonStyles.card.base,
  locationContent: {
    flex: 1,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  locationName: {
    ...commonStyles.text.h3,
    flex: 1,
  },
  locationCounts: {
    alignItems: 'flex-end',
  },
  countText: {
    ...commonStyles.text.body,
    fontWeight: '500',
  },
  presentText: commonStyles.text.caption,
  locationDescription: {
    ...commonStyles.text.body,
    color: themeColors.text.secondary,
    lineHeight: 20,
  },
  headerAddButton: commonStyles.headerButton.add,
  headerAddButtonText: commonStyles.headerButton.addText,
  deleteButton: {
    ...commonStyles.button.small,
    ...commonStyles.button.danger,
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  deleteText: commonStyles.button.textSmall,
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
  },
});
