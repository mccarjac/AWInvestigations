import React, { useState, useMemo, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, TextInput, TouchableOpacity, Button, Alert, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { CharacterFormData, GameCharacter, Species, SPECIES_BASE_STATS, Location, Relationship, RelationshipType } from '@models/types';
import { addCharacter, updateCharacter, loadCharacters, saveCharacters } from '@utils/characterStorage';
import { AVAILABLE_PERKS, AVAILABLE_DISTINCTIONS } from '@models/gameData';

// Dark theme color palette
const colors = {
  primary: '#0F0F23',
  surface: '#262647',
  elevated: '#2D2D52',
  text: {
    primary: '#FFFFFF',
    secondary: '#B0B0B0',
    accent: '#8A8A8A',
  },
  accent: {
    primary: '#6C5CE7',
    secondary: 'rgba(108, 92, 231, 0.15)',
  },
  border: '#404066',
  shadow: '#000000',
  status: {
    success: '#00B894',
    warning: '#FDCB6E',
    error: '#E17055',
    info: '#74B9FF',
  },
};

type CharacterFormRouteProp = RouteProp<RootStackParamList, 'CharacterForm'>;

export const CharacterFormScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<CharacterFormRouteProp>();
  const editingCharacter = route.params?.character;
  const [selectedPerkTag, setSelectedPerkTag] = useState<string>('');
  const [allCharacters, setAllCharacters] = useState<GameCharacter[]>([]);

  const [form, setForm] = useState<CharacterFormData>(
    editingCharacter ? {
      name: editingCharacter.name,
      species: editingCharacter.species,
      perkIds: [...editingCharacter.perkIds],
      distinctionIds: [...editingCharacter.distinctionIds],
      factions: [...editingCharacter.factions],
      relationships: [...(editingCharacter.relationships || [])],
      notes: editingCharacter.notes || '',
      imageUri: editingCharacter.imageUri,
      location: editingCharacter.location,
    } : {
      name: '',
      species: 'Human',
      perkIds: [],
      distinctionIds: [],
      factions: [],
      relationships: [],
      notes: '',
      imageUri: undefined,
      location: Location.Downtown,
    }
  );

  useEffect(() => {
    const loadAllCharacters = async () => {
      try {
        const characters = await loadCharacters();
        setAllCharacters(characters);
      } catch (error) {
        console.error('Failed to load characters:', error);
      }
    };
    
    loadAllCharacters();
  }, []);

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

  // Function to determine the reciprocal relationship type
  // For most relationships, the reciprocal is the same type
  // Special cases: Mentor <-> Student relationships are asymmetric
  const getReciprocalRelationshipType = (relationshipType: RelationshipType): RelationshipType => {
    const reciprocalMap: Record<RelationshipType, RelationshipType> = {
      [RelationshipType.Family]: RelationshipType.Family,      // Family is mutual
      [RelationshipType.Friend]: RelationshipType.Friend,      // Friend is mutual
      [RelationshipType.Ally]: RelationshipType.Ally,         // Ally is mutual
      [RelationshipType.Enemy]: RelationshipType.Enemy,       // Enemy is mutual
      [RelationshipType.Rival]: RelationshipType.Rival,       // Rival is mutual
      [RelationshipType.Mentor]: RelationshipType.Student,    // Mentor -> Student
      [RelationshipType.Student]: RelationshipType.Mentor,    // Student -> Mentor
      [RelationshipType.Romantic]: RelationshipType.Romantic, // Romantic is mutual
      [RelationshipType.Business]: RelationshipType.Business, // Business is mutual
      [RelationshipType.Other]: RelationshipType.Other,       // Other is mutual
    };
    return reciprocalMap[relationshipType];
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
      const currentCharIndex = updatedCharacters.findIndex(char => char.id === currentCharacter.id);
      if (currentCharIndex !== -1) {
        updatedCharacters[currentCharIndex] = currentCharacter;
      }

      // Remove old relationships that no longer exist
      for (const oldRel of previousRelationships) {
        const targetChar = updatedCharacters.find(char => char.name === oldRel.characterName);
        if (targetChar) {
          targetChar.relationships = (targetChar.relationships || []).filter(
            rel => rel.characterName !== currentCharacter.name
          );
        }
      }

      // Add new bidirectional relationships
      for (const relationship of currentCharacter.relationships) {
        const targetChar = updatedCharacters.find(char => char.name === relationship.characterName);
        if (targetChar && targetChar.id !== currentCharacter.id) {
          // Remove any existing relationship to avoid duplicates
          targetChar.relationships = (targetChar.relationships || []).filter(
            rel => rel.characterName !== currentCharacter.name
          );

          // Add the reciprocal relationship
          const reciprocalType = getReciprocalRelationshipType(relationship.relationshipType);
          const reciprocalRelationship: Relationship = {
            characterName: currentCharacter.name,
            relationshipType: reciprocalType,
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
      characterName: rel.characterName === '__CUSTOM__' 
        ? (rel.customName || '') 
        : rel.characterName,
      customName: undefined // Remove the customName field before saving
    }));

    const formToSubmit = {
      ...form,
      relationships: processedRelationships
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
      await updateBidirectionalRelationships(savedCharacter, previousRelationships);

      if (route.params?.onSubmit) {
        route.params.onSubmit(savedCharacter);
      }
      navigation.goBack();
    } catch (error) {
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
            onChangeText={(value) => handleChange('name', value)}
            placeholder="Character Name"
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Character Image</Text>
          <View style={styles.imageContainer}>
            {form.imageUri ? (
              <Image source={{ uri: form.imageUri }} style={styles.characterImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>No image selected</Text>
              </View>
            )}
            <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
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
            style={[styles.input, { backgroundColor: 'white' }]}
            onValueChange={(value: Species) => handleChange('species', value)}
          >
            {Object.keys(SPECIES_BASE_STATS).map((species) => (
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
            {Object.values(Location).map((location) => (
              <Picker.Item key={location} label={location} value={location} />
            ))}
          </Picker>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Perks</Text>
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Filter by Tag:</Text>
            <Picker
              selectedValue={selectedPerkTag}
              style={[styles.picker, { flex: 1 }]}
              onValueChange={setSelectedPerkTag}
            >
              <Picker.Item label="All Tags" value="" />
              {Array.from(new Set(AVAILABLE_PERKS.map(perk => perk.tag))).sort().map(tag => (
                <Picker.Item key={tag} label={tag} value={tag} />
              ))}
            </Picker>
          </View>
          {AVAILABLE_PERKS
            .filter(perk => (!selectedPerkTag || perk.tag === selectedPerkTag) &&
                          (!perk.allowedSpecies || perk.allowedSpecies.includes(form.species)))
            .map(perk => (
              <TouchableOpacity
                key={perk.id}
                style={[
                  styles.selectionItem,
                  form.perkIds.includes(perk.id) && styles.selectedItem,
                  perk.allowedSpecies && styles.speciesSpecificItem
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
                      {perk.allowedSpecies && perk.allowedSpecies.length > 0 && (
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
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Distinctions</Text>
          {AVAILABLE_DISTINCTIONS.map(distinction => (
            <TouchableOpacity
              key={distinction.id}
              style={[
                styles.selectionItem,
                form.distinctionIds.includes(distinction.id) && styles.selectedItem
              ]}
              onPress={() => {
                const newDistinctionIds = form.distinctionIds.includes(distinction.id)
                  ? form.distinctionIds.filter(id => id !== distinction.id)
                  : [...form.distinctionIds, distinction.id];
                handleChange('distinctionIds', newDistinctionIds);
              }}
            >
              <Text style={styles.itemName}>{distinction.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Factions</Text>
          {form.factions.map((faction, index) => (
            <View key={index} style={styles.factionContainer}>
              <TextInput
                style={styles.factionInput}
                value={faction.name}
                onChangeText={(value) => {
                  const newFactions = [...form.factions];
                  newFactions[index] = { ...faction, name: value };
                  handleChange('factions', newFactions);
                }}
                placeholder="Faction Name"
              />
              <Picker
                selectedValue={faction.standing}
                style={styles.factionStanding}
                onValueChange={(value) => {
                  const newFactions = [...form.factions];
                  newFactions[index] = { ...faction, standing: value };
                  handleChange('factions', newFactions);
                }}
              >
                <Picker.Item label="Allied" value="Allied" />
                <Picker.Item label="Friendly" value="Friendly" />
                <Picker.Item label="Neutral" value="Neutral" />
                <Picker.Item label="Hostile" value="Hostile" />
                <Picker.Item label="Enemy" value="Enemy" />
              </Picker>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => {
                  const newFactions = form.factions.filter((_, i) => i !== index);
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
              handleChange('factions', [...form.factions, { name: '', standing: 'Neutral' }]);
            }}
          >
            <Text style={styles.addButtonText}>Add Faction</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Relationships</Text>
          {form.relationships.map((relationship, index) => (
            <View key={index}>
              <View style={styles.relationshipContainer}>
                <View style={styles.relationshipPickerContainer}>
                  <Picker
                    selectedValue={relationship.characterName}
                    style={styles.relationshipNamePicker}
                    onValueChange={(value) => {
                      const newRelationships = [...form.relationships];
                      newRelationships[index] = { ...relationship, characterName: value };
                      handleChange('relationships', newRelationships);
                    }}
                  >
                    <Picker.Item label="Select Character..." value="" />
                    {getAvailableCharacterNames().map((name) => (
                      <Picker.Item key={name} label={name} value={name} />
                    ))}
                    <Picker.Item label="Other (Custom Name)" value="__CUSTOM__" />
                  </Picker>
                </View>
                <Picker
                  selectedValue={relationship.relationshipType}
                  style={styles.relationshipType}
                  onValueChange={(value) => {
                    const newRelationships = [...form.relationships];
                    newRelationships[index] = { ...relationship, relationshipType: value };
                    handleChange('relationships', newRelationships);
                  }}
                >
                  {Object.values(RelationshipType).map((type) => (
                    <Picker.Item key={type} label={type} value={type} />
                  ))}
                </Picker>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => {
                    const newRelationships = form.relationships.filter((_, i) => i !== index);
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
                    onChangeText={(value) => {
                      const newRelationships = [...form.relationships];
                      newRelationships[index] = { ...relationship, customName: value };
                      handleChange('relationships', newRelationships);
                    }}
                    placeholder="Enter custom character name"
                  />
                </View>
              )}
            </View>
          ))}
          {form.relationships.map((relationship, index) => (
            <View key={`desc-${index}`} style={styles.relationshipDescContainer}>
              <TextInput
                style={styles.relationshipDescInput}
                value={relationship.description || ''}
                onChangeText={(value) => {
                  const newRelationships = [...form.relationships];
                  newRelationships[index] = { ...relationship, description: value };
                  handleChange('relationships', newRelationships);
                }}
                placeholder={`Description of relationship with ${relationship.characterName || 'character'}`}
                multiline
              />
            </View>
          ))}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              handleChange('relationships', [...form.relationships, { characterName: '', relationshipType: RelationshipType.Friend, description: '' }]);
            }}
          >
            <Text style={styles.addButtonText}>Add Relationship</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={form.notes}
            onChangeText={(value) => handleChange('notes', value)}
            placeholder="Character Notes"
            multiline
          />
        </View>

        <View style={styles.submitContainer}>
          <Button
            title={editingCharacter ? "Update Character" : "Create Character"}
            onPress={handleSubmit}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: colors.primary,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: colors.surface,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  characterImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  placeholderImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  imagePickerButton: {
    backgroundColor: colors.accent.primary,
    padding: 16,
    borderRadius: 12,
    width: 200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  imagePickerButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
    color: colors.text.primary,
    letterSpacing: 0.2,
  },
  picker: {
    backgroundColor: colors.elevated,
    height: 50,
    borderRadius: 8,
    color: colors.text.primary,
  },
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
    fontSize: 12,
    color: colors.accent.primary,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.accent.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent.primary,
  },
  speciesText: {
    fontSize: 12,
    color: colors.status.info,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(116, 185, 255, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.status.info,
  },
  speciesSpecificItem: {
    borderLeftWidth: 4,
    borderLeftColor: colors.status.info,
    backgroundColor: colors.elevated,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 6,
    lineHeight: 20,
  },
  formSection: {
    marginBottom: 24,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: colors.text.primary,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: colors.elevated,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  selectionItem: {
    backgroundColor: colors.elevated,
    padding: 16,
    borderRadius: 12,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedItem: {
    backgroundColor: colors.accent.secondary,
    borderColor: colors.accent.primary,
  },
  itemName: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  factionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  factionInput: {
    backgroundColor: colors.elevated,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    flex: 1,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  factionStanding: {
    width: '35%',
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
    backgroundColor: colors.elevated,
    borderRadius: 8,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  relationshipInput: {
    backgroundColor: colors.elevated,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    flex: 1,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  relationshipType: {
    width: '35%',
  },
  customNameContainer: {
    marginBottom: 12,
    marginTop: -8,
  },
  customNameInput: {
    backgroundColor: colors.elevated,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  relationshipDescContainer: {
    marginBottom: 12,
  },
  relationshipDescInput: {
    backgroundColor: colors.elevated,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  removeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.status.error,
  },
  removeButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: colors.accent.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  submitContainer: {
    marginTop: 32,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  placeholderText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: '500',
  },
});