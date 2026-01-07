import {
  normalizedToPixels,
  applyTransform,
  calculatePanBoundaries,
  constrainTranslation,
  transformMapCoordinatesToScreen,
} from '@utils/mapTransforms';

describe('mapTransforms', () => {
  describe('normalizedToPixels', () => {
    it('should convert 0 to 0', () => {
      expect(normalizedToPixels(0, 100)).toBe(0);
    });

    it('should convert 1 to image size', () => {
      expect(normalizedToPixels(1, 100)).toBe(100);
    });

    it('should convert 0.5 to middle of image', () => {
      expect(normalizedToPixels(0.5, 100)).toBe(50);
    });

    it('should handle different image sizes', () => {
      expect(normalizedToPixels(0.25, 200)).toBe(50);
      expect(normalizedToPixels(0.75, 400)).toBe(300);
    });
  });

  describe('applyTransform', () => {
    it('should return centered coordinate with no zoom or pan', () => {
      // Image size 100, screen size 200, centered at x=50
      const result = applyTransform(50, 100, 200, 1, 0);
      // imageOffset = (200 - 100) / 2 = 50
      // imageCenterOffset = 100 / 2 = 50
      // scaledCoord = (50 - 50) * 1 + 50 = 50
      // result = 50 + 0 + 50 = 100
      expect(result).toBe(100);
    });

    it('should apply zoom scale correctly', () => {
      // Zoom 2x on center point
      const result = applyTransform(50, 100, 200, 2, 0);
      // imageOffset = 50
      // imageCenterOffset = 50
      // scaledCoord = (50 - 50) * 2 + 50 = 50
      // result = 50 + 0 + 50 = 100
      expect(result).toBe(100);
    });

    it('should apply zoom to off-center point', () => {
      // Zoom 2x on point at 25
      const result = applyTransform(25, 100, 200, 2, 0);
      // imageOffset = 50
      // imageCenterOffset = 50
      // scaledCoord = (25 - 50) * 2 + 50 = -50 + 50 = 0
      // result = 0 + 0 + 50 = 50
      expect(result).toBe(50);
    });

    it('should apply translation', () => {
      const result = applyTransform(50, 100, 200, 1, 20);
      // With translate = 20
      // result = 50 + 20 + 50 = 120
      expect(result).toBe(120);
    });

    it('should apply both zoom and translation', () => {
      const result = applyTransform(75, 100, 200, 2, 10);
      // imageOffset = 50
      // imageCenterOffset = 50
      // scaledCoord = (75 - 50) * 2 + 50 = 50 + 50 = 100
      // result = 100 + 10 + 50 = 160
      expect(result).toBe(160);
    });
  });

  describe('calculatePanBoundaries', () => {
    it('should return zero boundaries when scale is 1', () => {
      const boundaries = calculatePanBoundaries(100, 200, 1);
      expect(boundaries.min).toBe(0);
      expect(boundaries.max).toBe(0);
    });

    it('should return zero boundaries when scale is less than 1', () => {
      const boundaries = calculatePanBoundaries(100, 200, 0.5);
      expect(boundaries.min).toBe(0);
      expect(boundaries.max).toBe(0);
    });

    it('should calculate boundaries for 2x zoom', () => {
      // imageSize = 100, scale = 2
      // scaledImageSize = 200
      // excess = 200 - 100 = 100
      // maxTranslate = 100 / 2 = 50
      // centerOffset = (200 - 100) / 2 = 50
      const boundaries = calculatePanBoundaries(100, 200, 2);
      expect(boundaries.min).toBe(-100); // -50 - 50
      expect(boundaries.max).toBe(100); // 50 + 50
    });

    it('should calculate boundaries for 3x zoom', () => {
      // imageSize = 100, scale = 3
      // scaledImageSize = 300
      // excess = 300 - 100 = 200
      // maxTranslate = 200 / 2 = 100
      // centerOffset = 50
      const boundaries = calculatePanBoundaries(100, 200, 3);
      expect(boundaries.min).toBe(-150); // -100 - 50
      expect(boundaries.max).toBe(150); // 100 + 50
    });

    it('should handle different image and screen sizes', () => {
      // imageSize = 400, screenSize = 300, scale = 2
      // scaledImageSize = 800
      // excess = 800 - 400 = 400
      // maxTranslate = 400 / 2 = 200
      // centerOffset = max(0, (300 - 400) / 2) = 0
      const boundaries = calculatePanBoundaries(400, 300, 2);
      expect(boundaries.min).toBe(-200);
      expect(boundaries.max).toBe(200);
    });
  });

  describe('constrainTranslation', () => {
    it('should return value within boundaries', () => {
      const result = constrainTranslation(50, { min: 0, max: 100 });
      expect(result).toBe(50);
    });

    it('should constrain to min boundary', () => {
      const result = constrainTranslation(-50, { min: 0, max: 100 });
      expect(result).toBe(0);
    });

    it('should constrain to max boundary', () => {
      const result = constrainTranslation(150, { min: 0, max: 100 });
      expect(result).toBe(100);
    });

    it('should handle negative boundaries', () => {
      const result = constrainTranslation(-150, { min: -100, max: 100 });
      expect(result).toBe(-100);
    });

    it('should return exact boundary value', () => {
      const result = constrainTranslation(100, { min: 0, max: 100 });
      expect(result).toBe(100);
    });
  });

  describe('transformMapCoordinatesToScreen', () => {
    it('should transform center point with no zoom or pan', () => {
      // Normalized (0.5, 0.5) on 100x100 image, 200x200 screen
      const result = transformMapCoordinatesToScreen(
        0.5,
        0.5,
        100,
        100,
        200,
        200,
        1,
        0,
        0
      );
      // pixelX = 50, pixelY = 50
      // Both should be centered at 100 (screen center)
      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
    });

    it('should transform top-left corner', () => {
      const result = transformMapCoordinatesToScreen(
        0,
        0,
        100,
        100,
        200,
        200,
        1,
        0,
        0
      );
      // pixelX = 0, pixelY = 0
      // imageOffset = 50
      // imageCenterOffset = 50
      // scaledCoord = (0 - 50) * 1 + 50 = 0
      // result = 0 + 0 + 50 = 50
      expect(result.x).toBe(50);
      expect(result.y).toBe(50);
    });

    it('should transform bottom-right corner', () => {
      const result = transformMapCoordinatesToScreen(
        1,
        1,
        100,
        100,
        200,
        200,
        1,
        0,
        0
      );
      // pixelX = 100, pixelY = 100
      // scaledCoord = (100 - 50) * 1 + 50 = 100
      // result = 100 + 0 + 50 = 150
      expect(result.x).toBe(150);
      expect(result.y).toBe(150);
    });

    it('should apply zoom correctly', () => {
      const result = transformMapCoordinatesToScreen(
        0.5,
        0.5,
        100,
        100,
        200,
        200,
        2,
        0,
        0
      );
      // Center point should stay centered when zoomed
      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
    });

    it('should apply pan translation', () => {
      const result = transformMapCoordinatesToScreen(
        0.5,
        0.5,
        100,
        100,
        200,
        200,
        1,
        20,
        -10
      );
      // Center point with translation
      expect(result.x).toBe(120); // 100 + 20
      expect(result.y).toBe(90); // 100 - 10
    });

    it('should handle complex transformation', () => {
      // Quarter point with 2x zoom and translation
      const result = transformMapCoordinatesToScreen(
        0.25,
        0.75,
        100,
        100,
        200,
        200,
        2,
        10,
        -5
      );
      // pixelX = 25, pixelY = 75
      // imageOffset = 50
      // imageCenterOffset = 50
      // scaledX = (25 - 50) * 2 + 50 = -50 + 50 = 0
      // resultX = 0 + 10 + 50 = 60
      // scaledY = (75 - 50) * 2 + 50 = 50 + 50 = 100
      // resultY = 100 - 5 + 50 = 145
      expect(result.x).toBe(60);
      expect(result.y).toBe(145);
    });

    it('should handle different aspect ratios', () => {
      // Wide image on tall screen
      const result = transformMapCoordinatesToScreen(
        0.5,
        0.5,
        200,
        100,
        150,
        300,
        1,
        0,
        0
      );
      // Image centered differently on each axis
      expect(result.x).toBeCloseTo(75, 1); // (150 - 200) / 2 + 100 = -25 + 100 = 75
      expect(result.y).toBeCloseTo(150, 1); // (300 - 100) / 2 + 50 = 100 + 50 = 150
    });
  });

  describe('marker positioning during user interactions', () => {
    const imageWidth = 800;
    const imageHeight = 600;
    const screenWidth = 400;
    const screenHeight = 300;

    it('should keep marker at same relative position when zooming in', () => {
      // Marker at center of map
      const normalizedX = 0.5;
      const normalizedY = 0.5;

      // At 1x zoom
      const pos1x = transformMapCoordinatesToScreen(
        normalizedX,
        normalizedY,
        imageWidth,
        imageHeight,
        screenWidth,
        screenHeight,
        1,
        0,
        0
      );

      // At 2x zoom (center should stay in place)
      const pos2x = transformMapCoordinatesToScreen(
        normalizedX,
        normalizedY,
        imageWidth,
        imageHeight,
        screenWidth,
        screenHeight,
        2,
        0,
        0
      );

      // Center point should remain centered
      expect(pos2x.x).toBeCloseTo(pos1x.x, 1);
      expect(pos2x.y).toBeCloseTo(pos1x.y, 1);
    });

    it('should move marker correctly when panning', () => {
      const normalizedX = 0.5;
      const normalizedY = 0.5;

      const posInitial = transformMapCoordinatesToScreen(
        normalizedX,
        normalizedY,
        imageWidth,
        imageHeight,
        screenWidth,
        screenHeight,
        1,
        0,
        0
      );

      const posPanned = transformMapCoordinatesToScreen(
        normalizedX,
        normalizedY,
        imageWidth,
        imageHeight,
        screenWidth,
        screenHeight,
        1,
        50,
        -30
      );

      // Marker should move by the translation amount
      expect(posPanned.x).toBe(posInitial.x + 50);
      expect(posPanned.y).toBe(posInitial.y - 30);
    });

    it('should scale marker movement when zoomed and panning', () => {
      const normalizedX = 0.75; // Off-center marker
      const normalizedY = 0.25;

      const pos1x = transformMapCoordinatesToScreen(
        normalizedX,
        normalizedY,
        imageWidth,
        imageHeight,
        screenWidth,
        screenHeight,
        1,
        0,
        0
      );

      const pos2x = transformMapCoordinatesToScreen(
        normalizedX,
        normalizedY,
        imageWidth,
        imageHeight,
        screenWidth,
        screenHeight,
        2,
        0,
        0
      );

      // When zooming, off-center points should move away from center
      // At 2x zoom, distance from center should double
      const centerX = screenWidth / 2;

      const dist1xX = Math.abs(pos1x.x - centerX);
      const dist2xX = Math.abs(pos2x.x - centerX);

      // Distance at 2x should be approximately double (accounting for image offset)
      expect(dist2xX).toBeGreaterThan(dist1xX);
    });
  });

  describe('edge cases', () => {
    it('should handle zero image size', () => {
      const result = normalizedToPixels(0.5, 0);
      expect(result).toBe(0);
    });

    it('should handle markers outside normalized range', () => {
      // Marker at 1.5 (beyond map bounds)
      const result = transformMapCoordinatesToScreen(
        1.5,
        1.5,
        100,
        100,
        200,
        200,
        1,
        0,
        0
      );
      // Should still calculate position (even if off-screen)
      expect(result.x).toBeGreaterThan(150);
      expect(result.y).toBeGreaterThan(150);
    });

    it('should handle negative normalized coordinates', () => {
      const result = transformMapCoordinatesToScreen(
        -0.5,
        -0.5,
        100,
        100,
        200,
        200,
        1,
        0,
        0
      );
      // Should calculate position (even if off-screen)
      expect(result.x).toBeLessThan(50);
      expect(result.y).toBeLessThan(50);
    });

    it('should handle very large zoom levels', () => {
      const boundaries = calculatePanBoundaries(100, 200, 10);
      expect(boundaries.min).toBeLessThan(0);
      expect(boundaries.max).toBeGreaterThan(0);
      expect(Math.abs(boundaries.min)).toBe(boundaries.max);
    });

    it('should handle fractional zoom levels', () => {
      const boundaries = calculatePanBoundaries(100, 200, 1.5);
      expect(boundaries.min).toBeLessThan(0);
      expect(boundaries.max).toBeGreaterThan(0);
    });
  });
});
