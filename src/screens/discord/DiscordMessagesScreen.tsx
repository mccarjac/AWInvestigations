import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { colors as themeColors } from '@/styles/theme';
import type { DiscordMessage, GameCharacter } from '@models/types';
import {
  getDiscordMessages,
  saveDiscordMessages,
} from '@/utils/discordStorage';
import { loadCharacters } from '@/utils/characterStorage';
import { confirmCharacterMapping } from '@/utils/discordCharacterExtraction';

type FilterType = 'all' | 'untagged' | 'tagged';

export const DiscordMessagesScreen: React.FC = () => {
  const [messages, setMessages] = useState<DiscordMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<DiscordMessage[]>(
    []
  );
  const [characters, setCharacters] = useState<GameCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedMessage, setSelectedMessage] = useState<DiscordMessage | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [msgs, chars] = await Promise.all([
        getDiscordMessages(),
        loadCharacters(),
      ]);

      console.log(`[Discord Messages Screen] Loaded ${msgs.length} messages`);
      if (msgs.length > 0) {
        console.log(
          `[Discord Messages Screen] Sample message:`,
          JSON.stringify({
            id: msgs[0].id,
            content: msgs[0].content?.substring(0, 100) || '(empty)',
            contentLength: msgs[0].content?.length || 0,
            contentType: typeof msgs[0].content,
          })
        );
      }

      // Sort messages by timestamp (newest first)
      const sortedMsgs = msgs.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setMessages(sortedMsgs);
      setCharacters(chars);
      applyFilter(sortedMsgs, filter);
    } catch (error) {
      console.error('[Discord Messages Screen] Error loading data:', error);
      Alert.alert('Error', 'Failed to load Discord messages', [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const applyFilter = (msgs: DiscordMessage[], filterType: FilterType) => {
    let filtered = msgs;
    if (filterType === 'untagged') {
      filtered = msgs.filter(m => !m.characterId);
    } else if (filterType === 'tagged') {
      filtered = msgs.filter(m => m.characterId);
    }
    setFilteredMessages(filtered);
  };

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    applyFilter(messages, newFilter);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const openMappingModal = (message: DiscordMessage) => {
    setSelectedMessage(message);
    setSelectedCharacterId(message.characterId || '');
    setModalVisible(true);
  };

  const handleSaveMapping = async () => {
    if (!selectedMessage || !selectedCharacterId) {
      Alert.alert('Error', 'Please select a character', [{ text: 'OK' }]);
      return;
    }

    setSaving(true);
    try {
      // Update the message with the selected character
      const updatedMessages = messages.map(m =>
        m.id === selectedMessage.id
          ? { ...m, characterId: selectedCharacterId }
          : m
      );
      await saveDiscordMessages(updatedMessages);

      // If there's an extracted character name, save it as an alias
      if (selectedMessage.extractedCharacterName) {
        await confirmCharacterMapping(
          selectedMessage.extractedCharacterName,
          selectedCharacterId,
          selectedMessage.authorId
        );
      }

      setModalVisible(false);
      setSelectedMessage(null);
      setSelectedCharacterId('');
      await loadData();

      Alert.alert('Success', 'Character mapping saved', [{ text: 'OK' }]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save character mapping', [
        { text: 'OK' },
      ]);
    } finally {
      setSaving(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getCharacterName = (characterId: string | undefined) => {
    if (!characterId) return 'Untagged';
    const character = characters.find(c => c.id === characterId);
    return character?.name || 'Unknown Character';
  };

  const renderMessage = ({ item }: { item: DiscordMessage }) => {
    const characterName = getCharacterName(item.characterId);
    const isUntagged = !item.characterId;

    return (
      <TouchableOpacity
        style={[styles.messageCard, isUntagged && styles.untaggedCard]}
        onPress={() => openMappingModal(item)}
        activeOpacity={0.7}
      >
        <View style={styles.messageHeader}>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{item.authorUsername}</Text>
            <Text style={styles.discordId}>ID: {item.authorId}</Text>
          </View>
          <View style={styles.tagInfo}>
            {isUntagged ? (
              <View style={styles.untaggedBadge}>
                <Text style={styles.untaggedBadgeText}>UNTAGGED</Text>
              </View>
            ) : (
              <View style={styles.taggedBadge}>
                <Text style={styles.taggedBadgeText}>{characterName}</Text>
              </View>
            )}
          </View>
        </View>

        {item.extractedCharacterName && (
          <View style={styles.extractedNameContainer}>
            <Text style={styles.extractedNameLabel}>Extracted Name:</Text>
            <Text style={styles.extractedName}>
              &gt;&gt;[{item.extractedCharacterName}]
            </Text>
          </View>
        )}

        <Text style={styles.messageContent} numberOfLines={4}>
          {item.content ? item.content : '[No text content]'}
        </Text>

        {item.imageUris && item.imageUris.length > 0 && (
          <View style={styles.imagesContainer}>
            <Text style={styles.imagesLabel}>
              📷 {item.imageUris.length} image(s)
            </Text>
          </View>
        )}

        <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
      </TouchableOpacity>
    );
  };

  const renderMappingModal = () => {
    if (!selectedMessage) return null;

    return (
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Link Message to Character</Text>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Discord User:</Text>
                <Text style={styles.modalValue}>
                  {selectedMessage.authorUsername}
                </Text>
                <Text style={styles.modalSubValue}>
                  ID: {selectedMessage.authorId}
                </Text>
              </View>

              {selectedMessage.extractedCharacterName && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Extracted Name:</Text>
                  <Text style={styles.modalValue}>
                    &gt;&gt;[{selectedMessage.extractedCharacterName}]
                  </Text>
                </View>
              )}

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Message Preview:</Text>
                <Text style={styles.modalValue} numberOfLines={5}>
                  {selectedMessage.content
                    ? selectedMessage.content
                    : '[No text content - may have attachments only]'}
                </Text>
              </View>

              {selectedMessage.imageUris &&
                selectedMessage.imageUris.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Images:</Text>
                    <ScrollView horizontal style={styles.imageScroll}>
                      {selectedMessage.imageUris.map((uri, index) => (
                        <Image
                          key={index}
                          source={{ uri }}
                          style={styles.thumbnailImage}
                          resizeMode="cover"
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>
                  Select Character <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={selectedCharacterId}
                    onValueChange={setSelectedCharacterId}
                    style={styles.picker}
                    dropdownIconColor={'#FFFFFF'}
                  >
                    <Picker.Item label="Select a character" value="" />
                    {characters.map(char => (
                      <Picker.Item
                        key={char.id}
                        label={char.name}
                        value={char.id}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setModalVisible(false);
                    setSelectedMessage(null);
                    setSelectedCharacterId('');
                  }}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.saveButton,
                    saving && styles.buttonDisabled,
                  ]}
                  onPress={handleSaveMapping}
                  disabled={saving || !selectedCharacterId}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={themeColors.accent.primary} />
        <Text style={styles.loadingText}>Loading Discord messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discord Messages</Text>
        <Text style={styles.subtitle}>{messages.length} total messages</Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
          onPress={() => handleFilterChange('all')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'all' && styles.activeFilterText,
            ]}
          >
            All ({messages.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'untagged' && styles.activeFilter,
          ]}
          onPress={() => handleFilterChange('untagged')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'untagged' && styles.activeFilterText,
            ]}
          >
            Untagged ({messages.filter(m => !m.characterId).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'tagged' && styles.activeFilter,
          ]}
          onPress={() => handleFilterChange('tagged')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'tagged' && styles.activeFilterText,
            ]}
          >
            Tagged ({messages.filter(m => m.characterId).length})
          </Text>
        </TouchableOpacity>
      </View>

      {filteredMessages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No {filter === 'all' ? '' : filter} messages found
          </Text>
          {filter === 'untagged' && messages.length > 0 && (
            <Text style={styles.emptySubtext}>
              All messages have been tagged to characters!
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredMessages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {renderMappingModal()}
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
    backgroundColor: themeColors.surface,
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
  filterContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  filterButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 4,
    borderRadius: 6,
    backgroundColor: themeColors.elevated,
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: themeColors.accent.primary,
  },
  filterText: {
    fontSize: 14,
    color: themeColors.text.secondary,
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  messageCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  untaggedCard: {
    borderLeftWidth: 4,
    borderLeftColor: themeColors.accent.warning,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.text.primary,
    marginBottom: 2,
  },
  discordId: {
    fontSize: 11,
    color: themeColors.text.muted,
    fontFamily: 'monospace',
  },
  tagInfo: {
    marginLeft: 8,
  },
  untaggedBadge: {
    backgroundColor: themeColors.accent.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  untaggedBadgeText: {
    color: themeColors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  taggedBadge: {
    backgroundColor: themeColors.accent.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  taggedBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  extractedNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: themeColors.elevated,
    borderRadius: 4,
  },
  extractedNameLabel: {
    fontSize: 12,
    color: themeColors.text.secondary,
    marginRight: 8,
  },
  extractedName: {
    fontSize: 13,
    fontWeight: '600',
    color: themeColors.accent.primary,
  },
  messageContent: {
    fontSize: 14,
    color: themeColors.text.primary,
    lineHeight: 20,
    marginBottom: 8,
  },
  imagesContainer: {
    marginBottom: 8,
  },
  imagesLabel: {
    fontSize: 12,
    color: themeColors.text.secondary,
  },
  timestamp: {
    fontSize: 11,
    color: themeColors.text.muted,
    marginTop: 4,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: themeColors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSection: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: themeColors.text.primary,
    marginBottom: 8,
  },
  required: {
    color: themeColors.accent.danger,
  },
  modalValue: {
    fontSize: 14,
    color: themeColors.text.secondary,
    lineHeight: 20,
  },
  modalSubValue: {
    fontSize: 11,
    color: themeColors.text.muted,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  imageScroll: {
    marginTop: 8,
  },
  thumbnailImage: {
    width: 80,
    height: 80,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: themeColors.elevated,
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: themeColors.elevated,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  cancelButtonText: {
    color: themeColors.text.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: themeColors.accent.primary,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
