import AsyncStorage from '@react-native-async-storage/async-storage';
import { CharacterDataset, GameCharacter } from '@models/types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'gameCharacterManager';

export const saveCharacters = async (characters: GameCharacter[]): Promise<void> => {
  const dataset: CharacterDataset = {
    characters,
    version: '1.0',
    lastUpdated: new Date().toISOString()
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
    relationships: character.relationships ?? []
  }));
};

export const addCharacter = async (character: Omit<GameCharacter, 'id' | 'createdAt' | 'updatedAt'>): Promise<GameCharacter> => {
  const characters = await loadCharacters();
  const newCharacter: GameCharacter = {
    ...character,
    id: uuidv4(),
    present: false, // Default to not present
    retired: false, // Default to not retired
    relationships: character.relationships ?? [], // Ensure relationships array exists
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  await saveCharacters([...characters, newCharacter]);
  return newCharacter;
};

export const updateCharacter = async (id: string, updates: Partial<GameCharacter>): Promise<GameCharacter | null> => {
  const characters = await loadCharacters();
  const index = characters.findIndex(c => c.id === id);
  
  if (index === -1) return null;
  
  const updatedCharacter: GameCharacter = {
    ...characters[index],
    ...updates,
    updatedAt: new Date().toISOString()
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
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  return data || '{"characters":[],"version":"1.0","lastUpdated":""}';
};

export const importDataset = async (jsonData: string): Promise<boolean> => {
  try {
    const dataset: CharacterDataset = JSON.parse(jsonData);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
    return true;
  } catch (error) {
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
const mergeCharacterProperties = (existing: GameCharacter, imported: GameCharacter): { merged: GameCharacter; conflicts: string[] } => {
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
    const newDistinctions = imported.distinctionIds.filter(id => !existingDistinctionIds.has(id));
    if (newDistinctions.length > 0) {
      merged.distinctionIds = [...(existing.distinctionIds || []), ...newDistinctions];
    }
  }

  // Merge factions (keep all unique factions)
  if (imported.factions && imported.factions.length > 0) {
    const existingFactionNames = new Set((existing.factions || []).map(f => f.name));
    const newFactions = imported.factions.filter(f => !existingFactionNames.has(f.name));
    if (newFactions.length > 0) {
      merged.factions = [...(existing.factions || []), ...newFactions];
    }
  }

  // Merge relationships (keep all unique relationships by character name)
  if (imported.relationships && imported.relationships.length > 0) {
    const existingRelationshipNames = new Set((existing.relationships || []).map(r => r.characterName));
    const newRelationships = imported.relationships.filter(r => !existingRelationshipNames.has(r.characterName));
    
    // Update existing relationships if they exist with different types or descriptions
    const updatedRelationships = (existing.relationships || []).map(existingRel => {
      const importedRel = imported.relationships.find(r => r.characterName === existingRel.characterName);
      if (importedRel) {
        // If relationship exists in both, prefer the one with more recent timestamp or better description
        return {
          ...existingRel,
          relationshipType: importedRel.relationshipType || existingRel.relationshipType,
          description: importedRel.description || existingRel.description
        };
      }
      return existingRel;
    });
    
    merged.relationships = [...updatedRelationships, ...newRelationships];
  } else if (!existing.relationships) {
    // Ensure relationships array exists even if empty
    merged.relationships = [];
  }

  // Handle conflicting simple properties
  const simpleProperties: (keyof GameCharacter)[] = ['name', 'species', 'location', 'imageUri', 'notes'];
  
  for (const prop of simpleProperties) {
    if (imported[prop] !== undefined && existing[prop] !== imported[prop]) {
      if (existing[prop] === undefined || existing[prop] === '' || existing[prop] === null) {
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
    const importedData: CharacterDataset = JSON.parse(jsonData);
    
    const mergedCharacters = [...currentData];
    const addedCharacters: GameCharacter[] = [];
    const conflicts: MergeConflict[] = [];

    for (const importedChar of importedData.characters) {
      const existingIndex = currentData.findIndex(current => current.id === importedChar.id);
      
      if (existingIndex === -1) {
        // No conflict - add new character
        addedCharacters.push(importedChar);
        mergedCharacters.push(importedChar);
      } else {
        // Potential conflict - merge properties
        const existing = currentData[existingIndex];
        const { merged, conflicts: propConflicts } = mergeCharacterProperties(existing, importedChar);
        
        if (propConflicts.length > 0) {
          conflicts.push({
            id: importedChar.id,
            existing,
            imported: importedChar,
            conflicts: propConflicts
          });
        }
        
        // Use merged version (even if there are conflicts, we still merge non-conflicting properties)
        mergedCharacters[existingIndex] = merged;
      }
    }

    await saveCharacters(mergedCharacters);
    return true;
  } catch (error) {
    console.error('Error merging datasets:', error);
    return false;
  }
};

// Enhanced merge function that can handle user interaction
export const mergeDatasetWithConflictResolution = async (jsonData: string): Promise<MergeResult> => {
  try {
    const currentData = await loadCharacters();
    const importedData: CharacterDataset = JSON.parse(jsonData);
    
    const mergedCharacters = [...currentData];
    const addedCharacters: GameCharacter[] = [];
    const conflicts: MergeConflict[] = [];

    for (const importedChar of importedData.characters) {
      const existingIndex = currentData.findIndex(current => current.id === importedChar.id);
      
      if (existingIndex === -1) {
        // No conflict - add new character
        addedCharacters.push(importedChar);
        mergedCharacters.push(importedChar);
      } else {
        // Potential conflict - merge properties
        const existing = currentData[existingIndex];
        const { merged, conflicts: propConflicts } = mergeCharacterProperties(existing, importedChar);
        
        if (propConflicts.length > 0) {
          conflicts.push({
            id: importedChar.id,
            existing,
            imported: importedChar,
            conflicts: propConflicts
          });
        }
        
        // Use merged version for now
        mergedCharacters[existingIndex] = merged;
      }
    }

    await saveCharacters(mergedCharacters);
    return {
      success: true,
      conflicts,
      merged: mergedCharacters,
      added: addedCharacters
    };
  } catch (error) {
    console.error('Error merging datasets:', error);
    return {
      success: false,
      conflicts: [],
      merged: [],
      added: []
    };
  }
};

export const toggleCharacterPresent = async (id: string): Promise<GameCharacter | null> => {
  const characters = await loadCharacters();
  const index = characters.findIndex(c => c.id === id);
  
  if (index === -1) return null;
  
  const updatedCharacter: GameCharacter = {
    ...characters[index],
    present: !characters[index].present,
    updatedAt: new Date().toISOString()
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
    updatedAt: new Date().toISOString()
  }));
  
  await saveCharacters(updatedCharacters);
};

export const clearStorage = async (): Promise<void> => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};