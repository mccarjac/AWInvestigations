# Building Android App - Quick Guide

This guide provides step-by-step instructions for building an Android app from this React Native Expo project.

## Prerequisites

1. **Node.js and npm**: Already installed (required for development)
2. **Expo Account**: Create one at https://expo.dev (free)
3. **EAS CLI**: Install globally with `npm install -g eas-cli`

## Step-by-Step Build Process

### 1. Install Dependencies

```bash
npm install
```

### 2. Login to Expo

```bash
eas login
```

Enter your Expo account credentials when prompted.

### 3. Configure Your Project

The project is already configured with:

- Android package name: `com.junktownintelligence.app`
- Build profiles in `eas.json`

### 4. Build the Android App

#### For Testing (APK - Recommended)

```bash
eas build --platform android --profile preview
```

This creates an APK file that can be directly installed on Android devices.

#### For Production (APK - Distribution)

```bash
eas build --platform android --profile production
```

This creates a production-ready APK for distribution.

### 5. Monitor the Build

- The build process runs on Expo's cloud servers
- You'll see a URL to monitor build progress
- Build typically takes 10-20 minutes

### 6. Download and Install

Once the build completes:

1. **Download**: Click the download link provided by EAS
2. **Transfer**: Send the APK to your Android device (email, cloud storage, etc.)
3. **Enable Installation**: On your Android device:
   - Go to Settings > Security
   - Enable "Install from Unknown Sources" or "Install Unknown Apps"
4. **Install**: Open the APK file on your device to install

## Build Profiles Explained

| Profile       | Output | Use Case                                 |
| ------------- | ------ | ---------------------------------------- |
| `preview`     | APK    | Testing on devices, sharing with testers |
| `production`  | APK    | Distribution outside Play Store          |
| `development` | APK    | Development build with debugging tools   |

## Troubleshooting

### Build Fails

- Check the build logs on the Expo website
- Ensure all dependencies are compatible
- Verify app.json configuration is valid

### Cannot Install APK

- Ensure "Install from Unknown Sources" is enabled
- Check that your device runs Android 5.0 or higher
- Try downloading the APK again

### First Build Takes Long

- First build may take 20-30 minutes as it sets up the build environment
- Subsequent builds are typically faster (10-15 minutes)

## Alternative: Local Build (Advanced)

For developers who want to build locally:

1. Generate native Android project:

```bash
npx expo prebuild --platform android
```

2. Build with Android Studio or Gradle:

```bash
cd android
./gradlew assembleRelease
```

Output APK will be in `android/app/build/outputs/apk/release/`

## Resources

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Creating Your First Build](https://docs.expo.dev/build/setup/)
- [Android Build Configuration](https://docs.expo.dev/build-reference/android-builds/)
