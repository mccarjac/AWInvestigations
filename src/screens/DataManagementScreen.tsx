import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
  Text,
} from 'react-native';
import { clearStorage } from '@utils/characterStorage';
import {
  exportCharacterData,
  importCharacterData,
  mergeCharacterData,
  importCSVCharacters,
} from '@utils/exportImport';
import { colors as themeColors } from '@/styles/theme';
import { commonStyles } from '@/styles/commonStyles';
import { ProgressModal } from './components/ProgressModal';

export const DataManagementScreen: React.FC = () => {
  const [progressVisible, setProgressVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  const handleProgress = (progressValue: number, message: string) => {
    setProgress(progressValue);
    setProgressMessage(message);
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
    try {
      setProgressVisible(true);
      setProgress(0);
      setProgressMessage('Starting export...');

      await exportCharacterData(handleProgress);

      // Keep the modal visible for a brief moment to show completion
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setProgressVisible(false);
    }
  };

  const handleImport = async () => {
    console.log('Import button clicked');
    try {
      setProgressVisible(true);
      setProgress(0);
      setProgressMessage('Selecting file...');

      const success = await importCharacterData(handleProgress);
      console.log('Import result:', success);

      // Keep the modal visible for a brief moment to show completion
      if (success) {
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('Import successful');
        Alert.alert(
          'Success',
          'Character and faction data imported successfully.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setProgressVisible(false);
    }
  };

  const handleMerge = async () => {
    console.log('Merge button clicked');
    try {
      setProgressVisible(true);
      setProgress(0);
      setProgressMessage('Selecting file...');

      const success = await mergeCharacterData(handleProgress);
      console.log('Merge result:', success);

      // Keep the modal visible for a brief moment to show completion
      if (success) {
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('Merge successful');
        Alert.alert(
          'Success',
          'Character and faction data merged successfully.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Merge error:', error);
    } finally {
      setProgressVisible(false);
    }
  };

  const handleCSVImport = async () => {
    console.log('CSV Import button clicked');
    try {
      const success = await importCSVCharacters();
      console.log('CSV Import result:', success);
      if (success) {
        console.log('CSV Import successful');
        Alert.alert('Success', 'CSV data imported successfully.', [
          { text: 'OK' },
        ]);
      }
    } catch (error) {
      console.error('CSV Import error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ProgressModal
        visible={progressVisible}
        progress={progress}
        message={progressMessage}
      />

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
  clearButton: commonStyles.button.danger,
  buttonText: commonStyles.button.text,
});
