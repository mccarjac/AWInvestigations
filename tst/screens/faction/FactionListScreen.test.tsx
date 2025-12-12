import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { FactionListScreen } from '@screens/faction/FactionListScreen';
import * as characterStorage from '@utils/characterStorage';

// Mock the character storage module
jest.mock('@utils/characterStorage', () => ({
  loadFactions: jest.fn(),
  loadCharacters: jest.fn(),
  migrateFactionDescriptions: jest.fn(),
  getFactionDescription: jest.fn(),
}));

describe('FactionListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', async () => {
    (characterStorage.loadFactions as jest.Mock).mockResolvedValue([]);
    (characterStorage.loadCharacters as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(<FactionListScreen />);

    await waitFor(() => {
      expect(getByText('No factions found')).toBeTruthy();
    });
  });

  it('should load factions on mount', async () => {
    const mockFactions = [
      {
        id: '1',
        name: 'Test Faction',
        members: [],
      },
    ];

    (characterStorage.loadFactions as jest.Mock).mockResolvedValue(
      mockFactions
    );
    (characterStorage.loadCharacters as jest.Mock).mockResolvedValue([]);

    render(<FactionListScreen />);

    await waitFor(() => {
      expect(characterStorage.loadFactions).toHaveBeenCalled();
    });
  });

  it('should display search input', async () => {
    (characterStorage.loadFactions as jest.Mock).mockResolvedValue([]);
    (characterStorage.loadCharacters as jest.Mock).mockResolvedValue([]);

    const { getByPlaceholderText } = render(<FactionListScreen />);

    await waitFor(() => {
      expect(getByPlaceholderText('Search factions by name...')).toBeTruthy();
    });
  });
});
