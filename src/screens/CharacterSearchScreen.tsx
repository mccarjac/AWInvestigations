import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AVAILABLE_PERKS, AVAILABLE_DISTINCTIONS, AVAILABLE_RECIPES, PerkTag } from '@/models/gameData';
import { GameCharacter, PerkId, DistinctionId, RelationshipStanding } from '@/models/types';
import { RootStackParamList } from '@/navigation/types';

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
  factionStanding?: FactionStanding;
  recipeSearch?: string;
  presentStatus?: 'present' | 'absent' | 'any';
  retiredStatus?: 'active' | 'retired' | 'any';
}

export const CharacterSearchScreen: React.FC = () => {
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({ 
    presentStatus: 'any',
    retiredStatus: 'active' // Default to searching only active (non-retired) characters
  });
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

      // Check present status
      if (searchCriteria.presentStatus && searchCriteria.presentStatus !== 'any') {
        const isPresent = character.present === true;
        if (searchCriteria.presentStatus === 'present' && !isPresent) {
          return false;
        }
        if (searchCriteria.presentStatus === 'absent' && isPresent) {
          return false;
        }
      }

      // Check retired status
      if (searchCriteria.retiredStatus && searchCriteria.retiredStatus !== 'any') {
        const isRetired = character.retired === true;
        if (searchCriteria.retiredStatus === 'retired' && !isRetired) {
          return false;
        }
        if (searchCriteria.retiredStatus === 'active' && isRetired) {
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
              {Object.values(RelationshipStanding).map(standing => (
                <Picker.Item key={standing} label={standing} value={standing} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.criteriaItem}>
          <Text style={styles.label}>Present Status</Text>
          <Picker
            selectedValue={searchCriteria.presentStatus || 'any'}
            style={styles.picker}
            onValueChange={(value) => setSearchCriteria(prev => ({
              ...prev,
              presentStatus: value as 'present' | 'absent' | 'any'
            }))}
          >
            <Picker.Item label="Any Status" value="any" />
            <Picker.Item label="Present" value="present" />
            <Picker.Item label="Absent" value="absent" />
          </Picker>
        </View>

        <View style={styles.criteriaItem}>
          <Text style={styles.label}>Retired Status</Text>
          <Picker
            selectedValue={searchCriteria.retiredStatus || 'active'}
            style={styles.picker}
            onValueChange={(value) => setSearchCriteria(prev => ({
              ...prev,
              retiredStatus: value as 'active' | 'retired' | 'any'
            }))}
          >
            <Picker.Item label="Active Only" value="active" />
            <Picker.Item label="Retired Only" value="retired" />
            <Picker.Item label="Any Status" value="any" />
          </Picker>
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
              <View style={styles.characterInfo}>
                <Text style={styles.characterSpecies}>{character.species}</Text>
                {character.retired && (
                  <View style={[styles.presentStatusBadge, styles.retiredStatusBadge]}>
                    <Text style={[styles.presentStatusText, styles.retiredStatusText]}>
                      Retired
                    </Text>
                  </View>
                )}
                <View style={[styles.presentStatusBadge, character.present && styles.presentStatusBadgeActive]}>
                  <Text style={[styles.presentStatusText, character.present && styles.presentStatusTextActive]}>
                    {character.present ? 'Present' : 'Absent'}
                  </Text>
                </View>
              </View>
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
    backgroundColor: colors.primary,
  },
  searchSection: {
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
  resultsSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: colors.text.primary,
    letterSpacing: 0.3,
  },
  criteriaItem: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: colors.text.primary,
    letterSpacing: 0.2,
  },
  picker: {
    backgroundColor: colors.elevated,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text.primary,
  },
  input: {
    backgroundColor: colors.elevated,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text.primary,
  },
  tagScoreContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  factionContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  searchButton: {
    backgroundColor: colors.accent.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  resultItem: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  characterName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: 0.2,
  },
  characterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  characterSpecies: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  presentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presentStatusBadgeActive: {
    backgroundColor: colors.status.success,
    borderColor: colors.status.success,
  },
  presentStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.secondary,
    letterSpacing: 0.3,
  },
  presentStatusTextActive: {
    color: colors.text.primary,
  },
  retiredStatusBadge: {
    backgroundColor: colors.status.error,
    borderColor: colors.status.error,
  },
  retiredStatusText: {
    color: colors.text.primary,
  },
  recipesContainer: {
    marginTop: 12,
  },
  recipeItem: {
    backgroundColor: colors.elevated,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recipeName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  recipeDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  }
});