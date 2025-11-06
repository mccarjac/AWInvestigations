import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CharacterDataset,
  GameCharacter,
  GameLocation,
  LocationDataset,
} from '@models/types';
import { v4 as uuidv4 } from 'uuid';

interface StoredFaction {
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface FactionDataset {
  factions: StoredFaction[];
  version: string;
  lastUpdated: string;
}

const STORAGE_KEY = 'gameCharacterManager';
const FACTION_STORAGE_KEY = 'gameCharacterManager_factions';
const LOCATION_STORAGE_KEY = 'gameCharacterManager_locations';

export const saveCharacters = async (
  characters: GameCharacter[]
): Promise<void> => {
  const dataset: CharacterDataset = {
    characters,
    version: '1.0',
    lastUpdated: new Date().toISOString(),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
};

export const loadCharacters = async (): Promise<GameCharacter[]> => {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  if (!data) return [];

  const dataset: CharacterDataset = JSON.parse(data);
  // Handle backward compatibility - set defaults for missing properties
  return dataset.characters.map(character => ({
    ...character,
    present: character.present ?? false,
    retired: character.retired ?? false,
    relationships: character.relationships ?? [],
  }));
};

export const addCharacter = async (
  character: Omit<GameCharacter, 'id' | 'createdAt' | 'updatedAt'>
): Promise<GameCharacter> => {
  const characters = await loadCharacters();
  const newCharacter: GameCharacter = {
    ...character,
    id: uuidv4(),
    present: false, // Default to not present
    retired: false, // Default to not retired
    relationships: character.relationships ?? [], // Ensure relationships array exists
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveCharacters([...characters, newCharacter]);
  return newCharacter;
};

export const updateCharacter = async (
  id: string,
  updates: Partial<GameCharacter>
): Promise<GameCharacter | null> => {
  const characters = await loadCharacters();
  const index = characters.findIndex(c => c.id === id);

  if (index === -1) return null;

  const updatedCharacter: GameCharacter = {
    ...characters[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  characters[index] = updatedCharacter;
  await saveCharacters(characters);
  return updatedCharacter;
};

export const deleteCharacter = async (id: string): Promise<boolean> => {
  const characters = await loadCharacters();
  const filtered = characters.filter(c => c.id !== id);

  if (filtered.length === characters.length) return false;

  await saveCharacters(filtered);
  return true;
};

export const exportDataset = async (): Promise<string> => {
  const characterData = await AsyncStorage.getItem(STORAGE_KEY);
  const factionData = await AsyncStorage.getItem(FACTION_STORAGE_KEY);
  const locationData = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);

  const characters = characterData
    ? JSON.parse(characterData)
    : { characters: [], version: '1.0', lastUpdated: '' };
  const factions = factionData
    ? JSON.parse(factionData)
    : { factions: [], version: '1.0', lastUpdated: '' };
  const locations = locationData
    ? JSON.parse(locationData)
    : { locations: [], version: '1.0', lastUpdated: '' };

  const combinedDataset = {
    characters: characters.characters || [],
    factions: factions.factions || [],
    locations: locations.locations || [],
    version: '1.0',
    lastUpdated: new Date().toISOString(),
  };

  return JSON.stringify(combinedDataset);
};

// Migration helper to convert old location enum to location ID
const migrateOldLocationData = async (
  characters: GameCharacter[]
): Promise<void> => {
  const existingLocations = await loadLocations();
  const locationNameToId = new Map<string, string>();

  // Build a map of location names to IDs
  existingLocations.forEach(loc => {
    locationNameToId.set(loc.name.toLowerCase(), loc.id);
  });

  const locationsToCreate = new Map<string, GameLocation>();

  // Process each character
  for (const char of characters) {
    const oldLocation = (char as any).location;

    // If character has old location field but no locationId
    if (oldLocation && !char.locationId) {
      console.log(
        `Migrating old location "${oldLocation}" for character ${char.name}`
      );

      // Check if we already have a location with this name
      let locationId = locationNameToId.get(oldLocation.toLowerCase());

      if (!locationId) {
        // Check if we're already creating this location
        if (locationsToCreate.has(oldLocation)) {
          locationId = locationsToCreate.get(oldLocation)!.id;
        } else {
          // Create a new location
          const now = new Date().toISOString();
          locationId = uuidv4();
          const newLocation: GameLocation = {
            id: locationId,
            name: oldLocation,
            description: `Migrated from old location data: ${oldLocation}`,
            createdAt: now,
            updatedAt: now,
          };
          locationsToCreate.set(oldLocation, newLocation);
          locationNameToId.set(oldLocation.toLowerCase(), locationId);
          console.log(
            `Creating new location for "${oldLocation}" with ID ${locationId}`
          );
        }
      }

      // Set the locationId on the character
      char.locationId = locationId;
      // Remove the old location field
      delete (char as any).location;
    }
  }

  // Save any new locations we created
  if (locationsToCreate.size > 0) {
    const newLocationArray = Array.from(locationsToCreate.values());
    const allLocations = [...existingLocations, ...newLocationArray];
    await saveLocations(allLocations);
    console.log(
      `Migrated and created ${newLocationArray.length} location(s) from old data`
    );
  }
};

// Helper function to ensure all locations referenced by characters exist
const ensureLocationsExist = async (
  characters: GameCharacter[]
): Promise<void> => {
  const existingLocations = await loadLocations();
  const existingLocationIds = new Set(existingLocations.map(l => l.id));
  const newLocations: GameLocation[] = [];

  // Collect all unique location IDs from characters
  const referencedLocationIds = new Set<string>();
  characters.forEach((char, index) => {
    console.log(`Character ${index} (${char.name}):`, {
      hasLocationId: !!char.locationId,
      locationId: char.locationId,
      hasOldLocation: !!(char as any).location,
      oldLocation: (char as any).location,
    });

    if (char.locationId) {
      referencedLocationIds.add(char.locationId);
    }
  });

  console.log(
    `Found ${referencedLocationIds.size} unique location IDs referenced by ${characters.length} characters`
  );
  console.log('Referenced location IDs:', Array.from(referencedLocationIds));
  console.log('Existing location IDs:', Array.from(existingLocationIds));

  // Create placeholder locations for any missing location IDs
  for (const locationId of referencedLocationIds) {
    if (!existingLocationIds.has(locationId)) {
      const now = new Date().toISOString();
      const newLocation: GameLocation = {
        id: locationId,
        name: `Imported Location (${locationId.substring(0, 8)})`,
        description:
          'This location was automatically created during import. Please update the name and description.',
        createdAt: now,
        updatedAt: now,
      };
      newLocations.push(newLocation);
      console.log(
        `Creating new location: ${newLocation.name} with ID: ${locationId}`
      );
    }
  }

  // Save new locations if any were created
  if (newLocations.length > 0) {
    const allLocations = [...existingLocations, ...newLocations];
    await saveLocations(allLocations);
    console.log(
      `Auto-created ${newLocations.length} missing location(s) during import`
    );
    console.log('Total locations after import:', allLocations.length);
  } else {
    console.log('No new locations needed to be created');
  }
};

export const importDataset = async (jsonData: string): Promise<boolean> => {
  try {
    const dataset = JSON.parse(jsonData);
    console.log('Starting import. Dataset contains:', {
      characters: dataset.characters?.length || 0,
      factions: dataset.factions?.length || 0,
      locations: dataset.locations?.length || 0,
    });

    // Handle location data first (merge with existing, don't replace)
    if (dataset.locations && Array.isArray(dataset.locations)) {
      console.log('Importing locations from dataset...');
      const existingLocations = await loadLocations();
      const mergedLocations = [...existingLocations];

      // Add or update locations from import
      for (const importedLocation of dataset.locations) {
        const existingIndex = mergedLocations.findIndex(
          l => l.id === importedLocation.id
        );
        if (existingIndex >= 0) {
          // Update existing location if imported one is newer
          if (
            importedLocation.updatedAt >
            mergedLocations[existingIndex].updatedAt
          ) {
            mergedLocations[existingIndex] = importedLocation;
            console.log(`Updated location: ${importedLocation.name}`);
          }
        } else {
          // Add new location
          mergedLocations.push(importedLocation);
          console.log(`Added new location: ${importedLocation.name}`);
        }
      }

      await saveLocations(mergedLocations);
      console.log(`Saved ${mergedLocations.length} total locations`);
    }

    // Auto-create any missing locations referenced by characters
    if (dataset.characters) {
      console.log('Checking for old location data to migrate...');
      await migrateOldLocationData(dataset.characters);

      console.log('Checking for missing locations referenced by characters...');
      await ensureLocationsExist(dataset.characters);
    }

    // Handle character data
    const characterDataset: CharacterDataset = {
      characters: dataset.characters || [],
      version: dataset.version || '1.0',
      lastUpdated: dataset.lastUpdated || new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(characterDataset));

    // Handle faction data if present
    if (dataset.factions) {
      const factionDataset: FactionDataset = {
        factions: dataset.factions,
        version: dataset.version || '1.0',
        lastUpdated: dataset.lastUpdated || new Date().toISOString(),
      };
      await AsyncStorage.setItem(
        FACTION_STORAGE_KEY,
        JSON.stringify(factionDataset)
      );
    }

    return true;
  } catch {
    return false;
  }
};

// Enhanced merge interface for conflict resolution
export interface MergeConflict {
  id: string;
  existing: GameCharacter;
  imported: GameCharacter;
  conflicts: string[];
}

export interface MergeResult {
  success: boolean;
  conflicts: MergeConflict[];
  merged: GameCharacter[];
  added: GameCharacter[];
}

// Smart property merger that combines properties intelligently
const mergeCharacterProperties = (
  existing: GameCharacter,
  imported: GameCharacter
): { merged: GameCharacter; conflicts: string[] } => {
  const conflicts: string[] = [];
  const merged: GameCharacter = { ...existing };

  // Always use the most recent updatedAt timestamp
  if (imported.updatedAt > existing.updatedAt) {
    merged.updatedAt = imported.updatedAt;
  }

  // Merge arrays (like perkIds, distinctionIds, factions)
  if (imported.perkIds && imported.perkIds.length > 0) {
    const existingPerkIds = new Set(existing.perkIds || []);
    const newPerks = imported.perkIds.filter(id => !existingPerkIds.has(id));
    if (newPerks.length > 0) {
      merged.perkIds = [...(existing.perkIds || []), ...newPerks];
    }
  }

  if (imported.distinctionIds && imported.distinctionIds.length > 0) {
    const existingDistinctionIds = new Set(existing.distinctionIds || []);
    const newDistinctions = imported.distinctionIds.filter(
      id => !existingDistinctionIds.has(id)
    );
    if (newDistinctions.length > 0) {
      merged.distinctionIds = [
        ...(existing.distinctionIds || []),
        ...newDistinctions,
      ];
    }
  }

  // Merge factions (keep all unique factions)
  if (imported.factions && imported.factions.length > 0) {
    const existingFactionNames = new Set(
      (existing.factions || []).map(f => f.name)
    );
    const newFactions = imported.factions.filter(
      f => !existingFactionNames.has(f.name)
    );
    if (newFactions.length > 0) {
      merged.factions = [...(existing.factions || []), ...newFactions];
    }
  }

  // Merge relationships (keep all unique relationships by character name)
  if (imported.relationships && imported.relationships.length > 0) {
    const existingRelationshipNames = new Set(
      (existing.relationships || []).map(r => r.characterName)
    );
    const newRelationships = imported.relationships.filter(
      r => !existingRelationshipNames.has(r.characterName)
    );

    // Update existing relationships if they exist with different types or descriptions
    const updatedRelationships = (existing.relationships || []).map(
      existingRel => {
        const importedRel = imported.relationships.find(
          r => r.characterName === existingRel.characterName
        );
        if (importedRel) {
          // If relationship exists in both, prefer the one with more recent timestamp or better description
          return {
            ...existingRel,
            relationshipType:
              importedRel.relationshipType || existingRel.relationshipType,
            description: importedRel.description || existingRel.description,
          };
        }
        return existingRel;
      }
    );

    merged.relationships = [...updatedRelationships, ...newRelationships];
  } else if (!existing.relationships) {
    // Ensure relationships array exists even if empty
    merged.relationships = [];
  }

  // Handle conflicting simple properties
  const simpleProperties: (keyof GameCharacter)[] = [
    'name',
    'species',
    'locationId',
    'imageUri',
    'notes',
  ];

  for (const prop of simpleProperties) {
    if (imported[prop] !== undefined && existing[prop] !== imported[prop]) {
      if (
        existing[prop] === undefined ||
        existing[prop] === '' ||
        existing[prop] === null
      ) {
        // If existing is empty, use imported
        (merged as any)[prop] = imported[prop];
      } else if (imported[prop] !== '' && imported[prop] !== null) {
        // Both have values and they're different - this is a conflict
        conflicts.push(prop);
      }
    }
  }

  return { merged, conflicts };
};

export const mergeDatasets = async (jsonData: string): Promise<boolean> => {
  try {
    const currentData = await loadCharacters();
    const currentFactions = await loadFactions();
    const importedData = JSON.parse(jsonData);

    const mergedCharacters = [...currentData];
    const addedCharacters: GameCharacter[] = [];
    const conflicts: MergeConflict[] = [];

    // Auto-create any missing locations referenced by imported characters
    if (importedData.characters) {
      await migrateOldLocationData(importedData.characters);
      await ensureLocationsExist(importedData.characters);
    }

    // Merge characters
    for (const importedChar of importedData.characters || []) {
      const existingIndex = currentData.findIndex(
        current => current.id === importedChar.id
      );

      if (existingIndex === -1) {
        // No conflict - add new character
        addedCharacters.push(importedChar);
        mergedCharacters.push(importedChar);
      } else {
        // Potential conflict - merge properties
        const existing = currentData[existingIndex];
        const { merged, conflicts: propConflicts } = mergeCharacterProperties(
          existing,
          importedChar
        );

        if (propConflicts.length > 0) {
          conflicts.push({
            id: importedChar.id,
            existing,
            imported: importedChar,
            conflicts: propConflicts,
          });
        }

        // Use merged version (even if there are conflicts, we still merge non-conflicting properties)
        mergedCharacters[existingIndex] = merged;
      }
    }

    await saveCharacters(mergedCharacters);

    // Merge factions
    if (importedData.factions) {
      const mergedFactions = [...currentFactions];
      const existingFactionNames = new Set(currentFactions.map(f => f.name));

      for (const importedFaction of importedData.factions) {
        if (!existingFactionNames.has(importedFaction.name)) {
          mergedFactions.push(importedFaction);
        } else {
          // Update existing faction if imported one has more recent update
          const existingIndex = mergedFactions.findIndex(
            f => f.name === importedFaction.name
          );
          if (
            existingIndex >= 0 &&
            importedFaction.updatedAt > mergedFactions[existingIndex].updatedAt
          ) {
            mergedFactions[existingIndex] = importedFaction;
          }
        }
      }

      await saveFactions(mergedFactions);
    }

    // Merge locations
    if (importedData.locations) {
      const currentLocations = await loadLocations();
      const mergedLocations = [...currentLocations];
      const existingLocationIds = new Set(currentLocations.map(l => l.id));

      for (const importedLocation of importedData.locations) {
        if (!existingLocationIds.has(importedLocation.id)) {
          mergedLocations.push(importedLocation);
        } else {
          // Update existing location if imported one has more recent update
          const existingIndex = mergedLocations.findIndex(
            l => l.id === importedLocation.id
          );
          if (
            existingIndex >= 0 &&
            importedLocation.updatedAt >
              mergedLocations[existingIndex].updatedAt
          ) {
            mergedLocations[existingIndex] = importedLocation;
          }
        }
      }

      await saveLocations(mergedLocations);
    }

    return true;
  } catch (error) {
    console.error('Error merging datasets:', error);
    return false;
  }
};

// Enhanced merge function that can handle user interaction
export const mergeDatasetWithConflictResolution = async (
  jsonData: string
): Promise<MergeResult> => {
  try {
    const currentData = await loadCharacters();
    const currentFactions = await loadFactions();
    const importedData = JSON.parse(jsonData);

    const mergedCharacters = [...currentData];
    const addedCharacters: GameCharacter[] = [];
    const conflicts: MergeConflict[] = [];

    // Auto-create any missing locations referenced by imported characters
    if (importedData.characters) {
      await migrateOldLocationData(importedData.characters);
      await ensureLocationsExist(importedData.characters);
    }

    // Merge characters
    for (const importedChar of importedData.characters || []) {
      const existingIndex = currentData.findIndex(
        current => current.id === importedChar.id
      );

      if (existingIndex === -1) {
        // No conflict - add new character
        addedCharacters.push(importedChar);
        mergedCharacters.push(importedChar);
      } else {
        // Potential conflict - merge properties
        const existing = currentData[existingIndex];
        const { merged, conflicts: propConflicts } = mergeCharacterProperties(
          existing,
          importedChar
        );

        if (propConflicts.length > 0) {
          conflicts.push({
            id: importedChar.id,
            existing,
            imported: importedChar,
            conflicts: propConflicts,
          });
        }

        // Use merged version for now
        mergedCharacters[existingIndex] = merged;
      }
    }

    await saveCharacters(mergedCharacters);

    // Merge factions
    if (importedData.factions) {
      const mergedFactions = [...currentFactions];
      const existingFactionNames = new Set(currentFactions.map(f => f.name));

      for (const importedFaction of importedData.factions) {
        if (!existingFactionNames.has(importedFaction.name)) {
          mergedFactions.push(importedFaction);
        } else {
          // Update existing faction if imported one has more recent update
          const existingIndex = mergedFactions.findIndex(
            f => f.name === importedFaction.name
          );
          if (
            existingIndex >= 0 &&
            importedFaction.updatedAt > mergedFactions[existingIndex].updatedAt
          ) {
            mergedFactions[existingIndex] = importedFaction;
          }
        }
      }

      await saveFactions(mergedFactions);
    }

    // Merge locations
    if (importedData.locations) {
      const currentLocations = await loadLocations();
      const mergedLocations = [...currentLocations];
      const existingLocationIds = new Set(currentLocations.map(l => l.id));

      for (const importedLocation of importedData.locations) {
        if (!existingLocationIds.has(importedLocation.id)) {
          mergedLocations.push(importedLocation);
        } else {
          // Update existing location if imported one has more recent update
          const existingIndex = mergedLocations.findIndex(
            l => l.id === importedLocation.id
          );
          if (
            existingIndex >= 0 &&
            importedLocation.updatedAt >
              mergedLocations[existingIndex].updatedAt
          ) {
            mergedLocations[existingIndex] = importedLocation;
          }
        }
      }

      await saveLocations(mergedLocations);
    }

    return {
      success: true,
      conflicts,
      merged: mergedCharacters,
      added: addedCharacters,
    };
  } catch (error) {
    console.error('Error merging datasets:', error);
    return {
      success: false,
      conflicts: [],
      merged: [],
      added: [],
    };
  }
};

export const toggleCharacterPresent = async (
  id: string
): Promise<GameCharacter | null> => {
  const characters = await loadCharacters();
  const index = characters.findIndex(c => c.id === id);

  if (index === -1) return null;

  const updatedCharacter: GameCharacter = {
    ...characters[index],
    present: !characters[index].present,
    updatedAt: new Date().toISOString(),
  };

  characters[index] = updatedCharacter;
  await saveCharacters(characters);
  return updatedCharacter;
};

export const resetAllPresentStatus = async (): Promise<void> => {
  const characters = await loadCharacters();
  const updatedCharacters = characters.map(character => ({
    ...character,
    present: false,
    updatedAt: new Date().toISOString(),
  }));

  await saveCharacters(updatedCharacters);
};

export const clearStorage = async (): Promise<void> => {
  await AsyncStorage.removeItem(STORAGE_KEY);
  await AsyncStorage.removeItem(FACTION_STORAGE_KEY);
  await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
};

// Faction management functions
export const saveFactions = async (
  factions: StoredFaction[]
): Promise<void> => {
  const dataset: FactionDataset = {
    factions,
    version: '1.0',
    lastUpdated: new Date().toISOString(),
  };
  await AsyncStorage.setItem(FACTION_STORAGE_KEY, JSON.stringify(dataset));
};

export const loadFactions = async (): Promise<StoredFaction[]> => {
  const data = await AsyncStorage.getItem(FACTION_STORAGE_KEY);
  if (!data) return [];

  const dataset: FactionDataset = JSON.parse(data);
  return dataset.factions || [];
};

export const getFactionDescription = async (
  factionName: string
): Promise<string> => {
  const factions = await loadFactions();
  const faction = factions.find(f => f.name === factionName);
  return faction?.description || '';
};

export const saveFactionDescription = async (
  factionName: string,
  description: string
): Promise<void> => {
  const factions = await loadFactions();
  const existingIndex = factions.findIndex(f => f.name === factionName);

  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    // Update existing faction
    factions[existingIndex] = {
      ...factions[existingIndex],
      description,
      updatedAt: now,
    };
  } else {
    // Create new faction
    factions.push({
      name: factionName,
      description,
      createdAt: now,
      updatedAt: now,
    });
  }

  await saveFactions(factions);
};

export const getAllStoredFactions = async (): Promise<StoredFaction[]> => {
  return await loadFactions();
};

export const deleteFaction = async (factionName: string): Promise<boolean> => {
  const factions = await loadFactions();
  const filtered = factions.filter(f => f.name !== factionName);

  if (filtered.length === factions.length) return false;

  await saveFactions(filtered);
  return true;
};

export const deleteFactionCompletely = async (
  factionName: string
): Promise<{ success: boolean; charactersUpdated: number }> => {
  try {
    // First, remove the faction from all characters
    const characters = await loadCharacters();
    let charactersUpdated = 0;

    const updatedCharacters = characters.map(character => {
      const originalFactionCount = character.factions.length;
      const updatedFactions = character.factions.filter(
        faction => faction.name !== factionName
      );

      if (updatedFactions.length !== originalFactionCount) {
        charactersUpdated++;
        return {
          ...character,
          factions: updatedFactions,
          updatedAt: new Date().toISOString(),
        };
      }

      return character;
    });

    // Save updated characters if any were modified
    if (charactersUpdated > 0) {
      await saveCharacters(updatedCharacters);
    }

    // Then remove the faction from centralized storage
    await deleteFaction(factionName);

    return {
      success: true,
      charactersUpdated,
    };
  } catch (error) {
    console.error('Error deleting faction completely:', error);
    return {
      success: false,
      charactersUpdated: 0,
    };
  }
};

export const createFaction = async (factionData: {
  name: string;
  description: string;
}): Promise<boolean> => {
  const existingFactions = await loadFactions();

  // Check if faction with this name already exists
  const existingFaction = existingFactions.find(
    f => f.name.toLowerCase() === factionData.name.toLowerCase()
  );
  if (existingFaction) {
    return false; // Faction already exists
  }

  const now = new Date().toISOString();
  const newFaction: StoredFaction = {
    name: factionData.name,
    description: factionData.description,
    createdAt: now,
    updatedAt: now,
  };

  await saveFactions([...existingFactions, newFaction]);
  return true;
};

// Migration function to move faction descriptions from character data to centralized storage
export const migrateFactionDescriptions = async (): Promise<void> => {
  try {
    const characters = await loadCharacters();
    const existingFactions = await loadFactions();
    const factionDescriptions = new Map<string, string>();

    // Collect all faction descriptions from characters
    characters.forEach(character => {
      character.factions.forEach(faction => {
        if (faction.description && faction.description.trim() !== '') {
          // Use the first non-empty description found for each faction
          if (!factionDescriptions.has(faction.name)) {
            factionDescriptions.set(faction.name, faction.description);
          }
        }
      });
    });

    // Create or update centralized faction storage
    const updatedFactions = [...existingFactions];

    factionDescriptions.forEach((description, factionName) => {
      const existingIndex = updatedFactions.findIndex(
        f => f.name === factionName
      );
      const now = new Date().toISOString();

      if (existingIndex >= 0) {
        // Update existing faction if it has no description
        if (!updatedFactions[existingIndex].description) {
          updatedFactions[existingIndex] = {
            ...updatedFactions[existingIndex],
            description,
            updatedAt: now,
          };
        }
      } else {
        // Create new faction entry
        updatedFactions.push({
          name: factionName,
          description,
          createdAt: now,
          updatedAt: now,
        });
      }
    });

    await saveFactions(updatedFactions);
  } catch (error) {
    console.error('Error migrating faction descriptions:', error);
  }
};

// Location management functions
export const saveLocations = async (
  locations: GameLocation[]
): Promise<void> => {
  const dataset: LocationDataset = {
    locations,
    version: '1.0',
    lastUpdated: new Date().toISOString(),
  };
  await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(dataset));
};

export const loadLocations = async (): Promise<GameLocation[]> => {
  const data = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
  if (!data) return [];

  const dataset: LocationDataset = JSON.parse(data);
  return dataset.locations || [];
};

export const getLocation = async (
  locationId: string
): Promise<GameLocation | null> => {
  const locations = await loadLocations();
  return locations.find(l => l.id === locationId) || null;
};

export const createLocation = async (locationData: {
  name: string;
  description: string;
  imageUri?: string;
}): Promise<GameLocation | null> => {
  const existingLocations = await loadLocations();

  // Check if location with this name already exists
  const existingLocation = existingLocations.find(
    l => l.name.toLowerCase() === locationData.name.toLowerCase()
  );
  if (existingLocation) {
    return null; // Location already exists
  }

  const now = new Date().toISOString();
  const newLocation: GameLocation = {
    id: uuidv4(),
    name: locationData.name,
    description: locationData.description,
    imageUri: locationData.imageUri,
    createdAt: now,
    updatedAt: now,
  };

  await saveLocations([...existingLocations, newLocation]);
  return newLocation;
};

export const updateLocation = async (
  locationId: string,
  updates: Partial<Omit<GameLocation, 'id' | 'createdAt'>>
): Promise<GameLocation | null> => {
  const locations = await loadLocations();
  const index = locations.findIndex(l => l.id === locationId);

  if (index === -1) return null;

  const updatedLocation: GameLocation = {
    ...locations[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  locations[index] = updatedLocation;
  await saveLocations(locations);
  return updatedLocation;
};

export const deleteLocation = async (locationId: string): Promise<boolean> => {
  const locations = await loadLocations();
  const filtered = locations.filter(l => l.id !== locationId);

  if (filtered.length === locations.length) return false;

  await saveLocations(filtered);
  return true;
};

export const deleteLocationCompletely = async (
  locationId: string
): Promise<{ success: boolean; charactersUpdated: number }> => {
  try {
    // First, remove the location reference from all characters
    const characters = await loadCharacters();
    let charactersUpdated = 0;

    const updatedCharacters = characters.map(character => {
      if (character.locationId === locationId) {
        charactersUpdated++;
        return {
          ...character,
          locationId: undefined,
          updatedAt: new Date().toISOString(),
        };
      }
      return character;
    });

    // Save updated characters if any were modified
    if (charactersUpdated > 0) {
      await saveCharacters(updatedCharacters);
    }

    // Then remove the location from centralized storage
    await deleteLocation(locationId);

    return {
      success: true,
      charactersUpdated,
    };
  } catch (error) {
    console.error('Error deleting location completely:', error);
    return {
      success: false,
      charactersUpdated: 0,
    };
  }
};
