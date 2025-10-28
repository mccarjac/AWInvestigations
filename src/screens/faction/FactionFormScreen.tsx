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
import { colors as themeColors } from '@/styles/theme';
import { commonStyles } from '@/styles/commonStyles';

type FactionFormNavigationProp = StackNavigationProp<
  RootStackParamList,
  'FactionForm'
>;

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

  const renderStandingOption = (
    standing: RelationshipStanding,
    label: string
  ) => (
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
          formData.defaultStanding === standing &&
            styles.standingOptionTextSelected,
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
  inputDescription: {
    fontSize: 14,
    color: themeColors.text.secondary,
    marginBottom: 12,
    lineHeight: 20,
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
  standingOptions: {
    gap: 12,
  },
  standingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: 12,
    padding: 16,
  },
  standingOptionSelected: {
    borderColor: themeColors.accent.primary,
    backgroundColor: themeColors.elevated,
  },
  standingIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  standingOptionText: {
    fontSize: 16,
    color: themeColors.text.secondary,
    fontWeight: '500',
  },
  standingOptionTextSelected: {
    color: themeColors.text.primary,
    fontWeight: '600',
  },
  standingAllied: {
    backgroundColor: themeColors.standing.allied,
  },
  standingFriendly: {
    backgroundColor: themeColors.standing.friendly,
  },
  standingNeutral: {
    backgroundColor: themeColors.standing.neutral,
  },
  standingHostile: {
    backgroundColor: themeColors.standing.hostile,
  },
  standingEnemy: {
    backgroundColor: themeColors.standing.enemy,
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
