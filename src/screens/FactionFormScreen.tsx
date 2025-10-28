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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import { RelationshipStanding } from '@models/types';
import { createFaction } from '@utils/characterStorage';

type FactionFormNavigationProp = StackNavigationProp<RootStackParamList, 'FactionForm'>;

interface FactionFormData {
  name: string;
  description: string;
  defaultStanding: RelationshipStanding;
}

export const FactionFormScreen: React.FC = () => {
  const navigation = useNavigation<FactionFormNavigationProp>();
  
  const [formData, setFormData] = useState<FactionFormData>({
    name: '',
    description: '',
    defaultStanding: RelationshipStanding.Neutral,
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

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const success = await createFaction({
        name: formData.name.trim(),
        description: formData.description.trim(),
        defaultStanding: formData.defaultStanding,
      });

      if (success) {
        Alert.alert(
          'Success',
          'Faction created successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert(
          'Error',
          'A faction with this name already exists. Please choose a different name.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to create faction. Please try again.',
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

  const renderStandingOption = (standing: RelationshipStanding, label: string) => (
    <TouchableOpacity
      key={standing}
      style={[
        styles.standingOption,
        formData.defaultStanding === standing && styles.standingOptionSelected,
      ]}
      onPress={() => setFormData({ ...formData, defaultStanding: standing })}
    >
      <View style={[styles.standingIndicator, getStandingStyle(standing)]} />
      <Text
        style={[
          styles.standingOptionText,
          formData.defaultStanding === standing && styles.standingOptionTextSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const getStandingStyle = (standing: RelationshipStanding) => {
    switch (standing) {
      case RelationshipStanding.Ally:
        return styles.standingAllied;
      case RelationshipStanding.Friend:
        return styles.standingFriendly;
      case RelationshipStanding.Neutral:
        return styles.standingNeutral;
      case RelationshipStanding.Hostile:
        return styles.standingHostile;
      case RelationshipStanding.Enemy:
        return styles.standingEnemy;
      default:
        return styles.standingNeutral;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Faction Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Faction Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textInput, errors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(text) => {
                setFormData({ ...formData, name: text });
                if (errors.name) {
                  setErrors({ ...errors, name: '' });
                }
              }}
              placeholder="Enter faction name"
              placeholderTextColor={colors.text.muted}
              maxLength={50}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Enter faction description, goals, or background"
              placeholderTextColor={colors.text.muted}
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
            <Text style={styles.inputLabel}>Default Standing</Text>
            <Text style={styles.inputDescription}>
              Choose the default relationship standing for new members
            </Text>
            <View style={styles.standingOptions}>
              {renderStandingOption(RelationshipStanding.Ally, 'Allied')}
              {renderStandingOption(RelationshipStanding.Friend, 'Friendly')}
              {renderStandingOption(RelationshipStanding.Neutral, 'Neutral')}
              {renderStandingOption(RelationshipStanding.Hostile, 'Hostile')}
              {renderStandingOption(RelationshipStanding.Enemy, 'Enemy')}
            </View>
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
          style={[styles.button, styles.submitButton, isSubmitting && styles.buttonDisabled]}
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

// Modern Dark Color Palette
const colors = {
  // Background colors
  primary: '#0F0F23',
  secondary: '#1B1B3A',
  surface: '#262647',
  elevated: '#2D2D54',

  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#B8B8CC',
    muted: '#8E8EA0',
  },

  // Accent colors
  accent: {
    primary: '#6366F1',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
  },

  // Standing colors
  standing: {
    allied: '#10B981',
    friendly: '#3B82F6',
    neutral: '#6B7280',
    hostile: '#F59E0B',
    enemy: '#EF4444',
  },

  // Border and shadow
  border: '#3F3F65',
  borderError: '#EF4444',
  shadow: '#000000',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
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
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  required: {
    color: colors.accent.danger,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text.primary,
    minHeight: 52,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text.primary,
    minHeight: 120,
  },
  inputError: {
    borderColor: colors.borderError,
  },
  errorText: {
    fontSize: 14,
    color: colors.accent.danger,
    marginTop: 6,
  },
  characterCount: {
    fontSize: 12,
    color: colors.text.muted,
    textAlign: 'right',
    marginTop: 6,
  },
  standingOptions: {
    gap: 12,
  },
  standingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
  },
  standingOptionSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.elevated,
  },
  standingIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  standingOptionText: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  standingOptionTextSelected: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  standingAllied: {
    backgroundColor: colors.standing.allied,
  },
  standingFriendly: {
    backgroundColor: colors.standing.friendly,
  },
  standingNeutral: {
    backgroundColor: colors.standing.neutral,
  },
  standingHostile: {
    backgroundColor: colors.standing.hostile,
  },
  standingEnemy: {
    backgroundColor: colors.standing.enemy,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: colors.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.accent.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: 0.2,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: 0.2,
  },
});