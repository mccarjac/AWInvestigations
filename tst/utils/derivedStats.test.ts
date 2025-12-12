import { calculateDerivedStats } from '@/utils/derivedStats';
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
              health: 100, // Way over cap
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
              limit: 100, // Way over cap
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
              health: 1,
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
              limit: 2,
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
              health: 1,
            },
          },
          {
            name: 'Limit Boost',
            description: 'Adds 1 limit',
            statModifiers: {
              limit: 1,
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
              health: 10, // Lots of health
              healthCap: 10, // But also increase the cap
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

    describe('Perk Tag Scores and Stat Modifiers', () => {
      it('should calculate tag scores for perks without species restrictions', () => {
        const character: GameCharacter = {
          id: '14',
          name: 'Test Character',
          species: 'Human',
          perkIds: ['agility_1', 'agility_2', 'defense_1'],
          distinctionIds: [],
          factions: [],
          relationships: [],
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        };

        const stats = calculateDerivedStats(character);

        expect(stats.tagScores).toBeDefined();
        expect(stats.tagScores?.get(PerkTag.Agility)).toBe(2);
        expect(stats.tagScores?.get(PerkTag.Defense)).toBe(1);
      });

      it('should apply perk health modifiers', () => {
        const character: GameCharacter = {
          id: '15',
          name: 'Test Android',
          species: 'Android',
          perkIds: ['defense_23'], // Rugged Construction: +1 health
          distinctionIds: [],
          factions: [],
          relationships: [],
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        };

        const stats = calculateDerivedStats(character);

        // Android base health 2 + 1 from perk = 3
        expect(stats.maxHealth).toBe(3);
      });

      it('should apply perk limit modifiers', () => {
        const character: GameCharacter = {
          id: '16',
          name: 'Test Android',
          species: 'Android',
          perkIds: ['smarts_14'], // Adds +1 limit
          distinctionIds: [],
          factions: [],
          relationships: [],
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        };

        const stats = calculateDerivedStats(character);

        // Android base limit 1 + 1 from perk = 2
        expect(stats.maxLimit).toBe(2);
      });

      it('should apply both health and limit modifiers from perks', () => {
        const character: GameCharacter = {
          id: '17',
          name: 'Test Mutant',
          species: 'Mutant',
          perkIds: ['smarts_20'], // Big Brain: -1 health, +1 limit
          distinctionIds: [],
          factions: [],
          relationships: [],
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        };

        const stats = calculateDerivedStats(character);

        // Mutant base: health 2 - 1 = 1, limit 1 + 1 = 2
        expect(stats.maxHealth).toBe(1);
        expect(stats.maxLimit).toBe(2);
      });

      it('should exclude tag scores for Perfect Mutants with MUTANT_SPECIES restricted perks', () => {
        const character: GameCharacter = {
          id: '18',
          name: 'Test Perfect Mutant',
          species: 'Perfect Mutant',
          perkIds: ['agility_15', 'smarts_21'], // Both restricted to MUTANT_SPECIES
          distinctionIds: [],
          factions: [],
          relationships: [],
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        };

        const stats = calculateDerivedStats(character);

        // Perfect Mutants shouldn't get tag score bonuses from MUTANT_SPECIES restricted perks
        expect(stats.tagScores).toBeDefined();
        expect(stats.tagScores?.get(PerkTag.Agility)).toBeUndefined();
        expect(stats.tagScores?.get(PerkTag.Smarts)).toBeUndefined();
      });

      it('should include tag scores for Perfect Mutants with non-MUTANT_SPECIES restricted perks', () => {
        const character: GameCharacter = {
          id: '19',
          name: 'Test Perfect Mutant',
          species: 'Perfect Mutant',
          perkIds: ['agility_1', 'defense_1'], // Not species restricted
          distinctionIds: [],
          factions: [],
          relationships: [],
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        };

        const stats = calculateDerivedStats(character);

        // Perfect Mutants should get tag scores from unrestricted perks
        expect(stats.tagScores).toBeDefined();
        expect(stats.tagScores?.get(PerkTag.Agility)).toBe(1);
        expect(stats.tagScores?.get(PerkTag.Defense)).toBe(1);
      });

      it('should include tag scores for Perfect Mutants with species-specific non-MUTANT perks', () => {
        const character: GameCharacter = {
          id: '20',
          name: 'Test Perfect Mutant',
          species: 'Perfect Mutant',
          perkIds: ['agility_16'], // Tunnel Rat, restricted to Nomad only
          distinctionIds: [],
          factions: [],
          relationships: [],
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        };

        const stats = calculateDerivedStats(character);

        // Perfect Mutants should get tag scores from non-MUTANT_SPECIES restricted perks
        // even if they're restricted to other species
        expect(stats.tagScores).toBeDefined();
        expect(stats.tagScores?.get(PerkTag.Agility)).toBe(1);
      });

      it('should apply stat modifiers from MUTANT_SPECIES restricted perks even for Perfect Mutants', () => {
        const character: GameCharacter = {
          id: '21',
          name: 'Test Perfect Mutant',
          species: 'Perfect Mutant',
          perkIds: ['smarts_20'], // Big Brain: MUTANT_SPECIES restricted with stat modifiers
          distinctionIds: [],
          factions: [],
          relationships: [],
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        };

        const stats = calculateDerivedStats(character);

        // Perfect Mutant base: health 2, limit 1
        // Big Brain applies: -1 health, +1 limit (stat modifiers still apply)
        expect(stats.maxHealth).toBe(1);
        expect(stats.maxLimit).toBe(2);
        // But tag score should not be counted
        expect(stats.tagScores?.get(PerkTag.Smarts)).toBeUndefined();
      });

      it('should handle multiple perks of same tag', () => {
        const character: GameCharacter = {
          id: '22',
          name: 'Test Character',
          species: 'Human',
          perkIds: ['agility_1', 'agility_2', 'agility_3', 'agility_4'],
          distinctionIds: [],
          factions: [],
          relationships: [],
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        };

        const stats = calculateDerivedStats(character);

        expect(stats.tagScores).toBeDefined();
        expect(stats.tagScores?.get(PerkTag.Agility)).toBe(4);
      });

      it('should handle perks with no stat modifiers', () => {
        const character: GameCharacter = {
          id: '23',
          name: 'Test Character',
          species: 'Human',
          perkIds: ['agility_1'], // Has no stat modifiers
          distinctionIds: [],
          factions: [],
          relationships: [],
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        };

        const stats = calculateDerivedStats(character);

        // Base stats should be unchanged
        expect(stats.maxHealth).toBe(2);
        expect(stats.maxLimit).toBe(2);
        // But tag score should increment
        expect(stats.tagScores?.get(PerkTag.Agility)).toBe(1);
      });

      it('should handle mixed perks with and without stat modifiers', () => {
        const character: GameCharacter = {
          id: '24',
          name: 'Test Android',
          species: 'Android',
          perkIds: ['defense_1', 'defense_23'], // defense_1 no modifiers, defense_23 has +1 health
          distinctionIds: [],
          factions: [],
          relationships: [],
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        };

        const stats = calculateDerivedStats(character);

        // Android base health 2 + 1 from defense_23 = 3
        expect(stats.maxHealth).toBe(3);
        // Both perks count toward tag score
        expect(stats.tagScores?.get(PerkTag.Defense)).toBe(2);
      });

      it('should handle regular mutants with MUTANT_SPECIES restricted perks normally', () => {
        const character: GameCharacter = {
          id: '25',
          name: 'Test Regular Mutant',
          species: 'Mutant',
          perkIds: ['agility_15', 'smarts_21'], // Both restricted to MUTANT_SPECIES
          distinctionIds: [],
          factions: [],
          relationships: [],
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        };

        const stats = calculateDerivedStats(character);

        // Regular Mutants should get tag scores from MUTANT_SPECIES perks
        expect(stats.tagScores).toBeDefined();
        expect(stats.tagScores?.get(PerkTag.Agility)).toBe(1);
        expect(stats.tagScores?.get(PerkTag.Smarts)).toBe(1);
      });

      it('should handle Tech-Mutants with MUTANT_SPECIES restricted perks normally', () => {
        const character: GameCharacter = {
          id: '26',
          name: 'Test Tech-Mutant',
          species: 'Tech-Mutant',
          perkIds: ['agility_15', 'defense_25'], // agility_15 is MUTANT_SPECIES restricted
          distinctionIds: [],
          factions: [],
          relationships: [],
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        };

        const stats = calculateDerivedStats(character);

        // Tech-Mutants should get tag scores from MUTANT_SPECIES perks
        expect(stats.tagScores).toBeDefined();
        expect(stats.tagScores?.get(PerkTag.Agility)).toBe(1);
        expect(stats.tagScores?.get(PerkTag.Defense)).toBe(1);
      });
    });
  });
});
