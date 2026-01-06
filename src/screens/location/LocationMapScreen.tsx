import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import { loadLocations } from '@utils/characterStorage';
import { GameLocation } from '@models/types';
import { colors as themeColors } from '@/styles/theme';
import { commonStyles } from '@/styles/commonStyles';

// Coordinates for Noti, Oregon
const NOTI_OREGON = {
  latitude: 42.936,
  longitude: -122.079,
  latitudeDelta: 5, // Shows a large area of Oregon
  longitudeDelta: 5,
};

type LocationMapNavigationProp = StackNavigationProp<
  RootStackParamList,
  'LocationMap'
>;

export const LocationMapScreen: React.FC = () => {
  const navigation = useNavigation<LocationMapNavigationProp>();
  const [locations, setLocations] = useState<GameLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<GameLocation | null>(
    null
  );

  const loadData = async () => {
    const loadedLocations = await loadLocations();
    setLocations(loadedLocations);
  };

  const handleMarkerPress = (location: GameLocation) => {
    setSelectedLocation(location);
  };

  // Reload locations when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const handleMarkerDeselect = () => {
    setSelectedLocation(null);
  };

  const handleViewLocationDetails = () => {
    if (selectedLocation) {
      navigation.navigate('LocationDetails', {
        locationId: selectedLocation.id,
      });
      setSelectedLocation(null);
    }
  };

  // Filter locations that have coordinates
  const locationsWithCoordinates = locations.filter(
    loc => loc.mapCoordinates !== undefined
  );

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={NOTI_OREGON}
        showsUserLocation={false}
        showsMyLocationButton={false}
        onPress={handleMarkerDeselect}
      >
        {locationsWithCoordinates.map(location => {
          const coords = location.mapCoordinates;
          if (!coords) return null;
          
          return (
            <Marker
              key={location.id}
              coordinate={{
                latitude:
                  NOTI_OREGON.latitude +
                  (coords.y - 0.5) * NOTI_OREGON.latitudeDelta * 2,
                longitude:
                  NOTI_OREGON.longitude +
                  (coords.x - 0.5) * NOTI_OREGON.longitudeDelta * 2,
              }}
              title={location.name}
              description={location.description}
              onPress={() => handleMarkerPress(location)}
            />
          );
        })}
      </MapView>

      {selectedLocation && (
        <View style={styles.infoCard}>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>{selectedLocation.name}</Text>
            {selectedLocation.description && (
              <Text style={styles.infoDescription} numberOfLines={2}>
                {selectedLocation.description}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={handleViewLocationDetails}
          >
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      )}

      {locationsWithCoordinates.length === 0 && (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateText}>
              No locations with map coordinates yet.
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Edit a location to add it to the map.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.primary,
  },
  map: {
    flex: 1,
  },
  infoCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...commonStyles.text.h2,
    marginBottom: 4,
  },
  infoDescription: {
    ...commonStyles.text.body,
    color: themeColors.text.secondary,
  },
  viewButton: {
    backgroundColor: themeColors.accent.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  viewButtonText: {
    ...commonStyles.text.body,
    color: themeColors.text.primary,
    fontWeight: '600',
  },
  emptyStateContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    pointerEvents: 'none',
  },
  emptyStateCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    padding: 24,
    maxWidth: 300,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  emptyStateText: {
    ...commonStyles.text.h2,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    ...commonStyles.text.body,
    color: themeColors.text.secondary,
    textAlign: 'center',
  },
});
