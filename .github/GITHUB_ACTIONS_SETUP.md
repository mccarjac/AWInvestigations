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
3. **Build**: Submits an APK build to Expo Application Services (EAS)
4. **Duration**: The workflow completes in ~2-3 minutes (just submits the build)
5. **Actual Build**: EAS processes the build in 10-20 minutes on their servers

## Accessing Your Built APK

After the GitHub Action completes:

1. Visit your Expo builds page:
   - Go to [expo.dev](https://expo.dev)
   - Navigate to **Projects** → **JunktownIntelligence** → **Builds**
   - Or go directly to: `https://expo.dev/accounts/YOUR_USERNAME/projects/JunktownIntelligence/builds`
   - Replace `YOUR_USERNAME` with your actual Expo username or organization name
2. Wait for the build to finish (status will change from "In Progress" to "Finished")
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

### Action Runs But No Build Appears

- The `--no-wait` flag means the Action doesn't wait for EAS to complete
- Check the EAS builds page directly for your build status
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
            eas build --platform android --profile production --non-interactive --no-wait
          else
            eas build --platform android --profile preview --non-interactive --no-wait
          fi
```
