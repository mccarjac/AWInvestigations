import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import {
  GameCharacter,
  Faction,
  RelationshipStanding,
  POSITIVE_RELATIONSHIP_TYPE,
  NEGATIVE_RELATIONSHIP_TYPE,
} from '@models/types';
import {
  loadCharacters,
  getFactionDescription,
  migrateFactionDescriptions,
  loadFactions,
} from '@utils/characterStorage';
import {
  useNavigation,
  useFocusEffect,
  CompositeNavigationProp,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootStackParamList, RootDrawerParamList } from '@/navigation/types';
import { commonStyles } from '@/styles/commonStyles';
import { BaseListScreen } from '@/components';

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
  retired?: boolean;
}

export const FactionListScreen: React.FC = () => {
  const [factionInfos, setFactionInfos] = useState<FactionInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showRetired, setShowRetired] = useState<boolean>(false);
  const navigation = useNavigation<FactionNavigationProp>();

  const loadData = useCallback(async () => {
    // Run migration on first load (idempotent operation)
    await migrateFactionDescriptions();

    const data = await loadCharacters();

    // Process factions
    const factionMap = new Map<
      string,
      {
        faction: Faction;
        characters: GameCharacter[];
        standings: Record<string, number>;
      }
    >();

    // First, load centralized factions to ensure all created factions appear
    const storedFactions = await loadFactions();
    const factionRetiredMap = new Map<string, boolean>();
    storedFactions.forEach(storedFaction => {
      factionRetiredMap.set(storedFaction.name, storedFaction.retired ?? false);
      if (!factionMap.has(storedFaction.name)) {
        factionMap.set(storedFaction.name, {
          faction: {
            name: storedFaction.name,
            standing: RelationshipStanding.Neutral,
            description: storedFaction.description,
          },
          characters: [],
          standings: {},
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
            standings: {},
          });
        }

        const factionData = factionMap.get(faction.name)!;

        // Only count positive relationship standings as actual members
        const standingValue = faction.standing as string;
        if (
          POSITIVE_RELATIONSHIP_TYPE.includes(faction.standing) ||
          standingValue === 'Allied' ||
          standingValue === 'Friendly'
        ) {
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
            description: centralDescription, // Use centralized description
          },
          characters: data.characters,
          totalCount: data.characters.length,
          presentCount: data.characters.filter(c => c.present === true).length,
          standingCounts: data.standings,
          retired: factionRetiredMap.get(name) ?? false,
        };
      })
    );

    // Sort alphabetically by faction name
    factionInfosArray.sort((a, b) =>
      a.faction.name.localeCompare(b.faction.name)
    );

    setFactionInfos(factionInfosArray);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const getFilteredFactions = useCallback(() => {
    let filtered = factionInfos;

    // Filter by retired status
    if (showRetired) {
      filtered = filtered.filter(factionInfo => factionInfo.retired === true);
    } else {
      filtered = filtered.filter(factionInfo => !factionInfo.retired);
    }

    // Filter by search query if provided
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        factionInfo =>
          factionInfo.faction.name.toLowerCase().includes(query) ||
          (factionInfo.faction.description &&
            factionInfo.faction.description.toLowerCase().includes(query))
      );
    }

    // Sort alphabetically by faction name
    return filtered.sort((a, b) =>
      a.faction.name.localeCompare(b.faction.name)
    );
  }, [factionInfos, searchQuery, showRetired]);

  const filteredFactions = React.useMemo(
    () => getFilteredFactions(),
    [getFilteredFactions]
  );

  const handleFactionSelect = (factionInfo: FactionInfo) => {
    navigation.navigate('FactionDetails', {
      factionName: factionInfo.faction.name,
    });
  };

  const renderFactionItem = (item: FactionInfo) => (
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
            <Text style={styles.presentText}>{item.presentCount} present</Text>
          </View>
        </View>

        <View style={styles.standingsContainer}>
          {Object.entries(item.standingCounts).map(([standing, count]) => (
            <View
              key={standing}
              style={[styles.standingBadge, getStandingStyle(standing)]}
            >
              <Text
                style={[styles.standingText, getStandingTextStyle(standing)]}
              >
                {standing}: {count}
              </Text>
            </View>
          ))}
        </View>
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
    if (
      POSITIVE_RELATIONSHIP_TYPE.includes(standing as RelationshipStanding) ||
      standing === 'Allied' ||
      standing === 'Friendly'
    ) {
      return styles.standingTextLight;
    }

    // Check if standing is negative (Hostile/Enemy)
    if (NEGATIVE_RELATIONSHIP_TYPE.includes(standing as RelationshipStanding)) {
      return styles.standingTextLight;
    }

    // Neutral or unknown standings
    return styles.standingTextDark;
  };

  const renderHeaderRight = () => (
    <View style={styles.headerRight}>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          showRetired ? styles.toggleButtonActive : styles.toggleButtonInactive,
        ]}
        onPress={() => setShowRetired(!showRetired)}
      >
        <Text style={styles.toggleButtonText}>
          {showRetired ? 'Retired' : 'Active'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('FactionForm', {})}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <BaseListScreen
      data={filteredFactions}
      renderItem={renderFactionItem}
      keyExtractor={(item: FactionInfo) => item.faction.name}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search factions by name..."
      emptyStateTitle="No factions found"
      headerRight={renderHeaderRight()}
    />
  );
};

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  toggleButtonInactive: {
    backgroundColor: 'transparent',
    borderColor: '#6C5CE7',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 28,
  },
  factionCard: commonStyles.card.base,
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
    ...commonStyles.text.h3,
    flex: 1,
  },
  factionCounts: {
    alignItems: 'flex-end',
  },
  countText: {
    ...commonStyles.text.body,
    fontWeight: '500',
  },
  presentText: commonStyles.text.caption,
  standingsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  standingBadge: {
    ...commonStyles.badge.base,
    minWidth: 60,
  },
  standingAllied: commonStyles.badge.allied,
  standingFriendly: commonStyles.badge.friendly,
  standingNeutral: commonStyles.badge.neutral,
  standingHostile: commonStyles.badge.hostile,
  standingEnemy: commonStyles.badge.enemy,
  standingText: commonStyles.badge.text,
  standingTextLight: commonStyles.badge.text,
  standingTextDark: commonStyles.badge.text,
});
