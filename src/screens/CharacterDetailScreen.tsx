import React, { useLayoutEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import { AVAILABLE_PERKS, AVAILABLE_DISTINCTIONS, AVAILABLE_RECIPES, PerkTag } from '@models/gameData';
import { calculateDerivedStats } from '@/utils/derivedStats';

type CharacterDetailRouteProp = RouteProp<RootStackParamList, 'CharacterDetail'>;
type CharacterDetailNavigationProp = StackNavigationProp<RootStackParamList>;

export const CharacterDetailScreen: React.FC = () => {
  const route = useRoute<CharacterDetailRouteProp>();
  const navigation = useNavigation<CharacterDetailNavigationProp>();
  const { character } = route.params;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('CharacterForm', { 
            character,
            onSubmit: (updatedCharacter) => {
              navigation.navigate('CharacterDetail', { character: updatedCharacter });
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
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    backgroundColor: '#f5f5f5',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  characterImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 8,
  },
  recipesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  recipesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2196F3',
  },
  recipeItem: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recipeName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  recipeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  materialsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#666',
  },
  materialItem: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerInfo: {
    gap: 4,
  },
  tagScoresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagScoreItem: {
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1976d2',
  },
  tagScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
    marginLeft: 6,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subheader: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  itemContainer: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  standingText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  notes: {
    fontSize: 14,
    lineHeight: 20,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    backgroundColor: '#e3f2fd',
    padding: 8,
    borderRadius: 6,
  },
  statItem: {
    fontSize: 14,
    color: '#1976d2',
    flex: 1,
  },
  statValue: {
    fontWeight: 'bold',
    color: '#1565c0',
  },
});