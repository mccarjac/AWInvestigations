import 'react-native-get-random-values';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert, Platform } from 'react-native';
import {
  exportDataset,
  importDataset,
  mergeDatasetWithConflictResolution,
  MergeConflict,
  updateCharacter,
  saveCharacters,
} from './characterStorage';
import {
  GameCharacter,
  Species,
  Location,
  RelationshipStanding,
} from '../models/types';
import { AVAILABLE_PERKS, AVAILABLE_DISTINCTIONS } from '../models/gameData';

/**
 * Handle conflicts by asking the user for each conflicting property
 */
const handleMergeConflicts = async (
  conflicts: MergeConflict[]
): Promise<void> => {
  for (const conflict of conflicts) {
    for (const property of conflict.conflicts) {
      const existingValue = (conflict.existing as any)[property];
      const importedValue = (conflict.imported as any)[property];

      await new Promise<void>(resolve => {
        Alert.alert(
          'Merge Conflict',
          `Character "${conflict.existing.name}" has conflicting ${property}:\n\nExisting: ${existingValue}\nImported: ${importedValue}\n\nWhich value would you like to keep?`,
          [
            {
              text: 'Keep Existing',
              onPress: () => resolve(), // Do nothing, keep existing
            },
            {
              text: 'Use Imported',
              onPress: async () => {
                // Update the character with the imported value
                const updates = { [property]: importedValue };
                await updateCharacter(conflict.id, updates);
                resolve();
              },
            },
            {
              text: 'Skip This Property',
              style: 'cancel',
              onPress: () => resolve(),
            },
          ]
        );
      });
    }
  }
};

/**
 * Export character data for web platform (downloads file directly)
 */
const exportCharacterDataWeb = async (): Promise<void> => {
  try {
    // Get the character data as JSON string
    const jsonData = await exportDataset();

    // Create a filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `character-faction-data-${timestamp}.json`;

    // Create blob and download link for web
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Create temporary download link
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    Alert.alert(
      'Export Complete',
      `Character and faction data has been downloaded as ${filename}`,
      [{ text: 'OK' }]
    );
  } catch (error) {
    console.error('Export error:', error);
    Alert.alert(
      'Export Failed',
      'Failed to export character and faction data. Please try again.',
      [{ text: 'OK' }]
    );
  }
};

/**
 * Export character and faction data for native platforms
 */
const exportCharacterDataNative = async (): Promise<void> => {
  try {
    // Get the character data as JSON string
    const jsonData = await exportDataset();

    // Create a filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `character-faction-data-${timestamp}.json`;

    // Write to a temporary file using legacy API
    const fileUri =
      (FileSystem.cacheDirectory || FileSystem.documentDirectory || '') +
      filename;
    await FileSystem.writeAsStringAsync(fileUri, jsonData);

    // Check if sharing is available
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export Character Data',
      });
    } else {
      Alert.alert(
        'Export Complete',
        `Character and faction data exported to: ${fileUri}`,
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    console.error('Export error:', error);
    Alert.alert(
      'Export Failed',
      'Failed to export character and faction data. Please try again.',
      [{ text: 'OK' }]
    );
  }
};

/**
 * Export character and faction data to a JSON file and share it
 */
export const exportCharacterData = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    await exportCharacterDataWeb();
  } else {
    await exportCharacterDataNative();
  }
};

/**
 * Import character data for web platform
 */
const importCharacterDataWeb = async (): Promise<boolean> => {
  console.log('importCharacterDataWeb called');
  return new Promise(resolve => {
    try {
      console.log('Creating file input element');
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';

      input.onchange = async (event: any) => {
        console.log('File selected', event);
        try {
          const file = event.target?.files?.[0];
          console.log('Selected file:', file);
          if (!file) {
            console.log('No file selected');
            resolve(false);
            return;
          }

          const reader = new FileReader();
          reader.onload = async e => {
            try {
              const fileContent = e.target?.result as string;
              const success = await importDataset(fileContent);

              if (success) {
                Alert.alert(
                  'Import Successful',
                  'Character and faction data has been imported successfully. All existing data has been replaced.',
                  [{ text: 'OK' }]
                );
                resolve(true);
              } else {
                Alert.alert(
                  'Import Failed',
                  'The selected file is not a valid character and faction data file.',
                  [{ text: 'OK' }]
                );
                resolve(false);
              }
            } catch (error) {
              console.error('Import error:', error);
              Alert.alert(
                'Import Failed',
                'Failed to import character data. Please check the file format and try again.',
                [{ text: 'OK' }]
              );
              resolve(false);
            }
          };
          reader.readAsText(file);
        } catch (error) {
          console.error('Import error:', error);
          Alert.alert(
            'Import Failed',
            'Failed to import character data. Please try again.',
            [{ text: 'OK' }]
          );
          resolve(false);
        }
      };

      // Make sure input is attached to DOM for some browsers
      input.style.display = 'none';
      document.body.appendChild(input);
      console.log('Triggering file picker');
      input.click();
      // Clean up after use
      setTimeout(() => {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      }, 1000);
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert(
        'Import Failed',
        'Failed to import character data. Please try again.',
        [{ text: 'OK' }]
      );
      resolve(false);
    }
  });
};

/**
 * Import character data for native platforms
 */
const importCharacterDataNative = async (): Promise<boolean> => {
  try {
    // Pick a document
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return false;
    }

    // Read the file content
    const fileContent = await FileSystem.readAsStringAsync(
      result.assets[0].uri
    );

    // Import the data (this will replace existing data)
    const success = await importDataset(fileContent);

    if (success) {
      Alert.alert(
        'Import Successful',
        'Character and faction data has been imported successfully. All existing data has been replaced.',
        [{ text: 'OK' }]
      );
      return true;
    } else {
      Alert.alert(
        'Import Failed',
        'The selected file is not a valid character and faction data file.',
        [{ text: 'OK' }]
      );
      return false;
    }
  } catch (error) {
    console.error('Import error:', error);
    Alert.alert(
      'Import Failed',
      'Failed to import character data. Please check the file format and try again.',
      [{ text: 'OK' }]
    );
    return false;
  }
};

/**
 * Import character data from a JSON file (replaces existing data)
 */
export const importCharacterData = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return await importCharacterDataWeb();
  } else {
    return await importCharacterDataNative();
  }
};

/**
 * Merge character and faction data for web platform
 */
const mergeCharacterDataWeb = async (): Promise<boolean> => {
  return new Promise(resolve => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';

      input.onchange = async (event: any) => {
        try {
          const file = event.target?.files?.[0];
          if (!file) {
            resolve(false);
            return;
          }

          const reader = new FileReader();
          reader.onload = async e => {
            try {
              const fileContent = e.target?.result as string;
              const result =
                await mergeDatasetWithConflictResolution(fileContent);

              if (result.success) {
                if (result.conflicts.length > 0) {
                  Alert.alert(
                    'Conflicts Found',
                    `Found ${result.conflicts.length} character(s) with conflicts. You'll be asked to resolve each conflict.`,
                    [
                      {
                        text: 'Resolve Conflicts',
                        onPress: async () => {
                          await handleMergeConflicts(result.conflicts);
                          Alert.alert(
                            'Merge Complete',
                            `Successfully merged ${result.added.length} new characters and factions, and resolved conflicts for ${result.conflicts.length} existing characters.`,
                            [{ text: 'OK' }]
                          );
                        },
                      },
                      {
                        text: 'Skip Conflicts',
                        style: 'cancel',
                        onPress: () => {
                          Alert.alert(
                            'Merge Complete',
                            `Successfully merged ${result.added.length} new characters and factions. Conflicts were resolved automatically by merging compatible properties.`,
                            [{ text: 'OK' }]
                          );
                        },
                      },
                    ]
                  );
                } else {
                  Alert.alert(
                    'Merge Successful',
                    `Successfully merged ${result.added.length} new characters and factions with no conflicts.`,
                    [{ text: 'OK' }]
                  );
                }
                resolve(true);
              } else {
                Alert.alert(
                  'Merge Failed',
                  'The selected file is not a valid character data file.',
                  [{ text: 'OK' }]
                );
                resolve(false);
              }
            } catch (error) {
              console.error('Merge error:', error);
              Alert.alert(
                'Merge Failed',
                'Failed to merge character and faction data. Please check the file format and try again.',
                [{ text: 'OK' }]
              );
              resolve(false);
            }
          };
          reader.readAsText(file);
        } catch (error) {
          console.error('Merge error:', error);
          Alert.alert(
            'Merge Failed',
            'Failed to merge character and faction data. Please try again.',
            [{ text: 'OK' }]
          );
          resolve(false);
        }
      };

      // Make sure input is attached to DOM for some browsers
      input.style.display = 'none';
      document.body.appendChild(input);
      input.click();
      // Clean up after use
      setTimeout(() => {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      }, 1000);
    } catch (error) {
      console.error('Merge error:', error);
      Alert.alert(
        'Merge Failed',
        'Failed to merge character and faction data. Please try again.',
        [{ text: 'OK' }]
      );
      resolve(false);
    }
  });
};

/**
 * Merge character and faction data for native platforms
 */
const mergeCharacterDataNative = async (): Promise<boolean> => {
  try {
    // Pick a document
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return false;
    }

    // Read the file content
    const fileContent = await FileSystem.readAsStringAsync(
      result.assets[0].uri
    );

    // Merge the data with conflict resolution
    const result_merge = await mergeDatasetWithConflictResolution(fileContent);

    if (result_merge.success) {
      if (result_merge.conflicts.length > 0) {
        Alert.alert(
          'Conflicts Found',
          `Found ${result_merge.conflicts.length} character(s) with conflicts. You'll be asked to resolve each conflict.`,
          [
            {
              text: 'Resolve Conflicts',
              onPress: async () => {
                await handleMergeConflicts(result_merge.conflicts);
                Alert.alert(
                  'Merge Complete',
                  `Successfully merged ${result_merge.added.length} new characters and factions, and resolved conflicts for ${result_merge.conflicts.length} existing characters.`,
                  [{ text: 'OK' }]
                );
              },
            },
            {
              text: 'Skip Conflicts',
              style: 'cancel',
              onPress: () => {
                Alert.alert(
                  'Merge Complete',
                  `Successfully merged ${result_merge.added.length} new characters and factions. Conflicts were resolved automatically by merging compatible properties.`,
                  [{ text: 'OK' }]
                );
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Merge Successful',
          `Successfully merged ${result_merge.added.length} new characters and factions with no conflicts.`,
          [{ text: 'OK' }]
        );
      }
      return true;
    } else {
      Alert.alert(
        'Merge Failed',
        'The selected file is not a valid character data file.',
        [{ text: 'OK' }]
      );
      return false;
    }
  } catch (error) {
    console.error('Merge error:', error);
    Alert.alert(
      'Merge Failed',
      'Failed to merge character and faction data. Please check the file format and try again.',
      [{ text: 'OK' }]
    );
    return false;
  }
};

/**
 * Import and merge character and faction data from a JSON file (keeps existing data)
 */
export const mergeCharacterData = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return await mergeCharacterDataWeb();
  } else {
    return await mergeCharacterDataNative();
  }
};

/**
 * Show import options dialog
 */
export const showImportOptions = (): void => {
  console.log('showImportOptions called');
  Alert.alert(
    'Import Options',
    'Choose how to import character and faction data:',
    [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => console.log('Import cancelled'),
      },
      {
        text: 'Replace All',
        onPress: async () => {
          console.log('Replace All selected');
          await importCharacterData();
        },
        style: 'destructive',
      },
      {
        text: 'Merge',
        onPress: async () => {
          console.log('Merge selected');
          await mergeCharacterData();
        },
      },
    ]
  );
};

/**
 * Cross-platform alert function
 */
const showAlert = (title: string, message: string): void => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message, [{ text: 'OK' }]);
  }
};

/**
 * Map location string to Location enum value
 */
const mapLocationString = (locationStr: string): Location => {
  const normalizedStr = locationStr.toLowerCase().trim();

  // Handle common location mappings
  if (normalizedStr.includes('hospital')) return Location.Hospital;
  if (normalizedStr.includes('garage') || normalizedStr.includes('repair hall'))
    return Location.Garage;
  if (normalizedStr.includes('craft') || normalizedStr.includes('crafting'))
    return Location.CraftingHall;
  if (normalizedStr.includes('downtown') || normalizedStr.includes('sprawl'))
    return Location.Downtown;
  if (normalizedStr.includes('sanguine') || normalizedStr.includes('spring'))
    return Location.SanguineSprings;
  if (normalizedStr.includes('grimerust') || normalizedStr.includes('grimer'))
    return Location.GrimerustHeights;

  // Default to Unknown for unrecognized locations
  return Location.Unknown;
};

/**
 * Parse a CSV line properly handling quoted fields with commas
 */
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Start or end quote
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add the last field
  result.push(current.trim());

  return result;
};

/**
 * Parse CSV content and convert to character data
 */
const parseCSVToCharacters = (csvContent: string): GameCharacter[] => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV must have at least 2 lines (header and data)');
  }

  // Parse headers - first column is the property name, rest are character names
  const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, ''));
  const characterNames = headers.slice(1).filter(name => name.length > 0);

  if (characterNames.length === 0) {
    throw new Error('No character names found in CSV headers');
  }

  // Initialize characters
  const characters: Partial<GameCharacter>[] = characterNames.map(name => ({
    id: `csv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    species: 'Unknown' as Species,
    perkIds: [],
    distinctionIds: [],
    relationships: [],
    factions: [],
    present: false, // Default to not present
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  // Process each data line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = parseCSVLine(line).map(v => v.replace(/"/g, ''));
    const propertyName = values[0];

    if (!propertyName) continue;

    // Handle different property types
    if (propertyName.toLowerCase() === 'species') {
      // Set species for each character
      for (let j = 1; j < values.length && j - 1 < characters.length; j++) {
        const speciesValue = values[j];
        if (speciesValue && speciesValue !== '') {
          characters[j - 1].species = speciesValue as Species;
        }
      }
    } else if (
      propertyName.toLowerCase() === 'location' ||
      propertyName.toLowerCase() === 'frequently located'
    ) {
      // Set location for each character
      for (let j = 1; j < values.length && j - 1 < characters.length; j++) {
        const locationValue = values[j];
        if (locationValue && locationValue !== '') {
          characters[j - 1].location = mapLocationString(locationValue);
        }
      }
    } else if (propertyName.toLowerCase() === 'notes') {
      // Set notes for each character
      for (let j = 1; j < values.length && j - 1 < characters.length; j++) {
        const notesValue = values[j];
        if (notesValue && notesValue !== '') {
          characters[j - 1].notes = notesValue;
        }
      }
    } else if (propertyName.toLowerCase() === 'occupation') {
      // Set occupation for each character
      for (let j = 1; j < values.length && j - 1 < characters.length; j++) {
        const occupationValue = values[j];
        if (occupationValue && occupationValue !== '') {
          characters[j - 1].occupation = occupationValue;
        }
      }
    } else if (
      propertyName.toLowerCase() === 'factions' ||
      propertyName.toLowerCase() === 'faction'
    ) {
      // Set factions for each character with Ally standing (supports comma-separated list)
      console.log(`Processing factions row with values:`, values);
      for (let j = 1; j < values.length && j - 1 < characters.length; j++) {
        const factionValue = values[j];
        console.log(
          `Character ${characters[j - 1].name} faction value: "${factionValue}"`
        );
        if (factionValue && factionValue !== '' && factionValue !== 'Unknown') {
          // Initialize factions array if it doesn't exist
          if (!characters[j - 1].factions) {
            characters[j - 1].factions = [];
          }

          // Split by comma or semicolon and process each faction
          const separator = factionValue.includes(';') ? ';' : ',';
          const factionNames = factionValue
            .split(separator)
            .map(name => name.trim())
            .filter(name => name.length > 0);
          console.log(
            `Raw faction value for ${characters[j - 1].name}: "${factionValue}"`
          );
          console.log(`Using separator: "${separator}"`);
          console.log(
            `Split result: [${factionNames.map(f => `"${f}"`).join(', ')}]`
          );
          console.log(`Number of factions found: ${factionNames.length}`);

          for (const factionName of factionNames) {
            // Check if faction already exists to avoid duplicates
            const existingFaction = characters[j - 1].factions!.find(
              f => f.name === factionName
            );
            if (!existingFaction) {
              // Add faction with Ally standing
              characters[j - 1].factions!.push({
                name: factionName,
                standing: RelationshipStanding.Ally,
                description: `Imported from CSV as ally`,
              });
              console.log(
                `Added faction "${factionName}" to ${characters[j - 1].name}`
              );
            } else {
              console.log(
                `Faction "${factionName}" already exists for ${characters[j - 1].name}`
              );
            }
          }
        }
        console.log(
          `${characters[j - 1].name} now has ${characters[j - 1].factions?.length || 0} factions:`,
          characters[j - 1].factions?.map(f => f.name) || []
        );
      }
    } else {
      // Check if it's a perk or distinction
      const perk = AVAILABLE_PERKS.find(p => p.name === propertyName);
      const distinction = AVAILABLE_DISTINCTIONS.find(
        d => d.name === propertyName
      );

      if (perk) {
        // Handle perk
        for (let j = 1; j < values.length && j - 1 < characters.length; j++) {
          const hasValue = values[j];
          if (
            hasValue &&
            (hasValue.toLowerCase() === 'true' ||
              hasValue.toLowerCase() === '1')
          ) {
            characters[j - 1].perkIds!.push(perk.id);
          }
        }
      } else if (distinction) {
        // Handle distinction
        for (let j = 1; j < values.length && j - 1 < characters.length; j++) {
          const hasValue = values[j];
          if (
            hasValue &&
            (hasValue.toLowerCase() === 'true' ||
              hasValue.toLowerCase() === '1')
          ) {
            characters[j - 1].distinctionIds!.push(distinction.id);
          }
        }
      }
      // Skip other properties for now (like notes, locations, etc.)
    }
  }

  // Debug log final character data
  console.log(
    'Final parsed characters:',
    characters.map(c => ({
      name: c.name,
      factions: c.factions,
      species: c.species,
      location: c.location,
    }))
  );

  return characters as GameCharacter[];
};

/**
 * Import characters from CSV file (web version)
 */
const importCSVCharactersWeb = async (): Promise<boolean> => {
  try {
    return new Promise<boolean>(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv';
      input.style.display = 'none';

      input.onchange = async (event: any) => {
        try {
          const file = event.target.files[0];
          if (!file) {
            resolve(false);
            return;
          }

          const reader = new FileReader();
          reader.onload = async e => {
            try {
              const csvContent = e.target?.result as string;
              const characters = parseCSVToCharacters(csvContent);

              // Save the characters
              await saveCharacters(characters);

              showAlert(
                'CSV Import Successful',
                `Successfully imported ${characters.length} characters from CSV.`
              );
              resolve(true);
            } catch (error) {
              console.error('CSV parsing error:', error);
              showAlert(
                'CSV Import Failed',
                `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
              resolve(false);
            }
          };

          reader.onerror = () => {
            showAlert('File Read Error', 'Failed to read the selected file.');
            resolve(false);
          };

          reader.readAsText(file);
        } catch (error) {
          console.error('File selection error:', error);
          resolve(false);
        }
      };

      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    });
  } catch (error) {
    console.error('CSV import error:', error);
    showAlert(
      'CSV Import Failed',
      'Failed to import CSV data. Please check the file format and try again.'
    );
    return false;
  }
};

/**
 * Import characters from CSV file (native version)
 */
const importCSVCharactersNative = async (): Promise<boolean> => {
  try {
    console.log('Starting native CSV import...');
    const result = await DocumentPicker.getDocumentAsync({
      type: 'text/csv',
      copyToCacheDirectory: true,
    });

    console.log('Document picker result:', result);

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      console.log('Selected file:', asset);

      // Read the file content
      const fileContent = await FileSystem.readAsStringAsync(asset.uri);
      console.log('File content length:', fileContent.length);

      const characters = parseCSVToCharacters(fileContent);

      // Save the characters
      await saveCharacters(characters);

      showAlert(
        'CSV Import Successful',
        `Successfully imported ${characters.length} characters from CSV.`
      );
      return true;
    } else {
      console.log('CSV import cancelled or no file selected');
      return false;
    }
  } catch (error) {
    console.error('CSV import error:', error);
    showAlert(
      'CSV Import Failed',
      `Failed to import CSV data: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return false;
  }
};

/**
 * Import characters from CSV file (cross-platform)
 */
export const importCSVCharacters = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return await importCSVCharactersWeb();
  } else {
    return await importCSVCharactersNative();
  }
};
