# PRE-REQS

- A linux based terminal (Linux subservice for Windows should suffice)
- Permissions to run terminal commands, install packages on the machine
- NPM will need to be installed

# TO SETUP

`npm install`

# TO RUN

## Web Version

1. `npm run web`
1. Open a web browser and navigate to `localhost:8081`

## Android Development

1. `npm run android`
   - Requires an Android emulator or physical device with USB debugging enabled

# TO BUILD ANDROID APP

This project uses Expo Application Services (EAS) to build Android apps.

## Prerequisites for Building

- An Expo account (sign up at https://expo.dev)
- EAS CLI installed: `npm install -g eas-cli`
- Login to EAS: `eas login`

## Build Instructions

### Option 1: Build APK (Recommended for Testing)

Build an APK that can be installed directly on Android devices:

```bash
eas build --platform android --profile preview
```

This will:

1. Start a cloud build process
2. Generate an APK file
3. Provide a download link when complete

### Option 2: Build AAB (For Google Play Store)

Build an Android App Bundle for Play Store distribution:

```bash
eas build --platform android --profile production
```

### Option 3: Local Development Build

For development with custom native code:

```bash
eas build --platform android --profile development
```

## Installing the APK

1. After the build completes, download the APK from the link provided by EAS
2. Transfer the APK to your Android device
3. Enable "Install from Unknown Sources" in Android settings
4. Open the APK file on your device to install

## Build Profiles

- **preview**: Builds APK for testing (faster, easier to install)
- **production**: Builds AAB for Play Store submission
- **development**: Builds development client with debugging tools

For more information, visit: https://docs.expo.dev/build/setup/
