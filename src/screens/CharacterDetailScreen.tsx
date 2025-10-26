import React, { useLayoutEffect, useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { RouteProp, useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import { AVAILABLE_PERKS, AVAILABLE_DISTINCTIONS, AVAILABLE_RECIPES, PerkTag } from '@models/gameData';
import { calculateDerivedStats } from '@/utils/derivedStats';
import { MUTANT_SPECIES, Relationship, RelationshipType, GameCharacter } from '@/models/types';
import { loadCharacters } from '@/utils/characterStorage';

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

type CharacterDetailRouteProp = RouteProp<RootStackParamList, 'CharacterDetail'>;
type CharacterDetailNavigationProp = StackNavigationProp<RootStackParamList>;

export const CharacterDetailScreen: React.FC = () => {
  const route = useRoute<CharacterDetailRouteProp>();
  const navigation = useNavigation<CharacterDetailNavigationProp>();
  const { character } = route.params;
  const [allCharacters, setAllCharacters] = useState<GameCharacter[]>([]);

  const loadAllCharacters = async () => {
    try {
      const characters = await loadCharacters();
      setAllCharacters(characters);
      
      // Update the current character with the latest data
      const updatedCurrentChar = characters.find(char => char.id === character.id);
      if (updatedCurrentChar && JSON.stringify(updatedCurrentChar) !== JSON.stringify(character)) {
        // Update the route params with the fresh character data
        navigation.setParams({ character: updatedCurrentChar });
      }
    } catch (error) {
      console.error('Failed to load characters:', error);
    }
  };

  useEffect(() => {
    loadAllCharacters();
  }, []);

  // Refresh character data when screen comes back into focus
  useFocusEffect(
    React.useCallback(() => {
      loadAllCharacters();
    }, [character.id])
  );

  const findCharacterByName = (name: string): GameCharacter | undefined => {
    return allCharacters.find(char => char.name === name);
  };

  const handleRelationshipPress = (characterName: string) => {
    const targetCharacter = findCharacterByName(characterName);
    if (targetCharacter) {
      navigation.push('CharacterDetail', { character: targetCharacter });
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('CharacterForm', { 
            character,
            onSubmit: (updatedCharacter) => {
              // Update the current screen's params instead of pushing a new screen
              navigation.setParams({ character: updatedCharacter });
            }
          })}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, character]);

  const calculateTagScores = () => {
    const scores = new Map<PerkTag, number>();
    const characterPerks = AVAILABLE_PERKS.filter(perk => character.perkIds.includes(perk.id));
    
    characterPerks.forEach(perk => {
       if (character.species === 'Perfect Mutant' && 
              perk.allowedSpecies && 
              MUTANT_SPECIES.every(species => perk.allowedSpecies!.includes(species))) {
                console.log("Skipping perk for tag score calculation");
            return; // Skip this perk for tag score calculation
          }

      const currentScore = scores.get(perk.tag) || 0;
      scores.set(perk.tag, currentScore + 1);
    });

    return Array.from(scores.entries())
      .filter(([_, score]) => score > 0)
      .sort((a, b) => b[1] - a[1]); // Sort by score descending
  };

  const renderTagScores = () => {
    const tagScores = calculateTagScores();
    if (tagScores.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tag Scores</Text>
        <View style={styles.tagScoresContainer}>
          {tagScores.map(([tag, score]) => (
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
      {AVAILABLE_PERKS
        .filter(perk => character.perkIds.includes(perk.id))
        .map(perk => (
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
                      <Text style={styles.recipeDescription}>{recipe.description}</Text>
                      <Text style={styles.materialsTitle}>Materials Needed:</Text>
                      {recipe.materials.map((material, index) => (
                        <Text key={index} style={styles.materialItem}>• {material}</Text>
                      ))}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ))}
    </View>
  );

  const renderDistinctions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Distinctions</Text>
      {AVAILABLE_DISTINCTIONS
        .filter(distinction => character.distinctionIds.includes(distinction.id))
        .map(distinction => (
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
          const targetCharacter = findCharacterByName(relationship.characterName);
          const isClickable = !!targetCharacter;
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.itemContainer,
                isClickable && styles.clickableRelationship
              ]}
              onPress={() => isClickable && handleRelationshipPress(relationship.characterName)}
              disabled={!isClickable}
              activeOpacity={isClickable ? 0.7 : 1}
            >
              <View style={styles.headerContainer}>
                <View style={styles.relationshipNameContainer}>
                  <Text style={[
                    styles.titleText,
                    isClickable && styles.clickableText
                  ]}>
                    {relationship.characterName}
                  </Text>
                  {!isClickable && (
                    <Text style={styles.unavailableText}> (Not found)</Text>
                  )}
                </View>
                <Text style={styles.relationshipTypeText}>{relationship.relationshipType}</Text>
              </View>
              {relationship.description && (
                <Text style={styles.descriptionText}>{relationship.description}</Text>
              )}
            </TouchableOpacity>
          );
        })}
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
        {character.imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: character.imageUri }} style={styles.characterImage} />
          </View>
        )}
        <Text style={styles.name}>{character.name}</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.subheader}>
            Species: {character.species} / Location: {character.location}
          </Text>
          <View style={styles.statsContainer}>
            {(() => {
              const { maxHealth, maxLimit } = calculateDerivedStats(character);
              return (
                <>
                  <Text style={styles.statItem}>
                    Max Health: <Text style={styles.statValue}>{maxHealth}</Text>
                  </Text>
                  <Text style={styles.statItem}>
                    Max Limit: <Text style={styles.statValue}>{maxLimit}</Text>
                  </Text>
                </>
              );
            })()}
          </View>
        </View>
      </View>
      {renderTagScores()}
      {renderPerks()}
      {renderDistinctions()}
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
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollView: {
    backgroundColor: colors.primary,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  characterImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: colors.border,
  },
  recipesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: colors.border,
  },
  recipesTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: colors.accent.primary,
    letterSpacing: 0.3,
  },
  recipeItem: {
    backgroundColor: colors.elevated,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  recipeDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  materialsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: colors.text.primary,
  },
  materialItem: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 12,
    marginBottom: 4,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    padding: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
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
    backgroundColor: colors.accent.secondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent.primary,
  },
  tagName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.primary,
  },
  tagScore: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent.primary,
    marginLeft: 6,
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  subheader: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 6,
    fontWeight: '500',
  },
  section: {
    backgroundColor: colors.surface,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: colors.text.primary,
    letterSpacing: 0.3,
  },
  itemContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.elevated,
    padding: 12,
    borderRadius: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 6,
    lineHeight: 20,
  },
  standingText: {
    fontSize: 14,
    color: colors.accent.primary,
    fontWeight: '600',
  },
  relationshipTypeText: {
    fontSize: 14,
    color: colors.status.info,
    fontWeight: '600',
  },
  clickableRelationship: {
    borderWidth: 2,
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.secondary,
  },
  relationshipNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clickableText: {
    color: colors.accent.primary,
    textDecorationLine: 'underline',
  },
  unavailableText: {
    fontSize: 12,
    color: colors.status.warning,
    fontStyle: 'italic',
  },
  tapHintText: {
    fontSize: 12,
    color: colors.accent.primary,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'right',
  },
  notes: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text.secondary,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: colors.accent.primary,
    borderRadius: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    backgroundColor: colors.accent.secondary,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent.primary,
  },
  statItem: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
    fontWeight: '500',
  },
  statValue: {
    fontWeight: '700',
    color: colors.accent.primary,
  },
});