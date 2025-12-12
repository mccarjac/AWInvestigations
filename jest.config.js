module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|expo|@expo|@unimodules|react-native-.*)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/utils/**/*.{ts,tsx}',
    '!src/utils/**/*.d.ts',
    '!src/utils/**/index.{ts,tsx}',
    // Exclude files without tests (for now)
    '!src/utils/exportImport.ts',
    '!src/utils/factionStats.ts',
    '!src/utils/gitIntegration.ts',
    '!src/utils/influenceAnalysis.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 55,
      functions: 60,
      lines: 75,
      statements: 75,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: ['<rootDir>/tst/**/*.(test|spec).(ts|tsx|js)'],
  roots: ['<rootDir>/tst'],
};
