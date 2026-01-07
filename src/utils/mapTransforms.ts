/**
 * Utility functions for map coordinate transformations and boundary constraints
 */

/**
 * Convert normalized coordinates (0-1) to screen pixel coordinates
 * @param normalized - Normalized coordinate value (0-1)
 * @param imageSize - Image dimension (width or height in pixels)
 * @returns Pixel coordinate relative to image top-left
 */
export const normalizedToPixels = (
  normalized: number,
  imageSize: number
): number => {
  return normalized * imageSize;
};

/**
 * Apply zoom and pan transformations to a coordinate
 * @param pixelCoord - Coordinate in pixels relative to image
 * @param imageSize - Image dimension (width or height in pixels)
 * @param screenSize - Screen dimension (width or height in pixels)
 * @param scale - Current zoom scale
 * @param translate - Current pan translation
 * @returns Transformed coordinate on screen
 */
export const applyTransform = (
  pixelCoord: number,
  imageSize: number,
  screenSize: number,
  scale: number,
  translate: number
): number => {
  // Center the image on screen
  const imageOffset = (screenSize - imageSize) / 2;

  // Apply scale from image center
  const imageCenterOffset = imageSize / 2;
  const scaledCoord =
    (pixelCoord - imageCenterOffset) * scale + imageCenterOffset;

  // Apply translation and add screen centering offset
  return scaledCoord + translate + imageOffset;
};

/**
 * Calculate pan boundaries to prevent panning off the map
 * @param imageSize - Image dimension (width or height in pixels)
 * @param screenSize - Screen dimension (width or height in pixels)
 * @param scale - Current zoom scale
 * @returns Object with min and max translation values
 */
export const calculatePanBoundaries = (
  imageSize: number,
  screenSize: number,
  scale: number
): { min: number; max: number } => {
  // When zoomed out (scale = 1), image should be centered with no panning
  if (scale <= 1) {
    return { min: 0, max: 0 };
  }

  // Calculate how much the image extends beyond the screen when scaled
  const scaledImageSize = imageSize * scale;
  const excess = scaledImageSize - imageSize;

  // Maximum translation is half the excess (can pan to show edges)
  const maxTranslate = excess / 2;

  // Add a small buffer to account for the screen centering
  const centerOffset = (screenSize - imageSize) / 2;
  const buffer = Math.max(0, centerOffset);

  return {
    min: -maxTranslate - buffer,
    max: maxTranslate + buffer,
  };
};

/**
 * Constrain translation value within boundaries
 * @param translate - Current translation value
 * @param boundaries - Min and max boundaries
 * @returns Constrained translation value
 */
export const constrainTranslation = (
  translate: number,
  boundaries: { min: number; max: number }
): number => {
  return Math.max(boundaries.min, Math.min(boundaries.max, translate));
};

/**
 * Transform normalized map coordinates to screen coordinates
 * @param normalizedX - Normalized X coordinate (0-1)
 * @param normalizedY - Normalized Y coordinate (0-1)
 * @param imageWidth - Map image width in pixels
 * @param imageHeight - Map image height in pixels
 * @param screenWidth - Screen width in pixels
 * @param screenHeight - Screen height in pixels
 * @param scale - Current zoom scale
 * @param translateX - Current X translation
 * @param translateY - Current Y translation
 * @returns Object with screen X and Y coordinates
 */
export const transformMapCoordinatesToScreen = (
  normalizedX: number,
  normalizedY: number,
  imageWidth: number,
  imageHeight: number,
  screenWidth: number,
  screenHeight: number,
  scale: number,
  translateX: number,
  translateY: number
): { x: number; y: number } => {
  // Convert normalized coordinates to pixel coordinates on the image
  const pixelX = normalizedToPixels(normalizedX, imageWidth);
  const pixelY = normalizedToPixels(normalizedY, imageHeight);

  // Apply transformations to get screen coordinates
  const screenX = applyTransform(
    pixelX,
    imageWidth,
    screenWidth,
    scale,
    translateX
  );
  const screenY = applyTransform(
    pixelY,
    imageHeight,
    screenHeight,
    scale,
    translateY
  );

  return { x: screenX, y: screenY };
};
