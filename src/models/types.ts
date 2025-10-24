import { AVAILABLE_PERKS, AVAILABLE_DISTINCTIONS } from './gameData';

export type PerkId = typeof AVAILABLE_PERKS[number]['id'];
export type DistinctionId = typeof AVAILABLE_DISTINCTIONS[number]['id'];

export type Species = 'Android' | 'Drone' | 'Human' | 'Mutant' | 'Nomad';

// TODO: Add concept of health cap and limit cap
export interface SpeciesStats {
  baseHealth: number;
  baseLimit: number;
}

// TODO : Populate with all species
export const SPECIES_BASE_STATS: Record<Species, SpeciesStats> = {
  Android: {
    baseHealth: 2,
    baseLimit: 1
  },
  Drone: {
    baseHealth: 2,
    baseLimit: 1
  },
  Human: {
    baseHealth: 2,
    baseLimit: 2
  },
  Mutant: {
    baseHealth: 2,
    baseLimit: 1
  },
  Nomad: {
    baseHealth: 2,
    baseLimit: 1
  }
};

// TODO : Remove concept of difficulty from recipes
export interface Recipe {
  id: string;
  name: string;
  description: string;
  materials: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
}

export interface GameCharacter {
  id: string;
  name: string;
  species: Species;
  perkIds: PerkId[];
  distinctionIds: DistinctionId[];
  factions: {
    name: string;
    standing: 'Allied' | 'Friendly' | 'Neutral' | 'Hostile' | 'Enemy';
  }[];
  imageUri?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterDataset {
  characters: GameCharacter[];
  version: string;
  lastUpdated: string;
}

export type CharacterFormData = Omit<GameCharacter, 'id' | 'createdAt' | 'updatedAt'>;