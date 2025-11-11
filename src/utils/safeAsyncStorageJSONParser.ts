import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Safe wrapper around AsyncStorage with error handling and JSON parsing
 * Prevents crashes from corrupted data or storage errors
 */

export class SafeAsyncStorageJSONParser {
  /**
   * Safely get an item from AsyncStorage and parse it as JSON
   * Returns null if item doesn't exist, is corrupted, or parsing fails
   */
  static async getItem<T>(key: string): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(key);
      if (!data) {
        return null;
      }

      try {
        return JSON.parse(data) as T;
      } catch (parseError) {
        // Log parsing error but don't crash
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn(
            `Failed to parse stored data for key "${key}":`,
            parseError
          );
        }
        // Return null for corrupted data
        return null;
      }
    } catch (error) {
      // Log storage error but don't crash
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error(
          `Failed to get item from storage (key: "${key}"):`,
          error
        );
      }
      return null;
    }
  }

  /**
   * Safely set an item in AsyncStorage as JSON
   * Returns true on success, false on failure
   */
  static async setItem<T>(key: string, value: T): Promise<boolean> {
    try {
      const jsonString = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonString);
      return true;
    } catch (error) {
      // Log error but don't crash
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error(`Failed to set item in storage (key: "${key}"):`, error);
      }
      return false;
    }
  }

  /**
   * Safely remove an item from AsyncStorage
   * Returns true on success, false on failure
   */
  static async removeItem(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      // Log error but don't crash
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error(
          `Failed to remove item from storage (key: "${key}"):`,
          error
        );
      }
      return false;
    }
  }

  /**
   * Safely clear all items from AsyncStorage
   * Returns true on success, false on failure
   */
  static async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      // Log error but don't crash
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to clear storage:', error);
      }
      return false;
    }
  }

  /**
   * Safely get multiple items from AsyncStorage
   * Returns an object with keys and their parsed values
   * Skips items that fail to parse
   */
  static async multiGet<T = any>(
    keys: string[]
  ): Promise<Record<string, T | null>> {
    const result: Record<string, T | null> = {};

    try {
      const values = await AsyncStorage.multiGet(keys);

      for (const [key, value] of values) {
        if (value === null) {
          result[key] = null;
          continue;
        }

        try {
          result[key] = JSON.parse(value) as T;
        } catch (parseError) {
          if (__DEV__) {
            // eslint-disable-next-line no-console
            console.warn(
              `Failed to parse stored data for key "${key}":`,
              parseError
            );
          }
          result[key] = null;
        }
      }
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to get multiple items from storage:', error);
      }
    }

    return result;
  }

  /**
   * Safely set multiple items in AsyncStorage
   * Returns the number of successful writes
   */
  static async multiSet<T = any>(
    keyValuePairs: Array<[string, T]>
  ): Promise<number> {
    let successCount = 0;

    for (const [key, value] of keyValuePairs) {
      const success = await SafeAsyncStorageJSONParser.setItem(key, value);
      if (success) {
        successCount++;
      }
    }

    return successCount;
  }
}
