import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import { createFaction } from '@utils/characterStorage';
import { colors as themeColors } from '@/styles/theme';
import { commonStyles } from '@/styles/commonStyles';
import * as ImagePicker from 'expo-image-picker';

type FactionFormNavigationProp = StackNavigationProp<
  RootStackParamList,
  'FactionForm'
>;

interface FactionFormData {
  name: string;
  description: string;
  imageUris: string[];
}

export const FactionFormScreen: React.FC = () => {
  const navigation = useNavigation<FactionFormNavigationProp>();

  const [formData, setFormData] = useState<FactionFormData>({
    name: '',
    description: '',
    imageUris: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Faction name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Faction name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to add images!'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const newImageUri = result.assets[0].uri;
      setFormData({
        ...formData,
        imageUris: [...formData.imageUris, newImageUri],
      });
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.imageUris.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      imageUris: newImages,
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await createFaction({
        name: formData.name.trim(),
        description: formData.description.trim(),
        imageUris: formData.imageUris,
      });

      if (success) {
        Alert.alert('Success', 'Faction created successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert(
          'Error',
          'A faction with this name already exists. Please choose a different name.',
          [{ text: 'OK' }]
        );
      }
    } catch {
      Alert.alert('Error', 'Failed to create faction. Please try again.', [
        { text: 'OK' },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Faction Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Faction Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textInput, errors.name && styles.inputError]}
              value={formData.name}
              onChangeText={text => {
                setFormData({ ...formData, name: text });
                if (errors.name) {
                  setErrors({ ...errors, name: '' });
                }
              }}
              placeholder="Enter faction name"
              placeholderTextColor={themeColors.text.muted}
              maxLength={50}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textArea]}
              value={formData.description}
              onChangeText={text =>
                setFormData({ ...formData, description: text })
              }
              placeholder="Enter faction description, goals, or background"
              placeholderTextColor={themeColors.text.muted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.characterCount}>
              {formData.description.length}/500 characters
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Images</Text>
            {formData.imageUris && formData.imageUris.length > 0 ? (
              <View style={styles.imageGrid}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {formData.imageUris.map((uri, index) => (
                    <View key={index} style={styles.imageContainer}>
                      <Image source={{ uri }} style={styles.imagePreview} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      >
                        <Text style={styles.removeImageText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : null}
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <Text style={styles.addImageButtonText}>+ Add Image</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.submitButton,
            isSubmitting && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Creating...' : 'Create Faction'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.primary,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...commonStyles.text.h1,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    ...commonStyles.text.label,
    marginBottom: 8,
  },
  required: {
    color: themeColors.accent.danger,
  },
  textInput: {
    ...commonStyles.input.base,
    minHeight: 52,
  },
  textArea: {
    ...commonStyles.input.base,
    minHeight: 120,
  },
  inputError: {
    borderColor: themeColors.accent.danger,
  },
  errorText: {
    ...commonStyles.text.danger,
    marginTop: 6,
  },
  characterCount: {
    fontSize: 12,
    color: themeColors.text.muted,
    textAlign: 'right',
    marginTop: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: themeColors.primary,
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  cancelButton: {
    ...commonStyles.button.secondary,
  },
  submitButton: {
    ...commonStyles.button.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.text.primary,
    letterSpacing: 0.2,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.text.primary,
    letterSpacing: 0.2,
  },
  imageGrid: {
    marginBottom: 12,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: themeColors.elevated,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: themeColors.accent.danger,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: themeColors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  addImageButton: {
    ...commonStyles.button.secondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  addImageButtonText: {
    color: themeColors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
