import {
  AVAILABLE_PERKS,
  AVAILABLE_DISTINCTIONS,
  type StatModifiers,
} from './gameData';
import type { Species } from './speciesTypes';

export type PerkId = (typeof AVAILABLE_PERKS)[number]['id'];
export type DistinctionId = (typeof AVAILABLE_DISTINCTIONS)[number]['id'];

export interface GameLocation {
  id: string;
  name: string;
  description: string;
  imageUri?: string; // Deprecated: Use imageUris instead
  imageUris?: string[];
  mapCoordinates?: {
    x: number; // Normalized coordinate (0-1) representing position on map
    y: number; // Normalized coordinate (0-1) representing position on map
  };
  createdAt: string;
  updatedAt: string;
}

export interface LocationDataset {
  locations: GameLocation[];
  version: string;
  lastUpdated: string;
}

export enum RelationshipStanding {
  Ally = 'Ally',
  Friend = 'Friend',
  Neutral = 'Neutral',
  Hostile = 'Hostile',
  Enemy = 'Enemy',
}

export const POSITIVE_RELATIONSHIP_TYPE: RelationshipStanding[] = [
  RelationshipStanding.Ally,
  RelationshipStanding.Friend,
];

export const NEGATIVE_RELATIONSHIP_TYPE: RelationshipStanding[] = [
  RelationshipStanding.Hostile,
  RelationshipStanding.Enemy,
];

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

export interface Faction {
  name: string;
  standing: RelationshipStanding;
  description?: string;
}

export interface Relationship {
  characterName: string;
  relationshipType: RelationshipStanding;
  description?: string;
  customName?: string;
}

export interface Cyberware {
  name: string;
  description: string;
  statModifiers?: StatModifiers;
}

export interface GameCharacter {
  id: string;
  name: string;
  species: Species;
  perkIds: PerkId[];
  distinctionIds: DistinctionId[];
  factions: Faction[];
  relationships: Relationship[];
  imageUri?: string; // Deprecated: Use imageUris instead
  imageUris?: string[];
  notes?: string;
  locationId?: string; // Reference to GameLocation.id
  occupation?: string;
  cyberware?: Cyberware[];
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

export type CharacterFormData = Omit<
  GameCharacter,
  'id' | 'createdAt' | 'updatedAt'
>;

export interface GameEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date string
  time?: string; // Optional time in HH:MM format
  locationId?: string; // Reference to GameLocation.id
  characterIds?: string[]; // References to GameCharacter.id
  factionNames?: string[]; // Faction names involved in the event
  notes?: string;
  imageUri?: string; // Deprecated: Use imageUris instead
  imageUris?: string[];
  certaintyLevel?: CertaintyLevel; // Certainty level: unconfirmed, confirmed, or disputed
  createdAt: string;
  updatedAt: string;
}

export interface EventDataset {
  events: GameEvent[];
  version: string;
  lastUpdated: string;
}

export type CertaintyLevel = 'unconfirmed' | 'confirmed' | 'disputed';
