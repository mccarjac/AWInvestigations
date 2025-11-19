import { Octokit } from '@octokit/rest';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert } from 'react-native';
import { Buffer } from 'buffer';
import { exportDataset } from './characterStorage';

/**
 * Configuration for the data library repository
 */
const DATA_REPO_OWNER = 'mccarjac';
const DATA_REPO_NAME = 'AWInvestigationsDataLibrary';
const DATA_REPO_BRANCH = 'main';

/**
 * GitHub configuration storage keys
 */
const GITHUB_CONFIG_KEY = '@github_config';

interface GitHubConfig {
  token?: string;
  lastSync?: string;
}

/**
 * Get stored GitHub configuration
 */
export const getGitHubConfig = async (): Promise<GitHubConfig> => {
  try {
    const configStr = await FileSystem.readAsStringAsync(
      FileSystem.documentDirectory + GITHUB_CONFIG_KEY
    );
    return JSON.parse(configStr);
  } catch {
    return {};
  }
};

/**
 * Save GitHub configuration
 */
export const saveGitHubConfig = async (config: GitHubConfig): Promise<void> => {
  try {
    await FileSystem.writeAsStringAsync(
      FileSystem.documentDirectory + GITHUB_CONFIG_KEY,
      JSON.stringify(config)
    );
  } catch (error) {
    console.error('Failed to save GitHub config:', error);
  }
};

/**
 * Initialize Octokit with token
 */
const getOctokit = async (): Promise<Octokit | null> => {
  const config = await getGitHubConfig();
  if (!config.token) {
    return null;
  }
  return new Octokit({ auth: config.token });
};

/**
 * Verify GitHub token is valid
 */
export const verifyGitHubToken = async (token: string): Promise<boolean> => {
  try {
    const octokit = new Octokit({ auth: token });
    await octokit.rest.users.getAuthenticated();
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if the data repository exists and is accessible
 */
const verifyRepository = async (
  octokit: Octokit
): Promise<{ exists: boolean; error?: string }> => {
  try {
    await octokit.rest.repos.get({
      owner: DATA_REPO_OWNER,
      repo: DATA_REPO_NAME,
    });
    return { exists: true };
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error) {
      const status = (error as { status: number }).status;
      if (status === 404) {
        return {
          exists: false,
          error: `Repository ${DATA_REPO_OWNER}/${DATA_REPO_NAME} not found. Please ensure the repository exists and your token has access to it.`,
        };
      }
      if (status === 403) {
        return {
          exists: false,
          error: 'Access denied. Please check your token permissions.',
        };
      }
    }
    return {
      exists: false,
      error: 'Failed to verify repository access.',
    };
  }
};

/**
 * Export data to GitHub repository by creating a Pull Request
 */
export const exportToGitHub = async (): Promise<{
  success: boolean;
  prUrl?: string;
  error?: string;
}> => {
  try {
    const octokit = await getOctokit();
    if (!octokit) {
      return {
        success: false,
        error: 'GitHub token not configured. Please set up your token first.',
      };
    }

    // Verify repository exists and is accessible
    const repoCheck = await verifyRepository(octokit);
    if (!repoCheck.exists) {
      return {
        success: false,
        error: repoCheck.error || 'Repository verification failed.',
      };
    }

    // Get the current user info
    const { data: user } = await octokit.rest.users.getAuthenticated();
    const branchName = `data-export-${Date.now()}`;

    // Get the default branch's latest commit SHA
    const { data: ref } = await octokit.rest.git.getRef({
      owner: DATA_REPO_OWNER,
      repo: DATA_REPO_NAME,
      ref: `heads/${DATA_REPO_BRANCH}`,
    });
    const baseSha = ref.object.sha;

    // Create a new branch from the base
    await octokit.rest.git.createRef({
      owner: DATA_REPO_OWNER,
      repo: DATA_REPO_NAME,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    // Export all data
    const jsonData = await exportDataset();
    const dataset = JSON.parse(jsonData);

    // Create/update data.json file
    const dataContent = Buffer.from(JSON.stringify(dataset, null, 2)).toString(
      'base64'
    );

    // Check if file exists
    let fileSha: string | undefined;
    try {
      const { data: existingFile } = await octokit.rest.repos.getContent({
        owner: DATA_REPO_OWNER,
        repo: DATA_REPO_NAME,
        path: 'data.json',
        ref: branchName,
      });
      if ('sha' in existingFile) {
        fileSha = existingFile.sha;
      }
    } catch {
      // File doesn't exist, that's fine
    }

    // Create or update the file
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: DATA_REPO_OWNER,
      repo: DATA_REPO_NAME,
      path: 'data.json',
      message: `Data export by ${user.login} on ${new Date().toISOString()}`,
      content: dataContent,
      branch: branchName,
      sha: fileSha,
    });

    // TODO: Handle image files - for now, we'll just export the JSON data
    // Images could be uploaded separately or as a zip file

    // Create Pull Request
    const { data: pr } = await octokit.rest.pulls.create({
      owner: DATA_REPO_OWNER,
      repo: DATA_REPO_NAME,
      title: `Data export by ${user.login}`,
      head: branchName,
      base: DATA_REPO_BRANCH,
      body: `Automated data export from AWInvestigations app.

**Export Details:**
- User: ${user.login}
- Date: ${new Date().toLocaleString()}
- Characters: ${dataset.characters?.length || 0}
- Factions: ${dataset.factions?.length || 0}
- Locations: ${dataset.locations?.length || 0}
- Events: ${dataset.events?.length || 0}

Please review the changes before merging.`,
    });

    // Update last sync time
    const config = await getGitHubConfig();
    await saveGitHubConfig({
      ...config,
      lastSync: new Date().toISOString(),
    });

    return {
      success: true,
      prUrl: pr.html_url,
    };
  } catch (error) {
    console.error('Export to GitHub failed:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
};

/**
 * Import data from GitHub repository
 */
export const importFromGitHub = async (): Promise<{
  success: boolean;
  data?: string;
  error?: string;
}> => {
  try {
    const octokit = await getOctokit();
    if (!octokit) {
      return {
        success: false,
        error: 'GitHub token not configured. Please set up your token first.',
      };
    }

    // Verify repository exists and is accessible
    const repoCheck = await verifyRepository(octokit);
    if (!repoCheck.exists) {
      return {
        success: false,
        error: repoCheck.error || 'Repository verification failed.',
      };
    }

    // Fetch data.json from the main branch
    const { data: file } = await octokit.rest.repos.getContent({
      owner: DATA_REPO_OWNER,
      repo: DATA_REPO_NAME,
      path: 'data.json',
      ref: DATA_REPO_BRANCH,
    });

    if ('content' in file) {
      const content = Buffer.from(file.content, 'base64').toString('utf-8');

      // Update last sync time
      const config = await getGitHubConfig();
      await saveGitHubConfig({
        ...config,
        lastSync: new Date().toISOString(),
      });

      return {
        success: true,
        data: content,
      };
    } else {
      return {
        success: false,
        error: 'File not found or is a directory',
      };
    }
  } catch (error) {
    console.error('Import from GitHub failed:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
};

/**
 * Show GitHub token configuration dialog
 */
export const showGitHubTokenDialog = (): Promise<string | null> => {
  return new Promise(resolve => {
    Alert.prompt(
      'GitHub Personal Access Token',
      'Enter your GitHub Personal Access Token with repo permissions. You can create one at: https://github.com/settings/tokens',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(null),
        },
        {
          text: 'Save',
          onPress: async (token?: string) => {
            if (token && token.trim()) {
              const isValid = await verifyGitHubToken(token.trim());
              if (isValid) {
                const config = await getGitHubConfig();
                await saveGitHubConfig({ ...config, token: token.trim() });
                Alert.alert('Success', 'GitHub token saved successfully!', [
                  { text: 'OK' },
                ]);
                resolve(token.trim());
              } else {
                Alert.alert(
                  'Invalid Token',
                  'The token you entered is invalid. Please check and try again.',
                  [{ text: 'OK' }]
                );
                resolve(null);
              }
            } else {
              resolve(null);
            }
          },
        },
      ],
      'plain-text'
    );
  });
};

/**
 * Check if GitHub is configured
 */
export const isGitHubConfigured = async (): Promise<boolean> => {
  const config = await getGitHubConfig();
  return !!config.token;
};
