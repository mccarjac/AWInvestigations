import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AVAILABLE_PERKS, AVAILABLE_DISTINCTIONS, AVAILABLE_RECIPES, PerkTag } from '@/models/gameData';
import { GameCharacter, PerkId, DistinctionId } from '@/models/types';
import { RootStackParamList } from '@/navigation/types';

type SearchScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// Get all unique tags from the PerkTag type
const getAllTags = (): PerkTag[] => {
  const tagSet = new Set(AVAILABLE_PERKS.map(perk => perk.tag));
  return Array.from(tagSet);
};
import { loadCharacters } from '@/utils/characterStorage';

interface SearchCriteria {
  perkId?: PerkId;
  distinctionId?: DistinctionId;
  tag?: PerkTag;
  minTagScore?: number;
  factionName?: string;
  factionStanding?: 'Allied' | 'Friendly' | 'Neutral' | 'Hostile' | 'Enemy';
  recipeSearch?: string;
}

export const CharacterSearchScreen: React.FC = () => {
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({});
  const [searchResults, setSearchResults] = useState<GameCharacter[]>([]);

  const calculateTagScore = (character: GameCharacter, tag: PerkTag): number => {
    return AVAILABLE_PERKS
      .filter(perk => character.perkIds.includes(perk.id) && perk.tag === tag)
      .length;
  };

  const handleSearch = useCallback(async () => {
    const characters = await loadCharacters();
    const results = characters.filter(character => {
      // Check perk
      if (searchCriteria.perkId && !character.perkIds.includes(searchCriteria.perkId)) {
        return false;
      }

      // Check distinction
      if (searchCriteria.distinctionId && 
          !character.distinctionIds.includes(searchCriteria.distinctionId)) {
        return false;
      }

      // Check recipes
      if (searchCriteria.recipeSearch) {
        const query = searchCriteria.recipeSearch.toLowerCase();
        const characterPerks = AVAILABLE_PERKS.filter(perk => 
          character.perkIds.includes(perk.id) && perk.recipeIds
        );
        
        const hasMatchingRecipe = characterPerks.some(perk => 
          perk.recipeIds?.some(recipeId => {
            const recipe = AVAILABLE_RECIPES.find(r => r.id === recipeId);
            return recipe && (
              recipe.name.toLowerCase().includes(query) ||
              recipe.description.toLowerCase().includes(query) ||
              recipe.materials.some(material => 
                material.toLowerCase().includes(query)
              )
            );
          })
        );

        if (!hasMatchingRecipe) {
          return false;
        }
      }

      // Check tag score
      if (searchCriteria.tag && searchCriteria.minTagScore) {
        const tagScore = calculateTagScore(character, searchCriteria.tag);
        if (tagScore < searchCriteria.minTagScore) {
          return false;
        }
      }

      // Check faction
      if (searchCriteria.factionName || searchCriteria.factionStanding) {
        const matchingFaction = character.factions.find(faction => {
          if (searchCriteria.factionName && 
              !faction.name.toLowerCase().includes(searchCriteria.factionName.toLowerCase())) {
            return false;
          }
          if (searchCriteria.factionStanding && faction.standing !== searchCriteria.factionStanding) {
            return false;
          }
          return true;
        });
        if (!matchingFaction) {
          return false;
        }
      }

      return true;
    });

    setSearchResults(results);
  }, [searchCriteria]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.searchSection}>
        <Text style={styles.sectionTitle}>Search Criteria</Text>
        
        <View style={styles.criteriaItem}>
          <Text style={styles.label}>Perk</Text>
          <Picker
            selectedValue={searchCriteria.perkId}
            style={styles.picker}
            onValueChange={(value) => setSearchCriteria(prev => ({ ...prev, perkId: value || undefined }))}
          >
            <Picker.Item label="Any Perk" value="" />
            {AVAILABLE_PERKS.map(perk => (
              <Picker.Item key={perk.id} label={perk.name} value={perk.id} />
            ))}
          </Picker>
        </View>

        <View style={styles.criteriaItem}>
          <Text style={styles.label}>Distinction</Text>
          <Picker
            selectedValue={searchCriteria.distinctionId}
            style={styles.picker}
            onValueChange={(value) => setSearchCriteria(prev => ({ ...prev, distinctionId: value || undefined }))}
          >
            <Picker.Item label="Any Distinction" value="" />
            {AVAILABLE_DISTINCTIONS.map(distinction => (
              <Picker.Item key={distinction.id} label={distinction.name} value={distinction.id} />
            ))}
          </Picker>
        </View>

        <View style={styles.criteriaItem}>
          <Text style={styles.label}>Tag Score</Text>
          <View style={styles.tagScoreContainer}>
            <Picker
              selectedValue={searchCriteria.tag}
              style={[styles.picker, { flex: 2 }]}
              onValueChange={(value: PerkTag | '') => 
                setSearchCriteria(prev => ({ ...prev, tag: value || undefined }))}
            >
              <Picker.Item label="Any Tag" value="" />
              {getAllTags().map(tag => (
                <Picker.Item key={tag} label={tag} value={tag} />
              ))}
            </Picker>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={searchCriteria.minTagScore?.toString() || ''}
              onChangeText={(value) => setSearchCriteria(prev => ({
                ...prev,
                minTagScore: value ? parseInt(value) : undefined
              }))}
              placeholder="Min Score"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.criteriaItem}>
          <Text style={styles.label}>Recipe Search</Text>
          <TextInput
            style={styles.input}
            value={searchCriteria.recipeSearch || ''}
            onChangeText={(value) => setSearchCriteria(prev => ({
              ...prev,
              recipeSearch: value || undefined
            }))}
            placeholder="Search recipes or materials..."
          />
        </View>

        <View style={styles.criteriaItem}>
          <Text style={styles.label}>Faction</Text>
          <View style={styles.factionContainer}>
            <TextInput
              style={[styles.input, { flex: 2 }]}
              value={searchCriteria.factionName || ''}
              onChangeText={(value) => setSearchCriteria(prev => ({
                ...prev,
                factionName: value || undefined
              }))}
              placeholder="Faction Name"
            />
            <Picker
              selectedValue={searchCriteria.factionStanding}
              style={[styles.picker, { flex: 1 }]}
              onValueChange={(value) => setSearchCriteria(prev => ({
                ...prev,
                factionStanding: value || undefined
              }))}
            >
              <Picker.Item label="Any Standing" value="" />
              <Picker.Item label="Allied" value="Allied" />
              <Picker.Item label="Friendly" value="Friendly" />
              <Picker.Item label="Neutral" value="Neutral" />
              <Picker.Item label="Hostile" value="Hostile" />
              <Picker.Item label="Enemy" value="Enemy" />
            </Picker>
          </View>
        </View>

        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsSection}>
        <Text style={styles.sectionTitle}>Results ({searchResults.length})</Text>
        {searchResults.map(character => (
          <TouchableOpacity
            key={character.id}
            style={styles.resultItem}
            onPress={() => navigation.navigate('CharacterDetail', { character })}
          >
            <View style={styles.resultHeader}>
              <Text style={styles.characterName}>{character.name}</Text>
              <Text style={styles.characterSpecies}>{character.species}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchSection: {
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
  resultsSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  criteriaItem: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  picker: {
    backgroundColor: 'white',
    borderRadius: 6,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 6,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tagScoreContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  factionContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  searchButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  characterName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  characterSpecies: {
    fontSize: 14,
    color: '#666',
  },
  recipesContainer: {
    marginTop: 8,
  },
  recipeItem: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recipeName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  recipeDescription: {
    fontSize: 14,
    color: '#666',
  }
});