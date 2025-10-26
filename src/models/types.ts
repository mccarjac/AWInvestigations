import { AVAILABLE_PERKS, AVAILABLE_DISTINCTIONS } from './gameData';

export type PerkId = typeof AVAILABLE_PERKS[number]['id'];
export type DistinctionId = typeof AVAILABLE_DISTINCTIONS[number]['id'];

export enum Location {
  Hospital = 'Hospital',
  Garage = 'Garage',
  CraftingHall = 'Crafting Hall',
  Downtown = 'Downtown',
  SanguineSprings = 'Sanguine Springs',
  GrimerustHeights = 'Grimerust Heights',
  Unknown = 'Unknown'
}

export enum RelationshipType {
  Family = 'Family',
  Friend = 'Friend',
  Ally = 'Ally',
  Enemy = 'Enemy',
  Rival = 'Rival',
  Mentor = 'Mentor',
  Student = 'Student',
  Romantic = 'Romantic',
  Business = 'Business',
  Other = 'Other'
}

export type BaseSpecies = 
  | 'Android'
  | 'Drone'
  | 'Human'
  | 'Mutant'
  | 'Nomad'
  | 'Stray'
  | 'Unturned'
  | 'Unknown';

export type PrestigeSpecies =
  | 'Cyborg'
  | 'Mook'
  | 'Mutoid'
  | 'Perfect Mutant'
  | 'Rad-Titan'
  | 'Roadkill'
  | 'Tech-Mutant';

export type Species = BaseSpecies | PrestigeSpecies;

export interface SpeciesStats {
  baseHealth: number;
  baseLimit: number;
  healthCap: number;
  limitCap: number;
  canUseCyberware: boolean;
  canUseChems: boolean;
  canTakeInjuries: boolean;
  canTakeMalfunctions: boolean;
}

export const ORGANIC_SPECIES: Species[] = [
  'Human',
  'Mutant',
  'Nomad',
  'Stray',
  'Unturned',
  'Cyborg',
  'Mook',
  'Mutoid',
  'Perfect Mutant',
  'Rad-Titan',
  'Roadkill',
  'Tech-Mutant'
];

export const ROBOTIC_SPECIES: Species[] = [
  'Android',
  'Drone'
];

export const MUTANT_SPECIES: Species[] = [
  'Mutant',
  'Perfect Mutant',
  'Tech-Mutant'
];

export const ANDROID_SPECIES: Species[] = [
  'Android',
  'Tech-Mutant'
];

const organicDefaultSpeciesStats: SpeciesStats = {
  baseHealth: 2,
  baseLimit: 1,
  healthCap: 5,
  limitCap: 5,
  canUseCyberware: true,
  canUseChems: true,
  canTakeInjuries: true,
  canTakeMalfunctions: false
};

const roboticDefaultSpeciesStats: SpeciesStats = {
  baseHealth: 2,
  baseLimit: 1,
  healthCap: 5,
  limitCap: 5,
  canUseCyberware: false,
  canUseChems: false,
  canTakeInjuries: false,
  canTakeMalfunctions: true
};

export const SPECIES_BASE_STATS: Record<Species, SpeciesStats> = {
  // Base Species
  Android: {
    ...roboticDefaultSpeciesStats
  },
  Drone: {
    ...roboticDefaultSpeciesStats
  },
  Human: {
    ...organicDefaultSpeciesStats,
    baseLimit: 2
  },
  Mutant: {
    ...organicDefaultSpeciesStats
  },
  Nomad: {
    ...organicDefaultSpeciesStats
  },
  Stray: {
    ...organicDefaultSpeciesStats
  },
  Unturned: {
    ...organicDefaultSpeciesStats,
    baseHealth: 0,
    baseLimit: 3,
    healthCap: 0,
    limitCap: 10
  },
  Unknown: {
    ...organicDefaultSpeciesStats
  },
  
  // Prestige Species
  Cyborg: {
    ...organicDefaultSpeciesStats
  },
  Mook: {
    ...organicDefaultSpeciesStats
  },
  // TODO: Mutoid is weird
  Mutoid: {
    baseHealth: 2,
    baseLimit: 1,
    healthCap: 5,
    limitCap: 5,
    canUseCyberware: true,
    canUseChems: true,
    canTakeInjuries: true,
    canTakeMalfunctions: false
  },
  'Perfect Mutant': {
    ...organicDefaultSpeciesStats
  },
  'Rad-Titan': {
    ...organicDefaultSpeciesStats,
    baseHealth: 3,
    baseLimit: 0,
    healthCap: 10,
    limitCap: 0
  },
  Roadkill: {
    ...organicDefaultSpeciesStats
  },
  'Tech-Mutant': {
    ...organicDefaultSpeciesStats
  }
};

export interface Recipe {
  id: string;
  name: string;
  description: string;
  materials: string[];
}

export interface Distinction {
  id: string;
  name: string;
  description: string;
  allowedSpecies?: Species[];
}

export interface Relationship {
  characterName: string;
  relationshipType: RelationshipType;
  description?: string;
  customName?: string;
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
  relationships: Relationship[];
  imageUri?: string;
  notes?: string;
  location?: Location;
  present?: boolean;
  retired?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterDataset {
  characters: GameCharacter[];
  version: string;
  lastUpdated: string;
}

export type CharacterFormData = Omit<GameCharacter, 'id' | 'createdAt' | 'updatedAt'>;