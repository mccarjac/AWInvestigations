import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { colors as themeColors } from '@/styles/theme';
import type { GameCharacter, DiscordUserMapping } from '@models/types';
import {
  getDiscordUserMappings,
  addDiscordUserMapping,
  removeDiscordUserMapping,
} from '@/utils/discordStorage';
import { loadCharacters } from '@/utils/characterStorage';

export const DiscordUserMappingScreen: React.FC = () => {
  const [mappings, setMappings] = useState<DiscordUserMapping[]>([]);
  const [characters, setCharacters] = useState<GameCharacter[]>([]);
  const [discordUserId, setDiscordUserId] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');

  const loadData = useCallback(async () => {
    const [loadedMappings, loadedCharacters] = await Promise.all([
      getDiscordUserMappings(),
      loadCharacters(),
    ]);
    setMappings(loadedMappings);
    setCharacters(loadedCharacters);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAddMapping = async () => {
    if (!discordUserId.trim() || !discordUsername.trim()) {
      Alert.alert('Error', 'Please enter Discord user ID and username', [
        { text: 'OK' },
      ]);
      return;
    }

    if (!selectedCharacterId) {
      Alert.alert('Error', 'Please select a character', [{ text: 'OK' }]);
      return;
    }

    try {
      await addDiscordUserMapping(
        discordUserId.trim(),
        discordUsername.trim(),
        selectedCharacterId
      );
      setDiscordUserId('');
      setDiscordUsername('');
      setSelectedCharacterId('');
      await loadData();
      Alert.alert('Success', 'User mapping added successfully', [
        { text: 'OK' },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to add user mapping', [{ text: 'OK' }]);
    }
  };

  const handleDeleteMapping = (discordUserId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to remove this mapping?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeDiscordUserMapping(discordUserId);
            await loadData();
          },
        },
      ]
    );
  };

  const renderMapping = ({ item }: { item: DiscordUserMapping }) => {
    const character = characters.find(c => c.id === item.characterId);
    return (
      <View style={styles.mappingCard}>
        <View style={styles.mappingInfo}>
          <Text style={styles.mappingUsername}>{item.discordUsername}</Text>
          <Text style={styles.mappingId}>ID: {item.discordUserId}</Text>
          <Text style={styles.mappingCharacter}>
            → {character?.name || 'Unknown Character'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteMapping(item.discordUserId)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discord User Mappings</Text>
        <Text style={styles.subtitle}>
          Link Discord users to characters to track their messages
        </Text>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionHeader}>Add New Mapping</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Discord User ID</Text>
          <TextInput
            style={styles.input}
            value={discordUserId}
            onChangeText={setDiscordUserId}
            placeholder="Enter Discord user ID"
            placeholderTextColor={themeColors.text.secondary}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Discord Username</Text>
          <TextInput
            style={styles.input}
            value={discordUsername}
            onChangeText={setDiscordUsername}
            placeholder="Enter Discord username"
            placeholderTextColor={themeColors.text.secondary}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Character</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedCharacterId}
              onValueChange={setSelectedCharacterId}
              style={styles.picker}
              dropdownIconColor={'#FFFFFF'}
            >
              <Picker.Item label="Select a character" value="" />
              {characters.map(char => (
                <Picker.Item key={char.id} label={char.name} value={char.id} />
              ))}
            </Picker>
          </View>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddMapping}>
          <Text style={styles.addButtonText}>Add Mapping</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listSection}>
        <Text style={styles.sectionHeader}>
          Existing Mappings ({mappings.length})
        </Text>
        {mappings.length === 0 ? (
          <Text style={styles.emptyText}>
            No user mappings yet. Add one above.
          </Text>
        ) : (
          <FlatList
            data={mappings}
            renderItem={renderMapping}
            keyExtractor={item => item.discordUserId}
            style={styles.list}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.primary,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: themeColors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: themeColors.text.secondary,
  },
  formSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: themeColors.text.primary,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: themeColors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: themeColors.text.primary,
  },
  pickerContainer: {
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    color: themeColors.text.primary,
  },
  addButton: {
    backgroundColor: themeColors.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: themeColors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  listSection: {
    flex: 1,
    padding: 16,
  },
  list: {
    flex: 1,
  },
  mappingCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  mappingInfo: {
    flex: 1,
  },
  mappingUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.text.primary,
    marginBottom: 4,
  },
  mappingId: {
    fontSize: 12,
    color: themeColors.text.secondary,
    marginBottom: 4,
  },
  mappingCharacter: {
    fontSize: 14,
    color: themeColors.primary,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    padding: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: themeColors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: themeColors.text.secondary,
    textAlign: 'center',
    marginTop: 32,
  },
});
