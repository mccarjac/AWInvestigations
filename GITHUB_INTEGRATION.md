# GitHub Integration Guide

This guide explains how to set up and use the GitHub integration feature for importing and exporting game data.

## Prerequisites

1. **GitHub Account**: You need a GitHub account to use this feature.
2. **Data Repository**: The data will be stored in the `mccarjac/AWInvestigationsDataLibrary` repository.
3. **Personal Access Token**: You need a GitHub Personal Access Token with `repo` permissions.

## Setting Up Your GitHub Token

### Creating a Personal Access Token

1. Go to GitHub Settings: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Junktown Intelligence Data Sync")
4. Select the following scopes:
   - `repo` (Full control of private repositories)
5. Click "Generate token"
6. **IMPORTANT**: Copy the token immediately - you won't be able to see it again!

### Adding Token to the App

1. Open the app and navigate to "Data Management"
2. Scroll to the "GitHub Repository Sync" section
3. Click "Set Up GitHub Token"
4. Paste your token in the prompt
5. Click "Save"

The token will be validated and stored securely on your device.

## Exporting Data to GitHub

When you export data to GitHub:

1. Click "Export to GitHub (Create PR)" in the Data Management screen
2. The app will:
   - Create a new branch in the repository with a timestamp
   - Export your data as `data.json` containing:
     - Characters
     - Factions
     - Locations
     - Events
   - Export all images for characters, factions, locations, and events
   - Upload images to the `images/` directory in the repository
   - Create a Pull Request for review
3. You'll receive a link to the Pull Request
4. A human reviewer can approve and merge the PR

**Note**: Images are included in both export and import operations. They are stored in the repository under the `images/` directory organized by entity type (characters, factions, locations, events).

## Importing Data from GitHub

When you import data from GitHub:

1. Click "Import from GitHub" in the Data Management screen
2. The app will:
   - Fetch the latest `data.json` from the main branch
   - Check for images in the `images/` directory
   - Download only new or updated images (skips images that already exist locally with the same size)
   - Save images to local permanent storage
   - Replace your local data with the imported data
3. **Warning**: This will replace ALL existing data on your device

**Performance Note**: Subsequent imports are faster as existing images are not re-downloaded unless they have changed.

## Repository Structure

The data repository should have the following structure:

```
mccarjac/AWInvestigationsDataLibrary/
├── README.md
├── data.json
└── images/
    ├── characters/
    │   ├── characterId_0.jpg
    │   └── characterId_1.png
    ├── factions/
    │   └── Faction_Name_0.jpg
    ├── locations/
    │   └── locationId_0.jpg
    └── events/
        └── eventId_0.jpg
```

### data.json Format

```json
{
  "characters": [...],
  "factions": [...],
  "locations": [...],
  "events": [...],
  "version": "1.0",
  "lastUpdated": "2025-11-19T22:00:00.000Z"
}
```

## Security Considerations

1. **Token Storage**: Tokens are stored in the device's filesystem. Keep your device secure.
2. **Token Permissions**: Only grant `repo` permission - no more, no less.
3. **Data Privacy**: The repository can be public or private. Consider data sensitivity.
4. **Revoke Tokens**: If you lose your device, revoke the token at https://github.com/settings/tokens

## Troubleshooting

### "Repository not found" Error

If you get a "Repository not found" error:

1. Verify the repository exists: https://github.com/mccarjac/AWInvestigationsDataLibrary
2. Ensure your token has access to the repository
3. If the repository is private, verify your token has `repo` scope

### "Invalid Token" Error

If you get an "Invalid token" error:

1. Verify the token is correct (no extra spaces)
2. Check if the token has expired
3. Ensure the token has `repo` scope
4. Try generating a new token

### Export Failed

If export fails:

1. Check your internet connection
2. Verify your token is still valid
3. Check if you have write access to the repository
4. Try again after a few minutes (rate limiting)

### Import Failed

If import fails:

1. Check your internet connection
2. Verify the repository exists and has a `data.json` file
3. Verify your token has read access to the repository
4. Check if the `data.json` format is valid
5. Check the console logs for specific image download errors
6. Ensure images in the `images/` directory are valid and accessible

## Future Enhancements

Planned features for future releases:

1. ~~**Image Support**: Export and import character/faction/location images~~ ✅ Completed
2. **Merge Instead of Replace**: Option to merge imported data with existing data
3. **Selective Export**: Export only specific entities
4. **Version History**: View and restore previous versions
5. **Conflict Resolution**: Better handling of concurrent edits
6. **Git LFS**: Support for large image files (for better performance with many images)

## Contributing

If you want to contribute to the shared data library:

1. Fork the `mccarjac/AWInvestigationsDataLibrary` repository
2. Make your changes
3. Create a Pull Request
4. Wait for review and approval

## Support

For issues or questions:

- Check the troubleshooting section above
- Open an issue in the main repository
- Contact the maintainers
