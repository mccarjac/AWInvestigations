import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Text,
} from 'react-native';
import { GameCharacter, GameLocation } from '@models/types';
import {
  loadCharacters,
  getLocation,
  updateLocation,
} from '@utils/characterStorage';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
  RouteProp,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import { colors as themeColors } from '@/styles/theme';
import { commonStyles } from '@/styles/commonStyles';

type LocationDetailsRouteProp = RouteProp<
  RootStackParamList,
  'LocationDetails'
>;
type LocationDetailsNavigationProp = StackNavigationProp<RootStackParamList>;

export const LocationDetailsScreen: React.FC = () => {
  const route = useRoute<LocationDetailsRouteProp>();
  const navigation = useNavigation<LocationDetailsNavigationProp>();
  const { locationId } = route.params;

  const [location, setLocation] = useState<GameLocation | null>(null);
  const [characters, setCharacters] = useState<GameCharacter[]>([]);
  const [editingDescription, setEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState<string>('');

  const loadData = useCallback(async () => {
    const locationData = await getLocation(locationId);
    if (!locationData) {
      Alert.alert('Error', 'Location not found', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
      return;
    }

    setLocation(locationData);

    const allCharacters = await loadCharacters();
    const locationCharacters = allCharacters.filter(
      c => c.locationId === locationId
    );
    setCharacters(
      locationCharacters.sort((a, b) => a.name.localeCompare(b.name))
    );
  }, [locationId, navigation]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleEditDescription = () => {
    setTempDescription(location?.description || '');
    setEditingDescription(true);
  };

  const handleSaveDescription = async () => {
    if (!location) return;

    try {
      const updated = await updateLocation(location.id, {
        description: tempDescription,
      });

      if (updated) {
        setLocation(updated);
        setEditingDescription(false);
      }
    } catch (error) {
      console.error('Failed to update location description:', error);
      Alert.alert(
        'Error',
        'Failed to save location description. Please try again.'
      );
    }
  };

  const handleCancelEditDescription = () => {
    setTempDescription('');
    setEditingDescription(false);
  };

  const getStats = () => {
    const totalCharacters = characters.length;
    const presentCharacters = characters.filter(c => c.present === true).length;
    const absentCharacters = totalCharacters - presentCharacters;

    return { totalCharacters, presentCharacters, absentCharacters };
  };

  const renderCharacter = (character: GameCharacter) => (
    <TouchableOpacity
      key={character.id}
      style={[
        styles.characterCard,
        character.present && styles.characterCardPresent,
      ]}
      onPress={() => navigation.navigate('CharacterDetail', { character })}
    >
      <View style={styles.characterInfo}>
        <Text style={styles.characterName}>{character.name}</Text>
        <Text style={styles.characterSpecies}>{character.species}</Text>
      </View>
      <View
        style={[
          styles.presentBadge,
          character.present && styles.presentBadgeActive,
        ]}
      >
        <Text
          style={[
            styles.presentBadgeText,
            character.present && styles.presentBadgeTextActive,
          ]}
        >
          {character.present ? 'Present' : 'Absent'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!location) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const stats = getStats();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {/* Location Header */}
        <View style={styles.locationHeader}>
          <Text style={styles.locationName}>{location.name}</Text>

          <View style={styles.descriptionSection}>
            <View style={styles.descriptionHeader}>
              <Text style={styles.descriptionLabel}>Description</Text>
              {!editingDescription && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={handleEditDescription}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            {editingDescription ? (
              <View style={styles.descriptionEditContainer}>
                <TextInput
                  style={styles.descriptionInput}
                  value={tempDescription}
                  onChangeText={setTempDescription}
                  placeholder="Enter location description..."
                  multiline
                  numberOfLines={4}
                />
                <View style={styles.descriptionActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={handleCancelEditDescription}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={handleSaveDescription}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.descriptionDisplay}>
                <Text style={styles.descriptionText}>
                  {location.description || 'No description provided'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Location Statistics */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalCharacters}</Text>
              <Text style={styles.statLabel}>Total Characters</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.presentCharacters}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.absentCharacters}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
          </View>
        </View>

        {/* Characters Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Characters at this Location ({characters.length})
            </Text>
          </View>

          {characters.length > 0 ? (
            <View style={styles.charactersList}>
              {characters.map(renderCharacter)}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No characters at this location
              </Text>
              <Text style={styles.emptySubText}>
                Assign characters to this location from their detail screens
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.primary,
  },
  scrollView: {
    backgroundColor: themeColors.primary,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingText: {
    ...commonStyles.text.body,
    textAlign: 'center',
    marginTop: 40,
  },
  statsSection: {
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    ...commonStyles.card.base,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: themeColors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: themeColors.text.muted,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    ...commonStyles.text.h2,
  },
  charactersList: {
    gap: 12,
  },
  characterCard: {
    ...commonStyles.card.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  characterCardPresent: {
    borderLeftWidth: 4,
    borderLeftColor: themeColors.status.present,
  },
  characterInfo: {
    flex: 1,
  },
  characterName: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.text.primary,
    marginBottom: 4,
  },
  characterSpecies: {
    fontSize: 14,
    color: themeColors.text.secondary,
  },
  presentBadge: {
    ...commonStyles.badge.base,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  presentBadgeActive: {
    backgroundColor: themeColors.status.present,
    borderColor: themeColors.status.present,
  },
  presentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: themeColors.text.muted,
    letterSpacing: 0.3,
  },
  presentBadgeTextActive: {
    color: themeColors.text.primary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    ...commonStyles.text.h3,
    color: themeColors.text.muted,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    ...commonStyles.text.body,
    color: themeColors.text.muted,
    textAlign: 'center',
  },

  // Location Header Styles
  locationHeader: {
    ...commonStyles.card.base,
    padding: 20,
    marginBottom: 24,
  },
  locationName: {
    ...commonStyles.text.h1,
    textAlign: 'center',
    marginBottom: 16,
  },

  // Description Styles
  descriptionSection: {
    marginTop: 8,
  },
  descriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  descriptionLabel: {
    ...commonStyles.text.label,
  },
  editButton: {
    ...commonStyles.button.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButtonText: {
    color: themeColors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionDisplay: {
    backgroundColor: themeColors.elevated,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: themeColors.border,
    minHeight: 80,
  },
  descriptionText: {
    fontSize: 14,
    color: themeColors.text.primary,
    lineHeight: 20,
  },
  descriptionEditContainer: {
    gap: 12,
  },
  descriptionInput: {
    ...commonStyles.input.base,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  descriptionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: themeColors.accent.primary,
  },
  cancelButton: {
    ...commonStyles.button.secondary,
  },
  saveButtonText: {
    color: themeColors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: themeColors.text.muted,
    fontSize: 14,
    fontWeight: '600',
  },
});
