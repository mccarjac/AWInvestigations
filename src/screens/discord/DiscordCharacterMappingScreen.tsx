import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { colors as themeColors } from '@/styles/theme';
import { GameCharacter, DiscordCharacterAlias } from '@models/types';
import {
  getDiscordMessages,
  saveDiscordMessages,
  getDiscordCharacterAliases,
  saveDiscordCharacterAliases,
} from '@/utils/discordStorage';
import { loadCharacters } from '@/utils/characterStorage';
import { confirmCharacterMapping } from '@/utils/discordCharacterExtraction';
import type { DiscordMessage } from '@models/types';

interface UnmappedMessage {
  message: DiscordMessage;
  extractedName: string;
}

type ViewMode = 'unmapped' | 'existing';

export const DiscordCharacterMappingScreen: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('unmapped');
  const [unmappedMessages, setUnmappedMessages] = useState<UnmappedMessage[]>(
    []
  );
  const [existingAliases, setExistingAliases] = useState<
    DiscordCharacterAlias[]
  >([]);
  const [characters, setCharacters] = useState<GameCharacter[]>([]);
  const [selectedMappings, setSelectedMappings] = useState<
    Map<string, string>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [messages, chars, aliases] = await Promise.all([
        getDiscordMessages(),
        loadCharacters(),
        getDiscordCharacterAliases(),
      ]);

      // Find messages with extracted character names but no character ID
      const unmapped = messages
        .filter(m => m.extractedCharacterName && !m.characterId)
        .map(m => ({
          message: m,
          extractedName: m.extractedCharacterName!,
        }));

      // Group by extracted name to avoid duplicates
      const uniqueUnmapped = Array.from(
        new Map(
          unmapped.map(item => [item.extractedName, item])
        ).values()
      );

      setUnmappedMessages(uniqueUnmapped);
      setExistingAliases(aliases);
      setCharacters(chars);
    } catch (error) {
      Alert.alert('Error', 'Failed to load mapping data', [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleMappingChange = (extractedName: string, characterId: string) => {
    setSelectedMappings(prev => {
      const newMap = new Map(prev);
      if (characterId) {
        newMap.set(extractedName, characterId);
      } else {
        newMap.delete(extractedName);
      }
      return newMap;
    });
  };

  const handleSaveMappings = async () => {
    if (selectedMappings.size === 0) {
      Alert.alert('No Mappings', 'Please select at least one character mapping', [
        { text: 'OK' },
      ]);
      return;
    }

    setSaving(true);
    try {
      const messages = await getDiscordMessages();
      const updatedMessages = messages.map(msg => {
        if (
          msg.extractedCharacterName &&
          !msg.characterId &&
          selectedMappings.has(msg.extractedCharacterName)
        ) {
          return {
            ...msg,
            characterId: selectedMappings.get(msg.extractedCharacterName),
          };
        }
        return msg;
      });

      // Save the updated messages
      await saveDiscordMessages(updatedMessages);

      // Confirm the mappings as aliases for future use
      for (const [extractedName, characterId] of selectedMappings) {
        const message = unmappedMessages.find(
          m => m.extractedName === extractedName
        );
        if (message) {
          await confirmCharacterMapping(
            extractedName,
            characterId,
            message.message.authorId
          );
        }
      }

      Alert.alert('Success', 'Character mappings saved successfully', [
        { text: 'OK', onPress: () => loadData() },
      ]);
      setSelectedMappings(new Map());
    } catch (error) {
      Alert.alert('Error', 'Failed to save character mappings', [
        { text: 'OK' },
      ]);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = (extractedName: string) => {
    setUnmappedMessages(prev =>
      prev.filter(m => m.extractedName !== extractedName)
    );
    setSelectedMappings(prev => {
      const newMap = new Map(prev);
      newMap.delete(extractedName);
      return newMap;
    });
  };

  const handleDeleteAlias = async (alias: DiscordCharacterAlias) => {
    Alert.alert(
      'Delete Mapping',
      `Delete mapping "${alias.alias}" → ${getCharacterName(alias.characterId)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const aliases = await getDiscordCharacterAliases();
              const updated = aliases.filter(
                a =>
                  !(
                    a.alias === alias.alias &&
                    a.discordUserId === alias.discordUserId &&
                    a.characterId === alias.characterId
                  )
              );
              await saveDiscordCharacterAliases(updated);
              await loadData();
              Alert.alert('Success', 'Mapping deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete mapping');
            }
          },
        },
      ]
    );
  };

  const getCharacterName = (characterId: string): string => {
    const char = characters.find(c => c.id === characterId);
    return char ? char.name : 'Unknown';
  };

  const renderExistingAlias = ({ item }: { item: DiscordCharacterAlias }) => {
    const characterName = getCharacterName(item.characterId);
    return (
      <View style={styles.aliasCard}>
        <View style={styles.aliasHeader}>
          <Text style={styles.aliasName}>"{item.alias}"</Text>
          <TouchableOpacity
            onPress={() => handleDeleteAlias(item)}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.aliasInfo}>
          Mapped to: <Text style={styles.characterNameText}>{characterName}</Text>
        </Text>
        <Text style={styles.aliasInfo}>
          User ID: {item.discordUserId.substring(0, 18)}...
        </Text>
        <View style={styles.aliasStats}>
          <Text style={styles.aliasStatText}>
            Used {item.usageCount} time{item.usageCount !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.aliasStatText}>
            Confidence: {(item.confidence * 100).toFixed(0)}%
          </Text>
        </View>
      </View>
    );
  };

  const renderUnmappedItem = ({ item }: { item: UnmappedMessage }) => {
    const selectedCharacterId = selectedMappings.get(item.extractedName) || '';

    return (
      <View style={styles.mappingCard}>
        <View style={styles.mappingHeader}>
          <Text style={styles.extractedName}>"{item.extractedName}"</Text>
          <Text style={styles.messageInfo}>
            From: {item.message.authorUsername}
          </Text>
          <Text style={styles.messagePreview} numberOfLines={2}>
            {item.message.content.substring(0, 100)}...
          </Text>
        </View>

        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Select Character:</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedCharacterId}
              onValueChange={value =>
                handleMappingChange(item.extractedName, value)
              }
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

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => handleSkip(item.extractedName)}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={themeColors.accent.primary} />
        <Text style={styles.loadingText}>Loading unmapped messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Character Name Mapping</Text>
        <Text style={styles.subtitle}>
          Map extracted character names (from &gt;[Name]) to characters
        </Text>
      </View>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'unmapped' && styles.toggleButtonActive,
          ]}
          onPress={() => setViewMode('unmapped')}
        >
          <Text
            style={[
              styles.toggleButtonText,
              viewMode === 'unmapped' && styles.toggleButtonTextActive,
            ]}
          >
            Needs Mapping ({unmappedMessages.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'existing' && styles.toggleButtonActive,
          ]}
          onPress={() => setViewMode('existing')}
        >
          <Text
            style={[
              styles.toggleButtonText,
              viewMode === 'existing' && styles.toggleButtonTextActive,
            ]}
          >
            Existing Mappings ({existingAliases.length})
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'unmapped' ? (
        unmappedMessages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No unmapped character names found.
            </Text>
            <Text style={styles.emptySubtext}>
              Messages with &gt;[Name] format that match existing characters are
              automatically mapped.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                {unmappedMessages.length} unique name{unmappedMessages.length !== 1 ? 's' : ''} need mapping
              </Text>
              <Text style={styles.statsText}>
                {selectedMappings.size} selected
              </Text>
            </View>

            <FlatList
              data={unmappedMessages}
              renderItem={renderUnmappedItem}
              keyExtractor={item => item.extractedName}
              style={styles.list}
              contentContainerStyle={styles.listContent}
            />

            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.buttonDisabled]}
                onPress={handleSaveMappings}
                disabled={saving || selectedMappings.size === 0}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    Save {selectedMappings.size} Mapping{selectedMappings.size !== 1 ? 's' : ''}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )
      ) : (
        existingAliases.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No existing mappings found.</Text>
            <Text style={styles.emptySubtext}>
              Create mappings by linking Discord messages to characters.
            </Text>
          </View>
        ) : (
          <FlatList
            data={existingAliases}
            renderItem={renderExistingAlias}
            keyExtractor={(item, index) => `${item.alias}-${item.discordUserId}-${index}`}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeColors.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: themeColors.text.secondary,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  statsText: {
    fontSize: 14,
    color: themeColors.text.secondary,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  mappingCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  mappingHeader: {
    marginBottom: 12,
  },
  extractedName: {
    fontSize: 18,
    fontWeight: '600',
    color: themeColors.accent.primary,
    marginBottom: 8,
  },
  messageInfo: {
    fontSize: 12,
    color: themeColors.text.secondary,
    marginBottom: 4,
  },
  messagePreview: {
    fontSize: 14,
    color: themeColors.text.secondary,
    fontStyle: 'italic',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: themeColors.text.primary,
    marginBottom: 8,
  },
  pickerContainer: {
    marginBottom: 12,
  },
  pickerWrapper: {
    backgroundColor: themeColors.elevated,
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    color: themeColors.text.primary,
  },
  skipButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: themeColors.elevated,
    borderWidth: 1,
    borderColor: themeColors.border,
    alignItems: 'center',
  },
  skipButtonText: {
    color: themeColors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
    backgroundColor: themeColors.surface,
  },
  saveButton: {
    backgroundColor: themeColors.accent.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: themeColors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: themeColors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: themeColors.elevated,
    borderWidth: 1,
    borderColor: themeColors.border,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: themeColors.accent.primary,
    borderColor: themeColors.accent.primary,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: themeColors.text.secondary,
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  aliasCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  aliasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aliasName: {
    fontSize: 18,
    fontWeight: '600',
    color: themeColors.accent.primary,
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: themeColors.elevated,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  aliasInfo: {
    fontSize: 14,
    color: themeColors.text.secondary,
    marginBottom: 4,
  },
  characterNameText: {
    fontWeight: '600',
    color: themeColors.text.primary,
  },
  aliasStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
  },
  aliasStatText: {
    fontSize: 12,
    color: themeColors.text.secondary,
    fontWeight: '500',
  },
});
