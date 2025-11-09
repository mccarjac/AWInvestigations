import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { GameCharacter, GameLocation } from '@models/types';
import { loadCharacters, loadLocations } from '@utils/characterStorage';
import {
  useNavigation,
  useFocusEffect,
  CompositeNavigationProp,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootStackParamList, RootDrawerParamList } from '@/navigation/types';
import { commonStyles } from '@/styles/commonStyles';
import { BaseListScreen, HeaderAddButton } from '@/components';

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

  const handleLocationSelect = (locationInfo: LocationInfo) => {
    navigation.navigate('LocationDetails', {
      locationId: locationInfo.location.id,
    });
  };

  const handleCreateLocation = () => {
    navigation.navigate('LocationForm', {});
  };

  const handleViewMap = () => {
    navigation.navigate('LocationMap');
  };

  const renderLocationItem = (item: LocationInfo) => (
    <View style={styles.locationCard}>
      <TouchableOpacity
        style={styles.locationContent}
        onPress={() => handleLocationSelect(item)}
      >
        <View style={styles.locationTextContent}>
          <View style={styles.locationHeader}>
            <Text style={styles.locationName}>{item.location.name}</Text>
            <View style={styles.locationCounts}>
              <Text style={styles.countText}>
                {item.totalCount} character{item.totalCount !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.presentText}>
                {item.presentCount} present
              </Text>
            </View>
          </View>

          {item.location.description && (
            <Text style={styles.locationDescription} numberOfLines={2}>
              {item.location.description}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderHeaderRight = () => (
    <View style={styles.headerButtons}>
      <TouchableOpacity style={styles.headerMapButton} onPress={handleViewMap}>
        <Text style={styles.headerMapButtonText}>🗺️</Text>
      </TouchableOpacity>
      <HeaderAddButton onPress={handleCreateLocation} />
    </View>
  );

  return (
    <BaseListScreen
      data={filteredLocations}
      renderItem={renderLocationItem}
      keyExtractor={(item: LocationInfo) => item.location.id}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search locations by name..."
      emptyStateTitle="No locations found"
      emptyStateSubtitle="Create a location to get started"
      headerRight={renderHeaderRight()}
    />
  );
};

const styles = StyleSheet.create({
  locationCard: commonStyles.card.base,
  locationContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  locationTextContent: {
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
    lineHeight: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerMapButton: {
    ...commonStyles.headerButton.add,
    marginRight: 4,
  },
  headerMapButtonText: {
    ...commonStyles.headerButton.addText,
    fontSize: 20,
  },
});
