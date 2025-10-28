import React from 'react';
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

export const DataManagementScreen: React.FC = () => {
  const handleClearAll = async () => {
    const confirmClear = () => {
      if (Platform.OS === 'web') {
        return window.confirm(
          'Are you sure you want to delete all characters? This action cannot be undone.'
        );
      } else {
        return new Promise<boolean>(resolve => {
          Alert.alert(
            'Clear All Characters',
            'Are you sure you want to delete all characters? This action cannot be undone.',
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
      Alert.alert('Success', 'All characters have been deleted.', [
        { text: 'OK' },
      ]);
    }
  };

  const handleExport = async () => {
    await exportCharacterData();
  };

  const handleImport = async () => {
    console.log('Import button clicked');
    try {
      const success = await importCharacterData();
      console.log('Import result:', success);
      if (success) {
        console.log('Import successful');
        Alert.alert('Success', 'Character data imported successfully.', [
          { text: 'OK' },
        ]);
      }
    } catch (error) {
      console.error('Import error:', error);
    }
  };

  const handleMerge = async () => {
    console.log('Merge button clicked');
    try {
      const success = await mergeCharacterData();
      console.log('Merge result:', success);
      if (success) {
        console.log('Merge successful');
        Alert.alert('Success', 'Character data merged successfully.', [
          { text: 'OK' },
        ]);
      }
    } catch (error) {
      console.error('Merge error:', error);
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.header}>Data Management</Text>
        <Text style={styles.description}>
          Manage your character data with import, export, merge, and backup
          options.
        </Text>

        {/* Export Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Data</Text>
          <Text style={styles.sectionDescription}>
            Export all your character data to a JSON file for backup or sharing.
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, styles.exportButton]}
            onPress={handleExport}
          >
            <Text style={styles.buttonText}>Export Characters</Text>
          </TouchableOpacity>
        </View>

        {/* Import Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Import Data</Text>
          <Text style={styles.sectionDescription}>
            Import character data from a JSON file. This will replace all
            existing data.
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
            Merge character data from a JSON file with your existing data.
            Duplicates will be handled intelligently.
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
            <Text style={styles.buttonText}>Clear All Characters</Text>
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
