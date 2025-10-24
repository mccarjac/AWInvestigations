import React from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native';
import { GameCharacter } from '@models/types';
import { loadCharacters, deleteCharacter, clearStorage } from '@utils/characterStorage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';

export const CharacterListScreen: React.FC = () => {
  const [characters, setCharacters] = React.useState<GameCharacter[]>([]);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  React.useEffect(() => {
    const loadData = async () => {
      const data = await loadCharacters();
      setCharacters(data);
    };
    loadData();

    // Set up the header buttons
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 8, marginRight: 8 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('CharacterSearch')}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>Search</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('CharacterStats')}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>Stats</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  const handleDelete = async (id: string) => {
    await deleteCharacter(id);
    setCharacters(characters.filter(c => c.id !== id));
  };

  const handleClearAll = async () => {
    await clearStorage();
    setCharacters([]);
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
    <View style={styles.container}>
      <View style={styles.headerButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.statsButton]}
          onPress={() => navigation.navigate('CharacterStats')}
        >
          <Text style={styles.buttonText}>View Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.addButton]}
          onPress={() => navigation.navigate('CharacterForm', {})}
        >
          <Text style={styles.buttonText}>Add New Character</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.clearButton]}
          onPress={handleClearAll}
        >
          <Text style={styles.buttonText}>Clear All</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={characters}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
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