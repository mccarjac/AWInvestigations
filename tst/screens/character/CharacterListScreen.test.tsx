import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { CharacterListScreen } from '@screens/character/CharacterListScreen';
import * as characterStorage from '@utils/characterStorage';

// Mock the character storage module
jest.mock('@utils/characterStorage', () => ({
  loadCharacters: jest.fn(),
  toggleCharacterPresent: jest.fn(),
  resetAllPresentStatus: jest.fn(),
}));

describe('CharacterListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', async () => {
    (characterStorage.loadCharacters as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(<CharacterListScreen />);

    await waitFor(() => {
      expect(getByText('No characters found')).toBeTruthy();
    });
  });

  it('should load characters on mount', async () => {
    const mockCharacters = [
      {
        id: '1',
        name: 'Test Character',
        species: 'Human',
        factionId: 'faction1',
        stats: {},
        skills: {},
      },
    ];

    (characterStorage.loadCharacters as jest.Mock).mockResolvedValue(
      mockCharacters
    );

    render(<CharacterListScreen />);

    await waitFor(() => {
      expect(characterStorage.loadCharacters).toHaveBeenCalled();
    });
  });

  it('should display search input', async () => {
    (characterStorage.loadCharacters as jest.Mock).mockResolvedValue([]);

    const { getByPlaceholderText } = render(<CharacterListScreen />);

    await waitFor(() => {
      expect(getByPlaceholderText('Search characters by name...')).toBeTruthy();
    });
  });
});
