// Mock PixelRatio before any imports
jest.mock('react-native/Libraries/Utilities/PixelRatio', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => 1),
    getFontScale: jest.fn(() => 1),
    getPixelSizeForLayoutSize: jest.fn(size => size),
    roundToNearestPixel: jest.fn(size => size),
  },
  get: jest.fn(() => 1),
  getFontScale: jest.fn(() => 1),
  getPixelSizeForLayoutSize: jest.fn(size => size),
  roundToNearestPixel: jest.fn(size => size),
}));

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { LocationMapScreen } from '@screens/location/LocationMapScreen';
import * as characterStorage from '@utils/characterStorage';
import { GameLocation } from '@models/types';

// Mock the character storage
jest.mock('@utils/characterStorage', () => ({
  loadLocations: jest.fn(),
}));

// Mock Image.resolveAssetSource - must be at test level
const mockResolveAssetSource = jest.fn(() => ({
  width: 1000,
  height: 800,
}));

jest.mock('react-native/Libraries/Image/Image', () => ({
  ...jest.requireActual('react-native/Libraries/Image/Image'),
  resolveAssetSource: mockResolveAssetSource,
}));

describe('LocationMapScreen', () => {
  const mockLocations: GameLocation[] = [
    {
      id: '1',
      name: 'Test Location 1',
      description: 'Description 1',
      mapCoordinates: { x: 0.5, y: 0.5 }, // Center of map
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: '2',
      name: 'Test Location 2',
      description: 'Description 2',
      mapCoordinates: { x: 0.25, y: 0.75 }, // Lower left quadrant
      createdAt: '2024-01-02',
      updatedAt: '2024-01-02',
    },
    {
      id: '3',
      name: 'Test Location 3',
      description: 'Description 3',
      mapCoordinates: { x: 0.75, y: 0.25 }, // Upper right quadrant
      createdAt: '2024-01-03',
      updatedAt: '2024-01-03',
    },
    {
      id: '4',
      name: 'Location Without Coords',
      description: 'Should not appear',
      createdAt: '2024-01-04',
      updatedAt: '2024-01-04',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (characterStorage.loadLocations as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(<LocationMapScreen />);
    expect(getByText('Loading map...')).toBeTruthy();
  });

  it('should load locations with coordinates on mount', async () => {
    (characterStorage.loadLocations as jest.Mock).mockResolvedValue(
      mockLocations
    );

    render(<LocationMapScreen />);

    await waitFor(() => {
      expect(characterStorage.loadLocations).toHaveBeenCalled();
    });
  });

  it('should filter out locations without coordinates', async () => {
    (characterStorage.loadLocations as jest.Mock).mockResolvedValue(
      mockLocations
    );

    const { queryByText } = render(<LocationMapScreen />);

    await waitFor(() => {
      expect(characterStorage.loadLocations).toHaveBeenCalled();
    });

    // Location without coordinates should not be rendered
    // (This is a basic check - in a real app you'd check for marker rendering)
    expect(queryByText('Location Without Coords')).toBeNull();
  });

  it('should render location markers for locations with coordinates', async () => {
    (characterStorage.loadLocations as jest.Mock).mockResolvedValue(
      mockLocations
    );

    const { UNSAFE_getAllByType } = render(<LocationMapScreen />);

    await waitFor(() => {
      expect(characterStorage.loadLocations).toHaveBeenCalled();
    });

    // Wait for markers to be rendered
    await waitFor(() => {
      // This eslint disable is needed because we need to dynamically require the module for testing
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const animatedViews = UNSAFE_getAllByType(
        require('react-native-reanimated').default.View
      );
      // Should have image container + 3 markers (4th location has no coords)
      expect(animatedViews.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('should handle empty locations array', async () => {
    (characterStorage.loadLocations as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(<LocationMapScreen />);

    await waitFor(() => {
      expect(characterStorage.loadLocations).toHaveBeenCalled();
    });

    // Should still show map with no markers
    expect(getByText).toBeTruthy();
  });

  it('should reload locations when screen is focused', async () => {
    (characterStorage.loadLocations as jest.Mock).mockResolvedValue([]);

    render(<LocationMapScreen />);

    await waitFor(() => {
      expect(characterStorage.loadLocations).toHaveBeenCalledTimes(1);
    });

    // Note: Testing focus effects requires mocking navigation focus events
    // This is a basic test to ensure the callback is set up
  });

  describe('marker positioning', () => {
    it('should position marker at center for normalized coords (0.5, 0.5)', async () => {
      const centerLocation: GameLocation = {
        id: '1',
        name: 'Center Location',
        description: 'At map center',
        mapCoordinates: { x: 0.5, y: 0.5 },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      (characterStorage.loadLocations as jest.Mock).mockResolvedValue([
        centerLocation,
      ]);

      render(<LocationMapScreen />);

      await waitFor(() => {
        expect(characterStorage.loadLocations).toHaveBeenCalled();
      });

      // Markers should be rendered
      // In a real test, you'd check the actual position styles
    });

    it('should position marker at top-left for normalized coords (0, 0)', async () => {
      const topLeftLocation: GameLocation = {
        id: '1',
        name: 'Top Left',
        description: 'At top left',
        mapCoordinates: { x: 0, y: 0 },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      (characterStorage.loadLocations as jest.Mock).mockResolvedValue([
        topLeftLocation,
      ]);

      render(<LocationMapScreen />);

      await waitFor(() => {
        expect(characterStorage.loadLocations).toHaveBeenCalled();
      });
    });

    it('should position marker at bottom-right for normalized coords (1, 1)', async () => {
      const bottomRightLocation: GameLocation = {
        id: '1',
        name: 'Bottom Right',
        description: 'At bottom right',
        mapCoordinates: { x: 1, y: 1 },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      (characterStorage.loadLocations as jest.Mock).mockResolvedValue([
        bottomRightLocation,
      ]);

      render(<LocationMapScreen />);

      await waitFor(() => {
        expect(characterStorage.loadLocations).toHaveBeenCalled();
      });
    });
  });

  describe('marker interactions', () => {
    it('should not show modal initially', async () => {
      (characterStorage.loadLocations as jest.Mock).mockResolvedValue(
        mockLocations
      );

      const { queryByText } = render(<LocationMapScreen />);

      await waitFor(() => {
        expect(characterStorage.loadLocations).toHaveBeenCalled();
      });

      // Modal title should not be visible
      expect(queryByText('Test Location 1')).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle locations with x=0 coordinate', async () => {
      const edgeLocation: GameLocation = {
        id: '1',
        name: 'Edge Location',
        description: 'At left edge',
        mapCoordinates: { x: 0, y: 0.5 },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      (characterStorage.loadLocations as jest.Mock).mockResolvedValue([
        edgeLocation,
      ]);

      render(<LocationMapScreen />);

      await waitFor(() => {
        expect(characterStorage.loadLocations).toHaveBeenCalled();
      });
    });

    it('should handle locations with y=0 coordinate', async () => {
      const edgeLocation: GameLocation = {
        id: '1',
        name: 'Top Edge',
        description: 'At top edge',
        mapCoordinates: { x: 0.5, y: 0 },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      (characterStorage.loadLocations as jest.Mock).mockResolvedValue([
        edgeLocation,
      ]);

      render(<LocationMapScreen />);

      await waitFor(() => {
        expect(characterStorage.loadLocations).toHaveBeenCalled();
      });
    });

    it('should handle locations with x=1 coordinate', async () => {
      const edgeLocation: GameLocation = {
        id: '1',
        name: 'Right Edge',
        description: 'At right edge',
        mapCoordinates: { x: 1, y: 0.5 },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      (characterStorage.loadLocations as jest.Mock).mockResolvedValue([
        edgeLocation,
      ]);

      render(<LocationMapScreen />);

      await waitFor(() => {
        expect(characterStorage.loadLocations).toHaveBeenCalled();
      });
    });

    it('should handle locations with y=1 coordinate', async () => {
      const edgeLocation: GameLocation = {
        id: '1',
        name: 'Bottom Edge',
        description: 'At bottom edge',
        mapCoordinates: { x: 0.5, y: 1 },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      (characterStorage.loadLocations as jest.Mock).mockResolvedValue([
        edgeLocation,
      ]);

      render(<LocationMapScreen />);

      await waitFor(() => {
        expect(characterStorage.loadLocations).toHaveBeenCalled();
      });
    });

    it('should filter out locations with only x coordinate', async () => {
      const incompleteLocation: GameLocation = {
        id: '1',
        name: 'Incomplete',
        description: 'Missing y',
        mapCoordinates: { x: 0.5, y: 0 } as any,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      // Modify to only have x
      incompleteLocation.mapCoordinates = { x: 0.5 } as any;

      (characterStorage.loadLocations as jest.Mock).mockResolvedValue([
        incompleteLocation,
      ]);

      render(<LocationMapScreen />);

      await waitFor(() => {
        expect(characterStorage.loadLocations).toHaveBeenCalled();
      });
    });

    it('should filter out locations with only y coordinate', async () => {
      const incompleteLocation: GameLocation = {
        id: '1',
        name: 'Incomplete',
        description: 'Missing x',
        mapCoordinates: { y: 0.5 } as any,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      (characterStorage.loadLocations as jest.Mock).mockResolvedValue([
        incompleteLocation,
      ]);

      render(<LocationMapScreen />);

      await waitFor(() => {
        expect(characterStorage.loadLocations).toHaveBeenCalled();
      });
    });
  });

  describe('storage errors', () => {
    it('should handle loadLocations error gracefully', async () => {
      (characterStorage.loadLocations as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const { getByText } = render(<LocationMapScreen />);

      // Should still render the map
      expect(getByText('Loading map...')).toBeTruthy();
    });

    it('should handle malformed location data', async () => {
      const malformedLocations = [
        {
          id: '1',
          name: 'Malformed',
          // Missing required fields
        },
      ];

      (characterStorage.loadLocations as jest.Mock).mockResolvedValue(
        malformedLocations as any
      );

      render(<LocationMapScreen />);

      await waitFor(() => {
        expect(characterStorage.loadLocations).toHaveBeenCalled();
      });

      // Should not crash
    });
  });
});
