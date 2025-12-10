# GitHub Actions Setup for APK Building

This repository includes a GitHub Action that automatically builds an Android APK whenever changes are pushed to the `master` branch.

## Prerequisites

Before the GitHub Action can build your APK, you need to set up an Expo access token and initialize Android build credentials.

## Setup Instructions

### 1. Create an Expo Access Token

1. Log in to your Expo account at [expo.dev](https://expo.dev)
2. Navigate to **Account Settings** → **Access Tokens**
   - Or go directly to: `https://expo.dev/accounts/YOUR_USERNAME/settings/access-tokens`
   - Replace `YOUR_USERNAME` with your actual Expo username or organization name
3. Click **"Create Token"**
4. Give it a descriptive name (e.g., "GitHub Actions APK Builder")
5. Copy the token immediately (you won't be able to see it again)

### 2. Add the Token to GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Name: `EXPO_TOKEN`
5. Value: Paste the Expo access token you copied
6. Click **"Add secret"**

### 3. Initialize Android Build Credentials (One-Time Setup)

**Important**: Before GitHub Actions can build your app, you must run your first build locally to generate Android signing credentials. This is a one-time setup.

```bash
# Install EAS CLI globally if you haven't already
npm install -g eas-cli

# Login to your Expo account
eas login

# Run your first build (this will create the Android keystore)
eas build --platform android --profile preview
```

When prompted:

- Select **"Yes"** to generate a new Android Keystore
- Wait for the build to complete (this can take 10-20 minutes)

After this first build completes, the Android signing credentials will be stored securely on Expo's servers, and GitHub Actions will be able to use them for automated builds.

> **Note**: You only need to do this once. After the initial setup, all future builds through GitHub Actions will use the same credentials automatically.

### 4. Verify the Setup

Once you've added the `EXPO_TOKEN` secret:

1. Push a commit to the `master` branch
2. Go to the **Actions** tab in your GitHub repository
3. You should see the "Build Android APK" workflow running
4. The workflow will submit a build to Expo's build servers

## How It Works

The GitHub Action workflow:

1. **Triggers**: Automatically runs when code is pushed to the `master` branch
2. **Build Throttling**: Checks if the last build was >= 48 hours ago to avoid hitting Expo's free tier limits (15 builds/month)
   - If less than 48 hours: Build is skipped with an informative message
   - If >= 48 hours or no previous build: Proceeds with the build
3. **Setup**: Installs Node.js, Expo CLI, and project dependencies
4. **Build**: Submits an APK build to Expo Application Services (EAS) and waits for completion
5. **Duration**: The workflow takes 10-20 minutes (waits for EAS to complete the build)
6. **Release**: Creates a GitHub Release with the APK download URL

## Accessing Your Built APK

After the GitHub Action completes, there are two ways to download your APK:

### Method 1: GitHub Releases (Recommended)

1. Go to your repository's **Releases** page:
   - Navigate to `https://github.com/YOUR_USERNAME/YOUR_REPO/releases`
   - Or click **Releases** in the right sidebar of your repository
2. Find the latest release (named "APK Build #...")
3. Click the **Download APK** link in the release description
4. Transfer the APK to your Android device and install it

### Method 2: Expo Dashboard

1. Visit your Expo builds page:
   - Go to [expo.dev](https://expo.dev)
   - Navigate to **Projects** → **JunktownIntelligence** → **Builds**
   - Or go directly to: `https://expo.dev/accounts/YOUR_USERNAME/projects/JunktownIntelligence/builds`
   - Replace `YOUR_USERNAME` with your actual Expo username or organization name
2. Find the completed build
3. Click **"Download"** to get your APK file
4. Transfer the APK to your Android device and install it

## Build Profiles

The workflow uses the `preview` profile defined in `eas.json`:

- **Output**: APK file (not AAB)
- **Distribution**: Internal (for testing/direct installation)
- **Use Case**: Testing, sharing with beta testers, personal use

To change the build profile, edit `.github/workflows/build-apk.yml` and modify:

```yaml
eas build --platform android --profile preview
```

Available profiles:

- `preview` - APK for testing (current)
- `production` - APK for wider distribution
- `development` - Development build with debugging tools

## Build Throttling (48-Hour Rule)

To avoid hitting Expo's free tier build limits (15 builds per month), the workflow automatically throttles builds:

- **Automatic Check**: Before each build, the workflow checks when the last build was created
- **48-Hour Threshold**: Builds are only allowed if >= 48 hours have passed since the last build
- **Skipped Builds**: If less than 48 hours have passed, the workflow skips the build and shows an informative message
- **First Build**: If no previous builds exist, the build proceeds normally

This ensures you can push code to `master` as often as needed without worrying about build quota, while still getting regular APK builds approximately every 2 days.

### Overriding the Throttle

If you need to force a build before 48 hours have passed, you can:

1. Manually delete the most recent GitHub release
2. Push a new commit to trigger the workflow
3. Or manually trigger a build using EAS CLI: `eas build --platform android --profile preview`

## Troubleshooting

### Build Fails with "Generating a new Keystore is not supported in --non-interactive mode"

This error means Android signing credentials haven't been set up yet. **Solution**:

1. Run the one-time credential setup (see Step 3 above)
2. Complete at least one successful build locally with `eas build --platform android --profile preview`
3. After credentials are created, push to `master` branch again

### Build Fails with "Missing EXPO_TOKEN"

- Verify you've added the `EXPO_TOKEN` secret in your repository settings
- Ensure the token is valid and hasn't expired
- Check that you've logged into Expo at least once with `eas login`

### Build Never Starts

- Check your Expo account has build quota available (free tier includes builds)
- Verify your `app.json` has the correct project ID
- Ensure `eas.json` is properly configured
- **Most common**: Make sure you've completed the one-time credential setup (Step 3)

### Action Runs But No Release Appears

- Check the Action logs for any errors during the build process
- Verify that the build completed successfully (status: FINISHED)
- Ensure the workflow has permission to create releases (GITHUB_TOKEN should have write access)
- Review the EAS builds page directly for your build status

### Action Times Out

- The workflow now waits for the build to complete (10-20 minutes typically)
- If your build takes longer, GitHub Actions has a default timeout of 6 hours
- Check the EAS builds page to see if the build is still processing
- Review the Action logs for any error messages

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Build with GitHub Actions](https://docs.expo.dev/build/building-on-ci/)
- [Managing Access Tokens](https://docs.expo.dev/accounts/programmatic-access/)

## Customization

### Building Only on Version Tags

To build only when you tag releases:

```yaml
on:
  push:
    tags:
      - 'v*'
```

### Building on Pull Requests

To test builds on PRs before merging:

```yaml
on:
  pull_request:
    branches:
      - master
  push:
    branches:
      - master
```

### Different Build Profiles for Different Branches

```yaml
on:
  push:
    branches:
      - master
      - develop

jobs:
  build:
    # ...
    steps:
      # ...
      - name: Build APK
        run: |
          if [ "${{ github.ref }}" == "refs/heads/master" ]; then
            eas build --platform android --profile production --non-interactive --wait --json
          else
            eas build --platform android --profile preview --non-interactive --wait --json
          fi
```
