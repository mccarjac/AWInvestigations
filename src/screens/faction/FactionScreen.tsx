import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Text,
} from 'react-native';
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
  deleteFactionCompletely,
} from '@utils/characterStorage';
import {
  useNavigation,
  useFocusEffect,
  CompositeNavigationProp,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootStackParamList, RootDrawerParamList } from '@/navigation/types';
import { colors as themeColors } from '@/styles/theme';
import { commonStyles } from '@/styles/commonStyles';

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
  const [factionInfos, setFactionInfos] = useState<FactionInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
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
    storedFactions.forEach(storedFaction => {
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
  }, [factionInfos, searchQuery]);

  const filteredFactions = React.useMemo(
    () => getFilteredFactions(),
    [getFilteredFactions]
  );

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
    navigation.navigate('FactionDetails', {
      factionName: factionInfo.faction.name,
    });
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
                const message =
                  result.charactersUpdated > 0
                    ? `Faction "${factionName}" deleted successfully. Removed from ${result.charactersUpdated} character(s).`
                    : `Faction "${factionName}" deleted successfully.`;

                Alert.alert('Success', message, [{ text: 'OK' }]);
              } else {
                Alert.alert(
                  'Error',
                  'Failed to delete faction. Please try again.',
                  [{ text: 'OK' }]
                );
              }
            } catch {
              Alert.alert(
                'Error',
                'An unexpected error occurred while deleting the faction.',
                [{ text: 'OK' }]
              );
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

  return (
    <View style={styles.container}>
      {/* Fixed search bar outside of FlatList to prevent focus loss */}
      {/* <View style={styles.fixedHeader}> */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search factions by name..."
          placeholderTextColor={themeColors.text.muted}
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
        keyExtractor={item => item.faction.name}
        style={styles.factionList}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: commonStyles.layout.container,
  contentContainer: commonStyles.layout.contentContainer,
  factionList: {
    flex: 1,
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
  headerAddButton: commonStyles.headerButton.add,
  headerAddButtonText: commonStyles.headerButton.addText,
  deleteButton: {
    ...commonStyles.button.small,
    ...commonStyles.button.danger,
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  deleteText: commonStyles.button.textSmall,
  searchContainer: commonStyles.search.container,
  searchInput: commonStyles.search.input,
  clearSearchButton: commonStyles.search.clearButton,
  clearSearchText: commonStyles.search.clearText,
});
