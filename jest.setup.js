// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  getAllKeys: jest.fn(),
}));

// Mock expo modules
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://mock-document-directory/',
  writeAsStringAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn(),
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

// Mock react-native-zip-archive
jest.mock('react-native-zip-archive', () => ({
  zip: jest.fn(),
  unzip: jest.fn(),
}));

// Global __DEV__ variable for development checks
global.__DEV__ = false;

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
