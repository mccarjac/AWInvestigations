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
import { createLocation, updateLocation } from '@utils/characterStorage';
import { colors as themeColors } from '@/styles/theme';
import { commonStyles } from '@/styles/commonStyles';

type LocationFormNavigationProp = StackNavigationProp<
  RootStackParamList,
  'LocationForm'
>;

type LocationFormRouteProp = RouteProp<RootStackParamList, 'LocationForm'>;

interface LocationFormData {
  name: string;
  description: string;
  imageUri?: string;
}

export const LocationFormScreen: React.FC = () => {
  const navigation = useNavigation<LocationFormNavigationProp>();
  const route = useRoute<LocationFormRouteProp>();
  const { location } = route.params || {};

  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    description: '',
    imageUri: undefined,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing location data if editing
  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        description: location.description,
        imageUri: location.imageUri,
      });
    }
  }, [location]);

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Location name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Location name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (location) {
        // Update existing location
        const updated = await updateLocation(location.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          imageUri: formData.imageUri,
        });

        if (updated) {
          Alert.alert('Success', 'Location updated successfully!', [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]);
        } else {
          Alert.alert('Error', 'Failed to update location.', [{ text: 'OK' }]);
        }
      } else {
        // Create new location
        const newLocation = await createLocation({
          name: formData.name.trim(),
          description: formData.description.trim(),
          imageUri: formData.imageUri,
        });

        if (newLocation) {
          Alert.alert('Success', 'Location created successfully!', [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]);
        } else {
          Alert.alert(
            'Error',
            'A location with this name already exists. Please choose a different name.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch {
      Alert.alert(
        'Error',
        `Failed to ${location ? 'update' : 'create'} location. Please try again.`,
        [{ text: 'OK' }]
      );
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
          <Text style={styles.sectionTitle}>
            {location ? 'Edit Location' : 'Location Information'}
          </Text>

          {/* Image Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location Image</Text>
            {formData.imageUri ? (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: formData.imageUri }}
                  style={styles.locationImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={removeImage}
                >
                  <Text style={styles.removeImageButtonText}>Remove Image</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={pickImage}
              >
                <Text style={styles.imagePickerIcon}>📷</Text>
                <Text style={styles.imagePickerText}>Add Location Image</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Location Name <Text style={styles.required}>*</Text>
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
              placeholder="Enter location name"
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
              placeholder="Enter location description"
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
            {isSubmitting
              ? location
                ? 'Updating...'
                : 'Creating...'
              : location
                ? 'Update Location'
                : 'Create Location'}
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
  imageContainer: {
    alignItems: 'center',
    gap: 12,
  },
  locationImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: themeColors.surface,
  },
  imagePickerButton: {
    backgroundColor: themeColors.surface,
    borderWidth: 2,
    borderColor: themeColors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePickerIcon: {
    fontSize: 48,
  },
  imagePickerText: {
    ...commonStyles.text.body,
    color: themeColors.text.secondary,
  },
  removeImageButton: {
    backgroundColor: themeColors.accent.danger,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
  },
  removeImageButtonText: {
    ...commonStyles.text.body,
    color: themeColors.text.primary,
    fontWeight: '600',
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
});
