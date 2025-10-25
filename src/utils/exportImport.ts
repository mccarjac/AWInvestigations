import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert, Platform } from 'react-native';
import { exportDataset, importDataset, mergeDatasets, mergeDatasetWithConflictResolution, MergeResult, MergeConflict, updateCharacter } from './characterStorage';

/**
 * Handle conflicts by asking the user for each conflicting property
 */
const handleMergeConflicts = async (conflicts: MergeConflict[]): Promise<void> => {
  for (const conflict of conflicts) {
    for (const property of conflict.conflicts) {
      const existingValue = (conflict.existing as any)[property];
      const importedValue = (conflict.imported as any)[property];
      
      await new Promise<void>((resolve) => {
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
    const filename = `character-data-${timestamp}.json`;
    
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
      `Character data has been downloaded as ${filename}`,
      [{ text: 'OK' }]
    );
  } catch (error) {
    console.error('Export error:', error);
    Alert.alert(
      'Export Failed',
      'Failed to export character data. Please try again.',
      [{ text: 'OK' }]
    );
  }
};

/**
 * Export character data for native platforms
 */
const exportCharacterDataNative = async (): Promise<void> => {
  try {
    // Get the character data as JSON string
    const jsonData = await exportDataset();
    
    // Create a filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `character-data-${timestamp}.json`;
    
    // Write to a temporary file using legacy API
    const fileUri = (FileSystem.cacheDirectory || FileSystem.documentDirectory || '') + filename;
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
        `Character data exported to: ${fileUri}`,
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    console.error('Export error:', error);
    Alert.alert(
      'Export Failed',
      'Failed to export character data. Please try again.',
      [{ text: 'OK' }]
    );
  }
};

/**
 * Export character data to a JSON file and share it
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
  return new Promise((resolve) => {
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
          reader.onload = async (e) => {
            try {
              const fileContent = e.target?.result as string;
              const success = await importDataset(fileContent);
              
              if (success) {
                Alert.alert(
                  'Import Successful',
                  'Character data has been imported successfully. All existing data has been replaced.',
                  [{ text: 'OK' }]
                );
                resolve(true);
              } else {
                Alert.alert(
                  'Import Failed',
                  'The selected file is not a valid character data file.',
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
    const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
    
    // Import the data (this will replace existing data)
    const success = await importDataset(fileContent);
    
    if (success) {
      Alert.alert(
        'Import Successful',
        'Character data has been imported successfully. All existing data has been replaced.',
        [{ text: 'OK' }]
      );
      return true;
    } else {
      Alert.alert(
        'Import Failed',
        'The selected file is not a valid character data file.',
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
 * Merge character data for web platform
 */
const mergeCharacterDataWeb = async (): Promise<boolean> => {
  return new Promise((resolve) => {
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
          reader.onload = async (e) => {
            try {
              const fileContent = e.target?.result as string;
              const result = await mergeDatasetWithConflictResolution(fileContent);
              
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
                            `Successfully merged ${result.added.length} new characters and resolved conflicts for ${result.conflicts.length} existing characters.`,
                            [{ text: 'OK' }]
                          );
                        }
                      },
                      {
                        text: 'Skip Conflicts',
                        style: 'cancel',
                        onPress: () => {
                          Alert.alert(
                            'Merge Complete',
                            `Successfully merged ${result.added.length} new characters. Conflicts were resolved automatically by merging compatible properties.`,
                            [{ text: 'OK' }]
                          );
                        }
                      }
                    ]
                  );
                } else {
                  Alert.alert(
                    'Merge Successful',
                    `Successfully merged ${result.added.length} new characters with no conflicts.`,
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
                'Failed to merge character data. Please check the file format and try again.',
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
            'Failed to merge character data. Please try again.',
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
        'Failed to merge character data. Please try again.',
        [{ text: 'OK' }]
      );
      resolve(false);
    }
  });
};

/**
 * Merge character data for native platforms
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
    const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
    
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
                  `Successfully merged ${result_merge.added.length} new characters and resolved conflicts for ${result_merge.conflicts.length} existing characters.`,
                  [{ text: 'OK' }]
                );
              }
            },
            {
              text: 'Skip Conflicts',
              style: 'cancel',
              onPress: () => {
                Alert.alert(
                  'Merge Complete',
                  `Successfully merged ${result_merge.added.length} new characters. Conflicts were resolved automatically by merging compatible properties.`,
                  [{ text: 'OK' }]
                );
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Merge Successful',
          `Successfully merged ${result_merge.added.length} new characters with no conflicts.`,
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
      'Failed to merge character data. Please check the file format and try again.',
      [{ text: 'OK' }]
    );
    return false;
  }
};

/**
 * Import and merge character data from a JSON file (keeps existing data)
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
    'Choose how to import character data:',
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