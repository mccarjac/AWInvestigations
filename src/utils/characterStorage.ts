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
  return dataset.characters;
};

export const addCharacter = async (character: Omit<GameCharacter, 'id' | 'createdAt' | 'updatedAt'>): Promise<GameCharacter> => {
  const characters = await loadCharacters();
  const newCharacter: GameCharacter = {
    ...character,
    id: uuidv4(),
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

export const mergeDatasets = async (jsonData: string): Promise<boolean> => {
  try {
    const currentData = await loadCharacters();
    const importedData: CharacterDataset = JSON.parse(jsonData);
    
    const mergedCharacters = [
      ...currentData,
      ...importedData.characters.filter(
        imported => !currentData.some(current => current.id === imported.id)
      )
    ];
    
    await saveCharacters(mergedCharacters);
    return true;
  } catch (error) {
    return false;
  }
};

export const clearStorage = async (): Promise<void> => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};