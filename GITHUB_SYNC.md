# GitHub Sync Feature

This document describes the intelligent GitHub sync feature that allows users to synchronize their local data with the shared GitHub repository.

## Overview

The sync feature provides an intelligent way to merge local changes with remote updates from the GitHub repository. It automatically detects when updates are available and provides a visual badge notification in the navigation drawer.

## Features

### 1. **Intelligent Sync**
- Automatically detects when remote data is newer than local data
- Merges remote changes with local data using conflict resolution
- Preserves local changes that don't conflict with remote updates
- Uses the existing `mergeDatasetWithConflictResolution` function for safe merging

### 2. **Update Checking**
- Automatically checks for updates on app launch
- Periodically checks for updates every 5 minutes (configurable)
- Displays a visual badge on the "Data Management" menu item when updates are available
- Manual "Check for Updates" button for on-demand checking

### 3. **Badge Notification**
- Red "NEW" badge appears on the Data Management drawer item when updates are available
- Badge automatically disappears after syncing
- Updates check both in the drawer and on the Data Management screen

### 4. **Conflict Resolution**
- Auto-resolves conflicts where possible by:
  - Merging arrays (perks, distinctions, factions)
  - Using the most recent timestamp for updates
  - Keeping non-conflicting properties from both versions
- Prompts users when conflicts require manual review
- Falls back to suggesting a Pull Request export when local changes can't be automatically synced

## User Interface

### Data Management Screen

The Data Management screen has been enhanced with new sync options:

**Primary Actions:**
- **🔄 Sync with GitHub** - Main sync button that intelligently merges data
  - Highlighted when updates are available
  - Shows emoji indicator for visual prominence
- **Check for Updates** - Manually check if newer data is available in GitHub

**Advanced Options:**
- **Export to GitHub (Create PR)** - Creates a Pull Request for manual review
- **Import from GitHub (Replace All)** - Replaces all local data (use with caution)
- **Update GitHub Token** - Update your authentication token

### Navigation Drawer

The Data Management menu item now shows a badge:
- **Normal state**: "Data Management"
- **Updates available**: "Data Management" with red "NEW" badge

## Technical Implementation

### New Functions in `gitIntegration.ts`

#### `getRemoteDataInfo()`
```typescript
Promise<{
  success: boolean;
  info?: GitHubDataInfo;
  error?: string;
}>
```
Fetches metadata about the remote data without downloading the full dataset. Returns version, lastUpdated timestamp, and file SHA.

#### `checkForUpdates()`
```typescript
Promise<{
  available: boolean;
  remoteLastUpdated?: string;
  localLastUpdated?: string;
  error?: string;
}>
```
Compares remote and local data timestamps to determine if updates are available. Updates the `lastCheckedForUpdates` and `lastKnownRemoteVersion` in the config.

#### `syncWithGitHub()`
```typescript
Promise<{
  success: boolean;
  merged?: number;
  conflicts?: number;
  requiresManualReview?: boolean;
  error?: string;
}>
```
Performs the intelligent sync operation:
1. Checks if updates are available
2. Downloads remote data if updates exist
3. Merges using `mergeDatasetWithConflictResolution`
4. Returns statistics about merged items and conflicts
5. Suggests manual PR export if local changes can't be auto-synced

### Enhanced GitHubConfig

The configuration now tracks additional sync state:
```typescript
interface GitHubConfig {
  token?: string;
  lastSync?: string;                    // When last sync completed
  lastKnownRemoteVersion?: string;      // Remote timestamp at last check
  lastCheckedForUpdates?: string;       // When we last checked for updates
}
```

## Usage Flow

### Basic Sync Flow

1. User opens the app
2. App automatically checks for updates (if GitHub is configured)
3. If updates available, badge appears on Data Management menu
4. User navigates to Data Management screen
5. User sees "Sync Now (Updates Available)" button highlighted
6. User clicks sync button
7. App downloads and merges remote data
8. User receives confirmation with merge statistics

### Conflict Resolution Flow

1. User clicks sync button
2. App detects conflicts that can't be auto-resolved
3. User sees notification: "Sync Complete with Conflicts"
4. Message indicates N conflicts were auto-resolved
5. User reviews data to ensure correctness

### Manual Export Flow (for local changes)

1. User has local changes but no remote updates
2. User clicks sync button
3. App detects local changes need review
4. App suggests: "You have local changes. Please export to GitHub to create a pull request."
5. User clicks "Export to GitHub" to create PR
6. PR created for admin review and merge

## Configuration

### Update Check Interval

The update check interval is set in `App.tsx`:
```typescript
// Check periodically (every 5 minutes)
const interval = setInterval(checkUpdates, 5 * 60 * 1000);
```

To change the interval, modify the milliseconds value (currently 300,000ms = 5 minutes).

### Badge Appearance

Badge styling is defined in `App.tsx`:
```typescript
backgroundColor: '#FF6B6B',  // Red color
borderRadius: 10,
paddingHorizontal: 6,
paddingVertical: 2,
```

## Security Considerations

- Sync uses the same GitHub token as export/import
- Token must have `repo` permissions
- All data transmission uses HTTPS via GitHub API
- No local data is deleted unless explicitly replaced

## Troubleshooting

### "GitHub token not configured" error
- User needs to set up their GitHub token first
- Click "Set Up GitHub Token" and enter a valid token

### "You have local changes" message
- User has local modifications that can't be automatically synced
- Use "Export to GitHub (Create PR)" to create a pull request
- Admin can review and merge the PR manually

### Badge doesn't appear
- Check if GitHub is configured (token set up)
- Verify internet connection
- Manually click "Check for Updates"
- Check console logs for errors

### Sync fails with conflicts
- Some conflicts may be auto-resolved
- Review your data after sync to ensure correctness
- If needed, export your changes as a PR for manual review

## Future Enhancements

Potential improvements for future versions:

1. **Real-time sync** - Use webhooks or polling for instant updates
2. **Selective sync** - Choose which entities to sync
3. **Sync history** - View past sync operations and revert if needed
4. **Conflict UI** - Visual diff viewer for manual conflict resolution
5. **Offline queue** - Queue changes when offline and sync when connected
6. **Multi-user collaboration** - Better handling of concurrent edits

## Related Documentation

- [GITHUB_INTEGRATION.md](./GITHUB_INTEGRATION.md) - General GitHub integration guide
- [DATA_REPOSITORY_TEMPLATE.md](./DATA_REPOSITORY_TEMPLATE.md) - Repository structure
