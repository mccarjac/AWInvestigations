import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import {
  RouteProp,
  useRoute,
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import {
  AVAILABLE_PERKS,
  AVAILABLE_DISTINCTIONS,
  AVAILABLE_RECIPES,
} from '@models/gameData';
import { calculateDerivedStats } from '@/utils/derivedStats';
import { GameCharacter, GameLocation } from '@/models/types';
import {
  loadCharacters,
  loadLocations,
  deleteCharacter,
} from '@/utils/characterStorage';
import { colors as themeColors } from '@/styles/theme';
import { commonStyles } from '@/styles/commonStyles';
import { BaseDetailScreen, Section } from '@/components';

type CharacterDetailRouteProp = RouteProp<
  RootStackParamList,
  'CharacterDetail'
>;
type CharacterDetailNavigationProp = StackNavigationProp<RootStackParamList>;

export const CharacterDetailScreen: React.FC = () => {
  // eslint-disable-next-line no-console
  console.log('[CharacterDetail] Component rendering...');

  const route = useRoute<CharacterDetailRouteProp>();
  const navigation = useNavigation<CharacterDetailNavigationProp>();
  const { character } = route.params || {};
  const [allCharacters, setAllCharacters] = useState<GameCharacter[]>([]);
  const [locations, setLocations] = useState<GameLocation[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isValidating, setIsValidating] = useState(true);

  // Guard against missing character param
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[CharacterDetail] Validating character param...');

    if (!character) {
      // eslint-disable-next-line no-console
      console.error('[CharacterDetail] Character param is missing!');
      Alert.alert('Error', 'Character data is missing. Please try again.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      return;
    }

    // Validate character has required properties to prevent crashes
    if (!character.id || !character.name) {
      // eslint-disable-next-line no-console
      console.error(
        '[CharacterDetail] Character missing required properties:',
        character
      );
      Alert.alert('Error', 'Character data is corrupted. Please try again.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      return;
    }

    // eslint-disable-next-line no-console
    console.log(
      `[CharacterDetail] Character validated: ${character.name} (${character.id})`
    );
    setIsValidating(false);
  }, [character, navigation]);

  const loadAllCharacters = useCallback(async () => {
    try {
      // eslint-disable-next-line no-console
      console.log('[CharacterDetail] Loading characters and locations...');
      const characters = await loadCharacters();
      // eslint-disable-next-line no-console
      console.log(`[CharacterDetail] Loaded ${characters.length} characters`);

      const locs = await loadLocations();
      // eslint-disable-next-line no-console
      console.log(`[CharacterDetail] Loaded ${locs.length} locations`);

      setAllCharacters(characters);
      setLocations(locs);

      // Update the current character with the latest data
      // Note: We don't update navigation params here to avoid infinite loop
      // The character object is already in state via allCharacters
      // eslint-disable-next-line no-console
      console.log('[CharacterDetail] Data load complete');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[CharacterDetail] Failed to load characters:', error);
      Alert.alert('Error', 'Failed to load character data. Please try again.', [
        { text: 'OK' },
      ]);
    }
  }, []);

  // Refresh character data when screen comes back into focus
  useFocusEffect(
    React.useCallback(() => {
      loadAllCharacters();
    }, [loadAllCharacters])
  );

  const findCharacterByName = (name: string): GameCharacter | undefined => {
    return allCharacters.find(char => char.name === name);
  };

  const getLocationName = (locationId: string | undefined): string => {
    if (!locationId) return 'Unknown';
    const location = locations.find(l => l.id === locationId);
    return location ? location.name : 'Unknown';
  };

  const handleRelationshipPress = (characterName: string) => {
    const targetCharacter = findCharacterByName(characterName);
    if (targetCharacter) {
      // eslint-disable-next-line no-console
      console.log(`[CharacterDetail] Navigating to: ${targetCharacter.name}`);
      navigation.push('CharacterDetail', { character: targetCharacter });
    }
  };

  const handleEdit = useCallback(() => {
    if (!character) return;
    // eslint-disable-next-line no-console
    console.log('[CharacterDetail] Opening edit form');
    navigation.navigate('CharacterForm', { character });
  }, [navigation, character]);

  // Safety check before rendering - prevent crashes if character is invalid
  if (!character || !character.id || !character.name) {
    // eslint-disable-next-line no-console
    console.warn('[CharacterDetail] Invalid character, returning early');
    return null;
  }

  // eslint-disable-next-line no-console
  console.log(`[CharacterDetail] Rendering character: ${character.name}`);

  // Calculate derived stats with error handling
  let derivedStats;
  try {
    derivedStats = calculateDerivedStats(character);
    // eslint-disable-next-line no-console
    console.log('[CharacterDetail] Derived stats calculated successfully');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[CharacterDetail] Error calculating derived stats:', error);
    // Return a safe minimal render instead of crashing
    derivedStats = {
      maxHealth: 0,
      maxLimit: 0,
      tagScores: new Map(),
    };
  }

  const renderTagScores = () => {
    const tagScores = derivedStats.tagScores;
    if (!tagScores || tagScores.size === 0) return null;

    return (
      <Section title="Tag Scores">
        <View style={styles.tagScoresContainer}>
          {Array.from(tagScores.entries()).map(([tag, score]) => (
            <View key={tag} style={styles.tagScoreItem}>
              <Text style={styles.tagName}>{tag}</Text>
              <Text style={styles.tagScore}>{score}</Text>
            </View>
          ))}
        </View>
      </Section>
    );
  };

  const renderPerks = () => (
    <Section title="Perks">
      {AVAILABLE_PERKS.filter(perk => character.perkIds.includes(perk.id)).map(
        perk => (
          <View key={perk.id} style={styles.itemContainer}>
            <Text style={styles.titleText}>{perk.name}</Text>
            <Text style={styles.descriptionText}>{perk.description}</Text>
            {perk.recipeIds && perk.recipeIds.length > 0 && (
              <View style={styles.recipesContainer}>
                <Text style={styles.recipesTitle}>Known Recipes:</Text>
                {perk.recipeIds.map(recipeId => {
                  const recipe = AVAILABLE_RECIPES.find(r => r.id === recipeId);
                  if (!recipe) return null;
                  return (
                    <View key={recipe.id} style={styles.recipeItem}>
                      <View style={styles.recipeHeader}>
                        <Text style={styles.recipeName}>{recipe.name}</Text>
                      </View>
                      <Text style={styles.recipeDescription}>
                        {recipe.description}
                      </Text>
                      <Text style={styles.materialsTitle}>
                        Materials Needed:
                      </Text>
                      {recipe.materials.map((material, index) => (
                        <Text key={index} style={styles.materialItem}>
                          • {material}
                        </Text>
                      ))}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )
      )}
    </Section>
  );

  const renderDistinctions = () => (
    <Section title="Distinctions">
      {AVAILABLE_DISTINCTIONS.filter(distinction =>
        character.distinctionIds.includes(distinction.id)
      ).map(distinction => (
        <View key={distinction.id} style={styles.itemContainer}>
          <Text style={styles.titleText}>{distinction.name}</Text>
          <Text style={styles.descriptionText}>{distinction.description}</Text>
        </View>
      ))}
    </Section>
  );

  const renderFactions = () => (
    <Section title="Factions">
      {character.factions.map((faction, index) => (
        <View key={index} style={styles.itemContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.titleText}>{faction.name}</Text>
            <Text style={styles.standingText}>{faction.standing}</Text>
          </View>
        </View>
      ))}
    </Section>
  );

  const renderRelationships = () => {
    if (!character.relationships || character.relationships.length === 0) {
      return null;
    }

    return (
      <Section title="Relationships">
        {character.relationships.map((relationship, index) => {
          const targetCharacter = findCharacterByName(
            relationship.characterName
          );
          const isClickable = !!targetCharacter;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.itemContainer,
                isClickable && styles.clickableRelationship,
              ]}
              onPress={() =>
                isClickable &&
                handleRelationshipPress(relationship.characterName)
              }
              disabled={!isClickable}
              activeOpacity={isClickable ? 0.7 : 1}
            >
              <View style={styles.headerContainer}>
                <View style={styles.relationshipNameContainer}>
                  <Text
                    style={[
                      styles.titleText,
                      isClickable && styles.clickableText,
                    ]}
                  >
                    {relationship.characterName}
                  </Text>
                  {!isClickable && (
                    <Text style={styles.unavailableText}> (Not found)</Text>
                  )}
                </View>
                <Text style={styles.relationshipTypeText}>
                  {relationship.relationshipType}
                </Text>
              </View>
              {relationship.description && (
                <Text style={styles.descriptionText}>
                  {relationship.description}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </Section>
    );
  };

  const renderCyberware = () => {
    if (!character.cyberware || character.cyberware.length === 0) {
      return null;
    }

    return (
      <Section title="Cyberware">
        {character.cyberware.map((cyber, index) => (
          <View key={index} style={styles.itemContainer}>
            <Text style={styles.titleText}>{cyber.name}</Text>
            <Text style={styles.descriptionText}>{cyber.description}</Text>
            {cyber.statModifiers && (
              <View style={styles.cyberwareModifiersContainer}>
                <Text style={styles.cyberwareModifiersTitle}>
                  Stat Modifiers:
                </Text>
                {cyber.statModifiers.healthModifier !== undefined && (
                  <Text style={styles.cyberwareModifier}>
                    • Health:{' '}
                    {cyber.statModifiers.healthModifier > 0 ? '+' : ''}
                    {cyber.statModifiers.healthModifier}
                  </Text>
                )}
                {cyber.statModifiers.limitModifier !== undefined && (
                  <Text style={styles.cyberwareModifier}>
                    • Limit: {cyber.statModifiers.limitModifier > 0 ? '+' : ''}
                    {cyber.statModifiers.limitModifier}
                  </Text>
                )}
                {cyber.statModifiers.healthCapModifier !== undefined && (
                  <Text style={styles.cyberwareModifier}>
                    • Health Cap:{' '}
                    {cyber.statModifiers.healthCapModifier > 0 ? '+' : ''}
                    {cyber.statModifiers.healthCapModifier}
                  </Text>
                )}
                {cyber.statModifiers.limitCapModifier !== undefined && (
                  <Text style={styles.cyberwareModifier}>
                    • Limit Cap:{' '}
                    {cyber.statModifiers.limitCapModifier > 0 ? '+' : ''}
                    {cyber.statModifiers.limitCapModifier}
                  </Text>
                )}
                {cyber.statModifiers.tagModifiers &&
                  Object.entries(cyber.statModifiers.tagModifiers).map(
                    ([tag, modifier]) => (
                      <Text key={tag} style={styles.cyberwareModifier}>
                        • {tag} Tag Score: {modifier > 0 ? '+' : ''}
                        {modifier}
                      </Text>
                    )
                  )}
              </View>
            )}
          </View>
        ))}
      </Section>
    );
  };

  return (
    <BaseDetailScreen
      onEditPress={handleEdit}
      deleteConfig={{
        itemName: character.name,
        onDelete: async () => {
          try {
            // eslint-disable-next-line no-console
            console.log(
              `[CharacterDetail] Deleting character: ${character.id}`
            );
            await deleteCharacter(character.id);
            // eslint-disable-next-line no-console
            console.log('[CharacterDetail] Delete successful');
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('[CharacterDetail] Delete failed:', error);
            throw error;
          }
        },
      }}
    >
      <View style={styles.header}>
        {((character.imageUris && character.imageUris.length > 0) ||
          character.imageUri) && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imageGallery}
            contentContainerStyle={styles.imageGalleryContent}
          >
            {(character.imageUris && character.imageUris.length > 0
              ? character.imageUris
              : character.imageUri
                ? [character.imageUri]
                : []
            ).map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.characterImage} />
              </View>
            ))}
          </ScrollView>
        )}
        <Text style={styles.name}>{character.name}</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.subheader}>
            Species: {character.species} / Location:{' '}
            {getLocationName(character.locationId)}
          </Text>
          {character.occupation && (
            <Text style={styles.subheader}>
              Occupation: {character.occupation}
            </Text>
          )}
          {character.retired && (
            <View style={styles.retiredBadge}>
              <Text style={styles.retiredText}>RETIRED</Text>
            </View>
          )}
          <View style={styles.statsContainer}>
            <Text style={styles.statItem}>
              Max Health:{' '}
              <Text style={styles.statValue}>{derivedStats.maxHealth}</Text>
            </Text>
            <Text style={styles.statItem}>
              Max Limit:{' '}
              <Text style={styles.statValue}>{derivedStats.maxLimit}</Text>
            </Text>
          </View>
        </View>
      </View>
      {renderTagScores()}
      {renderPerks()}
      {renderDistinctions()}
      {renderCyberware()}
      {renderFactions()}
      {renderRelationships()}
      {character.notes && (
        <Section title="Notes">
          <Text style={styles.notes}>{character.notes}</Text>
        </Section>
      )}
    </BaseDetailScreen>
  );
};

const styles = StyleSheet.create({
  imageGallery: {
    marginBottom: 16,
  },
  imageGalleryContent: {
    gap: 12,
  },
  imageContainer: {
    width: 200,
    height: 200,
    marginRight: 12,
  },
  characterImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: themeColors.surface,
  },
  recipesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: themeColors.border,
  },
  recipesTitle: {
    ...commonStyles.text.h3,
    marginBottom: 12,
    color: themeColors.accent.primary,
  },
  recipeItem: {
    backgroundColor: themeColors.elevated,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recipeName: {
    ...commonStyles.text.body,
    fontWeight: '600',
  },
  recipeDescription: {
    ...commonStyles.text.description,
    marginBottom: 12,
    lineHeight: 20,
  },
  materialsTitle: {
    ...commonStyles.text.label,
    fontSize: 14,
    marginBottom: 8,
  },
  materialItem: {
    ...commonStyles.text.body,
    marginLeft: 12,
    marginBottom: 4,
  },
  header: {
    padding: 20,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 2,
    borderBottomColor: themeColors.border,
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  headerInfo: {
    gap: 8,
  },
  tagScoresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  tagScoreItem: {
    ...commonStyles.badge.base,
    ...commonStyles.badge.tag,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagName: {
    ...commonStyles.badge.text,
    color: themeColors.accent.primary,
  },
  tagScore: {
    ...commonStyles.badge.text,
    fontWeight: '700',
    color: themeColors.accent.primary,
    marginLeft: 6,
  },
  name: {
    ...commonStyles.text.h1,
    fontSize: 26,
  },
  subheader: {
    ...commonStyles.text.body,
    marginTop: 6,
    fontWeight: '500',
  },
  itemContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
    backgroundColor: themeColors.elevated,
    padding: 12,
    borderRadius: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleText: {
    ...commonStyles.text.body,
    fontWeight: '600',
  },
  descriptionText: {
    ...commonStyles.text.description,
    marginTop: 6,
    lineHeight: 20,
  },
  standingText: {
    fontSize: 14,
    color: themeColors.accent.primary,
    fontWeight: '600',
  },
  relationshipTypeText: {
    fontSize: 14,
    color: themeColors.status.info,
    fontWeight: '600',
  },
  clickableRelationship: {
    borderWidth: 2,
    borderColor: themeColors.accent.primary,
    backgroundColor: themeColors.interactive.hover,
  },
  relationshipNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clickableText: {
    color: themeColors.accent.primary,
    textDecorationLine: 'underline',
  },
  unavailableText: {
    fontSize: 12,
    color: themeColors.status.warning,
    fontStyle: 'italic',
  },

  notes: {
    ...commonStyles.text.description,
    lineHeight: 22,
  },
  statsContainer: commonStyles.status.container,
  statItem: commonStyles.status.item,
  statValue: commonStyles.status.value,
  retiredBadge: {
    ...commonStyles.badge.base,
    ...commonStyles.badge.retired,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  retiredText: {
    ...commonStyles.badge.textDark,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  cyberwareModifiersContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
  },
  cyberwareModifiersTitle: {
    ...commonStyles.text.label,
    fontSize: 14,
    marginBottom: 8,
    color: themeColors.accent.primary,
  },
  cyberwareModifier: {
    ...commonStyles.text.body,
    fontSize: 14,
    marginLeft: 8,
    marginBottom: 4,
    color: themeColors.text.secondary,
  },
});
