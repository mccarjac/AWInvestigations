# Testing

This project uses Jest with React Native Testing Library for comprehensive unit and component testing.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run all quality checks (type-check, lint, format-check, and test)
npm run check-all
```

## Test Structure

Tests are located in the `tst/` directory, which mirrors the structure of `src/`:

```
tst/
  components/          # Component tests
    common/           # Common component tests (Card, Section, buttons, etc.)
    screens/          # Base screen component tests (BaseListScreen, etc.)
  screens/            # Screen integration tests
    character/        # Character screen tests
    faction/          # Faction screen tests
    location/         # Location screen tests
    events/           # Event screen tests
  utils/              # Utility function tests
    dateUtils.test.ts
    derivedStats.test.ts
    characterStats.test.ts
    safeAsyncStorageJSONParser.test.ts
    characterStorage.test.ts
src/
  components/
    common/
    screens/
  screens/
  utils/
```

## Code Coverage

Coverage reports are generated in the `coverage/` directory when running `npm run test:coverage`.

Current coverage thresholds:

- **Statements**: 70%
- **Branches**: 50%
- **Functions**: 55%
- **Lines**: 70%

Coverage includes:

- Utility functions in `src/utils/`
- Common UI components in `src/components/common/`
- Base screen components in `src/components/screens/`
- Screen components in `src/screens/`

## Test Files Included

### UI Component Tests (59 tests)

1. **Common Components** (47 tests)
   - Card.test.tsx (6 tests) - Card container component with present state
   - CollapsibleSection.test.tsx (8 tests) - Collapsible content sections
   - Section.test.tsx (4 tests) - Basic section container
   - ErrorBoundary.test.tsx (8 tests) - Error boundary with fallback UI
   - InfoButton.test.tsx (5 tests) - Info button with modal
   - HeaderAddButton.test.tsx (4 tests) - Header add button
   - HeaderEditButton.test.tsx (4 tests) - Header edit button
   - HeaderDeleteButton.test.tsx (4 tests) - Header delete button
   - HeaderStatsButton.test.tsx (4 tests) - Header stats button

2. **Base Screen Components** (12 tests)
   - BaseListScreen.test.tsx (12 tests) - Generic list screen with search and filtering

3. **Screen Tests** (6 tests)
   - CharacterListScreen.test.tsx (3 tests) - Character list screen integration
   - FactionListScreen.test.tsx (3 tests) - Faction list screen integration

### Core Utility Functions (181 tests)

1. **dateUtils.test.ts** (17 tests)
   - Date parsing with validation
   - Date formatting (long and short formats)
   - Edge cases and error handling

2. **safeAsyncStorageJSONParser.test.ts** (18 tests)
   - AsyncStorage wrapper methods
   - JSON serialization/deserialization
   - Error handling and graceful degradation
   - Multi-get and multi-set operations

3. **derivedStats.test.ts** (13 tests)
   - Character stat calculation
   - Species-specific base stats
   - Cyberware modifiers
   - Health and limit cap enforcement

4. **characterStats.test.ts** (7 tests)
   - Character statistics aggregation
   - Species and faction distribution
   - Faction standings tracking

5. **characterStorage.test.ts** (126 tests)
   - Character CRUD operations
   - Faction management
   - Location management
   - Event management
   - Data import/export
   - Relationship management

## Configuration

### jest.config.js

- Uses `react-native` preset for React Native compatibility
- Configured with TypeScript path aliases (`@/`, `@utils/`, etc.)
- Coverage collection focused on tested files
- Custom setup file for mocks

### jest.setup.js

- Mocks AsyncStorage for isolated testing
- Mocks Expo modules (file system, sharing, document picker, etc.)
- Mocks React Navigation (navigation, routes, focus hooks)
- Mocks react-native-safe-area-context
- Mocks react-native-gesture-handler and react-native-reanimated
- Suppresses console warnings in test environment

## CI/CD Integration

Tests are automatically run in GitHub Actions before building the APK:

```yaml
- name: Run tests
  run: npm test
```

If tests fail, the build will not proceed.

## Writing New Tests

### Utility Function Tests

When adding new utility functions:

1. Create a test file in `tst/utils/` that mirrors the source file structure
   - For example, to test `src/utils/myFile.ts`, create `tst/utils/myFile.test.ts`
2. Import the function(s) to test
3. Write test cases using `describe` and `it` blocks
4. Mock any external dependencies (AsyncStorage, file system, etc.)
5. Run tests locally before committing

Example:

```typescript
import { myFunction } from '../myFile';

describe('myFunction', () => {
  it('should do something correctly', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });

  it('should handle errors gracefully', () => {
    expect(() => myFunction(null)).toThrow('Error message');
  });
});
```

### UI Component Tests

When testing React Native components:

1. Create a test file in `tst/components/` that mirrors the source file structure
   - For example, to test `src/components/common/MyComponent.tsx`, create `tst/components/common/MyComponent.test.tsx`
2. Use `@testing-library/react-native` for rendering and interaction
3. Test component rendering, props, user interactions, and state changes
4. Mock navigation and other dependencies as needed

Example:

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MyComponent } from '@components/common/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    const { getByText } = render(<MyComponent title="Test" />);
    expect(getByText('Test')).toBeTruthy();
  });

  it('should call onPress when button is pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <MyComponent title="Test" onPress={mockOnPress} />
    );

    fireEvent.press(getByText('Test'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });
});
```

### Screen Integration Tests

When testing full screen components:

1. Create a test file in `tst/screens/` that mirrors the source file structure
2. Mock all storage functions and navigation
3. Focus on critical rendering paths and user interactions
4. Use `waitFor` for async operations

Example:

```typescript
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { MyScreen } from '@screens/MyScreen';
import * as characterStorage from '@utils/characterStorage';

jest.mock('@utils/characterStorage', () => ({
  loadData: jest.fn(),
}));

describe('MyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load data on mount', async () => {
    (characterStorage.loadData as jest.Mock).mockResolvedValue([]);

    render(<MyScreen />);

    await waitFor(() => {
      expect(characterStorage.loadData).toHaveBeenCalled();
    });
  });
});
```

## Future Work

Additional files that could benefit from unit tests:

- `factionStats.ts` - Faction statistics and analysis
- `exportImport.ts` - Data import/export functionality
- `gitIntegration.ts` - GitHub API integration
- `influenceAnalysis.ts` - Complex faction relationship analysis
- Screen components (integration tests)
- UI components (integration tests)

## Troubleshooting

### Tests Failing Locally

1. Ensure all dependencies are installed: `npm ci`
2. Clear Jest cache: `npx jest --clearCache`
3. Check that you're using Node.js 20 or later

### Coverage Not Updating

1. Delete the `coverage/` directory
2. Run `npm run test:coverage` again

### Import Path Issues

Make sure you're using the configured path aliases:

- `@/` for `src/`
- `@utils/` for `src/utils/`
- `@models/` for `src/models/`
- etc.
