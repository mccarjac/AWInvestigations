import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { Text } from 'react-native';
import { GameCharacter, Faction, RelationshipStanding, POSITIVE_RELATIONSHIP_TYPE, NEGATIVE_RELATIONSHIP_TYPE } from '@models/types';
import { loadCharacters, getFactionDescription, migrateFactionDescriptions, loadFactions } from '@utils/characterStorage';
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

    // Sort by total member count (descending)
    factionInfosArray.sort((a, b) => b.totalCount - a.totalCount);
    
    setFactionInfos(factionInfosArray);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleFactionSelect = (factionInfo: FactionInfo) => {
    navigation.navigate('FactionDetails', { factionName: factionInfo.faction.name });
  };

  const handleCreateFaction = () => {
    navigation.navigate('FactionForm');
  };

  const renderFactionItem = ({ item }: { item: FactionInfo }) => (
    <TouchableOpacity
      style={styles.factionCard}
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
      <FlatList
        data={factionInfos}
        renderItem={renderFactionItem}
        keyExtractor={(item) => item.faction.name}
        style={styles.factionList}
        contentContainerStyle={styles.contentContainer}
        ListHeaderComponent={() => (
          <View style={styles.headerSection}>
            <Text style={styles.sectionTitle}>Factions ({factionInfos.length})</Text>
            <Text style={styles.sectionDescription}>
              Tap any faction to view detailed information, manage members, and modify standings.
            </Text>
          </View>
        )}
      />
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateFaction}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
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
  scrollView: {
    backgroundColor: colors.primary,
  },
  contentContainer: {
    padding: 16,
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    backgroundColor: colors.accent.primary,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.text.primary,
    lineHeight: 28,
  },
});