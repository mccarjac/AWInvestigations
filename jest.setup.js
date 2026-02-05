// Mock PixelRatio first - this needs to be before any other react-native imports
jest.mock('react-native/Libraries/Utilities/PixelRatio', () => ({
  get: jest.fn(() => 1),
  getFontScale: jest.fn(() => 1),
  getPixelSizeForLayoutSize: jest.fn(size => size),
  roundToNearestPixel: jest.fn(size => size),
}));

// Mock Dimensions
jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  get: jest.fn(() => ({
    width: 400,
    height: 600,
    scale: 1,
    fontScale: 1,
  })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  set: jest.fn(),
}));

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

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }),
  useFocusEffect: jest.fn(callback => callback()),
  useRoute: () => ({
    params: {},
  }),
  useIsFocused: () => true,
}));

jest.mock('@react-navigation/drawer', () => ({
  ...jest.requireActual('@react-navigation/drawer'),
  DrawerNavigationProp: jest.fn(),
}));

jest.mock('@react-navigation/stack', () => ({
  ...jest.requireActual('@react-navigation/stack'),
  StackNavigationProp: jest.fn(),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => ({
  TouchableOpacity: 'TouchableOpacity',
  ScrollView: 'ScrollView',
  State: {},
  PanGestureHandler: 'PanGestureHandler',
  TouchableWithoutFeedback: 'TouchableWithoutFeedback',
  FlatList: 'FlatList',
  GestureDetector: ({ children }) => children,
  Gesture: {
    Pan: jest.fn(() => ({
      onUpdate: jest.fn().mockReturnThis(),
      onEnd: jest.fn().mockReturnThis(),
    })),
    Pinch: jest.fn(() => ({
      onUpdate: jest.fn().mockReturnThis(),
      onEnd: jest.fn().mockReturnThis(),
    })),
    Tap: jest.fn(() => ({
      numberOfTaps: jest.fn().mockReturnThis(),
      onEnd: jest.fn().mockReturnThis(),
    })),
    Simultaneous: jest.fn((...args) => args),
  },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const React = require('react');

  const MockAnimated = {
    View: 'Animated.View',
    Image: 'Animated.Image',
    createAnimatedComponent: component => component,
  };

  return {
    default: MockAnimated,
    useSharedValue: jest.fn(val => ({ value: val })),
    useAnimatedStyle: jest.fn(fn => fn()),
    withTiming: jest.fn(val => val),
    runOnJS: jest.fn(fn => fn),
    Easing: {
      bezier: () => ({ factory: () => x => x }),
    },
  };
});

// Global __DEV__ variable for development checks
global.__DEV__ = false;

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
