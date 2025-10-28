import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Button,
  Alert,
  Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import {
  RouteProp,
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import {
  CharacterFormData,
  GameCharacter,
  Species,
  SPECIES_BASE_STATS,
  Location,
  Relationship,
  RelationshipStanding,
} from '@models/types';
import {
  addCharacter,
  updateCharacter,
  loadCharacters,
  saveCharacters,
  loadFactions,
} from '@utils/characterStorage';
import { AVAILABLE_PERKS, AVAILABLE_DISTINCTIONS } from '@models/gameData';
import { colors as themeColors } from '@/styles/theme';
import { commonStyles } from '@/styles/commonStyles';

type CharacterFormRouteProp = RouteProp<RootStackParamList, 'CharacterForm'>;

export const CharacterFormScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<CharacterFormRouteProp>();
  const editingCharacter = route.params?.character;
  const [selectedPerkTag, setSelectedPerkTag] = useState<string>('');
  const [allCharacters, setAllCharacters] = useState<GameCharacter[]>([]);
  const [availableFactions, setAvailableFactions] = useState<string[]>([]);
  const [showCustomFactionInput, setShowCustomFactionInput] = useState<{
    [key: number]: boolean;
  }>({});
  const [perksExpanded, setPerksExpanded] = useState<boolean>(false);
  const [distinctionsExpanded, setDistinctionsExpanded] =
    useState<boolean>(false);

  const [form, setForm] = useState<CharacterFormData>(
    editingCharacter
      ? {
          name: editingCharacter.name,
          species: editingCharacter.species,
          perkIds: [...editingCharacter.perkIds],
          distinctionIds: [...editingCharacter.distinctionIds],
          factions: [...editingCharacter.factions],
          relationships: [...(editingCharacter.relationships || [])],
          notes: editingCharacter.notes || '',
          occupation: editingCharacter.occupation || '',
          imageUri: editingCharacter.imageUri,
          location: editingCharacter.location,
          retired: editingCharacter.retired,
        }
      : {
          name: '',
          species: 'Human',
          perkIds: [],
          distinctionIds: [],
          factions: [],
          relationships: [],
          notes: '',
          occupation: '',
          imageUri: undefined,
          location: Location.Downtown,
          retired: false,
        }
  );

  const loadAllCharacters = useCallback(async () => {
    try {
      const characters = await loadCharacters();
      setAllCharacters(characters);

      // Extract unique faction names from all characters
      const factionNames = new Set<string>();
      characters.forEach(character => {
        character.factions.forEach(faction => {
          factionNames.add(faction.name);
        });
      });

      // Also load factions from centralized storage
      const storedFactions = await loadFactions();
      storedFactions.forEach(faction => {
        factionNames.add(faction.name);
      });

      setAvailableFactions(Array.from(factionNames).sort());
    } catch (error) {
      console.error('Failed to load characters:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAllCharacters();
    }, [loadAllCharacters])
  );

  // Get available character names for relationship picker
  const getAvailableCharacterNames = () => {
    return allCharacters
      .filter(char => char.id !== editingCharacter?.id) // Exclude the current character
      .map(char => char.name)
      .sort();
  };

  const handleChange = (field: keyof CharacterFormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Function to update bidirectional relationships
  const updateBidirectionalRelationships = async (
    currentCharacter: GameCharacter,
    previousRelationships: Relationship[] = []
  ): Promise<void> => {
    try {
      const allChars = await loadCharacters();
      const updatedCharacters = [...allChars];

      // Find the current character in the list and update it
      const currentCharIndex = updatedCharacters.findIndex(
        char => char.id === currentCharacter.id
      );
      if (currentCharIndex !== -1) {
        updatedCharacters[currentCharIndex] = currentCharacter;
      }

      // Remove old relationships that no longer exist
      for (const oldRel of previousRelationships) {
        const targetChar = updatedCharacters.find(
          char => char.name === oldRel.characterName
        );
        if (targetChar) {
          targetChar.relationships = (targetChar.relationships || []).filter(
            rel => rel.characterName !== currentCharacter.name
          );
        }
      }

      // Add new bidirectional relationships
      for (const relationship of currentCharacter.relationships) {
        const targetChar = updatedCharacters.find(
          char => char.name === relationship.characterName
        );
        if (targetChar && targetChar.id !== currentCharacter.id) {
          // Remove any existing relationship to avoid duplicates
          targetChar.relationships = (targetChar.relationships || []).filter(
            rel => rel.characterName !== currentCharacter.name
          );

          // Add the reciprocal relationship
          const reciprocalRelationship: Relationship = {
            characterName: currentCharacter.name,
            relationshipType: relationship.relationshipType,
            description: relationship.description
              ? `Reciprocal: ${relationship.description}`
              : `${currentCharacter.name}'s ${relationship.relationshipType.toLowerCase()}`,
          };

          targetChar.relationships.push(reciprocalRelationship);
          targetChar.updatedAt = new Date().toISOString();
        }
      }

      await saveCharacters(updatedCharacters);
    } catch (error) {
      console.error('Failed to update bidirectional relationships:', error);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      handleChange('imageUri', result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    // Process relationships to use custom names when applicable
    const processedRelationships = form.relationships.map(rel => ({
      ...rel,
      characterName:
        rel.characterName === '__CUSTOM__'
          ? rel.customName || ''
          : rel.characterName,
      customName: undefined, // Remove the customName field before saving
    }));

    const formToSubmit = {
      ...form,
      relationships: processedRelationships,
    };

    try {
      let savedCharacter: GameCharacter;
      const previousRelationships = editingCharacter?.relationships || [];

      if (editingCharacter) {
        const result = await updateCharacter(editingCharacter.id, formToSubmit);
        if (!result) throw new Error('Failed to update character');
        savedCharacter = result;
      } else {
        savedCharacter = await addCharacter(formToSubmit);
      }

      // Update bidirectional relationships
      await updateBidirectionalRelationships(
        savedCharacter,
        previousRelationships
      );

      if (route.params?.onSubmit) {
        route.params.onSubmit(savedCharacter);
      }
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save character');
    }
  };

  return (
    <View style={{ height: 882, overflow: 'scroll' }}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.formSection}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={value => handleChange('name', value)}
            placeholder="Character Name"
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Character Image</Text>
          <View style={styles.imageContainer}>
            {form.imageUri ? (
              <Image
                source={{ uri: form.imageUri }}
                style={styles.characterImage}
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>No image selected</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={pickImage}
            >
              <Text style={styles.imagePickerButtonText}>
                {form.imageUri ? 'Change Image' : 'Pick Image'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Species</Text>
          <Picker
            selectedValue={form.species}
            style={[styles.picker, { flex: 1 }]}
            onValueChange={(value: Species) => handleChange('species', value)}
          >
            {Object.keys(SPECIES_BASE_STATS).map(species => (
              <Picker.Item key={species} label={species} value={species} />
            ))}
          </Picker>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Location</Text>
          <Picker
            selectedValue={form.location}
            style={[styles.picker, { flex: 1 }]}
            onValueChange={(value: Location) => handleChange('location', value)}
          >
            {Object.values(Location).map(location => (
              <Picker.Item key={location} label={location} value={location} />
            ))}
          </Picker>
        </View>

        <View style={styles.formSection}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setPerksExpanded(!perksExpanded)}
          >
            <Text style={styles.label}>Perks</Text>
            <Text style={styles.expandIcon}>{perksExpanded ? '▼' : '▶'}</Text>
          </TouchableOpacity>
          {perksExpanded && (
            <>
              <View style={styles.filterContainer}>
                <Text style={styles.filterLabel}>Filter by Tag:</Text>
                <Picker
                  selectedValue={selectedPerkTag}
                  style={[styles.picker, { flex: 1 }]}
                  onValueChange={setSelectedPerkTag}
                >
                  <Picker.Item label="All Tags" value="" />
                  {Array.from(new Set(AVAILABLE_PERKS.map(perk => perk.tag)))
                    .sort()
                    .map(tag => (
                      <Picker.Item key={tag} label={tag} value={tag} />
                    ))}
                </Picker>
              </View>
              {AVAILABLE_PERKS.filter(
                perk =>
                  (!selectedPerkTag || perk.tag === selectedPerkTag) &&
                  (!perk.allowedSpecies ||
                    perk.allowedSpecies.includes(form.species))
              ).map(perk => (
                <TouchableOpacity
                  key={perk.id}
                  style={[
                    styles.selectionItem,
                    form.perkIds.includes(perk.id) && styles.selectedItem,
                    perk.allowedSpecies && styles.speciesSpecificItem,
                  ]}
                  onPress={() => {
                    const newPerkIds = form.perkIds.includes(perk.id)
                      ? form.perkIds.filter(id => id !== perk.id)
                      : [...form.perkIds, perk.id];
                    handleChange('perkIds', newPerkIds);
                  }}
                >
                  <View style={styles.perkContainer}>
                    <View style={styles.perkHeaderContainer}>
                      <Text style={styles.itemName}>{perk.name}</Text>
                      <View style={styles.perkBadgeContainer}>
                        {perk.allowedSpecies &&
                          perk.allowedSpecies.length > 0 && (
                            <Text style={styles.speciesText}>
                              {perk.allowedSpecies.length === 1
                                ? perk.allowedSpecies[0]
                                : `${perk.allowedSpecies.length} Species`}
                            </Text>
                          )}
                        <Text style={styles.tagText}>{perk.tag}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.descriptionText}>{perk.description}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>

        <View style={styles.formSection}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setDistinctionsExpanded(!distinctionsExpanded)}
          >
            <Text style={styles.label}>Distinctions</Text>
            <Text style={styles.expandIcon}>
              {distinctionsExpanded ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>
          {distinctionsExpanded && (
            <>
              {AVAILABLE_DISTINCTIONS.map(distinction => (
                <TouchableOpacity
                  key={distinction.id}
                  style={[
                    styles.selectionItem,
                    form.distinctionIds.includes(distinction.id) &&
                      styles.selectedItem,
                  ]}
                  onPress={() => {
                    const newDistinctionIds = form.distinctionIds.includes(
                      distinction.id
                    )
                      ? form.distinctionIds.filter(id => id !== distinction.id)
                      : [...form.distinctionIds, distinction.id];
                    handleChange('distinctionIds', newDistinctionIds);
                  }}
                >
                  <Text style={styles.itemName}>{distinction.name}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Factions</Text>
          {form.factions.map((faction, index) => (
            <View key={index} style={styles.factionContainer}>
              {showCustomFactionInput[index] ? (
                <View style={styles.customFactionContainer}>
                  <TextInput
                    style={styles.factionInput}
                    value={faction.name}
                    onChangeText={value => {
                      const newFactions = [...form.factions];
                      newFactions[index] = { ...faction, name: value };
                      handleChange('factions', newFactions);

                      // Add new faction to available list if it doesn't exist
                      if (
                        value.trim() &&
                        !availableFactions.includes(value.trim())
                      ) {
                        setAvailableFactions(prev =>
                          [...prev, value.trim()].sort()
                        );
                      }
                    }}
                    placeholder="Enter new faction name"
                    autoFocus={true}
                    onBlur={() => {
                      // Switch back to dropdown if input is empty
                      if (!faction.name.trim()) {
                        setShowCustomFactionInput(prev => ({
                          ...prev,
                          [index]: false,
                        }));
                      }
                    }}
                  />
                  <TouchableOpacity
                    style={styles.backToDropdownButton}
                    onPress={() => {
                      setShowCustomFactionInput(prev => ({
                        ...prev,
                        [index]: false,
                      }));
                    }}
                  >
                    <Text style={styles.backToDropdownText}>↩</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Picker
                  selectedValue={faction.name || ''}
                  style={styles.factionInput}
                  onValueChange={value => {
                    if (value === '__ADD_NEW__') {
                      setShowCustomFactionInput(prev => ({
                        ...prev,
                        [index]: true,
                      }));
                      const newFactions = [...form.factions];
                      newFactions[index] = { ...faction, name: '' };
                      handleChange('factions', newFactions);
                    } else if (value && value !== faction.name) {
                      const newFactions = [...form.factions];
                      newFactions[index] = { ...faction, name: value };
                      handleChange('factions', newFactions);
                    }
                  }}
                >
                  <Picker.Item label="Select a faction..." value="" />
                  {availableFactions.map(factionName => (
                    <Picker.Item
                      key={factionName}
                      label={factionName}
                      value={factionName}
                    />
                  ))}
                  <Picker.Item label="Add New Faction..." value="__ADD_NEW__" />
                </Picker>
              )}
              <Picker
                selectedValue={faction.standing}
                style={styles.factionStanding}
                onValueChange={value => {
                  const newFactions = [...form.factions];
                  newFactions[index] = { ...faction, standing: value };
                  handleChange('factions', newFactions);
                }}
              >
                {Object.values(RelationshipStanding).map(standing => (
                  <Picker.Item
                    key={standing}
                    label={standing}
                    value={standing}
                  />
                ))}
              </Picker>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => {
                  const newFactions = form.factions.filter(
                    (_, i) => i !== index
                  );
                  handleChange('factions', newFactions);
                }}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              handleChange('factions', [
                ...form.factions,
                { name: '', standing: 'Neutral' },
              ]);
            }}
          >
            <Text style={styles.addButtonText}>Add Faction</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Relationships</Text>
          {form.relationships.map((relationship, index) => (
            <View key={index} style={styles.relationshipGroup}>
              <View style={styles.relationshipContainer}>
                <View style={styles.relationshipPickerContainer}>
                  <Picker
                    selectedValue={relationship.characterName}
                    style={styles.relationshipNamePicker}
                    onValueChange={value => {
                      const newRelationships = [...form.relationships];
                      newRelationships[index] = {
                        ...relationship,
                        characterName: value,
                      };
                      handleChange('relationships', newRelationships);
                    }}
                  >
                    <Picker.Item label="Select Character..." value="" />
                    {getAvailableCharacterNames().map(name => (
                      <Picker.Item key={name} label={name} value={name} />
                    ))}
                    <Picker.Item
                      label="Other (Custom Name)"
                      value="__CUSTOM__"
                    />
                  </Picker>
                </View>
                <Picker
                  selectedValue={relationship.relationshipType}
                  style={styles.relationshipType}
                  onValueChange={value => {
                    const newRelationships = [...form.relationships];
                    newRelationships[index] = {
                      ...relationship,
                      relationshipType: value,
                    };
                    handleChange('relationships', newRelationships);
                  }}
                >
                  {Object.values(RelationshipStanding).map(type => (
                    <Picker.Item key={type} label={type} value={type} />
                  ))}
                </Picker>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => {
                    const newRelationships = form.relationships.filter(
                      (_, i) => i !== index
                    );
                    handleChange('relationships', newRelationships);
                  }}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
              {relationship.characterName === '__CUSTOM__' && (
                <View style={styles.customNameContainer}>
                  <TextInput
                    style={styles.customNameInput}
                    value={relationship.customName || ''}
                    onChangeText={value => {
                      const newRelationships = [...form.relationships];
                      newRelationships[index] = {
                        ...relationship,
                        customName: value,
                      };
                      handleChange('relationships', newRelationships);
                    }}
                    placeholder="Enter custom character name"
                  />
                </View>
              )}
              <View style={styles.relationshipDescContainer}>
                <TextInput
                  style={styles.relationshipDescInput}
                  value={relationship.description || ''}
                  onChangeText={value => {
                    const newRelationships = [...form.relationships];
                    newRelationships[index] = {
                      ...relationship,
                      description: value,
                    };
                    handleChange('relationships', newRelationships);
                  }}
                  placeholder={`Description of relationship with ${relationship.characterName || 'character'}`}
                  multiline
                />
              </View>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              handleChange('relationships', [
                ...form.relationships,
                {
                  characterName: '',
                  relationshipType: RelationshipStanding.Friend,
                  description: '',
                },
              ]);
            }}
          >
            <Text style={styles.addButtonText}>Add Relationship</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Status</Text>
          <TouchableOpacity
            style={[
              styles.statusButton,
              form.retired && styles.statusButtonRetired,
            ]}
            onPress={() => handleChange('retired', !form.retired)}
          >
            <Text
              style={[
                styles.statusButtonText,
                form.retired && styles.statusButtonTextRetired,
              ]}
            >
              {form.retired ? '🔒 Retired' : '✓ Active'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Occupation</Text>
          <TextInput
            style={styles.input}
            value={form.occupation}
            onChangeText={value => handleChange('occupation', value)}
            placeholder="Character Occupation"
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={form.notes}
            onChangeText={value => handleChange('notes', value)}
            placeholder="Character Notes"
            multiline
          />
        </View>

        <View style={styles.submitContainer}>
          <Button
            title={editingCharacter ? 'Update Character' : 'Create Character'}
            onPress={handleSubmit}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: commonStyles.layout.scrollView,
  imageContainer: commonStyles.image.container,
  characterImage: commonStyles.image.characterLarge,
  placeholderImage: commonStyles.image.placeholder,
  imagePickerButton: commonStyles.image.pickerButton,
  imagePickerButtonText: {
    ...commonStyles.button.text,
    textAlign: 'center',
  },
  contentContainer: commonStyles.layout.contentContainer,
  filterContainer: {
    ...commonStyles.layout.section,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
  },
  filterLabel: {
    ...commonStyles.text.label,
    marginRight: 12,
    marginBottom: 0,
  },
  picker: commonStyles.input.picker,
  perkContainer: {
    flexDirection: 'column',
    marginBottom: 4,
  },
  perkHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  perkBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagText: {
    ...commonStyles.badge.text,
    ...commonStyles.badge.tag,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  speciesText: {
    ...commonStyles.badge.text,
    ...commonStyles.badge.species,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  speciesSpecificItem: {
    borderLeftWidth: 4,
    borderLeftColor: themeColors.status.info,
    backgroundColor: themeColors.elevated,
  },
  descriptionText: {
    ...commonStyles.text.description,
    marginTop: 6,
    lineHeight: 20,
  },
  formSection: commonStyles.layout.formSection,
  label: commonStyles.text.label,
  input: commonStyles.input.base,
  notesInput: {
    ...commonStyles.input.base,
    ...commonStyles.input.multiline,
  },
  statusButton: {
    ...commonStyles.button.base,
    ...commonStyles.button.success,
  },
  statusButtonRetired: {
    backgroundColor: themeColors.status.error,
    borderColor: themeColors.status.error,
  },
  statusButtonText: commonStyles.button.text,
  statusButtonTextRetired: commonStyles.button.text,
  selectionItem: {
    backgroundColor: themeColors.elevated,
    padding: 16,
    borderRadius: 12,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  selectedItem: {
    backgroundColor: themeColors.interactive.hover,
    borderColor: themeColors.accent.primary,
  },
  itemName: {
    fontSize: 16,
    color: themeColors.text.primary,
    fontWeight: '500',
  },
  factionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  factionInput: {
    ...commonStyles.input.base,
    padding: 12,
    borderRadius: 8,
    flex: 1,
  },
  customFactionContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backToDropdownButton: {
    backgroundColor: themeColors.interactive.hover,
    padding: 8,
    borderRadius: 6,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToDropdownText: {
    color: themeColors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  factionStanding: {
    width: '35%',
  },
  relationshipGroup: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: themeColors.elevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  relationshipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  relationshipPickerContainer: {
    flex: 1,
  },
  relationshipNamePicker: {
    ...commonStyles.input.picker,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  relationshipType: {
    width: '35%',
  },
  customNameContainer: {
    marginBottom: 12,
    marginTop: -8,
  },
  customNameInput: {
    ...commonStyles.input.base,
    padding: 12,
    borderRadius: 8,
  },
  relationshipDescContainer: {
    marginBottom: 12,
  },
  relationshipDescInput: {
    ...commonStyles.input.base,
    padding: 12,
    borderRadius: 8,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  removeButton: {
    ...commonStyles.button.small,
    backgroundColor: themeColors.status.error,
  },
  removeButtonText: commonStyles.button.textSmall,
  addButton: {
    ...commonStyles.button.base,
    ...commonStyles.button.primary,
    marginTop: 12,
  },
  addButtonText: commonStyles.button.text,
  submitContainer: {
    marginTop: 32,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  placeholderText: {
    ...commonStyles.text.body,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  expandIcon: {
    color: themeColors.text.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
});
