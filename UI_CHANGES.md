# UI Changes - GitHub Integration

## Overview

This document describes the UI changes made to the Data Management screen to support GitHub integration.

## Data Management Screen Changes

### New Section Added

A new "GitHub Repository Sync" section has been added to the Data Management screen, appearing after the CSV Import section and before the Danger Zone.

### Section Layout

```
┌─────────────────────────────────────────────────────┐
│ Data Management                                      │
├─────────────────────────────────────────────────────┤
│                                                       │
│ [Export Data Section]                                │
│ [Import Data Section]                                │
│ [Merge Data Section]                                 │
│ [CSV Import Section]                                 │
│                                                       │
│ ┌───────────────────────────────────────────────┐  │
│ │ GitHub Repository Sync                         │  │
│ │                                                │  │
│ │ Share data with other users through the       │  │
│ │ AWInvestigationsDataLibrary GitHub repository.│  │
│ │ Exports create pull requests for review.      │  │
│ │                                                │  │
│ │ [Buttons - see below]                          │  │
│ └───────────────────────────────────────────────┘  │
│                                                       │
│ [Danger Zone Section]                                │
└─────────────────────────────────────────────────────┘
```

## Button States

### State 1: Not Configured

When GitHub token is not set up, only the setup button is shown:

```
┌─────────────────────────────────────────────────────┐
│ GitHub Repository Sync                               │
│                                                      │
│ Share data with other users through the             │
│ AWInvestigationsDataLibrary GitHub repository.      │
│ Exports create pull requests for review.            │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │         Set Up GitHub Token                   │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Button Details:**

- **Text:** "Set Up GitHub Token"
- **Style:** Secondary elevated style (darker background with primary border)
- **Action:** Shows prompt to enter GitHub Personal Access Token

### State 2: Configured

When GitHub token is configured, three buttons are shown:

```
┌─────────────────────────────────────────────────────┐
│ GitHub Repository Sync                               │
│                                                      │
│ Share data with other users through the             │
│ AWInvestigationsDataLibrary GitHub repository.      │
│ Exports create pull requests for review.            │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │    Export to GitHub (Create PR)               │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │         Import from GitHub                    │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │        Update GitHub Token                    │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Button Details:**

1. **Export to GitHub (Create PR)**
   - **Style:** Success button (green background)
   - **Action:** Exports data and creates a pull request
   - **Result:** Shows PR URL on success

2. **Import from GitHub**
   - **Style:** Info button (blue background)
   - **Action:** Fetches and imports data from repository
   - **Result:** Replaces local data with repository data

3. **Update GitHub Token**
   - **Style:** Secondary elevated style
   - **Action:** Shows prompt to enter new token
   - **Result:** Updates stored token

## User Interactions

### 1. Token Setup Flow

```
User clicks "Set Up GitHub Token"
           ↓
    Alert prompt appears
           ↓
User enters GitHub token
           ↓
    Token validated
           ↓
   ┌──────┴────────┐
   │               │
Valid           Invalid
   │               │
   ↓               ↓
Saved        Error shown
   ↓         (try again)
Success
message
   ↓
Buttons
update
```

**Dialog Appearance:**

```
┌────────────────────────────────────────┐
│ GitHub Personal Access Token           │
├────────────────────────────────────────┤
│                                        │
│ Enter your GitHub Personal Access     │
│ Token with repo permissions. You can  │
│ create one at:                         │
│ https://github.com/settings/tokens    │
│                                        │
│ [___________________________________]  │
│                                        │
│      [Cancel]         [Save]          │
└────────────────────────────────────────┘
```

### 2. Export Flow

```
User clicks "Export to GitHub (Create PR)"
           ↓
Progress modal appears:
"Exporting to GitHub..."
           ↓
   ┌──────┴────────┐
   │               │
Success         Error
   │               │
   ↓               ↓
Alert with    Error alert
PR URL        with message
```

**Progress Modal:**

```
┌────────────────────────────────────┐
│                                    │
│          [Loading spinner]         │
│                                    │
│      Exporting to GitHub...        │
│         Please wait...             │
│                                    │
└────────────────────────────────────┘
```

**Success Alert:**

```
┌────────────────────────────────────┐
│ Export Successful                  │
├────────────────────────────────────┤
│                                    │
│ A pull request has been created    │
│ with your data. You can review     │
│ it at:                             │
│                                    │
│ https://github.com/mccarjac/       │
│ AWInvestigationsDataLibrary/       │
│ pull/123                           │
│                                    │
│              [OK]                  │
└────────────────────────────────────┘
```

### 3. Import Flow

```
User clicks "Import from GitHub"
           ↓
Progress modal appears:
"Importing from GitHub..."
           ↓
   ┌──────┴────────┐
   │               │
Success         Error
   │               │
   ↓               ↓
Success       Error alert
alert         with message
```

**Success Alert:**

```
┌────────────────────────────────────┐
│ Import Successful                  │
├────────────────────────────────────┤
│                                    │
│ Data has been imported from the    │
│ GitHub repository.                 │
│                                    │
│              [OK]                  │
└────────────────────────────────────┘
```

## Error Scenarios

### Repository Not Found

```
┌────────────────────────────────────┐
│ Export Failed                      │
├────────────────────────────────────┤
│                                    │
│ Repository mccarjac/               │
│ AWInvestigationsDataLibrary        │
│ not found. Please ensure the       │
│ repository exists and your token   │
│ has access to it.                  │
│                                    │
│              [OK]                  │
└────────────────────────────────────┘
```

### Not Configured

```
┌────────────────────────────────────┐
│ GitHub Not Configured              │
├────────────────────────────────────┤
│                                    │
│ Please set up your GitHub token    │
│ first.                             │
│                                    │
│    [Cancel]        [Set Up]        │
└────────────────────────────────────┘
```

### Invalid Token

```
┌────────────────────────────────────┐
│ Invalid Token                      │
├────────────────────────────────────┤
│                                    │
│ The token you entered is invalid.  │
│ Please check and try again.        │
│                                    │
│              [OK]                  │
└────────────────────────────────────┘
```

## Button Styling

### Colors

All buttons follow the existing theme:

```typescript
// Export button (success)
backgroundColor: colors.accent.success; // #10B981 (green)

// Import button (info)
backgroundColor: colors.accent.info; // #3B82F6 (blue)

// Setup/Update button (secondary)
backgroundColor: colors.elevated; // #2D2D54
borderColor: colors.accent.secondary; // #8B5CF6 (purple)
```

### Spacing

```typescript
marginBottom: 12; // Space between buttons
marginTop: 16; // Space after description
```

### Typography

```typescript
// Button text
fontSize: 16;
fontWeight: '600';
color: colors.text.primary; // #FFFFFF (white)
```

## Accessibility

### Screen Reader Labels

All buttons include descriptive labels:

- "Set Up GitHub Token"
- "Export to GitHub and Create Pull Request"
- "Import from GitHub Repository"
- "Update GitHub Access Token"

### Touch Targets

All buttons meet minimum touch target size:

- Height: 48px (minimum recommended)
- Width: Full section width minus padding

## Responsive Design

The section maintains consistent layout across:

- Small phones (320px width)
- Standard phones (375px-414px width)
- Tablets (768px+ width)

All elements are scrollable within the Data Management screen's ScrollView.

## Dark Theme

All UI elements follow the app's dark theme:

- Background: Dark blue-purple (#0F0F23)
- Cards: Lighter dark (#262647)
- Text: White (#FFFFFF)
- Borders: Gray-blue (#3F3F65)
- Buttons: Themed accent colors

## Animation

### Progress Modal

- Fade in/out animation
- Spinner rotation
- Modal overlay darkening

### Button States

- Slight scale on press
- Color change on hover (web)
- Disabled state when loading

## Implementation Notes

The UI updates are minimal and follow existing patterns:

1. Same section structure as other sections
2. Same button styles as existing buttons
3. Same alert patterns as other features
4. Same progress modal as other operations

No new UI components were created - all use existing components from the app's design system.
