import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
  Text,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { clearStorage, importDataset } from '@utils/characterStorage';
import {
  exportCharacterData,
  importCharacterData,
  mergeCharacterData,
  importCSVCharacters,
} from '@utils/exportImport';
import {
  exportToGitHub,
  importFromGitHub,
  showGitHubTokenDialog,
  isGitHubConfigured,
} from '@utils/gitIntegration';
import { colors as themeColors } from '@/styles/theme';
import { commonStyles } from '@/styles/commonStyles';

interface ProgressState {
  visible: boolean;
  message: string;
  operation:
    | 'export'
    | 'import'
    | 'merge'
    | 'csv'
    | 'git-export'
    | 'git-import'
    | null;
}

export const DataManagementScreen: React.FC = () => {
  const [progress, setProgress] = useState<ProgressState>({
    visible: false,
    message: '',
    operation: null,
  });
  const [gitHubConfigured, setGitHubConfigured] = useState<boolean>(false);

  // Check GitHub configuration on mount
  React.useEffect(() => {
    const checkConfig = async () => {
      const configured = await isGitHubConfigured();
      setGitHubConfigured(configured);
    };
    checkConfig();
  }, []);

  const showProgress = (
    operation:
      | 'export'
      | 'import'
      | 'merge'
      | 'csv'
      | 'git-export'
      | 'git-import',
    message: string
  ) => {
    setProgress({ visible: true, message, operation });
  };

  const hideProgress = () => {
    setProgress({ visible: false, message: '', operation: null });
  };
  const handleClearAll = async () => {
    const confirmClear = () => {
      if (Platform.OS === 'web') {
        return window.confirm(
          'Are you sure you want to delete all data (characters, factions, locations, and events)? This action cannot be undone.'
        );
      } else {
        return new Promise<boolean>(resolve => {
          Alert.alert(
            'Clear All Data',
            'Are you sure you want to delete all data (characters, factions, locations, and events)? This action cannot be undone.',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => resolve(false),
              },
              {
                text: 'Delete All',
                style: 'destructive',
                onPress: () => resolve(true),
              },
            ]
          );
        });
      }
    };

    const shouldClear = await confirmClear();
    if (shouldClear) {
      await clearStorage();
      Alert.alert('Success', 'All data has been deleted.', [{ text: 'OK' }]);
    }
  };

  const handleExport = async () => {
    showProgress('export', 'Exporting data...');
    try {
      await exportCharacterData();
    } finally {
      hideProgress();
    }
  };

  const handleImport = async () => {
    showProgress('import', 'Importing data...');
    try {
      const success = await importCharacterData();
      hideProgress();
      if (success) {
        Alert.alert(
          'Success',
          'Character and faction data imported successfully.',
          [{ text: 'OK' }]
        );
      }
    } catch {
      hideProgress();
      Alert.alert(
        'Import Failed',
        'An unexpected error occurred during import.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleMerge = async () => {
    showProgress('merge', 'Merging data...');
    try {
      const success = await mergeCharacterData();
      hideProgress();
      if (success) {
        Alert.alert(
          'Success',
          'Character and faction data merged successfully.',
          [{ text: 'OK' }]
        );
      }
    } catch {
      hideProgress();
      Alert.alert(
        'Merge Failed',
        'An unexpected error occurred during merge.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCSVImport = async () => {
    showProgress('csv', 'Importing CSV data...');
    try {
      const success = await importCSVCharacters();
      hideProgress();
      if (success) {
        Alert.alert('Success', 'CSV data imported successfully.', [
          { text: 'OK' },
        ]);
      }
    } catch {
      hideProgress();
      Alert.alert(
        'CSV Import Failed',
        'An unexpected error occurred during CSV import.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleGitHubSetup = async () => {
    const token = await showGitHubTokenDialog();
    if (token) {
      setGitHubConfigured(true);
    }
  };

  const handleGitHubExport = async () => {
    if (!gitHubConfigured) {
      Alert.alert(
        'GitHub Not Configured',
        'Please set up your GitHub token first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Set Up', onPress: handleGitHubSetup },
        ]
      );
      return;
    }

    showProgress('git-export', 'Exporting to GitHub...');
    try {
      const result = await exportToGitHub();
      hideProgress();

      if (result.success && result.prUrl) {
        Alert.alert(
          'Export Successful',
          `A pull request has been created with your data. You can review it at:\n\n${result.prUrl}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Export Failed',
          result.error || 'An unexpected error occurred',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      hideProgress();
      Alert.alert(
        'Export Failed',
        `An unexpected error occurred during export: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleGitHubImport = async () => {
    if (!gitHubConfigured) {
      Alert.alert(
        'GitHub Not Configured',
        'Please set up your GitHub token first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Set Up', onPress: handleGitHubSetup },
        ]
      );
      return;
    }

    showProgress('git-import', 'Importing from GitHub...');
    try {
      const result = await importFromGitHub();

      if (result.success && result.data) {
        // Import the data
        const importSuccess = await importDataset(result.data);
        hideProgress();

        if (importSuccess) {
          Alert.alert(
            'Import Successful',
            'Data has been imported from the GitHub repository.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Import Failed',
            'Failed to import the data. Please check the file format.',
            [{ text: 'OK' }]
          );
        }
      } else {
        hideProgress();
        Alert.alert(
          'Import Failed',
          result.error || 'An unexpected error occurred',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      hideProgress();
      Alert.alert(
        'Import Failed',
        `An unexpected error occurred during import: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.header}>Data Management</Text>
        <Text style={styles.description}>
          Manage your character and faction data with import, export, merge, and
          backup options.
        </Text>

        {/* Export Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Data</Text>
          <Text style={styles.sectionDescription}>
            Export all your character and faction data to a JSON file for backup
            or sharing.
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, styles.exportButton]}
            onPress={handleExport}
          >
            <Text style={styles.buttonText}>Export Characters & Factions</Text>
          </TouchableOpacity>
        </View>

        {/* Import Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Import Data</Text>
          <Text style={styles.sectionDescription}>
            Import character and faction data from a JSON file. This will
            replace all existing data.
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, styles.importButton]}
            onPress={handleImport}
          >
            <Text style={styles.buttonText}>Import & Replace</Text>
          </TouchableOpacity>
        </View>

        {/* Merge Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Merge Data</Text>
          <Text style={styles.sectionDescription}>
            Merge character and faction data from a JSON file with your existing
            data. Duplicates will be handled intelligently.
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, styles.mergeButton]}
            onPress={handleMerge}
          >
            <Text style={styles.buttonText}>Merge Data</Text>
          </TouchableOpacity>
        </View>

        {/* CSV Import Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CSV Import</Text>
          <Text style={styles.sectionDescription}>
            Import character data from a CSV file. Useful for bulk character
            creation from spreadsheets.
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, styles.csvImportButton]}
            onPress={handleCSVImport}
          >
            <Text style={styles.buttonText}>Import CSV</Text>
          </TouchableOpacity>
        </View>

        {/* GitHub Integration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GitHub Repository Sync</Text>
          <Text style={styles.sectionDescription}>
            Share data with other users through the AWInvestigationsDataLibrary
            GitHub repository. Exports create pull requests for review.
          </Text>

          {!gitHubConfigured && (
            <TouchableOpacity
              style={[styles.actionButton, styles.setupButton]}
              onPress={handleGitHubSetup}
            >
              <Text style={styles.buttonText}>Set Up GitHub Token</Text>
            </TouchableOpacity>
          )}

          {gitHubConfigured && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.gitExportButton]}
                onPress={handleGitHubExport}
              >
                <Text style={styles.buttonText}>
                  Export to GitHub (Create PR)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.gitImportButton]}
                onPress={handleGitHubImport}
              >
                <Text style={styles.buttonText}>Import from GitHub</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.setupButton]}
                onPress={handleGitHubSetup}
              >
                <Text style={styles.buttonText}>Update GitHub Token</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, styles.dangerSection]}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>
            Danger Zone
          </Text>
          <Text style={styles.sectionDescription}>
            Irreversible actions that will permanently delete your data.
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, styles.clearButton]}
            onPress={handleClearAll}
          >
            <Text style={styles.buttonText}>Clear All Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Progress Modal */}
      <Modal
        visible={progress.visible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator
              size="large"
              color={themeColors.accent.primary}
            />
            <Text style={styles.modalText}>{progress.message}</Text>
            <Text style={styles.modalSubText}>Please wait...</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: commonStyles.layout.container,
  scrollView: commonStyles.layout.scrollView,
  contentContainer: commonStyles.layout.contentContainer,
  header: commonStyles.text.h1,
  description: {
    ...commonStyles.text.bodyLarge,
    marginBottom: 32,
    lineHeight: 24,
  },
  section: commonStyles.layout.section,
  dangerSection: commonStyles.layout.sectionDanger,
  sectionTitle: commonStyles.text.h2,
  dangerTitle: {
    ...commonStyles.text.h2,
    color: themeColors.accent.danger,
  },
  sectionDescription: {
    ...commonStyles.text.description,
    marginBottom: 16,
    lineHeight: 20,
  },
  actionButton: commonStyles.button.base,
  exportButton: commonStyles.button.warning,
  importButton: commonStyles.button.secondary,
  mergeButton: commonStyles.button.primary,
  csvImportButton: {
    backgroundColor: themeColors.elevated,
    borderColor: themeColors.accent.primary,
  },
  setupButton: {
    backgroundColor: themeColors.elevated,
    borderColor: themeColors.accent.secondary,
    marginBottom: 12,
  },
  gitExportButton: {
    backgroundColor: themeColors.accent.success,
    marginBottom: 12,
  },
  gitImportButton: {
    backgroundColor: themeColors.accent.info,
    marginBottom: 12,
  },
  clearButton: commonStyles.button.danger,
  buttonText: commonStyles.button.text,
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: themeColors.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  modalText: {
    ...commonStyles.text.h3,
    marginTop: 16,
    textAlign: 'center',
  },
  modalSubText: {
    ...commonStyles.text.body,
    marginTop: 8,
    textAlign: 'center',
    color: themeColors.text.muted,
  },
});
