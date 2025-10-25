import React, { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, TextInput, TouchableOpacity, Button, Alert, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { CharacterFormData, GameCharacter, Species, SPECIES_BASE_STATS } from '@models/types';
import { addCharacter, updateCharacter } from '@utils/characterStorage';
import { AVAILABLE_PERKS, AVAILABLE_DISTINCTIONS } from '@models/gameData';

type CharacterFormRouteProp = RouteProp<RootStackParamList, 'CharacterForm'>;

export const CharacterFormScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<CharacterFormRouteProp>();
  const editingCharacter = route.params?.character;
  const [selectedPerkTag, setSelectedPerkTag] = useState<string>('');

  const [form, setForm] = useState<CharacterFormData>(
    editingCharacter ? {
      name: editingCharacter.name,
      species: editingCharacter.species,
      perkIds: [...editingCharacter.perkIds],
      distinctionIds: [...editingCharacter.distinctionIds],
      factions: [...editingCharacter.factions],
      notes: editingCharacter.notes || '',
      imageUri: editingCharacter.imageUri,
    } : {
      name: '',
      species: 'Human',
      perkIds: [],
      distinctionIds: [],
      factions: [],
      notes: '',
      imageUri: undefined,
    }
  );

  const handleChange = (field: keyof CharacterFormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
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

    try {
      let savedCharacter: GameCharacter;
      if (editingCharacter) {
        const result = await updateCharacter(editingCharacter.id, form);
        if (!result) throw new Error('Failed to update character');
        savedCharacter = result;
      } else {
        savedCharacter = await addCharacter(form);
      }

      if (route.params?.onSubmit) {
        route.params.onSubmit(savedCharacter);
      } else {
        navigation.goBack();
      }
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
                <Text>No image selected</Text>
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
    backgroundColor: '#f5f5f5',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  characterImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 16,
  },
  placeholderImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePickerButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 6,
    width: 200,
  },
  imagePickerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 6,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  picker: {
    backgroundColor: 'white',
    height: 40,
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
    color: '#2196F3',
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#e3f2fd',
    borderRadius: 4,
  },
  speciesText: {
    fontSize: 12,
    color: '#9c27b0',
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#f3e5f5',
    borderRadius: 4,
  },
  speciesSpecificItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#9c27b0',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 6,
    fontSize: 16,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  selectionItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 6,
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedItem: {
    backgroundColor: '#e3f2fd',
  },
  itemName: {
    fontSize: 16,
  },
  factionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  factionInput: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 6,
    fontSize: 16,
    width: '50%',
  },
  factionStanding: {
    width: '40%',
    marginLeft: 8,
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
  removeButtonText: {
    color: '#f44336',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
});