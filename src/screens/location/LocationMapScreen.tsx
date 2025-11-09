import React, { useState, useCallback } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { GameLocation } from '@models/types';
import { loadLocations, updateLocation } from '@utils/characterStorage';
import { colors as themeColors } from '@/styles/theme';
import { commonStyles } from '@/styles/commonStyles';
import mapImage from '../../../assets/JunktownMap.png';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const LocationMapScreen: React.FC = () => {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [locations, setLocations] = useState<GameLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<GameLocation | null>(
    null
  );

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Load locations when screen is focused
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const loadedLocations = await loadLocations();
        setLocations(loadedLocations);
      };
      loadData();
    }, [])
  );

  // Get the actual image dimensions
  React.useEffect(() => {
    // For local assets, we can use Image.resolveAssetSource
    const source = Image.resolveAssetSource(mapImage);
    if (source) {
      const { width, height } = source;
      // Scale the image to fit within the screen while maintaining aspect ratio
      const scaleValue = Math.min(
        (screenWidth - 32) / width, // Account for padding
        (screenHeight - 100) / height, // Account for header and padding
        1 // Don't scale up, only down
      );
      setImageSize({
        width: width * scaleValue,
        height: height * scaleValue,
      });
    }
  }, []);

  const pinchGesture = Gesture.Pinch()
    .onUpdate(e => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      // Constrain scale between 1 and 3
      if (scale.value < 1) {
        scale.value = withTiming(1);
      } else if (scale.value > 3) {
        scale.value = withTiming(3);
      }
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate(e => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        // Zoom out
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        // Zoom in to 2x
        scale.value = withTiming(2);
        savedScale.value = 2;
      }
    });

  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(e => {
      // Only handle tap if there's a selected location
      if (!selectedLocation || imageSize.width === 0) return;

      // Convert screen coordinates to normalized coordinates (0-1)
      // Account for the current scale and translation of the map
      const centerX = screenWidth / 2;
      const centerY = screenHeight / 2;

      // Adjust for map translation and scale
      const mapCenterX = centerX + translateX.value;
      const mapCenterY = centerY + translateY.value;

      // Position relative to image center
      const relativeX = (e.x - mapCenterX) / scale.value;
      const relativeY = (e.y - mapCenterY) / scale.value;

      // Convert to normalized coordinates (0-1) relative to image size
      const normalizedX = 0.5 + relativeX / imageSize.width;
      const normalizedY = 0.5 + relativeY / imageSize.height;

      // Clamp to valid range
      const clampedX = Math.max(0, Math.min(1, normalizedX));
      const clampedY = Math.max(0, Math.min(1, normalizedY));

      // Update the location with new coordinates
      handleUpdateLocationCoordinates(clampedX, clampedY);
    });

  const composedGesture = Gesture.Exclusive(
    doubleTap,
    singleTap,
    Gesture.Simultaneous(pinchGesture, panGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleUpdateLocationCoordinates = async (x: number, y: number) => {
    if (!selectedLocation) return;

    try {
      await updateLocation(selectedLocation.id, {
        ...selectedLocation,
        mapCoordinates: { x, y },
      });

      // Reload locations to reflect the update
      const updatedLocations = await loadLocations();
      setLocations(updatedLocations);

      Alert.alert(
        'Success',
        `Pin placed for ${selectedLocation.name} at coordinates (${(x * 100).toFixed(1)}%, ${(y * 100).toFixed(1)}%)`,
        [{ text: 'OK' }]
      );
    } catch {
      Alert.alert('Error', 'Failed to update location coordinates', [
        { text: 'OK' },
      ]);
    }
  };

  const renderLocationPicker = () => {
    if (locations.length === 0) {
      return (
        <View style={styles.locationPickerContainer}>
          <Text style={styles.pickerText}>
            No locations found. Create a location first.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.locationPickerContainer}>
        <Text style={styles.pickerLabel}>Select location to place pin:</Text>
        <View style={styles.locationButtonsContainer}>
          {locations.map(location => (
            <TouchableOpacity
              key={location.id}
              style={[
                styles.locationButton,
                selectedLocation?.id === location.id &&
                  styles.locationButtonSelected,
              ]}
              onPress={() => setSelectedLocation(location)}
            >
              <Text
                style={[
                  styles.locationButtonText,
                  selectedLocation?.id === location.id &&
                    styles.locationButtonTextSelected,
                ]}
              >
                {location.name}
                {location.mapCoordinates && ' ✓'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderPins = () => {
    if (!imageSize.width) return null;

    return locations
      .filter(location => location.mapCoordinates)
      .map(location => {
        const coords = location.mapCoordinates!;

        // Convert normalized coordinates back to pixel positions
        // relative to the image center
        const pinX = (coords.x - 0.5) * imageSize.width;
        const pinY = (coords.y - 0.5) * imageSize.height;

        return (
          <Animated.View
            key={location.id}
            style={[
              styles.pin,
              animatedStyle,
              {
                left: screenWidth / 2 + pinX - 12, // Center pin (24/2)
                top: screenHeight / 2 + pinY - 24, // Position above point
              },
            ]}
          >
            <View style={styles.pinMarker}>
              <Text style={styles.pinText}>📍</Text>
            </View>
            <View style={styles.pinLabel}>
              <Text style={styles.pinLabelText} numberOfLines={1}>
                {location.name}
              </Text>
            </View>
          </Animated.View>
        );
      });
  };

  return (
    <View style={styles.container}>
      {renderLocationPicker()}
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={styles.imageContainer}>
          {imageSize.width > 0 ? (
            <>
              <Animated.Image
                source={mapImage}
                style={[
                  {
                    width: imageSize.width,
                    height: imageSize.height,
                  },
                  animatedStyle,
                ]}
                resizeMode="contain"
              />
              {renderPins()}
            </>
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading map...</Text>
            </View>
          )}
        </Animated.View>
      </GestureDetector>
      {selectedLocation && (
        <View style={styles.instructionBanner}>
          <Text style={styles.instructionText}>
            Tap on map to place pin for {selectedLocation.name}
          </Text>
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
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...commonStyles.text.body,
    color: themeColors.text.secondary,
  },
  locationPickerContainer: {
    backgroundColor: themeColors.secondary,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  pickerLabel: {
    ...commonStyles.text.label,
    color: themeColors.text.primary,
    marginBottom: 8,
  },
  pickerText: {
    ...commonStyles.text.body,
    color: themeColors.text.secondary,
  },
  locationButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: themeColors.primary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  locationButtonSelected: {
    backgroundColor: themeColors.accent.primary,
    borderColor: themeColors.accent.primary,
  },
  locationButtonText: {
    ...commonStyles.text.body,
    color: themeColors.text.primary,
  },
  locationButtonTextSelected: {
    color: themeColors.primary,
    fontWeight: '600',
  },
  pin: {
    position: 'absolute',
    alignItems: 'center',
  },
  pinMarker: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinText: {
    fontSize: 24,
  },
  pinLabel: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: 120,
  },
  pinLabelText: {
    color: '#FFFFFF',
    fontSize: 10,
    textAlign: 'center',
  },
  instructionBanner: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  instructionText: {
    ...commonStyles.text.body,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
