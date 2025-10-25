import { AVAILABLE_PERKS, AVAILABLE_DISTINCTIONS } from './gameData';

export type PerkId = typeof AVAILABLE_PERKS[number]['id'];
export type DistinctionId = typeof AVAILABLE_DISTINCTIONS[number]['id'];

export type BaseSpecies = 
  | 'Android'    // Synthetic beings with advanced AI
  | 'Drone'      // Basic robotic servants
  | 'Human'      // Unmodified humans
  | 'Mutant'     // Humans changed by radiation or other factors
  | 'Nomad'      // Desert-dwelling survivors
  | 'Stray'      // Animal-human hybrids
  | 'Unturned';  // Humans immune to the zombie virus

export type PrestigeSpecies =
  | 'Cyborg'         // Human-machine hybrid
  | 'Mook'           // Enhanced combat drone
  | 'Mutoid'         // Highly evolved mutant
  | 'Perfect Mutant' // Genetically superior mutant
  | 'Rad-Titan'      // Radiation-empowered being
  | 'Roadkill'       // Stray-human hybrid
  | 'Tech-Mutant';   // Mutant-machine hybrid

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
  description: string;
}

export const SPECIES_BASE_STATS: Record<Species, SpeciesStats> = {
  // Base Species
  Android: {
    baseHealth: 3,
    baseLimit: 2,
    healthCap: 6,
    limitCap: 4,
    canUseCyberware: true,
    canUseChems: false,
    canTakeInjuries: false,
    canTakeMalfunctions: true,
    description: 'Advanced artificial beings with sophisticated AI and human-like personalities.'
  },
  Drone: {
    baseHealth: 2,
    baseLimit: 1,
    healthCap: 5,
    limitCap: 3,
    canUseCyberware: true,
    canUseChems: false,
    canTakeInjuries: false,
    canTakeMalfunctions: true,
    description: 'Basic robotic servants designed for specific tasks with limited autonomy.'
  },
  Human: {
    baseHealth: 3,
    baseLimit: 2,
    healthCap: 6,
    limitCap: 4,
    canUseCyberware: true,
    canUseChems: true,
    canTakeInjuries: true,
    canTakeMalfunctions: false,
    description: 'Unmodified humans who have survived the apocalypse through adaptability.'
  },
  Mutant: {
    baseHealth: 4,
    baseLimit: 1,
    healthCap: 7,
    limitCap: 3,
    canUseCyberware: false,
    canUseChems: true,
    canTakeInjuries: true,
    canTakeMalfunctions: false,
    description: 'Humans transformed by radiation, chemicals, or other wasteland effects.'
  },
  Nomad: {
    baseHealth: 3,
    baseLimit: 2,
    healthCap: 6,
    limitCap: 4,
    canUseCyberware: true,
    canUseChems: true,
    canTakeInjuries: true,
    canTakeMalfunctions: false,
    description: 'Desert dwellers adapted to harsh survival conditions.'
  },
  Stray: {
    baseHealth: 4,
    baseLimit: 1,
    healthCap: 7,
    limitCap: 3,
    canUseCyberware: false,
    canUseChems: true,
    canTakeInjuries: true,
    canTakeMalfunctions: false,
    description: 'Animal-human hybrids with enhanced physical capabilities.'
  },
  Unturned: {
    baseHealth: 3,
    baseLimit: 2,
    healthCap: 6,
    limitCap: 4,
    canUseCyberware: true,
    canUseChems: true,
    canTakeInjuries: true,
    canTakeMalfunctions: false,
    description: 'Humans with natural immunity to the zombie virus.'
  },
  
  // Prestige Species
  Cyborg: {
    baseHealth: 4,
    baseLimit: 2,
    healthCap: 7,
    limitCap: 4,
    canUseCyberware: true,
    canUseChems: true,
    canTakeInjuries: true,
    canTakeMalfunctions: true,
    description: 'Advanced human-machine hybrid with enhanced capabilities and resilience.'
  },
  Mook: {
    baseHealth: 3,
    baseLimit: 3,
    healthCap: 6,
    limitCap: 5,
    canUseCyberware: true,
    canUseChems: false,
    canTakeInjuries: false,
    canTakeMalfunctions: true,
    description: 'Combat-focused drone with advanced tactical programming and enhanced limit capacity.'
  },
  Mutoid: {
    baseHealth: 5,
    baseLimit: 2,
    healthCap: 8,
    limitCap: 4,
    canUseCyberware: false,
    canUseChems: true,
    canTakeInjuries: true,
    canTakeMalfunctions: false,
    description: 'Highly evolved mutant with superior physical attributes and enhanced healing.'
  },
  'Perfect Mutant': {
    baseHealth: 4,
    baseLimit: 3,
    healthCap: 7,
    limitCap: 5,
    canUseCyberware: false,
    canUseChems: true,
    canTakeInjuries: true,
    canTakeMalfunctions: false,
    description: 'Genetically superior mutant with balanced physical and mental enhancements.'
  },
  'Rad-Titan': {
    baseHealth: 6,
    baseLimit: 1,
    healthCap: 9,
    limitCap: 3,
    canUseCyberware: false,
    canUseChems: true,
    canTakeInjuries: true,
    canTakeMalfunctions: false,
    description: 'Massive radiation-empowered being with incredible durability but limited energy.'
  },
  Roadkill: {
    baseHealth: 5,
    baseLimit: 2,
    healthCap: 8,
    limitCap: 4,
    canUseCyberware: false,
    canUseChems: true,
    canTakeInjuries: true,
    canTakeMalfunctions: false,
    description: 'Powerful hybrid combining Stray and human traits with enhanced survivability.'
  },
  'Tech-Mutant': {
    baseHealth: 4,
    baseLimit: 2,
    healthCap: 7,
    limitCap: 4,
    canUseCyberware: true,
    canUseChems: true,
    canTakeInjuries: true,
    canTakeMalfunctions: true,
    description: 'Unique combination of mutant biology and technological enhancement.'
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
  xpBonus: number;
  allowedSpecies?: Species[];
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