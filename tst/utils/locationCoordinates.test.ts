import { GameLocation } from '@models/types';

describe('Location Coordinates', () => {
  const NOTI_OREGON = {
    latitude: 42.936,
    longitude: -122.079,
    latitudeDelta: 5,
    longitudeDelta: 5,
  };

  describe('Coordinate normalization', () => {
    it('should normalize coordinates within bounds', () => {
      // Center of the map should be (0.5, 0.5)
      const centerLat = NOTI_OREGON.latitude;
      const centerLng = NOTI_OREGON.longitude;

      const normalizedX =
        (centerLng - (NOTI_OREGON.longitude - NOTI_OREGON.longitudeDelta)) /
        (NOTI_OREGON.longitudeDelta * 2);
      const normalizedY =
        (centerLat - (NOTI_OREGON.latitude - NOTI_OREGON.latitudeDelta)) /
        (NOTI_OREGON.latitudeDelta * 2);

      expect(normalizedX).toBeCloseTo(0.5, 5);
      expect(normalizedY).toBeCloseTo(0.5, 5);
    });

    it('should convert normalized coordinates back to absolute', () => {
      const testLocation: GameLocation = {
        id: 'test-1',
        name: 'Test Location',
        description: 'Test',
        mapCoordinates: {
          x: 0.5,
          y: 0.5,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Convert back to absolute coordinates
      const absoluteLat =
        NOTI_OREGON.latitude +
        (testLocation.mapCoordinates!.y - 0.5) * NOTI_OREGON.latitudeDelta * 2;
      const absoluteLng =
        NOTI_OREGON.longitude +
        (testLocation.mapCoordinates!.x - 0.5) * NOTI_OREGON.longitudeDelta * 2;

      // Center point should match NOTI_OREGON
      expect(absoluteLat).toBeCloseTo(NOTI_OREGON.latitude, 5);
      expect(absoluteLng).toBeCloseTo(NOTI_OREGON.longitude, 5);
    });

    it('should handle edge coordinates', () => {
      // Top-left corner (0, 0)
      const topLeftLat =
        NOTI_OREGON.latitude + (0 - 0.5) * NOTI_OREGON.latitudeDelta * 2;
      const topLeftLng =
        NOTI_OREGON.longitude + (0 - 0.5) * NOTI_OREGON.longitudeDelta * 2;

      expect(topLeftLat).toBeCloseTo(
        NOTI_OREGON.latitude - NOTI_OREGON.latitudeDelta,
        5
      );
      expect(topLeftLng).toBeCloseTo(
        NOTI_OREGON.longitude - NOTI_OREGON.longitudeDelta,
        5
      );

      // Bottom-right corner (1, 1)
      const bottomRightLat =
        NOTI_OREGON.latitude + (1 - 0.5) * NOTI_OREGON.latitudeDelta * 2;
      const bottomRightLng =
        NOTI_OREGON.longitude + (1 - 0.5) * NOTI_OREGON.longitudeDelta * 2;

      expect(bottomRightLat).toBeCloseTo(
        NOTI_OREGON.latitude + NOTI_OREGON.latitudeDelta,
        5
      );
      expect(bottomRightLng).toBeCloseTo(
        NOTI_OREGON.longitude + NOTI_OREGON.longitudeDelta,
        5
      );
    });

    it('should clamp coordinates to 0-1 range', () => {
      const clamp = (value: number) => Math.max(0, Math.min(1, value));

      expect(clamp(-0.5)).toBe(0);
      expect(clamp(1.5)).toBe(1);
      expect(clamp(0.5)).toBe(0.5);
    });
  });

  describe('Location with coordinates', () => {
    it('should create a location with valid coordinates', () => {
      const location: GameLocation = {
        id: 'test-1',
        name: 'Noti',
        description: 'A small town in Oregon',
        mapCoordinates: {
          x: 0.5,
          y: 0.5,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(location.mapCoordinates).toBeDefined();
      if (location.mapCoordinates) {
        expect(location.mapCoordinates.x).toBeGreaterThanOrEqual(0);
        expect(location.mapCoordinates.x).toBeLessThanOrEqual(1);
        expect(location.mapCoordinates.y).toBeGreaterThanOrEqual(0);
        expect(location.mapCoordinates.y).toBeLessThanOrEqual(1);
      }
    });

    it('should allow location without coordinates', () => {
      const location: GameLocation = {
        id: 'test-2',
        name: 'Unknown Place',
        description: 'Location without coordinates',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(location.mapCoordinates).toBeUndefined();
    });
  });
});
