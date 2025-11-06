import React, { useState, useCallback } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  SharedValue,
} from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { colors as themeColors } from '@/styles/theme';
import { commonStyles } from '@/styles/commonStyles';
import mapImage from '../../../assets/JunktownMap.png';
import { GameLocation } from '@models/types';
import { loadLocations, updateLocation } from '@utils/characterStorage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface LocationPinProps {
  location: GameLocation;
  imageSize: { width: number; height: number };
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
}

const LocationPin: React.FC<LocationPinProps> = ({
  location,
  imageSize,
  scale,
  translateX,
  translateY,
}) => {
  const { x, y } = location.mapCoordinates || { x: 0, y: 0 };

  // Convert normalized coordinates (0-1) to pixel position on the image
  const pixelX = x * imageSize.width - imageSize.width / 2;
  const pixelY = y * imageSize.height - imageSize.height / 2;

  const pinAnimatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: pixelX - 12, // Center the pin (pin is 24px wide)
    top: pixelY - 24, // Position so pin point is at the coordinate
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (!location.mapCoordinates) return null;

  return (
    <Animated.View style={pinAnimatedStyle}>
      <View style={styles.pinContainer}>
        <View style={styles.pin}>
          <Text style={styles.pinIcon}>📍</Text>
        </View>
        <View style={styles.pinLabel}>
          <Text style={styles.pinLabelText} numberOfLines={1}>
            {location.name}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

export const LocationMapScreen: React.FC = () => {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [locations, setLocations] = useState<GameLocation[]>([]);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [pendingCoordinates, setPendingCoordinates] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

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

  // Load locations when screen is focused
  const loadLocationsData = useCallback(async () => {
    const loadedLocations = await loadLocations();
    setLocations(loadedLocations);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLocationsData();
    }, [loadLocationsData])
  );

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
    .maxDuration(250)
    .onEnd(e => {
      if (imageSize.width === 0 || imageSize.height === 0) return;

      // Calculate the tap position relative to the image
      // Account for container centering
      const containerCenterX = screenWidth / 2;
      const containerCenterY = screenHeight / 2;

      // Reading SharedValue.value is safe here because gesture handlers run as worklets on UI thread
      const imageOffsetX = translateX.value;
      const imageOffsetY = translateY.value;

      // Tap position relative to container center
      const tapX = e.x - containerCenterX;
      const tapY = e.y - containerCenterY;

      // Adjust for current scale and translation to get position on original image
      const relativeX = (tapX - imageOffsetX) / scale.value;
      const relativeY = (tapY - imageOffsetY) / scale.value;

      // Convert to normalized coordinates (0-1)
      const normalizedX = (relativeX + imageSize.width / 2) / imageSize.width;
      const normalizedY = (relativeY + imageSize.height / 2) / imageSize.height;

      // Only process taps within the image bounds
      if (
        normalizedX >= 0 &&
        normalizedX <= 1 &&
        normalizedY >= 0 &&
        normalizedY <= 1
      ) {
        setPendingCoordinates({
          x: normalizedX,
          y: normalizedY,
        });
        setShowLocationPicker(true);
      }
    });

  // Compose gestures with proper priority to avoid conflicts
  // Double tap should take precedence, then allow pan/pinch and single tap simultaneously
  const composedGesture = Gesture.Race(
    doubleTap,
    Gesture.Simultaneous(pinchGesture, panGesture),
    singleTap
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleLocationSelect = async (location: GameLocation) => {
    if (!pendingCoordinates) return;

    try {
      await updateLocation(location.id, {
        mapCoordinates: pendingCoordinates,
      });

      // Reload locations to reflect the update
      await loadLocationsData();

      // Close picker and clear pending coordinates
      setShowLocationPicker(false);
      setPendingCoordinates(null);

      Alert.alert('Success', `Pin placed for "${location.name}" on the map.`, [
        { text: 'OK' },
      ]);
    } catch (error) {
      console.error('Failed to save pin location:', error);
      Alert.alert('Error', 'Failed to save pin location. Please try again.', [
        { text: 'OK' },
      ]);
    }
  };

  const handleCancelPicker = () => {
    setShowLocationPicker(false);
    setPendingCoordinates(null);
  };

  return (
    <View style={styles.container}>
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
              {locations.map(location => (
                <LocationPin
                  key={location.id}
                  location={location}
                  imageSize={imageSize}
                  scale={scale}
                  translateX={translateX}
                  translateY={translateY}
                />
              ))}
            </>
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading map...</Text>
            </View>
          )}
        </Animated.View>
      </GestureDetector>

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelPicker}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Location for Pin</Text>
            <Text style={styles.modalSubtitle}>
              Choose a location to place or move on the map
            </Text>

            {locations.length > 0 ? (
              <FlatList
                data={locations}
                keyExtractor={item => item.id}
                style={styles.locationList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.locationItem}
                    onPress={() => handleLocationSelect(item)}
                  >
                    <View style={styles.locationItemHeader}>
                      <Text style={styles.locationName}>{item.name}</Text>
                      {item.mapCoordinates && (
                        <Text style={styles.placedBadge}>Placed</Text>
                      )}
                    </View>
                    {item.description && (
                      <Text
                        style={styles.locationDescription}
                        numberOfLines={2}
                      >
                        {item.description}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No locations available. Create a location first.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelPicker}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  pinContainer: {
    alignItems: 'center',
  },
  pin: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinIcon: {
    fontSize: 24,
  },
  pinLabel: {
    backgroundColor: themeColors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 2,
    maxWidth: 120,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  pinLabelText: {
    ...commonStyles.text.caption,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: themeColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    ...commonStyles.text.h2,
    marginBottom: 8,
  },
  modalSubtitle: {
    ...commonStyles.text.body,
    color: themeColors.text.secondary,
    marginBottom: 16,
  },
  locationList: {
    maxHeight: 400,
  },
  locationItem: {
    padding: 16,
    backgroundColor: themeColors.primary,
    borderRadius: 8,
    marginBottom: 8,
  },
  locationItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationName: {
    ...commonStyles.text.h3,
    flex: 1,
  },
  placedBadge: {
    ...commonStyles.text.caption,
    color: themeColors.accent.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  locationDescription: {
    ...commonStyles.text.body,
    color: themeColors.text.secondary,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    ...commonStyles.text.body,
    color: themeColors.text.secondary,
    textAlign: 'center',
  },
  cancelButton: {
    ...commonStyles.button.primary,
    marginTop: 16,
  },
  cancelButtonText: commonStyles.button.text,
});
