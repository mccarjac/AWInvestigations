import { calculateDerivedStats } from '../derivedStats';
import { GameCharacter } from '@/models/types';
import { PerkTag } from '@/models/gameData';

describe('derivedStats', () => {
  describe('calculateDerivedStats', () => {
    it('should calculate base stats for human with no perks', () => {
      const character: GameCharacter = {
        id: '1',
        name: 'Test Human',
        species: 'Human',
        perkIds: [],
        distinctionIds: [],
        factions: [],
        relationships: [],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      };

      const stats = calculateDerivedStats(character);

      // Human base: health 2, limit 2
      expect(stats.maxHealth).toBe(2);
      expect(stats.maxLimit).toBe(2);
      expect(stats.tagScores).toBeDefined();
    });

    it('should calculate base stats for mutant with no perks', () => {
      const character: GameCharacter = {
        id: '2',
        name: 'Test Mutant',
        species: 'Mutant',
        perkIds: [],
        distinctionIds: [],
        factions: [],
        relationships: [],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      };

      const stats = calculateDerivedStats(character);

      // Mutant base: health 2, limit 1
      expect(stats.maxHealth).toBe(2);
      expect(stats.maxLimit).toBe(1);
    });

    it('should calculate stats for Rad-Titan', () => {
      const character: GameCharacter = {
        id: '3',
        name: 'Test Rad-Titan',
        species: 'Rad-Titan',
        perkIds: [],
        distinctionIds: [],
        factions: [],
        relationships: [],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      };

      const stats = calculateDerivedStats(character);

      // Rad-Titan base: health 3, limit 0
      expect(stats.maxHealth).toBe(3);
      expect(stats.maxLimit).toBe(0);
    });

    it('should calculate stats for Unturned', () => {
      const character: GameCharacter = {
        id: '4',
        name: 'Test Unturned',
        species: 'Unturned',
        perkIds: [],
        distinctionIds: [],
        factions: [],
        relationships: [],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      };

      const stats = calculateDerivedStats(character);

      // Unturned base: health 0, limit 3
      expect(stats.maxHealth).toBe(0);
      expect(stats.maxLimit).toBe(3);
    });

    it('should respect species health caps', () => {
      const character: GameCharacter = {
        id: '5',
        name: 'Test Human',
        species: 'Human',
        perkIds: [],
        distinctionIds: [],
        factions: [],
        relationships: [],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        cyberware: [
          {
            name: 'Super Health Cyberware',
            description: 'Adds lots of health',
            statModifiers: {
              healthModifier: 100, // Way over cap
            },
          },
        ],
      };

      const stats = calculateDerivedStats(character);

      // Human health cap is 5
      expect(stats.maxHealth).toBeLessThanOrEqual(5);
    });

    it('should respect species limit caps', () => {
      const character: GameCharacter = {
        id: '6',
        name: 'Test Human',
        species: 'Human',
        perkIds: [],
        distinctionIds: [],
        factions: [],
        relationships: [],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        cyberware: [
          {
            name: 'Super Limit Cyberware',
            description: 'Adds lots of limit',
            statModifiers: {
              limitModifier: 100, // Way over cap
            },
          },
        ],
      };

      const stats = calculateDerivedStats(character);

      // Human limit cap is 5
      expect(stats.maxLimit).toBeLessThanOrEqual(5);
    });

    it('should apply cyberware health modifiers', () => {
      const character: GameCharacter = {
        id: '7',
        name: 'Test Cyborg',
        species: 'Cyborg',
        perkIds: [],
        distinctionIds: [],
        factions: [],
        relationships: [],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        cyberware: [
          {
            name: 'Health Boost',
            description: 'Adds 1 health',
            statModifiers: {
              healthModifier: 1,
            },
          },
        ],
      };

      const stats = calculateDerivedStats(character);

      // Cyborg base health 2 + 1 from cyberware = 3
      expect(stats.maxHealth).toBe(3);
    });

    it('should apply cyberware limit modifiers', () => {
      const character: GameCharacter = {
        id: '8',
        name: 'Test Cyborg',
        species: 'Cyborg',
        perkIds: [],
        distinctionIds: [],
        factions: [],
        relationships: [],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        cyberware: [
          {
            name: 'Limit Boost',
            description: 'Adds 2 limit',
            statModifiers: {
              limitModifier: 2,
            },
          },
        ],
      };

      const stats = calculateDerivedStats(character);

      // Cyborg base limit 1 + 2 from cyberware = 3
      expect(stats.maxLimit).toBe(3);
    });

    it('should apply multiple cyberware modifiers', () => {
      const character: GameCharacter = {
        id: '9',
        name: 'Test Cyborg',
        species: 'Cyborg',
        perkIds: [],
        distinctionIds: [],
        factions: [],
        relationships: [],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        cyberware: [
          {
            name: 'Health Boost',
            description: 'Adds 1 health',
            statModifiers: {
              healthModifier: 1,
            },
          },
          {
            name: 'Limit Boost',
            description: 'Adds 1 limit',
            statModifiers: {
              limitModifier: 1,
            },
          },
        ],
      };

      const stats = calculateDerivedStats(character);

      // Cyborg base: health 2 + 1, limit 1 + 1
      expect(stats.maxHealth).toBe(3);
      expect(stats.maxLimit).toBe(2);
    });

    it('should apply cyberware health cap modifiers', () => {
      const character: GameCharacter = {
        id: '10',
        name: 'Test Human',
        species: 'Human',
        perkIds: [],
        distinctionIds: [],
        factions: [],
        relationships: [],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        cyberware: [
          {
            name: 'Cap Increase',
            description: 'Increases health cap',
            statModifiers: {
              healthModifier: 10, // Lots of health
              healthCapModifier: 10, // But also increase the cap
            },
          },
        ],
      };

      const stats = calculateDerivedStats(character);

      // Human base health cap is 5, + 10 = 15
      // Health should be 2 + 10 = 12, capped at 15
      expect(stats.maxHealth).toBe(12);
    });

    it('should apply cyberware tag modifiers to tag scores', () => {
      const character: GameCharacter = {
        id: '11',
        name: 'Test Character',
        species: 'Human',
        perkIds: [],
        distinctionIds: [],
        factions: [],
        relationships: [],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        cyberware: [
          {
            name: 'Agility Boost',
            description: 'Adds to agility',
            statModifiers: {
              tagModifiers: {
                [PerkTag.Agility]: 2,
              },
            },
          },
        ],
      };

      const stats = calculateDerivedStats(character);

      expect(stats.tagScores).toBeDefined();
      expect(stats.tagScores?.get(PerkTag.Agility)).toBe(2);
    });

    it('should handle character with no cyberware', () => {
      const character: GameCharacter = {
        id: '12',
        name: 'Test Character',
        species: 'Human',
        perkIds: [],
        distinctionIds: [],
        factions: [],
        relationships: [],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        cyberware: undefined,
      };

      const stats = calculateDerivedStats(character);

      expect(stats.maxHealth).toBe(2);
      expect(stats.maxLimit).toBe(2);
    });

    it('should handle character with empty cyberware array', () => {
      const character: GameCharacter = {
        id: '13',
        name: 'Test Character',
        species: 'Human',
        perkIds: [],
        distinctionIds: [],
        factions: [],
        relationships: [],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        cyberware: [],
      };

      const stats = calculateDerivedStats(character);

      expect(stats.maxHealth).toBe(2);
      expect(stats.maxLimit).toBe(2);
    });
  });
});
