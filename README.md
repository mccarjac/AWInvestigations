# AWIntelligence

A React Native mobile application for managing tabletop RPG game data, including characters, factions, locations, and events.

## Features

- **Character Management**: Track character stats, skills, perks, and relationships
- **Faction System**: Manage factions and character affiliations
- **Location Tracking**: Create and assign locations to characters
- **Event Timeline**: Track important game events
- **Import/Export**: Share data via JSON, ZIP, or CSV files
- **GitHub Integration**: Sync data with other users via GitHub repository (see [GITHUB_INTEGRATION.md](./GITHUB_INTEGRATION.md))

## PRE-REQS

- A linux based terminal (Linux subservice for Windows should suffice)
- Permissions to run terminal commands, install packages on the machine
- NPM and GitHub CLI will need to be installed

## TO SETUP

1. Create your workspace \
   `mkdir AWIntelligence && cd AWIntelligence`
1. Pull down this package \
   `gh repo clone mccarjac/AWInvestigations`
1. Install dependencies \
   `npm install`

## TO RUN

### Android Development (Preffered)

1. If using a physical device, connect it via USB
   - You will need to enable USB debugging, see the [official documentation](https://developer.android.com/studio/run/device)
1. `npm run android`
   - While running, you can press 'a' in the terminal to re-launch the app on your device, bringing in any changes

### Web Version (Features may not work on web as expected)

1. `npm run web`
1. Open a web browser and navigate to `localhost:8081`

## TO BUILD ANDROID APP

See ANDROID_BUILD.md
