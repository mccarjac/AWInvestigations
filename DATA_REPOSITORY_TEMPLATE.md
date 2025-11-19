# AWInvestigationsDataLibrary Repository Template

This document provides a template for setting up the `mccarjac/AWInvestigationsDataLibrary` repository.

## Purpose

This repository serves as a shared data library for the AWInvestigations application, allowing users to:

- Share game data (characters, factions, locations, events) with other users
- Collaborate on building a shared game universe
- Access community-contributed content
- Backup and sync data across devices

## Repository Setup

### 1. Create the Repository

1. Go to https://github.com/new
2. Set repository name: `AWInvestigationsDataLibrary`
3. Add description: "Shared data library for AWInvestigations game management app"
4. Choose visibility:
   - **Public**: Anyone can see and contribute (recommended for community sharing)
   - **Private**: Only invited users can access
5. Initialize with README
6. Click "Create repository"

### 2. Create Initial Files

Create the following files in your repository:

#### README.md

```markdown
# AWInvestigations Data Library

This repository contains shared game data for the AWInvestigations mobile application.

## About

AWInvestigations is a mobile app for managing tabletop RPG game data. This repository serves as a community-driven data library where users can share and collaborate on game content.

## Structure

- `data.json` - Main data file containing all game entities
- `contributions/` - Directory for user contributions and pull requests

## Contributing

To contribute your game data:

1. Export your data from the AWInvestigations app
2. The app will automatically create a Pull Request to this repository
3. Wait for review and approval from maintainers
4. Once merged, your data will be available to all users

## Data Format

The `data.json` file follows this structure:

\`\`\`json
{
"characters": [],
"factions": [],
"locations": [],
"events": [],
"version": "1.0",
"lastUpdated": "2025-11-19T00:00:00.000Z"
}
\`\`\`

## Usage

To import data from this repository:

1. Open AWInvestigations app
2. Go to Data Management
3. Set up your GitHub token (if not already done)
4. Click "Import from GitHub"
5. Your local data will be replaced with the repository data

## Guidelines

- Keep data family-friendly
- Use descriptive names for characters and locations
- Avoid copyrighted content
- Be respectful of other contributors

## License

The data in this repository is contributed by the community and is available for use within the AWInvestigations application.
```

#### data.json

```json
{
  "characters": [],
  "factions": [],
  "locations": [],
  "events": [],
  "version": "1.0",
  "lastUpdated": "2025-11-19T00:00:00.000Z"
}
```

#### .gitignore

```
# OS files
.DS_Store
Thumbs.db

# Editor files
*.swp
*.swo
*~
.vscode/
.idea/

# Temporary files
*.tmp
temp/
```

### 3. Set Up Branch Protection (Recommended)

1. Go to repository Settings → Branches
2. Click "Add rule"
3. Branch name pattern: `main`
4. Enable:
   - ☑️ Require a pull request before merging
   - ☑️ Require approvals (at least 1)
   - ☑️ Require review from Code Owners (optional)
5. Click "Create"

### 4. Configure Access

#### For Public Repository:

- Anyone can view and clone
- Configure who can approve PRs in Settings → Collaborators

#### For Private Repository:

1. Go to Settings → Collaborators
2. Add users who should have access
3. Set appropriate permissions:
   - **Write**: Can create PRs
   - **Maintain**: Can approve PRs
   - **Admin**: Full control

### 5. Optional: Set Up Code Owners

Create `.github/CODEOWNERS`:

```
# Data files require approval from maintainers
data.json @mccarjac
```

### 6. Optional: Add Issue Templates

Create `.github/ISSUE_TEMPLATE/data_issue.md`:

```markdown
---
name: Data Issue
about: Report an issue with game data
title: '[DATA] '
labels: data-issue
assignees: ''
---

**Data Type**
Character / Faction / Location / Event

**Description**
Describe the issue with the data

**Expected Behavior**
What should the data look like?

**Current Behavior**
What does the data currently show?

**Additional Context**
Any other information that might be helpful
```

## Usage Instructions for Users

### Exporting Data

1. Open AWInvestigations app
2. Go to Data Management
3. Ensure GitHub token is configured
4. Click "Export to GitHub (Create PR)"
5. Review the Pull Request link
6. Wait for approval

### Importing Data

1. Open AWInvestigations app
2. Go to Data Management
3. Ensure GitHub token is configured
4. Click "Import from GitHub"
5. Confirm you want to replace local data
6. Data will be imported from the main branch

## Maintenance

### Regular Tasks

1. **Review Pull Requests**: Check for quality and appropriateness
2. **Merge Approved Changes**: Keep the main branch up to date
3. **Monitor Issues**: Address data problems reported by users
4. **Update Documentation**: Keep README and guides current

### Data Quality

- Validate JSON format before merging
- Check for duplicate entries
- Ensure data follows app schema
- Test imports before approving major changes

## Troubleshooting

### Common Issues

1. **PR Creation Fails**: Check repository exists and token has write access
2. **Import Fails**: Verify data.json exists and is valid JSON
3. **Permission Errors**: Ensure user token has appropriate repository access

## Support

For issues with the data library:

- Open an issue in this repository
- Contact repository maintainers
- Check AWInvestigations app documentation

## Future Enhancements

Planned features:

- Image storage and sync
- Version history and rollback
- Partial data sync
- Conflict resolution
- Data validation workflows
