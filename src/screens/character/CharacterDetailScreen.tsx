import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
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
import { loadCharacters, loadLocations } from '@/utils/characterStorage';
import { colors as themeColors } from '@/styles/theme';
import { commonStyles } from '@/styles/commonStyles';

type CharacterDetailRouteProp = RouteProp<
  RootStackParamList,
  'CharacterDetail'
>;
type CharacterDetailNavigationProp = StackNavigationProp<RootStackParamList>;

export const CharacterDetailScreen: React.FC = () => {
  const route = useRoute<CharacterDetailRouteProp>();
  const navigation = useNavigation<CharacterDetailNavigationProp>();
  const { character } = route.params;
  const [allCharacters, setAllCharacters] = useState<GameCharacter[]>([]);
  const [locations, setLocations] = useState<GameLocation[]>([]);

  const loadAllCharacters = useCallback(async () => {
    try {
      const characters = await loadCharacters();
      const locs = await loadLocations();
      setAllCharacters(characters);
      setLocations(locs);

      // Update the current character with the latest data
      const updatedCurrentChar = characters.find(
        char => char.id === character.id
      );
      if (
        updatedCurrentChar &&
        JSON.stringify(updatedCurrentChar) !== JSON.stringify(character)
      ) {
        // Update the route params with the fresh character data
        navigation.setParams({ character: updatedCurrentChar });
      }
    } catch (error) {
      console.error('Failed to load characters:', error);
    }
  }, [character, navigation]);

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
      navigation.push('CharacterDetail', { character: targetCharacter });
    }
  };

  const derivedStats = calculateDerivedStats(character);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() =>
            navigation.navigate('CharacterForm', {
              character,
            })
          }
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, character]);

  const renderTagScores = () => {
    const tagScores = derivedStats.tagScores;
    if (!tagScores || tagScores.size === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tag Scores</Text>
        <View style={styles.tagScoresContainer}>
          {Array.from(tagScores.entries()).map(([tag, score]) => (
            <View key={tag} style={styles.tagScoreItem}>
              <Text style={styles.tagName}>{tag}</Text>
              <Text style={styles.tagScore}>{score}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderPerks = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Perks</Text>
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
    </View>
  );

  const renderDistinctions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Distinctions</Text>
      {AVAILABLE_DISTINCTIONS.filter(distinction =>
        character.distinctionIds.includes(distinction.id)
      ).map(distinction => (
        <View key={distinction.id} style={styles.itemContainer}>
          <Text style={styles.titleText}>{distinction.name}</Text>
          <Text style={styles.descriptionText}>{distinction.description}</Text>
        </View>
      ))}
    </View>
  );

  const renderFactions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Factions</Text>
      {character.factions.map((faction, index) => (
        <View key={index} style={styles.itemContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.titleText}>{faction.name}</Text>
            <Text style={styles.standingText}>{faction.standing}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderRelationships = () => {
    if (!character.relationships || character.relationships.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Relationships</Text>
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
      </View>
    );
  };

  const renderCyberware = () => {
    if (!character.cyberware || character.cyberware.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cyberware</Text>
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
      </View>
    );
  };

  return (
    <View style={{ height: 882, overflow: 'scroll' }}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.header}>
          {((character.imageUris && character.imageUris.length > 0) || character.imageUri) && (
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
                  <Image
                    source={{ uri }}
                    style={styles.characterImage}
                  />
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{character.notes}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: commonStyles.layout.scrollView,
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
  contentContainer: commonStyles.layout.contentContainer,
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
  section: commonStyles.layout.section,
  sectionTitle: commonStyles.text.h2,
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
  editButton: commonStyles.headerButton.edit,
  editButtonText: commonStyles.headerButton.text,
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
