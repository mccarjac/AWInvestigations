import 'react-native-get-random-values';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import { zip, unzip } from 'react-native-zip-archive';
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
 * Progress callback type for import/export operations
 */
export type ProgressCallback = (progress: number, message: string) => void;

/**
 * Export character and faction data for native platforms (creates zip with images)
 */
const exportCharacterDataNative = async (
  onProgress?: ProgressCallback
): Promise<void> => {
  try {
    onProgress?.(0, 'Starting export...');

    // Get the character data as JSON string
    const jsonData = await exportDataset();
    const dataset = JSON.parse(jsonData);

    onProgress?.(10, 'Preparing export directory...');

    // Create a temporary directory for building the zip
    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '');
    const tempDir =
      (FileSystem.cacheDirectory || FileSystem.documentDirectory || '') +
      `export_temp_${timestamp}/`;

    // Create directory structure
    await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
    await FileSystem.makeDirectoryAsync(tempDir + 'images/characters/', {
      intermediates: true,
    });
    await FileSystem.makeDirectoryAsync(tempDir + 'images/locations/', {
      intermediates: true,
    });
    await FileSystem.makeDirectoryAsync(tempDir + 'images/events/', {
      intermediates: true,
    });

    onProgress?.(20, 'Processing images...');

    // Track image references and replace URIs with file paths
    let imageCounter = 0;

    // Calculate total items for progress
    const totalCharacters = dataset.characters?.length || 0;
    const totalLocations = dataset.locations?.length || 0;
    const totalEvents = dataset.events?.length || 0;
    const totalItems = totalCharacters + totalLocations + totalEvents;
    let processedItems = 0;

    // Process character images
    if (dataset.characters) {
      for (const character of dataset.characters) {
        // Handle multiple images
        if (character.imageUris && character.imageUris.length > 0) {
          const processedUris: string[] = [];
          for (let i = 0; i < character.imageUris.length; i++) {
            const uri = character.imageUris[i];
            if (uri) {
              if (uri.startsWith('data:')) {
                // Handle base64 data URI
                const imageData = extractImageData(uri);
                if (imageData) {
                  const filename = `images/characters/${character.id}_${i}.${imageData.extension}`;
                  const filePath = tempDir + filename;
                  await FileSystem.writeAsStringAsync(
                    filePath,
                    imageData.base64Data,
                    {
                      encoding: FileSystem.EncodingType.Base64,
                    }
                  );
                  processedUris.push(filename);
                  imageCounter++;
                }
              } else if (uri.startsWith('file://') || uri.startsWith('/')) {
                // Handle file URI - copy file directly
                try {
                  const extension =
                    uri.split('.').pop()?.toLowerCase() || 'jpg';
                  const filename = `images/characters/${character.id}_${i}.${extension}`;
                  const filePath = tempDir + filename;
                  await FileSystem.copyAsync({ from: uri, to: filePath });
                  processedUris.push(filename);
                  imageCounter++;
                } catch {
                  // Image file not accessible, skip
                }
              } else {
                processedUris.push(uri);
              }
            }
          }
          if (processedUris.length > 0) {
            character.imageUris = processedUris;
            character.imageUri = processedUris[0];
          }
        }
        // Handle legacy single image
        else if (character.imageUri) {
          if (character.imageUri.startsWith('data:')) {
            const imageData = extractImageData(character.imageUri);
            if (imageData) {
              const filename = `images/characters/${character.id}.${imageData.extension}`;
              const filePath = tempDir + filename;
              await FileSystem.writeAsStringAsync(
                filePath,
                imageData.base64Data,
                {
                  encoding: FileSystem.EncodingType.Base64,
                }
              );
              character.imageUri = filename;
              character.imageUris = [filename];
              imageCounter++;
            }
          } else if (
            character.imageUri.startsWith('file://') ||
            character.imageUri.startsWith('/')
          ) {
            // Handle file URI - copy file directly
            try {
              const extension =
                character.imageUri.split('.').pop()?.toLowerCase() || 'jpg';
              const filename = `images/characters/${character.id}.${extension}`;
              const filePath = tempDir + filename;
              await FileSystem.copyAsync({
                from: character.imageUri,
                to: filePath,
              });
              character.imageUri = filename;
              character.imageUris = [filename];
              imageCounter++;
            } catch {
              // Image file not accessible, skip
            }
          }
        }

        processedItems++;
        if (totalItems > 0) {
          const progress = 20 + (processedItems / totalItems) * 50;
          onProgress?.(
            progress,
            `Processing character images... (${processedItems}/${totalItems})`
          );
        }
      }
    }

    // Process location images
    if (dataset.locations) {
      for (const location of dataset.locations) {
        // Handle multiple images
        if (location.imageUris && location.imageUris.length > 0) {
          const processedUris: string[] = [];
          for (let i = 0; i < location.imageUris.length; i++) {
            const uri = location.imageUris[i];
            if (uri) {
              if (uri.startsWith('data:')) {
                // Handle base64 data URI
                const imageData = extractImageData(uri);
                if (imageData) {
                  const filename = `images/locations/${location.id}_${i}.${imageData.extension}`;
                  const filePath = tempDir + filename;
                  await FileSystem.writeAsStringAsync(
                    filePath,
                    imageData.base64Data,
                    {
                      encoding: FileSystem.EncodingType.Base64,
                    }
                  );
                  processedUris.push(filename);
                  imageCounter++;
                }
              } else if (uri.startsWith('file://') || uri.startsWith('/')) {
                // Handle file URI - copy file directly
                try {
                  const extension =
                    uri.split('.').pop()?.toLowerCase() || 'jpg';
                  const filename = `images/locations/${location.id}_${i}.${extension}`;
                  const filePath = tempDir + filename;
                  await FileSystem.copyAsync({ from: uri, to: filePath });
                  processedUris.push(filename);
                  imageCounter++;
                } catch {
                  // Image file not accessible, skip
                }
              } else {
                processedUris.push(uri);
              }
            }
          }
          if (processedUris.length > 0) {
            location.imageUris = processedUris;
            location.imageUri = processedUris[0];
          }
        }
        // Handle legacy single image
        else if (location.imageUri) {
          if (location.imageUri.startsWith('data:')) {
            const imageData = extractImageData(location.imageUri);
            if (imageData) {
              const filename = `images/locations/${location.id}.${imageData.extension}`;
              const filePath = tempDir + filename;
              await FileSystem.writeAsStringAsync(
                filePath,
                imageData.base64Data,
                {
                  encoding: FileSystem.EncodingType.Base64,
                }
              );
              location.imageUri = filename;
              location.imageUris = [filename];
              imageCounter++;
            }
          } else if (
            location.imageUri.startsWith('file://') ||
            location.imageUri.startsWith('/')
          ) {
            // Handle file URI - copy file directly
            try {
              const extension =
                location.imageUri.split('.').pop()?.toLowerCase() || 'jpg';
              const filename = `images/locations/${location.id}.${extension}`;
              const filePath = tempDir + filename;
              await FileSystem.copyAsync({
                from: location.imageUri,
                to: filePath,
              });
              location.imageUri = filename;
              location.imageUris = [filename];
              imageCounter++;
            } catch {
              // Image file not accessible, skip
            }
          }
        }

        processedItems++;
        if (totalItems > 0) {
          const progress = 20 + (processedItems / totalItems) * 50;
          onProgress?.(
            progress,
            `Processing location images... (${processedItems}/${totalItems})`
          );
        }
      }
    }

    // Process event images
    if (dataset.events) {
      for (const event of dataset.events) {
        // Handle multiple images
        if (event.imageUris && event.imageUris.length > 0) {
          const processedUris: string[] = [];
          for (let i = 0; i < event.imageUris.length; i++) {
            const uri = event.imageUris[i];
            if (uri) {
              if (uri.startsWith('data:')) {
                // Handle base64 data URI
                const imageData = extractImageData(uri);
                if (imageData) {
                  const filename = `images/events/${event.id}_${i}.${imageData.extension}`;
                  const filePath = tempDir + filename;
                  await FileSystem.writeAsStringAsync(
                    filePath,
                    imageData.base64Data,
                    {
                      encoding: FileSystem.EncodingType.Base64,
                    }
                  );
                  processedUris.push(filename);
                  imageCounter++;
                }
              } else if (uri.startsWith('file://') || uri.startsWith('/')) {
                // Handle file URI - copy file directly
                try {
                  const extension =
                    uri.split('.').pop()?.toLowerCase() || 'jpg';
                  const filename = `images/events/${event.id}_${i}.${extension}`;
                  const filePath = tempDir + filename;
                  await FileSystem.copyAsync({ from: uri, to: filePath });
                  processedUris.push(filename);
                  imageCounter++;
                } catch {
                  // Image file not accessible, skip
                }
              } else {
                processedUris.push(uri);
              }
            }
          }
          if (processedUris.length > 0) {
            event.imageUris = processedUris;
            event.imageUri = processedUris[0];
          }
        }
        // Handle legacy single image
        else if (event.imageUri) {
          if (event.imageUri.startsWith('data:')) {
            const imageData = extractImageData(event.imageUri);
            if (imageData) {
              const filename = `images/events/${event.id}.${imageData.extension}`;
              const filePath = tempDir + filename;
              await FileSystem.writeAsStringAsync(
                filePath,
                imageData.base64Data,
                {
                  encoding: FileSystem.EncodingType.Base64,
                }
              );
              event.imageUri = filename;
              event.imageUris = [filename];
              imageCounter++;
            }
          } else if (
            event.imageUri.startsWith('file://') ||
            event.imageUri.startsWith('/')
          ) {
            // Handle file URI - copy file directly
            try {
              const extension =
                event.imageUri.split('.').pop()?.toLowerCase() || 'jpg';
              const filename = `images/events/${event.id}.${extension}`;
              const filePath = tempDir + filename;
              await FileSystem.copyAsync({
                from: event.imageUri,
                to: filePath,
              });
              event.imageUri = filename;
              event.imageUris = [filename];
              imageCounter++;
            } catch {
              // Image file not accessible, skip
            }
          }
        }

        processedItems++;
        if (totalItems > 0) {
          const progress = 20 + (processedItems / totalItems) * 50;
          onProgress?.(
            progress,
            `Processing event images... (${processedItems}/${totalItems})`
          );
        }
      }
    }

    onProgress?.(70, 'Creating export file...');

    // Write the modified JSON to the temp directory
    const dataJsonPath = tempDir + 'data.json';
    await FileSystem.writeAsStringAsync(
      dataJsonPath,
      JSON.stringify(dataset, null, 2)
    );

    // Create the zip file from the directory
    const filename = `character-faction-data-${timestamp}.zip`;
    const zipPath =
      (FileSystem.cacheDirectory || FileSystem.documentDirectory || '') +
      filename;

    onProgress?.(85, 'Compressing files...');
    await zip(tempDir, zipPath);

    onProgress?.(95, 'Cleaning up...');
    // Clean up temp directory
    await FileSystem.deleteAsync(tempDir, { idempotent: true });

    onProgress?.(100, 'Export complete!');

    // Check if sharing is available
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(zipPath, {
        mimeType: 'application/zip',
        dialogTitle: 'Export Character Data',
      });
    } else {
      Alert.alert(
        'Export Complete',
        `Character and faction data exported to: ${zipPath}${imageCounter > 0 ? ` (includes ${imageCounter} images)` : ''}`,
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
export const exportCharacterData = async (
  onProgress?: ProgressCallback
): Promise<void> => {
  await exportCharacterDataNative(onProgress);
};

/**
 * Import character data for native platforms (supports both JSON and ZIP files)
 */
const importCharacterDataNative = async (
  onProgress?: ProgressCallback
): Promise<boolean> => {
  try {
    onProgress?.(0, 'Selecting file...');

    // Pick a document
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'application/zip'],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return false;
    }

    onProgress?.(10, 'Reading file...');

    const fileUri = result.assets[0].uri;
    const fileName = result.assets[0].name;
    const isZip = fileName.endsWith('.zip');

    if (isZip) {
      console.log('[ZIP Import] Starting import from:', fileName);
      console.log('[ZIP Import] File URI:', fileUri);

      // Handle ZIP file - extract to temp directory
      const timestamp = new Date().getTime();
      const tempDir =
        (FileSystem.cacheDirectory || FileSystem.documentDirectory || '') +
        `import_temp_${timestamp}/`;

      console.log('[ZIP Import] Temp directory:', tempDir);

      try {
        console.log('[ZIP Import] Attempting to unzip...');
        onProgress?.(20, 'Extracting files...');
        await unzip(fileUri, tempDir);
        console.log('[ZIP Import] Unzip successful');
        onProgress?.(35, 'Files extracted successfully');
      } catch (unzipError) {
        console.error('[ZIP Import] Unzip failed:', unzipError);
        Alert.alert(
          'Import Failed',
          `Failed to extract zip file: ${unzipError instanceof Error ? unzipError.message : 'Unknown error'}`,
          [{ text: 'OK' }]
        );
        return false;
      }

      // Read data.json
      const dataJsonPath = tempDir + 'data.json';
      console.log('[ZIP Import] Checking for data.json at:', dataJsonPath);

      const dataJsonInfo = await FileSystem.getInfoAsync(dataJsonPath);
      console.log('[ZIP Import] data.json exists:', dataJsonInfo.exists);

      if (!dataJsonInfo.exists) {
        // List what files were extracted to help debug
        try {
          const extractedFiles = await FileSystem.readDirectoryAsync(tempDir);
          console.error('[ZIP Import] Files in temp dir:', extractedFiles);
        } catch (e) {
          console.error('[ZIP Import] Could not list temp dir:', e);
        }

        Alert.alert(
          'Import Failed',
          'Invalid zip file: data.json not found in the archive.',
          [{ text: 'OK' }]
        );
        await FileSystem.deleteAsync(tempDir, { idempotent: true });
        return false;
      }

      console.log('[ZIP Import] Reading data.json...');
      onProgress?.(40, 'Reading data...');
      const jsonContent = await FileSystem.readAsStringAsync(dataJsonPath);
      console.log('[ZIP Import] JSON content length:', jsonContent.length);

      try {
        const dataset = JSON.parse(jsonContent);
        console.log('[ZIP Import] Parsed dataset:', {
          hasCharacters: !!dataset.characters,
          characterCount: dataset.characters?.length || 0,
          hasLocations: !!dataset.locations,
          locationCount: dataset.locations?.length || 0,
          hasEvents: !!dataset.events,
          eventCount: dataset.events?.length || 0,
        });
      } catch (parseError) {
        console.error('[ZIP Import] JSON parse error:', parseError);
        Alert.alert(
          'Import Failed',
          `Invalid JSON in data.json: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
          [{ text: 'OK' }]
        );
        await FileSystem.deleteAsync(tempDir, { idempotent: true });
        return false;
      }

      const dataset = JSON.parse(jsonContent);

      // Helper function to read directory recursively
      const readDirRecursive = async (
        dirPath: string
      ): Promise<{ path: string; isDirectory: boolean }[]> => {
        const items = await FileSystem.readDirectoryAsync(dirPath);
        const results: { path: string; isDirectory: boolean }[] = [];

        for (const item of items) {
          const itemPath = dirPath + item;
          const info = await FileSystem.getInfoAsync(itemPath);
          if (info.isDirectory) {
            results.push({ path: itemPath + '/', isDirectory: true });
            const subItems = await readDirRecursive(itemPath + '/');
            results.push(...subItems);
          } else {
            results.push({ path: itemPath, isDirectory: false });
          }
        }

        return results;
      };

      // Extract and restore images - save to permanent storage as files
      console.log('[ZIP Import] Processing images...');
      onProgress?.(50, 'Processing images...');
      const allFiles = await readDirRecursive(tempDir);
      console.log(`[ZIP Import] Total files extracted: ${allFiles.length}`);
      const imageFiles = allFiles.filter(
        f => !f.isDirectory && f.path.includes('/images/')
      );
      console.log(`[ZIP Import] Found ${imageFiles.length} image files`);
      if (imageFiles.length > 0) {
        console.log(
          '[ZIP Import] Sample image paths:',
          imageFiles.slice(0, 3).map(f => f.path)
        );
      }

      // Create permanent image directories
      const permanentImageDir = FileSystem.documentDirectory + 'images/';
      await FileSystem.makeDirectoryAsync(permanentImageDir + 'characters/', {
        intermediates: true,
      });
      await FileSystem.makeDirectoryAsync(permanentImageDir + 'locations/', {
        intermediates: true,
      });
      await FileSystem.makeDirectoryAsync(permanentImageDir + 'events/', {
        intermediates: true,
      });

      // Group images by entity ID as file URIs (NOT base64 data URIs)
      const imagesByEntity: Record<string, Record<number, string>> = {};

      const totalImageFiles = imageFiles.length;
      let processedImageFiles = 0;

      for (const fileInfo of imageFiles) {
        const filePath = fileInfo.path;
        const filename = filePath.split('/').pop();

        if (filename) {
          // Match pattern: entityId_index.ext or entityId.ext
          // Use non-greedy match up to the last _digits before extension
          const match =
            filename.match(/^(.+?)_(\d+)\.[^.]+$/) ||
            filename.match(/^(.+)\.[^.]+$/);
          if (match) {
            const entityId = match[1];
            const imageIndex = match[2] ? parseInt(match[2]) : 0;

            const entityType = filePath.includes('/characters/')
              ? 'characters'
              : filePath.includes('/locations/')
                ? 'locations'
                : filePath.includes('/events/')
                  ? 'events'
                  : '';

            if (entityType) {
              // Copy image to permanent storage
              const permanentPath =
                permanentImageDir + entityType + '/' + filename;
              await FileSystem.copyAsync({
                from: filePath,
                to: permanentPath,
              });

              const entityKey = `${entityType.slice(0, -1)}_${entityId}`;
              if (!imagesByEntity[entityKey]) {
                imagesByEntity[entityKey] = {};
              }
              imagesByEntity[entityKey][imageIndex] = permanentPath;
            }
          }
        }

        processedImageFiles++;
        if (totalImageFiles > 0) {
          const progress = 50 + (processedImageFiles / totalImageFiles) * 30;
          onProgress?.(
            progress,
            `Copying images... (${processedImageFiles}/${totalImageFiles})`
          );
        }
      }

      console.log(
        `[ZIP Import] Processed ${Object.keys(imagesByEntity).length} entities with images`
      );

      onProgress?.(85, 'Finalizing import...');

      // Apply grouped images to entities
      console.log('[ZIP Import] Applying images to entities...');
      for (const [entityKey, images] of Object.entries(imagesByEntity)) {
        // Entity key format: "character_entityId" or "location_entityId" etc.
        // entityId may contain underscores, so only split on the first underscore
        const firstUnderscoreIndex = entityKey.indexOf('_');
        const entityType = entityKey.substring(0, firstUnderscoreIndex);
        const entityId = entityKey.substring(firstUnderscoreIndex + 1);
        const sortedImages = Object.keys(images)
          .map(k => parseInt(k))
          .sort((a, b) => a - b)
          .map(idx => images[idx]);

        console.log(
          `[ZIP Import] Processing ${entityType} ${entityId}: ${sortedImages.length} images`
        );
        console.log(`[ZIP Import] First image path: ${sortedImages[0]}`);

        if (entityType === 'character') {
          const character = dataset.characters?.find(
            (c: any) => c.id === entityId
          );
          if (character) {
            console.log(
              `[ZIP Import] Found character ${character.name}, updating imageUri from "${character.imageUri}" to "${sortedImages[0]}"`
            );
            character.imageUris = sortedImages;
            character.imageUri = sortedImages[0]; // Backward compatibility
          } else {
            console.warn(
              `[ZIP Import] Character ${entityId} not found in dataset`
            );
          }
        } else if (entityType === 'location') {
          const location = dataset.locations?.find(
            (l: any) => l.id === entityId
          );
          if (location) {
            console.log(
              `[ZIP Import] Found location ${location.name}, updating imageUri`
            );
            location.imageUris = sortedImages;
            location.imageUri = sortedImages[0]; // Backward compatibility
          } else {
            console.warn(
              `[ZIP Import] Location ${entityId} not found in dataset`
            );
          }
        } else if (entityType === 'event') {
          const event = dataset.events?.find((e: any) => e.id === entityId);
          if (event) {
            console.log(
              `[ZIP Import] Found event ${event.title}, updating imageUri`
            );
            event.imageUris = sortedImages;
            event.imageUri = sortedImages[0]; // Backward compatibility
          } else {
            console.warn(`[ZIP Import] Event ${entityId} not found in dataset`);
          }
        }
      }

      // Clean up temp directory
      console.log('[ZIP Import] Cleaning up temp directory...');
      await FileSystem.deleteAsync(tempDir, { idempotent: true });
      console.log('[ZIP Import] Temp directory cleaned up');

      // Import the dataset
      console.log('[ZIP Import] Calling importDataset...');
      onProgress?.(95, 'Saving data...');
      const success = await importDataset(JSON.stringify(dataset));
      console.log('[ZIP Import] importDataset result:', success);

      if (success) {
        onProgress?.(100, 'Import complete!');

        // Give the user a moment to see the 100% completion
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('[ZIP Import] Import completed successfully');
        Alert.alert(
          'Import Successful',
          'Character and faction data has been imported successfully. All existing data has been replaced.',
          [{ text: 'OK' }]
        );
        return true;
      } else {
        console.error('[ZIP Import] importDataset returned false');
        Alert.alert(
          'Import Failed',
          'The selected file is not a valid character and faction data file.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } else {
      // Handle JSON file (without images - strip imageUri fields)
      onProgress?.(30, 'Reading JSON file...');
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      onProgress?.(50, 'Parsing data...');
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

      onProgress?.(90, 'Saving data...');
      const success = await importDataset(JSON.stringify(dataset));

      if (success) {
        onProgress?.(100, 'Import complete!');

        // Give the user a moment to see the 100% completion
        await new Promise(resolve => setTimeout(resolve, 500));

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
    console.error('[ZIP Import] Unexpected error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('[ZIP Import] Error details:', {
      message: errorMessage,
      stack: errorStack,
    });

    Alert.alert(
      'Import Failed',
      `Failed to import character data: ${errorMessage}\n\nPlease check the file format and try again.`,
      [{ text: 'OK' }]
    );
    return false;
  }
};

/**
 * Import character data from a JSON file (replaces existing data)
 */
export const importCharacterData = async (
  onProgress?: ProgressCallback
): Promise<boolean> => {
  return await importCharacterDataNative(onProgress);
};

/**
 * Merge character and faction data for native platforms (supports both JSON and ZIP files)
 */
const mergeCharacterDataNative = async (
  onProgress?: ProgressCallback
): Promise<boolean> => {
  try {
    onProgress?.(0, 'Selecting file...');

    // Pick a document
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'application/zip'],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return false;
    }

    onProgress?.(10, 'Reading file...');

    const fileUri = result.assets[0].uri;
    const fileName = result.assets[0].name;
    const isZip = fileName.endsWith('.zip');

    let fileContent: string;

    if (isZip) {
      // Handle ZIP file - extract to temp directory
      const timestamp = new Date().getTime();
      const tempDir =
        (FileSystem.cacheDirectory || FileSystem.documentDirectory || '') +
        `merge_temp_${timestamp}/`;

      onProgress?.(20, 'Extracting files...');
      await unzip(fileUri, tempDir);

      onProgress?.(35, 'Reading data...');
      // Read data.json
      const dataJsonPath = tempDir + 'data.json';
      const dataJsonInfo = await FileSystem.getInfoAsync(dataJsonPath);
      if (!dataJsonInfo.exists) {
        Alert.alert('Merge Failed', 'Invalid zip file: data.json not found.', [
          { text: 'OK' },
        ]);
        await FileSystem.deleteAsync(tempDir, { idempotent: true });
        return false;
      }

      const jsonContent = await FileSystem.readAsStringAsync(dataJsonPath);
      const dataset = JSON.parse(jsonContent);

      onProgress?.(45, 'Processing images...');

      // Helper function to read directory recursively
      const readDirRecursive = async (
        dirPath: string
      ): Promise<{ path: string; isDirectory: boolean }[]> => {
        const items = await FileSystem.readDirectoryAsync(dirPath);
        const results: { path: string; isDirectory: boolean }[] = [];

        for (const item of items) {
          const itemPath = dirPath + item;
          const info = await FileSystem.getInfoAsync(itemPath);
          if (info.isDirectory) {
            results.push({ path: itemPath + '/', isDirectory: true });
            const subItems = await readDirRecursive(itemPath + '/');
            results.push(...subItems);
          } else {
            results.push({ path: itemPath, isDirectory: false });
          }
        }

        return results;
      };

      // Extract and restore images - save to permanent storage as files
      const allFiles = await readDirRecursive(tempDir);
      const imageFiles = allFiles.filter(
        f => !f.isDirectory && f.path.includes('/images/')
      );

      // Create permanent image directories
      const permanentImageDir = FileSystem.documentDirectory + 'images/';
      await FileSystem.makeDirectoryAsync(permanentImageDir + 'characters/', {
        intermediates: true,
      });
      await FileSystem.makeDirectoryAsync(permanentImageDir + 'locations/', {
        intermediates: true,
      });
      await FileSystem.makeDirectoryAsync(permanentImageDir + 'events/', {
        intermediates: true,
      });

      // Group images by entity ID as file URIs (NOT base64 data URIs)
      const imagesByEntity: Record<string, Record<number, string>> = {};

      for (const fileInfo of imageFiles) {
        const filePath = fileInfo.path;
        const filename = filePath.split('/').pop();

        if (filename) {
          // Match pattern: entityId_index.ext or entityId.ext
          // Use non-greedy match up to the last _digits before extension
          const match =
            filename.match(/^(.+?)_(\d+)\.[^.]+$/) ||
            filename.match(/^(.+)\.[^.]+$/);
          if (match) {
            const entityId = match[1];
            const imageIndex = match[2] ? parseInt(match[2]) : 0;

            const entityType = filePath.includes('/characters/')
              ? 'characters'
              : filePath.includes('/locations/')
                ? 'locations'
                : filePath.includes('/events/')
                  ? 'events'
                  : '';

            if (entityType) {
              // Copy image to permanent storage
              const permanentPath =
                permanentImageDir + entityType + '/' + filename;
              await FileSystem.copyAsync({
                from: filePath,
                to: permanentPath,
              });

              const entityKey = `${entityType.slice(0, -1)}_${entityId}`;
              if (!imagesByEntity[entityKey]) {
                imagesByEntity[entityKey] = {};
              }
              imagesByEntity[entityKey][imageIndex] = permanentPath;
            }
          }
        }
      }

      // Apply grouped images to entities
      for (const [entityKey, images] of Object.entries(imagesByEntity)) {
        // Entity key format: "character_entityId" or "location_entityId" etc.
        // entityId may contain underscores, so only split on the first underscore
        const firstUnderscoreIndex = entityKey.indexOf('_');
        const entityType = entityKey.substring(0, firstUnderscoreIndex);
        const entityId = entityKey.substring(firstUnderscoreIndex + 1);
        const sortedImages = Object.keys(images)
          .map(k => parseInt(k))
          .sort((a, b) => a - b)
          .map(idx => images[idx]);

        if (entityType === 'character') {
          const character = dataset.characters?.find(
            (c: any) => c.id === entityId
          );
          if (character) {
            character.imageUris = sortedImages;
            character.imageUri = sortedImages[0];
          }
        } else if (entityType === 'location') {
          const location = dataset.locations?.find(
            (l: any) => l.id === entityId
          );
          if (location) {
            location.imageUris = sortedImages;
            location.imageUri = sortedImages[0];
          }
        } else if (entityType === 'event') {
          const event = dataset.events?.find((e: any) => e.id === entityId);
          if (event) {
            event.imageUris = sortedImages;
            event.imageUri = sortedImages[0];
          }
        }
      }

      onProgress?.(85, 'Cleaning up...');
      // Clean up temp directory
      await FileSystem.deleteAsync(tempDir, { idempotent: true });

      fileContent = JSON.stringify(dataset);
    } else {
      // Handle JSON file (without images - strip imageUri fields)
      onProgress?.(30, 'Reading JSON file...');
      const jsonContent = await FileSystem.readAsStringAsync(fileUri);
      onProgress?.(50, 'Parsing data...');
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

    onProgress?.(90, 'Merging data...');
    // Merge the data with conflict resolution
    const result_merge = await mergeDatasetWithConflictResolution(fileContent);

    if (result_merge.success) {
      onProgress?.(100, 'Merge complete!');

      // Give the user a moment to see the 100% completion
      await new Promise(resolve => setTimeout(resolve, 500));
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
export const mergeCharacterData = async (
  onProgress?: ProgressCallback
): Promise<boolean> => {
  return await mergeCharacterDataNative(onProgress);
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
 * Import characters from CSV file
 */
export const importCSVCharacters = async (): Promise<boolean> => {
  try {
    console.log('Starting CSV import...');
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

      Alert.alert(
        'CSV Import Successful',
        `Successfully imported ${characters.length} characters from CSV.`,
        [{ text: 'OK' }]
      );
      return true;
    } else {
      console.log('CSV import cancelled or no file selected');
      return false;
    }
  } catch (error) {
    console.error('CSV import error:', error);
    Alert.alert(
      'CSV Import Failed',
      `Failed to import CSV data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      [{ text: 'OK' }]
    );
    return false;
  }
};
