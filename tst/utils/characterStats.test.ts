import { calculateCharacterStats } from '@/utils/characterStats';
import { GameCharacter, RelationshipStanding } from '@/models/types';

describe('characterStats', () => {
  describe('calculateCharacterStats', () => {
    const mockCharacters: GameCharacter[] = [
      {
        id: '1',
        name: 'Alice',
        species: 'Human',
        perkIds: [],
        distinctionIds: [],
        factions: [
          { name: 'Brotherhood', standing: RelationshipStanding.Ally },
        ],
        relationships: [],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
      {
        id: '2',
        name: 'Bob',
        species: 'Mutant',
        perkIds: [],
        distinctionIds: [],
        factions: [
          { name: 'Brotherhood', standing: RelationshipStanding.Friend },
          { name: 'Raiders', standing: RelationshipStanding.Enemy },
        ],
        relationships: [],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
      {
        id: '3',
        name: 'Charlie',
        species: 'Human',
        perkIds: [],
        distinctionIds: [],
        factions: [{ name: 'Raiders', standing: RelationshipStanding.Ally }],
        relationships: [],
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
      },
    ];

    it('should throw error for empty character array', () => {
      expect(() => calculateCharacterStats([])).toThrow(
        'No characters available for statistics calculation'
      );
    });

    it('should calculate total character count', () => {
      const stats = calculateCharacterStats(mockCharacters);

      expect(stats.totalCharacters).toBe(3);
    });

    it('should calculate species distribution', () => {
      const stats = calculateCharacterStats(mockCharacters);

      expect(stats.speciesDistribution).toEqual({
        Human: 2,
        Mutant: 1,
      });
    });

    it('should calculate faction distribution', () => {
      const stats = calculateCharacterStats(mockCharacters);

      expect(stats.factionDistribution).toEqual({
        Brotherhood: 2,
        Raiders: 2,
      });
    });

    it('should calculate faction standings distribution', () => {
      const stats = calculateCharacterStats(mockCharacters);

      expect(stats.factionStandings).toEqual({
        Brotherhood: {
          Ally: 1,
          Friend: 1,
        },
        Raiders: {
          Enemy: 1,
          Ally: 1,
        },
      });
    });

    it('should handle character with no factions', () => {
      const characters: GameCharacter[] = [
        {
          id: '1',
          name: 'Loner',
          species: 'Nomad',
          perkIds: [],
          distinctionIds: [],
          factions: [],
          relationships: [],
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
      ];

      const stats = calculateCharacterStats(characters);

      expect(stats.totalCharacters).toBe(1);
      expect(stats.factionDistribution).toEqual({});
      expect(stats.factionStandings).toEqual({});
    });

    it('should handle single character', () => {
      const characters: GameCharacter[] = [
        {
          id: '1',
          name: 'Solo',
          species: 'Android',
          perkIds: [],
          distinctionIds: [],
          factions: [
            { name: 'Machines', standing: RelationshipStanding.Neutral },
          ],
          relationships: [],
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
      ];

      const stats = calculateCharacterStats(characters);

      expect(stats.totalCharacters).toBe(1);
      expect(stats.speciesDistribution).toEqual({ Android: 1 });
      expect(stats.factionDistribution).toEqual({ Machines: 1 });
    });

    it('should accumulate multiple faction memberships per character', () => {
      const characters: GameCharacter[] = [
        {
          id: '1',
          name: 'Multi-faction',
          species: 'Human',
          perkIds: [],
          distinctionIds: [],
          factions: [
            { name: 'Faction A', standing: RelationshipStanding.Ally },
            { name: 'Faction B', standing: RelationshipStanding.Friend },
            { name: 'Faction C', standing: RelationshipStanding.Neutral },
          ],
          relationships: [],
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
      ];

      const stats = calculateCharacterStats(characters);

      expect(stats.factionDistribution).toEqual({
        'Faction A': 1,
        'Faction B': 1,
        'Faction C': 1,
      });
    });

    it('should handle diverse species distribution', () => {
      const characters: GameCharacter[] = [
        {
          id: '1',
          name: 'Char1',
          species: 'Human',
          perkIds: [],
          distinctionIds: [],
          factions: [],
          relationships: [],
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
        {
          id: '2',
          name: 'Char2',
          species: 'Mutant',
          perkIds: [],
          distinctionIds: [],
          factions: [],
          relationships: [],
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
        {
          id: '3',
          name: 'Char3',
          species: 'Android',
          perkIds: [],
          distinctionIds: [],
          factions: [],
          relationships: [],
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
        {
          id: '4',
          name: 'Char4',
          species: 'Human',
          perkIds: [],
          distinctionIds: [],
          factions: [],
          relationships: [],
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
      ];

      const stats = calculateCharacterStats(characters);

      expect(stats.speciesDistribution).toEqual({
        Human: 2,
        Mutant: 1,
        Android: 1,
      });
    });

    it('should include all relationship standings in faction standings', () => {
      const characters: GameCharacter[] = [
        {
          id: '1',
          name: 'Char1',
          species: 'Human',
          perkIds: [],
          distinctionIds: [],
          factions: [
            { name: 'TestFaction', standing: RelationshipStanding.Ally },
          ],
          relationships: [],
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
        {
          id: '2',
          name: 'Char2',
          species: 'Human',
          perkIds: [],
          distinctionIds: [],
          factions: [
            { name: 'TestFaction', standing: RelationshipStanding.Friend },
          ],
          relationships: [],
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
        {
          id: '3',
          name: 'Char3',
          species: 'Human',
          perkIds: [],
          distinctionIds: [],
          factions: [
            { name: 'TestFaction', standing: RelationshipStanding.Neutral },
          ],
          relationships: [],
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
        {
          id: '4',
          name: 'Char4',
          species: 'Human',
          perkIds: [],
          distinctionIds: [],
          factions: [
            { name: 'TestFaction', standing: RelationshipStanding.Hostile },
          ],
          relationships: [],
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
        {
          id: '5',
          name: 'Char5',
          species: 'Human',
          perkIds: [],
          distinctionIds: [],
          factions: [
            { name: 'TestFaction', standing: RelationshipStanding.Enemy },
          ],
          relationships: [],
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
        },
      ];

      const stats = calculateCharacterStats(characters);

      expect(stats.factionStandings.TestFaction).toEqual({
        Ally: 1,
        Friend: 1,
        Neutral: 1,
        Hostile: 1,
        Enemy: 1,
      });
    });

    describe('Perk Statistics', () => {
      it('should calculate most common perks', () => {
        const characters: GameCharacter[] = [
          {
            id: '1',
            name: 'Char1',
            species: 'Human',
            perkIds: ['agility_1', 'defense_1', 'strength_1'],
            distinctionIds: [],
            factions: [],
            relationships: [],
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01',
          },
          {
            id: '2',
            name: 'Char2',
            species: 'Human',
            perkIds: ['agility_1', 'defense_1'],
            distinctionIds: [],
            factions: [],
            relationships: [],
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01',
          },
          {
            id: '3',
            name: 'Char3',
            species: 'Human',
            perkIds: ['agility_1'],
            distinctionIds: [],
            factions: [],
            relationships: [],
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01',
          },
        ];

        const stats = calculateCharacterStats(characters);

        expect(stats.commonPerks).toHaveLength(3);
        expect(stats.commonPerks[0]).toEqual({
          name: 'Agile Strikes',
          count: 3,
        });
        expect(stats.commonPerks[1].count).toBe(2);
        expect(stats.commonPerks[2].count).toBe(1);
      });

      it('should handle unknown perk IDs', () => {
        const characters: GameCharacter[] = [
          {
            id: '1',
            name: 'Char1',
            species: 'Human',
            perkIds: ['unknown_perk_id', 'agility_1'],
            distinctionIds: [],
            factions: [],
            relationships: [],
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01',
          },
        ];

        const stats = calculateCharacterStats(characters);

        expect(stats.commonPerks).toHaveLength(2);
        const unknownPerk = stats.commonPerks.find(
          p => p.name === 'Unknown Perk'
        );
        expect(unknownPerk).toBeDefined();
        expect(unknownPerk?.count).toBe(1);
      });

      it('should limit common perks to top 5', () => {
        const characters: GameCharacter[] = [
          {
            id: '1',
            name: 'Char1',
            species: 'Human',
            perkIds: [
              'agility_1',
              'agility_2',
              'agility_3',
              'defense_1',
              'defense_2',
              'strength_1',
              'strength_2',
            ],
            distinctionIds: [],
            factions: [],
            relationships: [],
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01',
          },
        ];

        const stats = calculateCharacterStats(characters);

        expect(stats.commonPerks).toHaveLength(5);
      });

      it('should handle characters with no perks', () => {
        const characters: GameCharacter[] = [
          {
            id: '1',
            name: 'Char1',
            species: 'Human',
            perkIds: [],
            distinctionIds: [],
            factions: [],
            relationships: [],
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01',
          },
        ];

        const stats = calculateCharacterStats(characters);

        expect(stats.commonPerks).toHaveLength(0);
      });

      it('should sort perks by count descending', () => {
        const characters: GameCharacter[] = [
          {
            id: '1',
            name: 'Char1',
            species: 'Human',
            perkIds: ['agility_1', 'defense_1', 'defense_1'],
            distinctionIds: [],
            factions: [],
            relationships: [],
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01',
          },
          {
            id: '2',
            name: 'Char2',
            species: 'Human',
            perkIds: ['defense_1', 'strength_1'],
            distinctionIds: [],
            factions: [],
            relationships: [],
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01',
          },
        ];

        const stats = calculateCharacterStats(characters);

        // defense_1 appears 3 times, agility_1 once, strength_1 once
        expect(stats.commonPerks[0].count).toBeGreaterThanOrEqual(
          stats.commonPerks[1]?.count || 0
        );
        if (stats.commonPerks[1]) {
          expect(stats.commonPerks[1].count).toBeGreaterThanOrEqual(
            stats.commonPerks[2]?.count || 0
          );
        }
      });
    });

    describe('Distinction Statistics', () => {
      it('should calculate most common distinctions', () => {
        const characters: GameCharacter[] = [
          {
            id: '1',
            name: 'Char1',
            species: 'Human',
            perkIds: [],
            distinctionIds: ['d1', 'd2', 'd3'],
            factions: [],
            relationships: [],
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01',
          },
          {
            id: '2',
            name: 'Char2',
            species: 'Human',
            perkIds: [],
            distinctionIds: ['d1', 'd2'],
            factions: [],
            relationships: [],
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01',
          },
          {
            id: '3',
            name: 'Char3',
            species: 'Human',
            perkIds: [],
            distinctionIds: ['d1'],
            factions: [],
            relationships: [],
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01',
          },
        ];

        const stats = calculateCharacterStats(characters);

        expect(stats.commonDistinctions).toHaveLength(3);
        expect(stats.commonDistinctions[0]).toEqual({
          name: 'Apathetic',
          count: 3,
        });
        expect(stats.commonDistinctions[1].count).toBe(2);
        expect(stats.commonDistinctions[2].count).toBe(1);
      });

      it('should handle unknown distinction IDs', () => {
        const characters: GameCharacter[] = [
          {
            id: '1',
            name: 'Char1',
            species: 'Human',
            perkIds: [],
            distinctionIds: ['unknown_distinction_id', 'd1'],
            factions: [],
            relationships: [],
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01',
          },
        ];

        const stats = calculateCharacterStats(characters);

        expect(stats.commonDistinctions).toHaveLength(2);
        const unknownDistinction = stats.commonDistinctions.find(
          d => d.name === 'Unknown Distinction'
        );
        expect(unknownDistinction).toBeDefined();
        expect(unknownDistinction?.count).toBe(1);
      });

      it('should limit common distinctions to top 5', () => {
        const characters: GameCharacter[] = [
          {
            id: '1',
            name: 'Char1',
            species: 'Human',
            perkIds: [],
            distinctionIds: ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7'],
            factions: [],
            relationships: [],
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01',
          },
        ];

        const stats = calculateCharacterStats(characters);

        expect(stats.commonDistinctions).toHaveLength(5);
      });

      it('should handle characters with no distinctions', () => {
        const characters: GameCharacter[] = [
          {
            id: '1',
            name: 'Char1',
            species: 'Human',
            perkIds: [],
            distinctionIds: [],
            factions: [],
            relationships: [],
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01',
          },
        ];

        const stats = calculateCharacterStats(characters);

        expect(stats.commonDistinctions).toHaveLength(0);
      });

      it('should sort distinctions by count descending', () => {
        const characters: GameCharacter[] = [
          {
            id: '1',
            name: 'Char1',
            species: 'Human',
            perkIds: [],
            distinctionIds: ['d1', 'd2', 'd2'],
            factions: [],
            relationships: [],
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01',
          },
          {
            id: '2',
            name: 'Char2',
            species: 'Human',
            perkIds: [],
            distinctionIds: ['d2', 'd3'],
            factions: [],
            relationships: [],
            createdAt: '2025-01-01',
            updatedAt: '2025-01-01',
          },
        ];

        const stats = calculateCharacterStats(characters);

        // d2 appears 3 times, d1 once, d3 once
        expect(stats.commonDistinctions[0].count).toBeGreaterThanOrEqual(
          stats.commonDistinctions[1]?.count || 0
        );
        if (stats.commonDistinctions[1]) {
          expect(stats.commonDistinctions[1].count).toBeGreaterThanOrEqual(
            stats.commonDistinctions[2]?.count || 0
          );
        }
      });
    });
  });
});
