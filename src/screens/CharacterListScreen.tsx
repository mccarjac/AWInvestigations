import React from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import { Text } from 'react-native';
import { GameCharacter } from '@models/types';
import { loadCharacters, deleteCharacter, clearStorage } from '@utils/characterStorage';
import { exportCharacterData, importCharacterData, mergeCharacterData, showImportOptions, importCSVCharacters } from '@utils/exportImport';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';

export const CharacterListScreen: React.FC = () => {
  const [characters, setCharacters] = React.useState<GameCharacter[]>([]);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const loadData = React.useCallback(async () => {
    const data = await loadCharacters();
    setCharacters(data);
  }, []);

  // Reload characters whenever the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDelete = async (id: string) => {
    await deleteCharacter(id);
    setCharacters(characters.filter(c => c.id !== id));
  };

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
      setCharacters([]);
    }
  };

  const handleExport = async () => {
    await exportCharacterData();
  };

  const handleImport = async () => {
    console.log('Import button clicked');
    try {
      // For debugging, let's try a direct import first
      const success = await importCharacterData();
      console.log('Import result:', success);
      if (success) {
        console.log('Import successful, reloading data...');
        await loadData();
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
        console.log('Merge successful, reloading data...');
        await loadData();
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
        console.log('CSV Import successful, reloading data...');
        await loadData();
      }
    } catch (error) {
      console.error('CSV Import error:', error);
    }
  };

  const renderItem = ({ item }: { item: GameCharacter }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('CharacterDetail', { character: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{item.name}</Text>
      </View>
      <Text style={styles.factions}>
        {(item.factions || []).map(f => f.name).join(', ') || 'No factions'}
      </Text>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id)}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={{ height: 882, overflow: 'scroll' }}>
      <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={true}
            >
      <View style={styles.headerButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.statsButton]}
          onPress={() => navigation.navigate('CharacterStats')}
        >
          <Text style={styles.buttonText}>Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.addButton]}
          onPress={() => navigation.navigate('CharacterForm', {})}
        >
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.addButton]}
          onPress={() => navigation.navigate('CharacterSearch')}
        >
          <Text style={styles.buttonText}>Search</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={characters}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        style={styles.list}
      />
      <View style={styles.headerButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.exportButton]}
          onPress={handleExport}
        >
          <Text style={styles.buttonText}>Export</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.importButton]}
          onPress={handleImport}
        >
          <Text style={styles.buttonText}>Import</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.mergeButton]}
          onPress={handleMerge}
        >
          <Text style={styles.buttonText}>Merge</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.headerButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.csvImportButton]}
          onPress={handleCSVImport}
        >
          <Text style={styles.buttonText}>CSV Import</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.headerButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.clearButton]}
          onPress={handleClearAll}
        >
          <Text style={styles.buttonText}>Clear All</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  addButton: {
    backgroundColor: '#4CAF50',
  },
  statsButton: {
    backgroundColor: '#2196F3',
  },
  clearButton: {
    backgroundColor: '#FF5252',
  },
  exportButton: {
    backgroundColor: '#FF9800',
  },
  importButton: {
    backgroundColor: '#9C27B0',
  },
  mergeButton: {
    backgroundColor: '#009688',
  },
  csvImportButton: {
    backgroundColor: '#673AB7',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  xp: {
    fontSize: 16,
    color: '#666',
  },
  factions: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  deleteButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#ff5252',
    borderRadius: 4,
    alignSelf: 'flex-end',
  },
  deleteText: {
    color: 'white',
    fontSize: 14,
  },
  headerButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  headerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});