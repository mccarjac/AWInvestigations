import 'react-native-get-random-values';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert, Platform } from 'react-native';
import JSZip from 'jszip';
import {
  exportDataset,
  importDataset,
  mergeDatasetWithConflictResolution,
  MergeConflict,
  updateCharacter,
  saveCharacters,
} from './characterStorage';
import { GameCharacter, Species, RelationshipStanding } from '../models/types';
import { AVAILABLE_PERKS, AVAILABLE_DISTINCTIONS } from '../models/gameData';

/**
 * Extract image data from a data URI
 */
const extractImageData = (
  dataUri: string
): { mimeType: string; base64Data: string; extension: string } | null => {
  const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) return null;

  const mimeType = matches[1];
  const base64Data = matches[2];
  const extension = mimeType.split('/')[1] || 'jpg';

  return { mimeType, base64Data, extension };
};

/**
 * Create a data URI from image data
 */
const createDataUri = (mimeType: string, base64Data: string): string => {
  return `data:${mimeType};base64,${base64Data}`;
};

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
 * Export character data for web platform (downloads zip file with images)
 */
const exportCharacterDataWeb = async (): Promise<void> => {
  try {
    // Get the character data as JSON string
    const jsonData = await exportDataset();
    const dataset = JSON.parse(jsonData);

    // Create a new ZIP file
    const zip = new JSZip();

    // Track image references and replace URIs with file paths
    const imageMap = new Map<string, string>();
    let imageCounter = 0;

    // Process character images
    if (dataset.characters) {
      for (const character of dataset.characters) {
        if (character.imageUri && character.imageUri.startsWith('data:')) {
          const imageData = extractImageData(character.imageUri);
          if (imageData) {
            const filename = `images/characters/${character.id}.${imageData.extension}`;
            zip.file(filename, imageData.base64Data, { base64: true });
            imageMap.set(character.imageUri, filename);
            character.imageUri = filename; // Replace URI with relative path
            imageCounter++;
          }
        }
      }
    }

    // Process location images
    if (dataset.locations) {
      for (const location of dataset.locations) {
        if (location.imageUri && location.imageUri.startsWith('data:')) {
          const imageData = extractImageData(location.imageUri);
          if (imageData) {
            const filename = `images/locations/${location.id}.${imageData.extension}`;
            zip.file(filename, imageData.base64Data, { base64: true });
            imageMap.set(location.imageUri, filename);
            location.imageUri = filename; // Replace URI with relative path
            imageCounter++;
          }
        }
      }
    }

    // Process event images
    if (dataset.events) {
      for (const event of dataset.events) {
        if (event.imageUri && event.imageUri.startsWith('data:')) {
          const imageData = extractImageData(event.imageUri);
          if (imageData) {
            const filename = `images/events/${event.id}.${imageData.extension}`;
            zip.file(filename, imageData.base64Data, { base64: true });
            imageMap.set(event.imageUri, filename);
            event.imageUri = filename; // Replace URI with relative path
            imageCounter++;
          }
        }
      }
    }

    // Add the modified JSON to the zip
    zip.file('data.json', JSON.stringify(dataset, null, 2));

    // Generate the zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Create a filename with timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '');
    const filename = `character-faction-data-${timestamp}.zip`;

    // Create download link for web
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    Alert.alert(
      'Export Complete',
      `Character and faction data has been downloaded as ${filename}${imageCounter > 0 ? ` (includes ${imageCounter} images)` : ''}`,
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
 * Export character and faction data for native platforms (creates zip with images)
 */
const exportCharacterDataNative = async (): Promise<void> => {
  try {
    // Get the character data as JSON string
    const jsonData = await exportDataset();
    const dataset = JSON.parse(jsonData);

    // Create a new ZIP file
    const zip = new JSZip();

    // Track image references and replace URIs with file paths
    let imageCounter = 0;

    // Process character images
    if (dataset.characters) {
      for (const character of dataset.characters) {
        if (character.imageUri && character.imageUri.startsWith('data:')) {
          const imageData = extractImageData(character.imageUri);
          if (imageData) {
            const filename = `images/characters/${character.id}.${imageData.extension}`;
            zip.file(filename, imageData.base64Data, { base64: true });
            character.imageUri = filename; // Replace URI with relative path
            imageCounter++;
          }
        }
      }
    }

    // Process location images
    if (dataset.locations) {
      for (const location of dataset.locations) {
        if (location.imageUri && location.imageUri.startsWith('data:')) {
          const imageData = extractImageData(location.imageUri);
          if (imageData) {
            const filename = `images/locations/${location.id}.${imageData.extension}`;
            zip.file(filename, imageData.base64Data, { base64: true });
            location.imageUri = filename; // Replace URI with relative path
            imageCounter++;
          }
        }
      }
    }

    // Process event images
    if (dataset.events) {
      for (const event of dataset.events) {
        if (event.imageUri && event.imageUri.startsWith('data:')) {
          const imageData = extractImageData(event.imageUri);
          if (imageData) {
            const filename = `images/events/${event.id}.${imageData.extension}`;
            zip.file(filename, imageData.base64Data, { base64: true });
            event.imageUri = filename; // Replace URI with relative path
            imageCounter++;
          }
        }
      }
    }

    // Add the modified JSON to the zip
    zip.file('data.json', JSON.stringify(dataset, null, 2));

    // Generate the zip file as base64
    const zipBase64 = await zip.generateAsync({ type: 'base64' });

    // Create a filename with timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '');
    const filename = `character-faction-data-${timestamp}.zip`;

    // Write to a temporary file
    const fileUri =
      (FileSystem.cacheDirectory || FileSystem.documentDirectory || '') +
      filename;
    await FileSystem.writeAsStringAsync(fileUri, zipBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Check if sharing is available
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/zip',
        dialogTitle: 'Export Character Data',
      });
    } else {
      Alert.alert(
        'Export Complete',
        `Character and faction data exported to: ${fileUri}${imageCounter > 0 ? ` (includes ${imageCounter} images)` : ''}`,
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
 * Import character data for web platform (supports both JSON and ZIP files)
 */
const importCharacterDataWeb = async (): Promise<boolean> => {
  console.log('importCharacterDataWeb called');
  return new Promise(resolve => {
    try {
      console.log('Creating file input element');
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,.zip,application/json,application/zip';

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

          const isZip = file.name.endsWith('.zip');

          if (isZip) {
            // Handle ZIP file
            const arrayBuffer = await file.arrayBuffer();
            const zip = new JSZip();
            const zipContent = await zip.loadAsync(arrayBuffer);

            // Extract data.json
            const dataFile = zipContent.file('data.json');
            if (!dataFile) {
              Alert.alert(
                'Import Failed',
                'Invalid zip file: data.json not found.',
                [{ text: 'OK' }]
              );
              resolve(false);
              return;
            }

            const jsonContent = await dataFile.async('text');
            const dataset = JSON.parse(jsonContent);

            // Extract and restore images
            const imageFiles = zipContent.folder('images');
            if (imageFiles) {
              const allFiles = Object.keys(zipContent.files);

              for (const filePath of allFiles) {
                if (filePath.startsWith('images/')) {
                  const file = zipContent.file(filePath);
                  if (file) {
                    const base64Data = await file.async('base64');

                    // Determine mime type from extension
                    const extension = filePath.split('.').pop()?.toLowerCase();
                    const mimeType =
                      extension === 'png'
                        ? 'image/png'
                        : extension === 'jpg' || extension === 'jpeg'
                          ? 'image/jpeg'
                          : extension === 'gif'
                            ? 'image/gif'
                            : 'image/jpeg';

                    const dataUri = createDataUri(mimeType, base64Data);

                    // Find and update the corresponding character, location, or event
                    if (filePath.startsWith('images/characters/')) {
                      const characterId = filePath
                        .split('/')
                        .pop()
                        ?.split('.')[0];
                      const character = dataset.characters?.find(
                        (c: any) => c.id === characterId
                      );
                      if (character) {
                        character.imageUri = dataUri;
                      }
                    } else if (filePath.startsWith('images/locations/')) {
                      const locationId = filePath
                        .split('/')
                        .pop()
                        ?.split('.')[0];
                      const location = dataset.locations?.find(
                        (l: any) => l.id === locationId
                      );
                      if (location) {
                        location.imageUri = dataUri;
                      }
                    } else if (filePath.startsWith('images/events/')) {
                      const eventId = filePath.split('/').pop()?.split('.')[0];
                      const event = dataset.events?.find(
                        (e: any) => e.id === eventId
                      );
                      if (event) {
                        event.imageUri = dataUri;
                      }
                    }
                  }
                }
              }
            }

            // Import the dataset
            const success = await importDataset(JSON.stringify(dataset));

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
          } else {
            // Handle JSON file (without images - strip imageUri fields)
            const reader = new FileReader();
            reader.onload = async e => {
              try {
                const fileContent = e.target?.result as string;
                const dataset = JSON.parse(fileContent);

                // Strip imageUri from all characters
                if (dataset.characters) {
                  dataset.characters.forEach((character: any) => {
                    delete character.imageUri;
                  });
                }

                // Strip imageUri from all locations
                if (dataset.locations) {
                  dataset.locations.forEach((location: any) => {
                    delete location.imageUri;
                  });
                }

                const success = await importDataset(JSON.stringify(dataset));

                if (success) {
                  Alert.alert(
                    'Import Successful',
                    'Character and faction data has been imported successfully (without images). All existing data has been replaced.',
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
          }
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
 * Import character data for native platforms (supports both JSON and ZIP files)
 */
const importCharacterDataNative = async (): Promise<boolean> => {
  try {
    // Pick a document
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'application/zip'],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return false;
    }

    const fileUri = result.assets[0].uri;
    const fileName = result.assets[0].name;
    const isZip = fileName.endsWith('.zip');

    if (isZip) {
      // Handle ZIP file
      const base64Content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const zip = new JSZip();
      const zipContent = await zip.loadAsync(base64Content, { base64: true });

      // Extract data.json
      const dataFile = zipContent.file('data.json');
      if (!dataFile) {
        Alert.alert('Import Failed', 'Invalid zip file: data.json not found.', [
          { text: 'OK' },
        ]);
        return false;
      }

      const jsonContent = await dataFile.async('text');
      const dataset = JSON.parse(jsonContent);

      // Extract and restore images
      const allFiles = Object.keys(zipContent.files);

      for (const filePath of allFiles) {
        if (filePath.startsWith('images/')) {
          const file = zipContent.file(filePath);
          if (file) {
            const base64Data = await file.async('base64');

            // Determine mime type from extension
            const extension = filePath.split('.').pop()?.toLowerCase();
            const mimeType =
              extension === 'png'
                ? 'image/png'
                : extension === 'jpg' || extension === 'jpeg'
                  ? 'image/jpeg'
                  : extension === 'gif'
                    ? 'image/gif'
                    : 'image/jpeg';

            const dataUri = createDataUri(mimeType, base64Data);

            // Find and update the corresponding character, location, or event
            if (filePath.startsWith('images/characters/')) {
              const characterId = filePath.split('/').pop()?.split('.')[0];
              const character = dataset.characters?.find(
                (c: any) => c.id === characterId
              );
              if (character) {
                character.imageUri = dataUri;
              }
            } else if (filePath.startsWith('images/locations/')) {
              const locationId = filePath.split('/').pop()?.split('.')[0];
              const location = dataset.locations?.find(
                (l: any) => l.id === locationId
              );
              if (location) {
                location.imageUri = dataUri;
              }
            } else if (filePath.startsWith('images/events/')) {
              const eventId = filePath.split('/').pop()?.split('.')[0];
              const event = dataset.events?.find((e: any) => e.id === eventId);
              if (event) {
                event.imageUri = dataUri;
              }
            }
          }
        }
      }

      // Import the dataset
      const success = await importDataset(JSON.stringify(dataset));

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
    } else {
      // Handle JSON file (without images - strip imageUri fields)
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      const dataset = JSON.parse(fileContent);

      // Strip imageUri from all characters
      if (dataset.characters) {
        dataset.characters.forEach((character: any) => {
          delete character.imageUri;
        });
      }

      // Strip imageUri from all locations
      if (dataset.locations) {
        dataset.locations.forEach((location: any) => {
          delete location.imageUri;
        });
      }

      const success = await importDataset(JSON.stringify(dataset));

      if (success) {
        Alert.alert(
          'Import Successful',
          'Character and faction data has been imported successfully (without images). All existing data has been replaced.',
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
 * Merge character and faction data for web platform (supports both JSON and ZIP files)
 */
const mergeCharacterDataWeb = async (): Promise<boolean> => {
  return new Promise(resolve => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,.zip,application/json,application/zip';

      input.onchange = async (event: any) => {
        try {
          const file = event.target?.files?.[0];
          if (!file) {
            resolve(false);
            return;
          }

          const isZip = file.name.endsWith('.zip');
          let fileContent: string;

          if (isZip) {
            // Handle ZIP file
            const arrayBuffer = await file.arrayBuffer();
            const zip = new JSZip();
            const zipContent = await zip.loadAsync(arrayBuffer);

            // Extract data.json
            const dataFile = zipContent.file('data.json');
            if (!dataFile) {
              Alert.alert(
                'Merge Failed',
                'Invalid zip file: data.json not found.',
                [{ text: 'OK' }]
              );
              resolve(false);
              return;
            }

            const jsonContent = await dataFile.async('text');
            const dataset = JSON.parse(jsonContent);

            // Extract and restore images
            const allFiles = Object.keys(zipContent.files);

            for (const filePath of allFiles) {
              if (filePath.startsWith('images/')) {
                const file = zipContent.file(filePath);
                if (file) {
                  const base64Data = await file.async('base64');

                  // Determine mime type from extension
                  const extension = filePath.split('.').pop()?.toLowerCase();
                  const mimeType =
                    extension === 'png'
                      ? 'image/png'
                      : extension === 'jpg' || extension === 'jpeg'
                        ? 'image/jpeg'
                        : extension === 'gif'
                          ? 'image/gif'
                          : 'image/jpeg';

                  const dataUri = createDataUri(mimeType, base64Data);

                  // Find and update the corresponding character, location, or event
                  if (filePath.startsWith('images/characters/')) {
                    const characterId = filePath
                      .split('/')
                      .pop()
                      ?.split('.')[0];
                    const character = dataset.characters?.find(
                      (c: any) => c.id === characterId
                    );
                    if (character) {
                      character.imageUri = dataUri;
                    }
                  } else if (filePath.startsWith('images/locations/')) {
                    const locationId = filePath.split('/').pop()?.split('.')[0];
                    const location = dataset.locations?.find(
                      (l: any) => l.id === locationId
                    );
                    if (location) {
                      location.imageUri = dataUri;
                    }
                  } else if (filePath.startsWith('images/events/')) {
                    const eventId = filePath.split('/').pop()?.split('.')[0];
                    const event = dataset.events?.find(
                      (e: any) => e.id === eventId
                    );
                    if (event) {
                      event.imageUri = dataUri;
                    }
                  }
                }
              }
            }

            fileContent = JSON.stringify(dataset);
          } else {
            // Handle JSON file (without images - strip imageUri fields)
            const reader = new FileReader();
            const readerPromise = new Promise<string>((res, rej) => {
              reader.onload = e => res(e.target?.result as string);
              reader.onerror = () => rej(new Error('Failed to read file'));
            });
            reader.readAsText(file);
            const jsonContent = await readerPromise;
            const dataset = JSON.parse(jsonContent);

            // Strip imageUri from all characters
            if (dataset.characters) {
              dataset.characters.forEach((character: any) => {
                delete character.imageUri;
              });
            }

            // Strip imageUri from all locations
            if (dataset.locations) {
              dataset.locations.forEach((location: any) => {
                delete location.imageUri;
              });
            }

            fileContent = JSON.stringify(dataset);
          }

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
 * Merge character and faction data for native platforms (supports both JSON and ZIP files)
 */
const mergeCharacterDataNative = async (): Promise<boolean> => {
  try {
    // Pick a document
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'application/zip'],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return false;
    }

    const fileUri = result.assets[0].uri;
    const fileName = result.assets[0].name;
    const isZip = fileName.endsWith('.zip');

    let fileContent: string;

    if (isZip) {
      // Handle ZIP file
      const base64Content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const zip = new JSZip();
      const zipContent = await zip.loadAsync(base64Content, { base64: true });

      // Extract data.json
      const dataFile = zipContent.file('data.json');
      if (!dataFile) {
        Alert.alert('Merge Failed', 'Invalid zip file: data.json not found.', [
          { text: 'OK' },
        ]);
        return false;
      }

      const jsonContent = await dataFile.async('text');
      const dataset = JSON.parse(jsonContent);

      // Extract and restore images
      const allFiles = Object.keys(zipContent.files);

      for (const filePath of allFiles) {
        if (filePath.startsWith('images/')) {
          const file = zipContent.file(filePath);
          if (file) {
            const base64Data = await file.async('base64');

            // Determine mime type from extension
            const extension = filePath.split('.').pop()?.toLowerCase();
            const mimeType =
              extension === 'png'
                ? 'image/png'
                : extension === 'jpg' || extension === 'jpeg'
                  ? 'image/jpeg'
                  : extension === 'gif'
                    ? 'image/gif'
                    : 'image/jpeg';

            const dataUri = createDataUri(mimeType, base64Data);

            // Find and update the corresponding character or location
            if (filePath.startsWith('images/characters/')) {
              const characterId = filePath.split('/').pop()?.split('.')[0];
              const character = dataset.characters?.find(
                (c: any) => c.id === characterId
              );
              if (character) {
                character.imageUri = dataUri;
              }
            } else if (filePath.startsWith('images/locations/')) {
              const locationId = filePath.split('/').pop()?.split('.')[0];
              const location = dataset.locations?.find(
                (l: any) => l.id === locationId
              );
              if (location) {
                location.imageUri = dataUri;
              }
            } else if (filePath.startsWith('images/events/')) {
              const eventId = filePath.split('/').pop()?.split('.')[0];
              const event = dataset.events?.find((e: any) => e.id === eventId);
              if (event) {
                event.imageUri = dataUri;
              }
            }
          }
        }
      }

      fileContent = JSON.stringify(dataset);
    } else {
      // Handle JSON file (without images - strip imageUri fields)
      const jsonContent = await FileSystem.readAsStringAsync(fileUri);
      const dataset = JSON.parse(jsonContent);

      // Strip imageUri from all characters
      if (dataset.characters) {
        dataset.characters.forEach((character: any) => {
          delete character.imageUri;
        });
      }

      // Strip imageUri from all locations
      if (dataset.locations) {
        dataset.locations.forEach((location: any) => {
          delete location.imageUri;
        });
      }

      fileContent = JSON.stringify(dataset);
    }

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
      // Note: CSV import for locations is not currently supported in the new location system
      // Locations should be created separately and then assigned to characters
      // This section is kept for backwards compatibility but will be skipped
      console.log(
        'Location field found in CSV but will be skipped. Please create locations separately and assign them to characters.'
      );
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
      locationId: c.locationId,
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
