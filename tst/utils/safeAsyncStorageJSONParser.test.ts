import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAsyncStorageJSONParser } from '@/utils/safeAsyncStorageJSONParser';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

describe('SafeAsyncStorageJSONParser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getItem', () => {
    it('should return parsed JSON data for valid item', async () => {
      const mockData = { name: 'Test', value: 123 };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockData)
      );

      const result = await SafeAsyncStorageJSONParser.getItem('test-key');
      expect(result).toEqual(mockData);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('test-key');
    });

    it('should return null if item does not exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await SafeAsyncStorageJSONParser.getItem('missing-key');
      expect(result).toBeNull();
    });

    it('should return null for corrupted JSON data', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid-json{');

      const result = await SafeAsyncStorageJSONParser.getItem('corrupt-key');
      expect(result).toBeNull();
    });

    it('should return null on storage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const result = await SafeAsyncStorageJSONParser.getItem('error-key');
      expect(result).toBeNull();
    });

    it('should handle complex nested objects', async () => {
      const complexData = {
        nested: { deep: { value: 'test' } },
        array: [1, 2, 3],
        mixed: { arr: ['a', 'b'], num: 42 },
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(complexData)
      );

      const result = await SafeAsyncStorageJSONParser.getItem('complex-key');
      expect(result).toEqual(complexData);
    });
  });

  describe('setItem', () => {
    it('should save item and return true on success', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const data = { name: 'Test', value: 123 };
      const result = await SafeAsyncStorageJSONParser.setItem('test-key', data);

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(data)
      );
    });

    it('should return false on storage error', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const data = { name: 'Test' };
      const result = await SafeAsyncStorageJSONParser.setItem('test-key', data);

      expect(result).toBe(false);
    });

    it('should handle complex data types', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const complexData = {
        nested: { data: 'test' },
        array: [1, 2, 3],
        nullValue: null,
        boolValue: true,
      };

      const result = await SafeAsyncStorageJSONParser.setItem(
        'test-key',
        complexData
      );

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(complexData)
      );
    });
  });

  describe('removeItem', () => {
    it('should remove item and return true on success', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      const result = await SafeAsyncStorageJSONParser.removeItem('test-key');

      expect(result).toBe(true);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('should return false on storage error', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const result = await SafeAsyncStorageJSONParser.removeItem('error-key');

      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear storage and return true on success', async () => {
      (AsyncStorage.clear as jest.Mock).mockResolvedValue(undefined);

      const result = await SafeAsyncStorageJSONParser.clear();

      expect(result).toBe(true);
      expect(AsyncStorage.clear).toHaveBeenCalled();
    });

    it('should return false on storage error', async () => {
      (AsyncStorage.clear as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const result = await SafeAsyncStorageJSONParser.clear();

      expect(result).toBe(false);
    });
  });

  describe('multiGet', () => {
    it('should return multiple items successfully', async () => {
      const mockData = [
        ['key1', JSON.stringify({ value: 1 })],
        ['key2', JSON.stringify({ value: 2 })],
        ['key3', JSON.stringify({ value: 3 })],
      ];
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue(mockData);

      const result = await SafeAsyncStorageJSONParser.multiGet([
        'key1',
        'key2',
        'key3',
      ]);

      expect(result).toEqual({
        key1: { value: 1 },
        key2: { value: 2 },
        key3: { value: 3 },
      });
    });

    it('should handle null values', async () => {
      const mockData = [
        ['key1', JSON.stringify({ value: 1 })],
        ['key2', null],
        ['key3', JSON.stringify({ value: 3 })],
      ];
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue(mockData);

      const result = await SafeAsyncStorageJSONParser.multiGet([
        'key1',
        'key2',
        'key3',
      ]);

      expect(result).toEqual({
        key1: { value: 1 },
        key2: null,
        key3: { value: 3 },
      });
    });

    it('should handle corrupted data gracefully', async () => {
      const mockData = [
        ['key1', JSON.stringify({ value: 1 })],
        ['key2', 'invalid-json{'],
        ['key3', JSON.stringify({ value: 3 })],
      ];
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue(mockData);

      const result = await SafeAsyncStorageJSONParser.multiGet([
        'key1',
        'key2',
        'key3',
      ]);

      expect(result).toEqual({
        key1: { value: 1 },
        key2: null,
        key3: { value: 3 },
      });
    });

    it('should return empty object on storage error', async () => {
      (AsyncStorage.multiGet as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const result = await SafeAsyncStorageJSONParser.multiGet([
        'key1',
        'key2',
      ]);

      expect(result).toEqual({});
    });
  });

  describe('multiSet', () => {
    it('should set multiple items and return success count', async () => {
      // Mock successful setItem calls
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const pairs: Array<[string, any]> = [
        ['key1', { value: 1 }],
        ['key2', { value: 2 }],
        ['key3', { value: 3 }],
      ];

      const result = await SafeAsyncStorageJSONParser.multiSet(pairs);

      expect(result).toBe(3);
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures', async () => {
      // Mock first call success, second fail, third success
      (AsyncStorage.setItem as jest.Mock)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Storage error'))
        .mockResolvedValueOnce(undefined);

      const pairs: Array<[string, any]> = [
        ['key1', { value: 1 }],
        ['key2', { value: 2 }],
        ['key3', { value: 3 }],
      ];

      const result = await SafeAsyncStorageJSONParser.multiSet(pairs);

      expect(result).toBe(2); // 2 successful out of 3
    });

    it('should handle empty array', async () => {
      const result = await SafeAsyncStorageJSONParser.multiSet([]);

      expect(result).toBe(0);
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });
});
