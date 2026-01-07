import React, { useState, useCallback } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import { colors as themeColors } from '@/styles/theme';
import { commonStyles } from '@/styles/commonStyles';
import { GameLocation } from '@models/types';
import { loadLocations } from '@utils/characterStorage';
import {
  transformMapCoordinatesToScreen,
  calculatePanBoundaries,
  constrainTranslation,
} from '@utils/mapTransforms';
import mapImage from '../../../assets/JunktownMap.png';

type LocationMapNavigationProp = StackNavigationProp<RootStackParamList>;

export const LocationMapScreen: React.FC = () => {
  const navigation = useNavigation<LocationMapNavigationProp>();
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
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

  // Load locations with coordinates
  const loadLocationsData = useCallback(async () => {
    const allLocations = await loadLocations();
    const locationsWithCoords = allLocations.filter(
      loc => loc.mapCoordinates && loc.mapCoordinates.x && loc.mapCoordinates.y
    );
    setLocations(locationsWithCoords);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLocationsData();
    }, [loadLocationsData])
  );

  // Get the actual image and screen dimensions
  React.useEffect(() => {
    const { width: screenWidth, height: screenHeight } =
      Dimensions.get('window');
    setScreenSize({ width: screenWidth, height: screenHeight });

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

  // Constrain translation to keep image within bounds
  const constrainPan = (newScale: number) => {
    'worklet';
    const xBoundaries = calculatePanBoundaries(
      imageSize.width,
      screenSize.width,
      newScale
    );
    const yBoundaries = calculatePanBoundaries(
      imageSize.height,
      screenSize.height,
      newScale
    );

    translateX.value = constrainTranslation(translateX.value, xBoundaries);
    translateY.value = constrainTranslation(translateY.value, yBoundaries);
    savedTranslateX.value = translateX.value;
    savedTranslateY.value = translateY.value;
  };

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
      // Constrain pan after zoom
      constrainPan(scale.value);
    });

  const panGesture = Gesture.Pan()
    .onUpdate(e => {
      const xBoundaries = calculatePanBoundaries(
        imageSize.width,
        screenSize.width,
        scale.value
      );
      const yBoundaries = calculatePanBoundaries(
        imageSize.height,
        screenSize.height,
        scale.value
      );

      translateX.value = constrainTranslation(
        savedTranslateX.value + e.translationX,
        xBoundaries
      );
      translateY.value = constrainTranslation(
        savedTranslateY.value + e.translationY,
        yBoundaries
      );
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
        runOnJS(constrainPan)(2);
      }
    });

  const composedGesture = Gesture.Simultaneous(
    doubleTap,
    Gesture.Simultaneous(pinchGesture, panGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Calculate marker positions
  const getMarkerPosition = (location: GameLocation) => {
    if (!location.mapCoordinates) return null;

    return transformMapCoordinatesToScreen(
      location.mapCoordinates.x,
      location.mapCoordinates.y,
      imageSize.width,
      imageSize.height,
      screenSize.width,
      screenSize.height,
      scale.value,
      translateX.value,
      translateY.value
    );
  };

  const renderMarker = (location: GameLocation) => {
    const position = getMarkerPosition(location);
    if (!position) return null;

    return (
      <Animated.View
        key={location.id}
        style={[
          styles.marker,
          {
            left: position.x,
            top: position.y,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.markerButton}
          onPress={() => setSelectedLocation(location)}
        >
          <View style={styles.markerPin} />
          <View style={styles.markerDot} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const handleLocationPress = (location: GameLocation) => {
    setSelectedLocation(null);
    navigation.navigate('LocationDetails', { locationId: location.id });
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
              {/* Render location markers */}
              {locations.map(renderMarker)}
            </>
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading map...</Text>
            </View>
          )}
        </Animated.View>
      </GestureDetector>

      {/* Location info modal */}
      <Modal
        visible={selectedLocation !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedLocation(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedLocation(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedLocation?.name || ''}
            </Text>
            {selectedLocation?.description && (
              <Text style={styles.modalDescription} numberOfLines={3}>
                {selectedLocation.description}
              </Text>
            )}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() =>
                selectedLocation && handleLocationPress(selectedLocation)
              }
            >
              <Text style={styles.modalButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  marker: {
    position: 'absolute',
    width: 40,
    height: 40,
    marginLeft: -20, // Center the marker on the point
    marginTop: -40, // Position pin point at the coordinate
    zIndex: 1000,
  },
  markerButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  markerPin: {
    width: 0,
    height: 0,
    backgroundColor: themeColors.transparent || 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 20,
    borderLeftColor: themeColors.transparent || 'transparent',
    borderRightColor: themeColors.transparent || 'transparent',
    borderTopColor: themeColors.accent,
    marginBottom: -2,
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: themeColors.accent,
    borderWidth: 2,
    borderColor: themeColors.text.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: themeColors.overlay || 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  modalTitle: {
    ...commonStyles.text.h2,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    ...commonStyles.text.body,
    color: themeColors.text.secondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: themeColors.accent,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    ...commonStyles.text.body,
    color: themeColors.text.primary,
    fontWeight: '600',
  },
});
