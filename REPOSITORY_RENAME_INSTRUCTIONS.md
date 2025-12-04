# Repository Rename Instructions

This document explains how to rename the GitHub repository from `AWInvestigations` to `JunktownIntelligence` to match the updated application name.

## Important Notes

- **Repository rename requires owner/admin permissions** on the GitHub repository
- GitHub automatically sets up redirects from the old repository name to the new one
- Existing clones will continue to work, but should be updated to use the new URL
- Open pull requests and issues will automatically redirect to the new repository name

## Steps to Rename the Repository

### 1. Rename on GitHub

1. Go to the repository on GitHub: https://github.com/mccarjac/AWInvestigations
2. Click **Settings** (gear icon) in the repository menu
3. Scroll down to the **Repository name** section
4. Change `AWInvestigations` to `JunktownIntelligence`
5. Click **Rename**
6. GitHub will show a warning about the impact - read it and confirm

### 2. Update Local Clones (Optional but Recommended)

For any local clones of the repository, update the remote URL:

```bash
cd /path/to/repository
git remote set-url origin https://github.com/mccarjac/JunktownIntelligence.git
```

Or if using SSH:

```bash
git remote set-url origin git@github.com:mccarjac/JunktownIntelligence.git
```

Verify the change:

```bash
git remote -v
```

### 3. Update GitHub Actions Secrets (If Needed)

The GitHub Actions workflow should continue to work after the rename because:

- It uses the repository context variables which automatically update
- The `EXPO_TOKEN` secret will remain valid

However, verify that the workflow runs successfully after the rename.

### 4. Update Expo Project (If Needed)

If you encounter any issues with Expo builds after the rename:

1. Log in to https://expo.dev
2. Navigate to your project
3. The project should automatically recognize the new repository name
4. If needed, you can update project settings to reference the new repository

## What Gets Updated Automatically

GitHub handles these automatically:

- All issues and pull requests redirect to the new URL
- Stars, watchers, and forks are preserved
- GitHub Pages (if configured) updates automatically
- Webhooks remain active
- GitHub Actions workflows continue to work

## What Needs Manual Updates

These references will still work (due to redirects) but should be updated for clarity:

1. **README badges and links**: Update any GitHub URLs in the README that weren't caught in the rename (already done in this PR)
2. **External documentation**: Update any external links to the repository
3. **Package.json repository field**: Consider adding a repository field:
   ```json
   "repository": {
     "type": "git",
     "url": "https://github.com/mccarjac/JunktownIntelligence.git"
   }
   ```

## Testing After Rename

After renaming, verify:

1. ✅ Repository is accessible at new URL
2. ✅ Old URL redirects to new URL
3. ✅ GitHub Actions workflows run successfully
4. ✅ Expo builds complete successfully
5. ✅ Issues and PRs are accessible
6. ✅ Clone/push/pull operations work

## Rollback (If Needed)

If you need to revert the rename:

1. Go to repository Settings
2. Change the name back to `AWInvestigations`
3. GitHub will restore the original URL

## References

- [GitHub Docs: Renaming a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository)
- [GitHub Docs: What happens when I change my repository name?](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository#what-happens-when-i-rename-a-repository)
