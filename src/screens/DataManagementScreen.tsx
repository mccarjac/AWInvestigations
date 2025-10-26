import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import { Text } from 'react-native';
import { loadCharacters, clearStorage } from '@utils/characterStorage';
import { exportCharacterData, importCharacterData, mergeCharacterData, importCSVCharacters } from '@utils/exportImport';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';

type DataManagementNavigationProp = StackNavigationProp<RootStackParamList>;

export const DataManagementScreen: React.FC = () => {
  const navigation = useNavigation<DataManagementNavigationProp>();

  const handleClearAll = async () => {
    const confirmClear = () => {
      if (Platform.OS === 'web') {
        return window.confirm(
          'Are you sure you want to delete all characters? This action cannot be undone.'
        );
      } else {
        return new Promise<boolean>((resolve) => {
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
      Alert.alert(
        'Success',
        'All characters have been deleted.',
        [{ text: 'OK' }]
      );
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
        Alert.alert(
          'Success',
          'Character data imported successfully.',
          [{ text: 'OK' }]
        );
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
        Alert.alert(
          'Success',
          'Character data merged successfully.',
          [{ text: 'OK' }]
        );
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
        Alert.alert(
          'Success',
          'CSV data imported successfully.',
          [{ text: 'OK' }]
        );
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
          Manage your character data with import, export, merge, and backup options.
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
            Import character data from a JSON file. This will replace all existing data.
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
            Merge character data from a JSON file with your existing data. Duplicates will be handled intelligently.
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
            Import character data from a CSV file. Useful for bulk character creation from spreadsheets.
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
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
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

// Modern Dark Color Palette
const colors = {
  // Background colors
  primary: '#0F0F23',      // Deep dark blue-purple
  secondary: '#1B1B3A',    // Slightly lighter dark
  surface: '#262647',      // Card/surface color
  elevated: '#2D2D54',     // Elevated surfaces
  
  // Text colors
  text: {
    primary: '#FFFFFF',    // Primary white text
    secondary: '#B8B8CC',  // Secondary lighter text
    muted: '#8E8EA0',      // Muted text
  },
  
  // Accent colors
  accent: {
    primary: '#6366F1',    // Indigo primary
    secondary: '#8B5CF6',  // Purple secondary
    success: '#10B981',    // Green
    warning: '#F59E0B',    // Amber
    danger: '#EF4444',     // Red
    info: '#3B82F6',       // Blue
  },
  
  // Border and shadow
  border: '#3F3F65',
  shadow: '#000000',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollView: {
    backgroundColor: colors.primary,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 32,
    lineHeight: 24,
  },
  section: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dangerSection: {
    borderColor: colors.accent.danger,
    borderWidth: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: colors.text.primary,
    letterSpacing: 0.3,
  },
  dangerTitle: {
    color: colors.accent.danger,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  exportButton: {
    backgroundColor: colors.accent.warning,
    borderColor: colors.accent.warning,
  },
  importButton: {
    backgroundColor: colors.accent.secondary,
    borderColor: colors.accent.secondary,
  },
  mergeButton: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  csvImportButton: {
    backgroundColor: colors.elevated,
    borderColor: colors.accent.primary,
  },
  clearButton: {
    backgroundColor: colors.accent.danger,
    borderColor: colors.accent.danger,
  },
  buttonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});