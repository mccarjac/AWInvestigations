import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, FlatList, Alert, TextInput } from 'react-native';
import { Text } from 'react-native';
import { GameCharacter, Faction, RelationshipStanding, POSITIVE_RELATIONSHIP_TYPE, NEGATIVE_RELATIONSHIP_TYPE } from '@models/types';
import { loadCharacters, updateCharacter, getFactionDescription, saveFactionDescription, migrateFactionDescriptions } from '@utils/characterStorage';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import { colors as themeColors } from '@/styles/theme';
import { commonStyles } from '@/styles/commonStyles';

type FactionDetailsRouteProp = RouteProp<RootStackParamList, 'FactionDetails'>;
type FactionDetailsNavigationProp = StackNavigationProp<RootStackParamList>;

interface FactionMemberInfo {
  character: GameCharacter;
  faction: Faction;
}

export const FactionDetailsScreen: React.FC = () => {
  const route = useRoute<FactionDetailsRouteProp>();
  const navigation = useNavigation<FactionDetailsNavigationProp>();
  const { factionName } = route.params;

  const [allCharacters, setAllCharacters] = useState<GameCharacter[]>([]);
  const [members, setMembers] = useState<FactionMemberInfo[]>([]);
  const [nonMembers, setNonMembers] = useState<GameCharacter[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [factionDescription, setFactionDescription] = useState<string>('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState<string>('');

  const loadData = useCallback(async () => {
    // Run migration on first load (idempotent operation)
    await migrateFactionDescriptions();
    
    const characters = await loadCharacters();
    setAllCharacters(characters);

    // Find faction members and non-members
    const factionMembers: FactionMemberInfo[] = [];
    const factionNonMembers: GameCharacter[] = [];

    characters.forEach(character => {
      const faction = character.factions.find(f => f.name === factionName);
      if (faction) {
        // Show all relationships, but distinguish members from contacts
        factionMembers.push({ character, faction });
      } else {
        factionNonMembers.push(character);
      }
    });

    setMembers(factionMembers.sort((a, b) => a.character.name.localeCompare(b.character.name)));
    setNonMembers(factionNonMembers.sort((a, b) => a.name.localeCompare(b.name)));
    
    // Get the faction description from centralized faction storage
    const description = await getFactionDescription(factionName);
    setFactionDescription(description);
  }, [factionName]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRemoveMember = async (character: GameCharacter) => {
    // Use window.confirm for web compatibility instead of Alert
    const shouldRemove = window.confirm(`Remove ${character.name} from ${factionName}?`);
    
    if (shouldRemove) {
      try {
        const updatedFactions = character.factions.filter(f => f.name !== factionName);
        const result = await updateCharacter(character.id, { factions: updatedFactions });
        
        if (result) {
          // Update local state immediately to provide immediate feedback
          setMembers(prevMembers => prevMembers.filter(m => m.character.id !== character.id));
          setNonMembers(prevNonMembers => [...prevNonMembers, result].sort((a, b) => a.name.localeCompare(b.name)));
          
          // Update the allCharacters state to reflect the change
          setAllCharacters(prevChars => 
            prevChars.map(c => c.id === character.id ? result : c)
          );
        } else {
          throw new Error('Failed to update character');
        }
      } catch (error) {
        console.error('Error removing member from faction:', error);
        window.alert('Failed to remove member from faction. Please try again.');
      }
    }
  };

  const handleAddMember = async (character: GameCharacter, standing: RelationshipStanding) => {
    // Ensure the faction exists in central storage (this will create it if it doesn't exist)
    const currentDescription = await getFactionDescription(factionName);
    if (!currentDescription && factionDescription) {
      // If no central description but we have a local one, save it
      await saveFactionDescription(factionName, factionDescription);
    } else if (!currentDescription) {
      // Create with empty description if none exists
      await saveFactionDescription(factionName, '');
    }

    const newFaction: Faction = {
      name: factionName,
      standing,
      description: '' // Description is managed centrally now
    };

    const updatedFactions = [...character.factions, newFaction];
    const result = await updateCharacter(character.id, { factions: updatedFactions });
    
    if (result) {
      // Update local state immediately
      setNonMembers(prevNonMembers => prevNonMembers.filter(c => c.id !== character.id));
      setMembers(prevMembers => [...prevMembers, { character: result, faction: newFaction }]
        .sort((a, b) => a.character.name.localeCompare(b.character.name)));
      
      // Update the allCharacters state
      setAllCharacters(prevChars => 
        prevChars.map(c => c.id === character.id ? result : c)
      );
    }
    
    // Keep the add members section open for adding multiple members
    // setShowAddMember(false); // Removed to allow adding multiple members easily
  };

  const handleUpdateStanding = async (character: GameCharacter, newStanding: RelationshipStanding) => {
    try {
      const updatedFactions = character.factions.map(f => 
        f.name === factionName ? { ...f, standing: newStanding } : f
      );
      const result = await updateCharacter(character.id, { factions: updatedFactions });
      
      if (result) {
        // Update local state immediately
        setMembers(prevMembers => 
          prevMembers.map(member => 
            member.character.id === character.id 
              ? { ...member, faction: { ...member.faction, standing: newStanding } }
              : member
          )
        );
        
        // Update the allCharacters state
        setAllCharacters(prevChars => 
          prevChars.map(c => c.id === character.id ? result : c)
        );
      }
    } catch (error) {
      console.error('Error updating standing:', error);
      Alert.alert('Error', 'Failed to update relationship standing. Please try again.');
    }
  };

  const handleEditDescription = () => {
    setTempDescription(factionDescription);
    setEditingDescription(true);
  };

  const handleSaveDescription = async () => {
    try {
      // Save description to centralized faction storage
      await saveFactionDescription(factionName, tempDescription);
      
      // Update local state to reflect the changes immediately
      setFactionDescription(tempDescription);
      setEditingDescription(false);
      
      // Update the members array to reflect the new description for UI consistency
      setMembers(prevMembers => 
        prevMembers.map(member => ({
          ...member,
          faction: { ...member.faction, description: tempDescription }
        }))
      );
    } catch (error) {
      console.error('Failed to save faction description:', error);
      Alert.alert('Error', 'Failed to save faction description. Please try again.');
    }
  };

  const handleCancelEditDescription = () => {
    setTempDescription('');
    setEditingDescription(false);
  };

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

  const getStats = () => {
    // Only count positive relationships as actual members
    const actualMembers = members.filter(member => {
      const standingValue = member.faction.standing as string;
      return POSITIVE_RELATIONSHIP_TYPE.includes(member.faction.standing) || 
             standingValue === 'Allied' || standingValue === 'Friendly';
    });
    
    const totalMembers = actualMembers.length;
    const presentMembers = actualMembers.filter(m => m.character.present === true).length;
    const standingCounts: Record<string, number> = {};
    
    // Count all standings for display purposes (including neutral/negative)
    members.forEach(member => {
      standingCounts[member.faction.standing] = (standingCounts[member.faction.standing] || 0) + 1;
    });

    return { totalMembers, presentMembers, standingCounts };
  };

  const renderMember = ({ item }: { item: FactionMemberInfo }) => (
    <View style={[styles.memberCard, item.character.present && styles.memberCardPresent]}>
      <TouchableOpacity
        style={styles.memberHeader}
        onPress={() => navigation.navigate('CharacterDetail', { character: item.character })}
      >
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.character.name}</Text>
          <Text style={styles.memberSpecies}>{item.character.species}</Text>
        </View>
        <View style={styles.memberActions}>
          <View style={[styles.standingBadge, getStandingStyle(item.faction.standing)]}>
            <Text style={[styles.standingText, getStandingTextStyle(item.faction.standing)]}>
              {item.faction.standing}
            </Text>
          </View>
          <View style={[styles.presentBadge, item.character.present && styles.presentBadgeActive]}>
            <Text style={[styles.presentBadgeText, item.character.present && styles.presentBadgeTextActive]}>
              {item.character.present ? 'Present' : 'Absent'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      
      <View style={styles.memberControls}>
        <Text style={styles.controlLabel}>Standing:</Text>
        <View style={styles.standingButtons}>
          {Object.values(RelationshipStanding).map(standing => (
            <TouchableOpacity
              key={standing}
              style={[
                styles.standingButton,
                getStandingStyle(standing),
                item.faction.standing === standing && styles.standingButtonActive
              ]}
              onPress={() => handleUpdateStanding(item.character, standing)}
            >
              <Text style={[styles.standingButtonText, getStandingTextStyle(standing)]}>
                {standing}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveMember(item.character)}
          activeOpacity={0.7}
        >
          <Text style={styles.removeButtonText}>Remove from Faction</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderNonMember = ({ item }: { item: GameCharacter }) => (
    <View style={styles.nonMemberCard}>
      <View style={styles.nonMemberInfo}>
        <Text style={styles.nonMemberName}>{item.name}</Text>
        <Text style={styles.nonMemberSpecies}>{item.species}</Text>
      </View>
      
      <View style={styles.addControls}>
        <Text style={styles.controlLabel}>Add as:</Text>
        <View style={styles.standingButtons}>
          {Object.values(RelationshipStanding).map(standing => (
            <TouchableOpacity
              key={standing}
              style={[styles.standingButton, getStandingStyle(standing)]}
              onPress={() => handleAddMember(item, standing)}
            >
              <Text style={[styles.standingButtonText, getStandingTextStyle(standing)]}>
                {standing}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const stats = getStats();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {/* Faction Header */}
        <View style={styles.factionHeader}>
          <Text style={styles.factionName}>{factionName}</Text>
          
          <View style={styles.descriptionSection}>
            <View style={styles.descriptionHeader}>
              <Text style={styles.descriptionLabel}>Description</Text>
              {!editingDescription && (
                <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={handleEditDescription}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {editingDescription ? (
              <View style={styles.descriptionEditContainer}>
                <TextInput
                  style={styles.descriptionInput}
                  value={tempDescription}
                  onChangeText={setTempDescription}
                  placeholder="Enter faction description..."
                  multiline
                  numberOfLines={4}
                />
                <View style={styles.descriptionActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.cancelButton]} 
                    onPress={handleCancelEditDescription}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.saveButton]} 
                    onPress={handleSaveDescription}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.descriptionDisplay}>
                <Text style={styles.descriptionText}>
                  {factionDescription || 'No description provided'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Faction Statistics */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalMembers}</Text>
              <Text style={styles.statLabel}>Active Members</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.presentMembers}</Text>
              <Text style={styles.statLabel}>Present Members</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalMembers - stats.presentMembers}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
          </View>

          {/* Standing Distribution */}
          <View style={styles.standingDistribution}>
            <Text style={styles.sectionSubtitle}>Standing Distribution</Text>
            <View style={styles.standingGrid}>
              {Object.entries(stats.standingCounts).map(([standing, count]) => (
                <View key={standing} style={[styles.standingCard, getStandingStyle(standing)]}>
                  <Text style={[styles.standingCardCount, getStandingTextStyle(standing)]}>{count}</Text>
                  <Text style={[styles.standingCardLabel, getStandingTextStyle(standing)]}>{standing}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Relationships ({members.length})</Text>
            <Text style={styles.sectionDescription}>
              Includes all characters with any relationship to this faction. Only positive relationships (Ally/Friend) count as members in statistics.
            </Text>
          </View>
          
          <View style={styles.membersList}>
            {members.map((item) => (
              <View key={item.character.id}>
                {renderMember({ item })}
              </View>
            ))}
          </View>
        </View>

        {/* Add Members Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Add Members</Text>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowAddMember(!showAddMember)}
            >
              <Text style={styles.toggleButtonText}>
                {showAddMember ? 'Hide' : 'Show'} Available Characters
              </Text>
            </TouchableOpacity>
          </View>

          {showAddMember && (
            <>
              <Text style={styles.sectionDescription}>
                Add characters to {factionName} by selecting their standing:
              </Text>
              <View style={styles.nonMembersList}>
                {nonMembers.map((item) => (
                  <View key={item.id}>
                    {renderNonMember({ item })}
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.primary,
  },
  scrollView: {
    backgroundColor: themeColors.primary,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  statsSection: {
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    ...commonStyles.card.base,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: themeColors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: themeColors.text.muted,
    textAlign: 'center',
  },
  standingDistribution: {
    ...commonStyles.card.base,
  },
  sectionSubtitle: {
    ...commonStyles.text.h3,
    marginBottom: 12,
  },
  standingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  standingCard: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 70,
  },
  standingCardCount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  standingCardLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    ...commonStyles.text.h2,
  },
  sectionDescription: {
    fontSize: 14,
    color: themeColors.text.secondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  toggleButton: {
    ...commonStyles.button.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  toggleButtonText: {
    color: themeColors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  membersList: {
    // Remove maxHeight constraint since we're using ScrollView now
  },
  memberCard: {
    ...commonStyles.card.base,
    marginBottom: 12,
    overflow: 'hidden',
  },
  memberCardPresent: {
    borderLeftWidth: 4,
    borderLeftColor: themeColors.status.present,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.text.primary,
    marginBottom: 4,
  },
  memberSpecies: {
    fontSize: 14,
    color: themeColors.text.secondary,
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberControls: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
  },
  controlLabel: {
    ...commonStyles.text.label,
    color: themeColors.text.secondary,
    marginBottom: 8,
  },
  standingButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  standingButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  standingButtonActive: {
    borderColor: themeColors.text.primary,
    borderWidth: 2,
  },
  standingButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    ...commonStyles.button.danger,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  removeButtonText: {
    color: themeColors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  nonMembersList: {
    // Remove maxHeight constraint since we're using ScrollView now
  },
  nonMemberCard: {
    ...commonStyles.card.base,
    marginBottom: 8,
  },
  nonMemberInfo: {
    marginBottom: 12,
  },
  nonMemberName: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.text.primary,
    marginBottom: 4,
  },
  nonMemberSpecies: {
    fontSize: 14,
    color: themeColors.text.secondary,
  },
  addControls: {
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
    paddingTop: 12,
  },
  standingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  standingAllied: {
    backgroundColor: themeColors.standing.allied,
  },
  standingFriendly: {
    backgroundColor: themeColors.standing.friendly,
  },
  standingNeutral: {
    backgroundColor: themeColors.standing.neutral,
  },
  standingHostile: {
    backgroundColor: themeColors.standing.hostile,
  },
  standingEnemy: {
    backgroundColor: themeColors.standing.enemy,
  },
  standingText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  standingTextLight: {
    color: themeColors.text.primary,
  },
  standingTextDark: {
    color: themeColors.text.primary,
  },
  presentBadge: {
    ...commonStyles.badge.base,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  presentBadgeActive: {
    backgroundColor: themeColors.status.present,
    borderColor: themeColors.status.present,
  },
  presentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: themeColors.text.muted,
    letterSpacing: 0.3,
  },
  presentBadgeTextActive: {
    color: themeColors.text.primary,
  },
  
  // Faction Header Styles
  factionHeader: {
    ...commonStyles.card.base,
    padding: 20,
    marginBottom: 24,
  },
  factionName: {
    ...commonStyles.text.h1,
    textAlign: 'center',
    marginBottom: 16,
  },
  
  // Description Styles
  descriptionSection: {
    marginTop: 8,
  },
  descriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  descriptionLabel: {
    ...commonStyles.text.label,
  },
  editButton: {
    ...commonStyles.button.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButtonText: {
    color: themeColors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionDisplay: {
    backgroundColor: themeColors.elevated,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: themeColors.border,
    minHeight: 80,
  },
  descriptionText: {
    fontSize: 14,
    color: themeColors.text.primary,
    lineHeight: 20,
  },
  descriptionEditContainer: {
    gap: 12,
  },
  descriptionInput: {
    ...commonStyles.input.base,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  descriptionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: themeColors.accent.primary,
  },
  cancelButton: {
    ...commonStyles.button.secondary,
  },
  saveButtonText: {
    color: themeColors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: themeColors.text.muted,
    fontSize: 14,
    fontWeight: '600',
  },
});