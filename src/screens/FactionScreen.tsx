import React, { useState, useCallback, useLayoutEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, FlatList, Alert, TextInput } from 'react-native';
import { Text } from 'react-native';
import { GameCharacter, Faction, RelationshipStanding, POSITIVE_RELATIONSHIP_TYPE, NEGATIVE_RELATIONSHIP_TYPE } from '@models/types';
import { loadCharacters, getFactionDescription, migrateFactionDescriptions, loadFactions, deleteFactionCompletely } from '@utils/characterStorage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootStackParamList, RootDrawerParamList } from '@/navigation/types';

type FactionNavigationProp = CompositeNavigationProp<
  DrawerNavigationProp<RootDrawerParamList, 'Factions'>,
  StackNavigationProp<RootStackParamList>
>;

interface FactionInfo {
  faction: Faction;
  characters: GameCharacter[];
  totalCount: number;
  presentCount: number;
  standingCounts: Record<string, number>;
}

export const FactionScreen: React.FC = () => {
  const [characters, setCharacters] = useState<GameCharacter[]>([]);
  const [factionInfos, setFactionInfos] = useState<FactionInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const navigation = useNavigation<FactionNavigationProp>();

  const loadData = useCallback(async () => {
    // Run migration on first load (idempotent operation)
    await migrateFactionDescriptions();
    
    const data = await loadCharacters();
    setCharacters(data);
    
    // Process factions
    const factionMap = new Map<string, { 
      faction: Faction; 
      characters: GameCharacter[]; 
      standings: Record<string, number>;
    }>();

    // First, load centralized factions to ensure all created factions appear
    const storedFactions = await loadFactions();
    storedFactions.forEach(storedFaction => {
      if (!factionMap.has(storedFaction.name)) {
        factionMap.set(storedFaction.name, {
          faction: {
            name: storedFaction.name,
            standing: RelationshipStanding.Neutral,
            description: storedFaction.description
          },
          characters: [],
          standings: {}
        });
      }
    });

    // Collect all factions from all characters
    data.forEach(character => {
      character.factions.forEach(faction => {
        if (!factionMap.has(faction.name)) {
          factionMap.set(faction.name, {
            faction,
            characters: [],
            standings: {}
          });
        }
        
        const factionData = factionMap.get(faction.name)!;
        
        // Only count positive relationship standings as actual members
        const standingValue = faction.standing as string;
        if (POSITIVE_RELATIONSHIP_TYPE.includes(faction.standing) || 
            standingValue === 'Allied' || standingValue === 'Friendly') {
          factionData.characters.push(character);
        }
        
        // Count all standings for display purposes
        factionData.standings[faction.standing] = 
          (factionData.standings[faction.standing] || 0) + 1;
      });
    });

    // Convert to FactionInfo array and get centralized descriptions
    const factionInfosArray = await Promise.all(
      Array.from(factionMap.entries()).map(async ([name, data]) => {
        // Get the centralized faction description
        const centralDescription = await getFactionDescription(name);
        
        return {
          faction: {
            ...data.faction,
            description: centralDescription // Use centralized description
          },
          characters: data.characters,
          totalCount: data.characters.length,
          presentCount: data.characters.filter(c => c.present === true).length,
          standingCounts: data.standings
        };
      })
    );

    // Sort alphabetically by faction name
    factionInfosArray.sort((a, b) => a.faction.name.localeCompare(b.faction.name));
    
    setFactionInfos(factionInfosArray);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const getFilteredFactions = useCallback(() => {
    let filtered = factionInfos;
    
    // Filter by search query if provided
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(factionInfo => 
        factionInfo.faction.name.toLowerCase().includes(query) ||
        (factionInfo.faction.description && factionInfo.faction.description.toLowerCase().includes(query))
      );
    }
    
    // Sort alphabetically by faction name
    return filtered.sort((a, b) => 
      a.faction.name.localeCompare(b.faction.name)
    );
  }, [factionInfos, searchQuery]);

  const filteredFactions = React.useMemo(() => getFilteredFactions(), [getFilteredFactions]);

  // Set up the header with a plus button
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerAddButton}
          onPress={handleCreateFaction}
        >
          <Text style={styles.headerAddButtonText}>+</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleFactionSelect = (factionInfo: FactionInfo) => {
    navigation.navigate('FactionDetails', { factionName: factionInfo.faction.name });
  };

  const handleCreateFaction = () => {
    navigation.navigate('FactionForm');
  };

  const handleDeleteFaction = async (factionName: string) => {
    Alert.alert(
      'Delete Faction',
      `Are you sure you want to delete "${factionName}"? This will remove it from all characters and cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteFactionCompletely(factionName);
              
              if (result.success) {
                // Refresh the faction list
                await loadData();
                
                // Show success message
                const message = result.charactersUpdated > 0 
                  ? `Faction "${factionName}" deleted successfully. Removed from ${result.charactersUpdated} character(s).`
                  : `Faction "${factionName}" deleted successfully.`;
                
                Alert.alert('Success', message, [{ text: 'OK' }]);
              } else {
                Alert.alert('Error', 'Failed to delete faction. Please try again.', [{ text: 'OK' }]);
              }
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred while deleting the faction.', [{ text: 'OK' }]);
            }
          },
        },
      ]
    );
  };

  const renderFactionItem = ({ item }: { item: FactionInfo }) => (
    <View style={styles.factionCard}>
      <TouchableOpacity
        style={styles.factionContent}
        onPress={() => handleFactionSelect(item)}
      >
        <View style={styles.factionHeader}>
          <Text style={styles.factionName}>{item.faction.name}</Text>
          <View style={styles.factionCounts}>
            <Text style={styles.countText}>
              {item.totalCount} member{item.totalCount !== 1 ? 's' : ''}
            </Text>
            <Text style={styles.presentText}>
              {item.presentCount} present
            </Text>
          </View>
        </View>
        
        <View style={styles.standingsContainer}>
          {Object.entries(item.standingCounts).map(([standing, count]) => (
            <View key={standing} style={[styles.standingBadge, getStandingStyle(standing)]}>
              <Text style={[styles.standingText, getStandingTextStyle(standing)]}>
                {standing}: {count}
              </Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteFaction(item.faction.name)}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );



  const getStandingStyle = (standing: string) => {
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
      // Legacy support for faction standings that might use different values
      case 'Allied':
        return styles.standingAllied;
      case 'Friendly':
        return styles.standingFriendly;
      default:
        return styles.standingNeutral;
    }
  };

  const getStandingTextStyle = (standing: string) => {
    // Check if standing is positive (Allied/Ally/Friendly/Friend)
    if (POSITIVE_RELATIONSHIP_TYPE.includes(standing as RelationshipStanding) || 
        standing === 'Allied' || standing === 'Friendly') {
      return styles.standingTextLight;
    }
    
    // Check if standing is negative (Hostile/Enemy)
    if (NEGATIVE_RELATIONSHIP_TYPE.includes(standing as RelationshipStanding)) {
      return styles.standingTextLight;
    }
    
    // Neutral or unknown standings
    return styles.standingTextDark;
  };

  return (
    <View style={styles.container}>
      {/* Fixed search bar outside of FlatList to prevent focus loss */}
      {/* <View style={styles.fixedHeader}> */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search factions by name..."
            placeholderTextColor={colors.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            blurOnSubmit={false}
            autoFocus={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
      </View>

      <FlatList
        data={filteredFactions}
        renderItem={renderFactionItem}
        keyExtractor={(item) => item.faction.name}
        style={styles.factionList}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
};

// Modern Dark Color Palette
const colors = {
  // Background colors
  primary: '#0F0F23',      // Deep dark blue-purple
  secondary: '#1B1B3A',    // Slightly lighter dark
  surface: '#262647',      // Card/surface color
  elevated: '#2D2D54',     // Elevated surfaces
  
  // Text colors
  text: {
    primary: '#FFFFFF',    // Primary white text
    secondary: '#B8B8CC',  // Secondary lighter text
    muted: '#8E8EA0',      // Muted text
  },
  
  // Accent colors
  accent: {
    primary: '#6366F1',    // Indigo primary
    secondary: '#8B5CF6',  // Purple secondary
    success: '#10B981',    // Green
    warning: '#F59E0B',    // Amber
    danger: '#EF4444',     // Red
    info: '#3B82F6',       // Blue
  },
  
  // Status colors
  present: '#059669',      // Green for present
  absent: '#6B7280',       // Gray for absent
  
  // Standing colors
  standing: {
    allied: '#10B981',     // Green
    friendly: '#3B82F6',   // Blue
    neutral: '#6B7280',    // Gray
    hostile: '#F59E0B',    // Amber
    enemy: '#EF4444',      // Red
  },
  
  // Border and shadow
  border: '#3F3F65',
  shadow: '#000000',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  fixedHeader: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scrollView: {
    backgroundColor: colors.primary,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: colors.text.primary,
    letterSpacing: 0.3,
  },
  sectionDescription: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 20,
    lineHeight: 24,
  },
  factionList: {
    flex: 1,
  },
  headerSection: {
    marginBottom: 20,
  },
  factionCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  factionContent: {
    flex: 1,
  },

  factionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  factionName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: 0.2,
    flex: 1,
  },
  factionCounts: {
    alignItems: 'flex-end',
  },
  countText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  presentText: {
    fontSize: 12,
    color: colors.text.muted,
  },
  standingsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  standingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
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
  standingText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  standingTextLight: {
    color: colors.text.primary,
  },
  standingTextDark: {
    color: colors.text.primary,
  },
  factionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.muted,
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  descriptionContainer: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  characterList: {
    maxHeight: 600,
  },
  characterCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 1,
  },
  characterCardPresent: {
    borderLeftWidth: 4,
    borderLeftColor: colors.present,
  },
  characterHeader: {
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
    flex: 1,
  },
  characterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  characterSpecies: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  characterDescription: {
    fontSize: 13,
    color: colors.text.muted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  presentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presentBadgeActive: {
    backgroundColor: colors.present,
    borderColor: colors.present,
  },
  presentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.muted,
    letterSpacing: 0.3,
  },
  presentBadgeTextActive: {
    color: colors.text.primary,
  },
  headerAddButton: {
    marginRight: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.success,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  headerAddButtonText: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 20,
  },
  deleteButton: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.accent.danger,
    borderRadius: 8,
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: colors.accent.danger,
    shadowColor: colors.accent.danger,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  searchContainer: {
    position: 'relative',
    margin: 16,
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  clearSearchButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.text.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearSearchText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});