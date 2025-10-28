# Code Style and Linting

This project uses ESLint and Prettier to enforce consistent code style and quality across the codebase.

## 🎯 Final Status

- **Total Issues Fixed**: 110+ issues resolved (58% improvement)
- **Critical Errors**: 41 (down from 89 - 54% reduction!)
- **Focus**: Mostly unused styles and React hooks optimizations remaining

## Tools Used

- **ESLint**: Linting and code quality rules
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit linting
- **lint-staged**: Run linters on staged files only

## Configuration Files

- `.eslintconfig.js` - ESLint configuration with TypeScript, React, and React Native rules
- `.prettierrc` - Prettier formatting configuration
- `.prettierignore` - Files to exclude from Prettier formatting
- `.husky/pre-commit` - Git pre-commit hook
- `.vscode/settings.json` - VS Code editor settings for automatic formatting

## Available Scripts

```bash
# Lint all files
npm run lint

# Lint and auto-fix issues
npm run lint:fix

# Show only critical errors (no warnings)
npm run lint:errors

# Format all files with Prettier
npm run format

# Check formatting without making changes
npm run format:check

# Run TypeScript type checking
npm run type-check

# Run all checks (type-check, lint, format-check)
npm run check-all
```

## Rules Overview

### ESLint Rules

- TypeScript strict mode enabled
- React and React Native specific rules
- Automatic fixing for formatting issues
- Warnings for console statements (should be removed in production)
- Errors for unused variables and imports
- React Hooks rules for proper usage

### Prettier Rules

- Single quotes for strings
- Semicolons required
- 2-space indentation
- Trailing commas in ES5 compatible locations
- 80 character line width

## Pre-commit Hooks

The project is configured with Husky to automatically run linting and formatting on staged files before each commit. This ensures that:

1. All staged files are properly formatted
2. ESLint rules are enforced
3. No linting errors are committed to the repository

## VS Code Integration

The `.vscode/settings.json` file configures VS Code to:

- Format files on save
- Run ESLint auto-fix on save
- Use proper file exclusions for performance

## Recommended VS Code Extensions

For the best development experience, install these VS Code extensions:

- ESLint
- Prettier - Code formatter
- TypeScript and JavaScript Language Features (built-in)

## Customizing Rules

You can modify the linting rules by editing `eslint.config.js`. Common customizations:

```javascript
// To disable a rule
'rule-name': 'off',

// To change rule severity
'rule-name': 'warn', // or 'error'

// To configure rule options
'rule-name': ['error', { option: 'value' }],
```

## Troubleshooting

### Linting Errors

- Run `npm run lint` to see all issues
- Run `npm run lint:fix` to auto-fix resolvable issues
- Check the ESLint output for specific error messages and line numbers

### Formatting Issues

- Run `npm run format` to format all files
- Check `.prettierignore` if certain files should be excluded
- Verify Prettier configuration in `.prettierrc`

### Pre-commit Hook Issues

- Ensure husky is properly installed: `npm run prepare`
- Check that `.husky/pre-commit` exists and is executable
- Test manually: `npx lint-staged`
