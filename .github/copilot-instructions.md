# AWInvestigations - Copilot Instructions

## Project Overview

AWInvestigations (also known as AWIntelligence or Game Character Manager) is a React Native mobile application built with Expo for managing tabletop RPG game data. The app helps users track characters, factions, locations, and events for their gaming campaigns.

**Tech Stack:**

- React Native with Expo (v54)
- TypeScript (strict mode enabled)
- React Navigation for routing (drawer and stack navigators)
- AsyncStorage for data persistence
- React Native Gesture Handler & Reanimated for animations

## Project Structure

```
/
├── src/
│   ├── components/      # Reusable UI components (common, screens)
│   ├── models/          # Data models and types
│   ├── navigation/      # Navigation types and configuration
│   ├── screens/         # Screen components organized by feature
│   │   ├── character/   # Character management screens
│   │   ├── faction/     # Faction management screens
│   │   ├── location/    # Location management screens
│   │   └── events/      # Event timeline screens
│   ├── styles/          # Shared styles and theming
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions (storage, stats, export/import)
├── assets/              # Images and static assets
├── .github/             # GitHub configuration (including this file)
└── [config files]       # Root level configuration files
```

## Development Workflow

### Setup and Installation

```bash
npm install              # Install dependencies
npm run prepare          # Set up Husky git hooks
```

### Running the App

```bash
npm run android          # Run on Android device/emulator (preferred)
npm run web              # Run in web browser (localhost:8081)
npm run ios              # Run on iOS device/simulator
npm start                # Start Expo dev server
```

### Code Quality Commands

```bash
npm run lint             # Run ESLint on all files
npm run lint:fix         # Auto-fix ESLint issues
npm run lint:errors      # Show only critical errors (no warnings)
npm run format           # Format all files with Prettier
npm run format:check     # Check formatting without making changes
npm run type-check       # Run TypeScript type checking
npm run check-all        # Run all checks (type-check, lint, format-check)
```

### Building

See `ANDROID_BUILD.md` for detailed Android build instructions using EAS CLI.

## Coding Standards

### TypeScript

- **Strict mode enabled** - all TypeScript strict checks are enforced
- Use explicit types for function parameters and complex return types
- Avoid `any` type (warning level) - use proper types or `unknown`
- Prefix unused variables with underscore: `_unusedVar`
- Use path aliases:
  - `@/*` for `src/*`
  - `@components/*` for `src/components/*`
  - `@screens/*` for `src/screens/*`
  - `@models/*` for `src/models/*`
  - `@utils/*` for `src/utils/*`

### React & React Native

- **No PropTypes** - use TypeScript interfaces for prop validation
- **React 19** - React import not required in JSX files
- Follow React Hooks rules (enforced by eslint)
- Avoid inline styles (warning level) - use StyleSheet.create()
- Avoid color literals (warning level) - define colors in theme
- Use proper platform-specific components when needed

### Code Style (Prettier)

- **Single quotes** for strings
- **Semicolons required**
- **2-space indentation**
- **80 character line width**
- **Trailing commas** in ES5 compatible locations
- **LF line endings**
- Arrow function parens: avoid when single parameter

### Git Workflow

- **Pre-commit hooks** automatically run linting and formatting on staged files
- Ensure all checks pass before committing
- Husky enforces code quality at commit time

## Key Conventions

### Component Organization

- Screen components go in `src/screens/{feature}/`
- Reusable components go in `src/components/common/`
- Base/abstract components go in `src/components/screens/`
- Export components from `src/components/index.ts` for cleaner imports

### Navigation

- Navigation types defined in `src/navigation/types.ts`
- Uses drawer navigator for main screens
- Uses stack navigator for detail/form screens
- Dark theme applied consistently across navigation

### State Management

- AsyncStorage for data persistence
- Character, Faction, Location, and Event data stored locally
- Storage utilities in `src/utils/characterStorage.ts`
- Import/Export functionality in `src/utils/exportImport.ts`

### Styling

- Dark theme with consistent color palette:
  - Primary: `#6C5CE7` (purple)
  - Background: `#0F0F23` (dark blue)
  - Card: `#262647` (lighter dark blue)
  - Border: `#404066` (gray-blue)
- Use StyleSheet.create() for all styles
- Avoid inline styles and color literals when possible

## Files to NOT Modify

- `node_modules/` - Dependencies (automatically managed)
- `.expo/` - Expo build cache
- `dist/`, `build/` - Build outputs
- `.husky/` - Git hooks configuration (unless specifically working on git hooks)
- Config files unless specifically required for the task:
  - `babel.config.js`
  - `metro.config.js`
  - `tsconfig.json`
  - `eslint.config.js`
  - `.prettierrc`
- CSV test files (`test-factions*.csv`) - used for testing import functionality

## Testing & Validation

- **No test framework currently configured** - manual testing required
- Test on Android device/emulator primarily
- Web version may have limited functionality
- Always run `npm run check-all` before committing
- Verify changes with `npm run android` or `npm run web`

## Important Notes

### Data Structure

- Characters have detailed stats, skills, and relationships
- Factions track members and character affiliations
- Locations can have coordinates for map display
- Events form a timeline with date tracking

### Performance Considerations

- Large character lists may need pagination (not yet implemented)
- Image handling uses Expo Image Picker
- Export/Import uses CSV and JSON formats

### Known Limitations

- No automated tests currently
- Web platform may have reduced functionality
- Export/import feature needs manual testing

## For AI Coding Assistants

When making changes to this codebase:

1. **Always** run linting and type-checking before committing
2. **Maintain** the existing dark theme and design patterns
3. **Follow** the established project structure
4. **Use** existing utility functions rather than duplicating logic
5. **Test** changes on Android (preferred) or web
6. **Document** any new features or significant changes
7. **Keep** component files focused and single-responsibility
8. **Respect** the path alias system defined in tsconfig.json
9. **Avoid** breaking changes to data storage format
10. **Check** that pre-commit hooks pass

## Additional Resources

- Main README: `README.md` - Setup and running instructions
- Linting Guide: `LINTING.md` - Detailed linting configuration and rules
- Android Build: `ANDROID_BUILD.md` - APK build instructions
- CSV Import Format: `CSV_Import_Format.md` - Import data format specification
