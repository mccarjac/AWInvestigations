# Unit Testing

This project uses Jest for unit testing with React Native support.

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
  utils/
    dateUtils.test.ts
    derivedStats.test.ts
    characterStats.test.ts
    safeAsyncStorageJSONParser.test.ts
src/
  utils/
    dateUtils.ts
    derivedStats.ts
    ...
```

## Code Coverage

Coverage reports are generated in the `coverage/` directory when running `npm run test:coverage`.

Current coverage thresholds:

- **Statements**: 75%
- **Branches**: 55%
- **Functions**: 60%
- **Lines**: 75%

Coverage is currently focused on utility functions in `src/utils/`. Future work will expand coverage to other parts of the codebase.

## Test Files Included

### Core Utility Functions (55 tests)

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

## Configuration

### jest.config.js

- Uses `react-native` preset for React Native compatibility
- Configured with TypeScript path aliases (`@/`, `@utils/`, etc.)
- Coverage collection focused on tested files
- Custom setup file for mocks

### jest.setup.js

- Mocks AsyncStorage for isolated testing
- Mocks Expo modules (file system, sharing, document picker, etc.)
- Suppresses console warnings in test environment

## CI/CD Integration

Tests are automatically run in GitHub Actions before building the APK:

```yaml
- name: Run tests
  run: npm test
```

If tests fail, the build will not proceed.

## Writing New Tests

When adding new utility functions or features:

1. Create a test file in the `tst/` directory that mirrors the structure of the file being tested
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
