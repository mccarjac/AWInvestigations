import React from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView, TextInput } from 'react-native';
import { Text } from 'react-native';
import { GameCharacter } from '@models/types';
import { loadCharacters, deleteCharacter, toggleCharacterPresent, resetAllPresentStatus } from '@utils/characterStorage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';

export const CharacterListScreen: React.FC = () => {
  const [characters, setCharacters] = React.useState<GameCharacter[]>([]);
  const [showOnlyPresent, setShowOnlyPresent] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>('');
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



  const handleTogglePresent = async (id: string) => {
    await toggleCharacterPresent(id);
    await loadData(); // Refresh the list
  };

  const handleResetAllPresent = async () => {
    const confirmReset = () => {
      if (Platform.OS === 'web') {
        return window.confirm(
          'Are you sure you want to reset present status for all characters?'
        );
      } else {
        return new Promise<boolean>((resolve) => {
          Alert.alert(
            'Reset Present Status',
            'Are you sure you want to reset present status for all characters?',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => resolve(false),
              },
              {
                text: 'Reset All',
                onPress: () => resolve(true),
              },
            ]
          );
        });
      }
    };

    const shouldReset = await confirmReset();
    if (shouldReset) {
      await resetAllPresentStatus();
      await loadData();
    }
  };

  const getFilteredCharacters = () => {
    // First filter out retired characters
    let filtered = characters.filter(c => !c.retired);
    
    // Filter by search query if provided
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query)
      );
    }
    
    // Filter by present status if enabled
    if (showOnlyPresent) {
      filtered = filtered.filter(c => c.present === true);
    }
    
    // Sort alphabetically
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  };

  const renderItem = ({ item }: { item: GameCharacter }) => (
    <TouchableOpacity
      style={[styles.card, item.present && styles.cardPresent]}
      onPress={() => navigation.navigate('CharacterDetail', { character: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{item.name}</Text>
        <TouchableOpacity
          style={[styles.presentButton, item.present && styles.presentButtonActive]}
          onPress={() => handleTogglePresent(item.id)}
        >
          <Text style={[styles.presentText, item.present && styles.presentTextActive]}>
            {item.present ? 'Present' : 'Absent'}
          </Text>
        </TouchableOpacity>
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
          style={[styles.actionButton, styles.addButton]}
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
      
      <View style={styles.headerButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.factionButton]}
          onPress={() => navigation.navigate('Factions')}
        >
          <Text style={styles.buttonText}>Factions</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.headerButtons}>
        <TouchableOpacity
          style={[styles.actionButton, showOnlyPresent ? styles.filterButtonActive : styles.filterButton]}
          onPress={() => setShowOnlyPresent(!showOnlyPresent)}
        >
          <Text style={styles.buttonText}>
            {showOnlyPresent ? 'Show All' : 'Present Only'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.resetButton]}
          onPress={handleResetAllPresent}
        >
          <Text style={styles.buttonText}>Reset Present</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search characters by name..."
          placeholderTextColor={colors.text.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearchButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        data={getFilteredCharacters()}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        style={styles.list}
      />
      
      <View style={styles.headerButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.dataManagementButton]}
          onPress={() => navigation.navigate('DataManagement')}
        >
          <Text style={styles.buttonText}>Data Management</Text>
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
  
  // Status colors
  present: '#059669',      // Green for present
  absent: '#6B7280',       // Gray for absent
  
  // Border and shadow
  border: '#3F3F65',
  shadow: '#000000',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.primary,
  },
  scrollView: {
    backgroundColor: colors.primary,
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
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addButton: {
    backgroundColor: colors.accent.success,
    borderColor: colors.accent.success,
  },
  dataManagementButton: {
    backgroundColor: colors.accent.info,
    borderColor: colors.accent.info,
  },
  factionButton: {
    backgroundColor: colors.accent.secondary,
    borderColor: colors.accent.secondary,
  },
  filterButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.accent.success,
    borderColor: colors.accent.success,
  },
  resetButton: {
    backgroundColor: colors.accent.warning,
    borderColor: colors.accent.warning,
  },
  buttonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  list: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 20,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardPresent: {
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.present,
    borderColor: colors.present,
    shadowColor: colors.present,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 0.3,
  },
  xp: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  factions: {
    fontSize: 14,
    color: colors.text.muted,
    marginTop: 8,
    fontStyle: 'italic',
  },
  deleteButton: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.accent.danger,
    borderRadius: 8,
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: colors.accent.danger,
    shadowColor: colors.accent.danger,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  presentButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presentButtonActive: {
    backgroundColor: colors.present,
    borderColor: colors.present,
  },
  presentText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.muted,
    letterSpacing: 0.3,
  },
  presentTextActive: {
    color: colors.text.primary,
  },
  headerButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent.primary,
  },
  headerButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  clearSearchButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.text.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearSearchText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});