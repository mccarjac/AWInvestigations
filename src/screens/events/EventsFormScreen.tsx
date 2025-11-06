import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import {
  createEvent,
  updateEvent,
  loadCharacters,
  loadLocations,
} from '@utils/characterStorage';
import { colors as themeColors } from '@/styles/theme';
import { commonStyles } from '@/styles/commonStyles';
import { Picker } from '@react-native-picker/picker';
import { GameCharacter, GameLocation } from '@models/types';

type EventsFormNavigationProp = StackNavigationProp<
  RootStackParamList,
  'EventsForm'
>;

type EventsFormRouteProp = RouteProp<RootStackParamList, 'EventsForm'>;

interface EventFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  locationId: string;
  characterIds: string[];
  factionNames: string[];
  notes: string;
  imageUri?: string;
}

export const EventsFormScreen: React.FC = () => {
  const navigation = useNavigation<EventsFormNavigationProp>();
  const route = useRoute<EventsFormRouteProp>();
  const { event } = route.params || {};

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    time: '',
    locationId: '',
    characterIds: [],
    factionNames: [],
    notes: '',
    imageUri: undefined,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [characters, setCharacters] = useState<GameCharacter[]>([]);
  const [locations, setLocations] = useState<GameLocation[]>([]);
  const [factionInput, setFactionInput] = useState<string>('');

  // Load characters and locations
  useEffect(() => {
    const loadData = async () => {
      const [loadedCharacters, loadedLocations] = await Promise.all([
        loadCharacters(),
        loadLocations(),
      ]);
      setCharacters(loadedCharacters);
      setLocations(loadedLocations);
    };
    loadData();
  }, []);

  // Load existing event data if editing
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || '',
        date: event.date,
        time: event.time || '',
        locationId: event.locationId || '',
        characterIds: event.characterIds || [],
        factionNames: event.factionNames || [],
        notes: event.notes || '',
        imageUri: event.imageUri,
      });
    }
  }, [event]);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Required',
        'Permission to access camera roll is required!',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setFormData({ ...formData, imageUri: result.assets[0].uri });
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, imageUri: undefined });
  };

  const toggleCharacter = (characterId: string) => {
    const newCharacterIds = formData.characterIds.includes(characterId)
      ? formData.characterIds.filter(id => id !== characterId)
      : [...formData.characterIds, characterId];
    setFormData({ ...formData, characterIds: newCharacterIds });
  };

  const addFaction = () => {
    if (
      factionInput.trim() &&
      !formData.factionNames.includes(factionInput.trim())
    ) {
      setFormData({
        ...formData,
        factionNames: [...formData.factionNames, factionInput.trim()],
      });
      setFactionInput('');
    }
  };

  const removeFaction = (faction: string) => {
    setFormData({
      ...formData,
      factionNames: formData.factionNames.filter(f => f !== faction),
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (event) {
        // Update existing event
        await updateEvent(event.id, formData);
        Alert.alert('Success', 'Event updated successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        // Create new event
        await createEvent(formData);
        Alert.alert('Success', 'Event created successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Error', 'Failed to save event. Please try again.', [
        { text: 'OK' },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={commonStyles.layout.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={commonStyles.layout.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder="Event title"
            placeholderTextColor={themeColors.text.muted}
            value={formData.title}
            onChangeText={title => setFormData({ ...formData, title })}
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Event description"
            placeholderTextColor={themeColors.text.muted}
            value={formData.description}
            onChangeText={description =>
              setFormData({ ...formData, description })
            }
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Date and Time */}
        <View style={styles.section}>
          <Text style={styles.label}>Date *</Text>
          <TextInput
            style={[styles.input, errors.date && styles.inputError]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={themeColors.text.muted}
            value={formData.date}
            onChangeText={date => setFormData({ ...formData, date })}
          />
          {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}

          <Text style={[styles.label, styles.labelMargin]}>
            Time (optional)
          </Text>
          <TextInput
            style={styles.input}
            placeholder="HH:MM (e.g., 14:30)"
            placeholderTextColor={themeColors.text.muted}
            value={formData.time}
            onChangeText={time => setFormData({ ...formData, time })}
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.label}>Location</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.locationId}
              onValueChange={locationId =>
                setFormData({ ...formData, locationId })
              }
              style={styles.picker}
              dropdownIconColor={themeColors.text.secondary}
            >
              <Picker.Item label="Select location..." value="" />
              {locations.map(location => (
                <Picker.Item
                  key={location.id}
                  label={location.name}
                  value={location.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Characters */}
        <View style={styles.section}>
          <Text style={styles.label}>Characters Involved</Text>
          <View style={styles.characterList}>
            {characters.map(character => (
              <TouchableOpacity
                key={character.id}
                style={[
                  styles.characterChip,
                  formData.characterIds.includes(character.id) &&
                    styles.characterChipSelected,
                ]}
                onPress={() => toggleCharacter(character.id)}
              >
                <Text
                  style={[
                    styles.characterChipText,
                    formData.characterIds.includes(character.id) &&
                      styles.characterChipTextSelected,
                  ]}
                >
                  {character.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Factions */}
        <View style={styles.section}>
          <Text style={styles.label}>Factions Involved</Text>
          <View style={styles.factionInputContainer}>
            <TextInput
              style={[styles.input, styles.factionInput]}
              placeholder="Add faction name"
              placeholderTextColor={themeColors.text.muted}
              value={factionInput}
              onChangeText={setFactionInput}
              onSubmitEditing={addFaction}
            />
            <TouchableOpacity style={styles.addButton} onPress={addFaction}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.factionList}>
            {formData.factionNames.map((faction, index) => (
              <View key={index} style={styles.factionChip}>
                <Text style={styles.factionChipText}>{faction}</Text>
                <TouchableOpacity onPress={() => removeFaction(faction)}>
                  <Text style={styles.removeButton}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Additional notes about the event"
            placeholderTextColor={themeColors.text.muted}
            value={formData.notes}
            onChangeText={notes => setFormData({ ...formData, notes })}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Image */}
        <View style={styles.section}>
          <Text style={styles.label}>Event Photo</Text>
          {formData.imageUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: formData.imageUri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={removeImage}
              >
                <Text style={styles.removeImageButtonText}>Remove Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
              <Text style={styles.uploadButtonText}>Choose Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting
              ? 'Saving...'
              : event
                ? 'Update Event'
                : 'Create Event'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.text.primary,
    marginBottom: 8,
  },
  labelMargin: {
    marginTop: 16,
  },
  input: {
    backgroundColor: themeColors.elevated,
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: 8,
    padding: 12,
    color: themeColors.text.primary,
    fontSize: 16,
  },
  inputError: {
    borderColor: themeColors.accent.danger,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: themeColors.accent.danger,
    fontSize: 12,
    marginTop: 4,
  },
  pickerContainer: {
    backgroundColor: themeColors.elevated,
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    color: themeColors.text.primary,
  },
  characterList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  characterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: themeColors.elevated,
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: 16,
  },
  characterChipSelected: {
    backgroundColor: themeColors.accent.primary,
    borderColor: themeColors.accent.primary,
  },
  characterChipText: {
    fontSize: 14,
    color: themeColors.text.secondary,
  },
  characterChipTextSelected: {
    color: themeColors.text.primary,
    fontWeight: '600',
  },
  factionInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  factionInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: themeColors.accent.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addButtonText: {
    color: themeColors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  factionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  factionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    backgroundColor: themeColors.accent.secondary,
    borderRadius: 16,
    gap: 6,
  },
  factionChipText: {
    fontSize: 14,
    color: themeColors.text.primary,
  },
  removeButton: {
    fontSize: 20,
    color: themeColors.text.primary,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
  imageContainer: {
    gap: 12,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: themeColors.elevated,
  },
  uploadButton: {
    backgroundColor: themeColors.elevated,
    borderWidth: 2,
    borderColor: themeColors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: 16,
    color: themeColors.text.secondary,
    fontWeight: '600',
  },
  removeImageButton: {
    backgroundColor: themeColors.accent.danger,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  removeImageButtonText: {
    color: themeColors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: themeColors.accent.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: themeColors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    height: 50,
  },
});
