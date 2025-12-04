# GitHub Actions Setup for APK Building

This repository includes a GitHub Action that automatically builds an Android APK whenever changes are pushed to the `master` branch.

## Prerequisites

Before the GitHub Action can build your APK, you need to set up an Expo access token.

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

### 3. Verify the Setup

Once you've added the `EXPO_TOKEN` secret:

1. Push a commit to the `master` branch
2. Go to the **Actions** tab in your GitHub repository
3. You should see the "Build Android APK" workflow running
4. The workflow will submit a build to Expo's build servers

## How It Works

The GitHub Action workflow:

1. **Triggers**: Automatically runs when code is pushed to the `master` branch
2. **Setup**: Installs Node.js, Expo CLI, and project dependencies
3. **Build**: Submits an APK build to Expo Application Services (EAS) and waits for completion
4. **Duration**: The workflow takes 10-20 minutes (waits for EAS to complete the build)
5. **Release**: Creates a GitHub Release with the APK download URL

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

## Troubleshooting

### Build Fails with "Missing EXPO_TOKEN"

- Verify you've added the `EXPO_TOKEN` secret in your repository settings
- Ensure the token is valid and hasn't expired
- Check that you've logged into Expo at least once with `eas login`

### Build Never Starts

- Check your Expo account has build quota available (free tier includes builds)
- Verify your `app.json` has the correct project ID
- Ensure `eas.json` is properly configured

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
