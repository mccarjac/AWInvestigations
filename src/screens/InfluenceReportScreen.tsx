import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { loadCharacters } from '@utils/characterStorage';
import { GameCharacter } from '@models/types';
import {
  getTopInfluencers,
  analyzeFactionInfluence,
  findKeyConnectors,
  findPowerCenters,
  CharacterInfluence,
  FactionInfluence,
} from '@utils/influenceAnalysis';
import { Card, Section } from '@components/index';

export const InfluenceReportScreen: React.FC = () => {
  const [characters, setCharacters] = useState<GameCharacter[]>([]);
  const [topInfluencers, setTopInfluencers] = useState<CharacterInfluence[]>(
    []
  );
  const [factionInfluences, setFactionInfluences] = useState<
    FactionInfluence[]
  >([]);
  const [keyConnectors, setKeyConnectors] = useState<CharacterInfluence[]>([]);
  const [powerCenters, setPowerCenters] = useState<CharacterInfluence[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const loadedCharacters = await loadCharacters();
      setCharacters(loadedCharacters);

      // Calculate all analyses
      const influencers = getTopInfluencers(loadedCharacters, 10);
      const factions = await analyzeFactionInfluence(loadedCharacters);
      const connectors = findKeyConnectors(loadedCharacters, 5);
      const centers = findPowerCenters(loadedCharacters, 5);

      setTopInfluencers(influencers);
      setFactionInfluences(factions);
      setKeyConnectors(connectors);
      setPowerCenters(centers);
    } catch (error) {
      console.error('Error loading influence data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getInfluenceLabel = (score: number): string => {
    if (score >= 50) return 'Extremely Influential';
    if (score >= 30) return 'Highly Influential';
    if (score >= 20) return 'Very Influential';
    if (score >= 10) return 'Influential';
    if (score >= 5) return 'Minor Influence';
    return 'Minimal Influence';
  };

  const getInfluenceColor = (score: number): string => {
    if (score >= 50) return '#FF6B9D';
    if (score >= 30) return '#6C5CE7';
    if (score >= 20) return '#00B894';
    if (score >= 10) return '#FDCB6E';
    return '#B8B8CC';
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={styles.loadingText}>Analyzing influence networks...</Text>
      </View>
    );
  }

  if (characters.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No characters found</Text>
        <Text style={styles.emptySubtext}>
          Add characters to see influence analysis
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#6C5CE7"
          colors={['#6C5CE7']}
        />
      }
    >
      {/* Overview Stats */}
      <Card style={styles.overviewCard}>
        <Text style={styles.overviewTitle}>Network Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{characters.length}</Text>
            <Text style={styles.statLabel}>Total Characters</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{factionInfluences.length}</Text>
            <Text style={styles.statLabel}>Active Factions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {characters.reduce(
                (sum, c) => sum + (c.relationships?.length || 0),
                0
              )}
            </Text>
            <Text style={styles.statLabel}>Total Relationships</Text>
          </View>
        </View>
      </Card>

      {/* Top Influencers */}
      <Section title="Top Influencers" style={styles.section}>
        {topInfluencers.length === 0 ? (
          <Card>
            <Text style={styles.emptySubtext}>
              No influential characters found
            </Text>
          </Card>
        ) : (
          topInfluencers.map((inf, index) => (
            <Card key={inf.character.id} style={styles.influencerCard}>
              <View style={styles.influencerHeader}>
                <View style={styles.influencerRank}>
                  <Text style={styles.rankNumber}>#{index + 1}</Text>
                </View>
                <View style={styles.influencerInfo}>
                  <Text style={styles.characterName}>{inf.character.name}</Text>
                  <Text style={styles.characterSpecies}>
                    {inf.character.species}
                    {inf.character.occupation
                      ? ` • ${inf.character.occupation}`
                      : ''}
                  </Text>
                </View>
                <View style={styles.influenceScoreContainer}>
                  <Text
                    style={[
                      styles.influenceScore,
                      { color: getInfluenceColor(inf.influenceScore) },
                    ]}
                  >
                    {inf.influenceScore}
                  </Text>
                  <Text style={styles.influenceScoreLabel}>influence</Text>
                </View>
              </View>

              <View style={styles.influenceDetails}>
                <Text
                  style={[
                    styles.influenceLabel,
                    { color: getInfluenceColor(inf.influenceScore) },
                  ]}
                >
                  {getInfluenceLabel(inf.influenceScore)}
                </Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxValue}>
                    {inf.relationshipCount}
                  </Text>
                  <Text style={styles.statBoxLabel}>Relationships</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statBoxValue, { color: '#00B894' }]}>
                    {inf.positiveRelationships}
                  </Text>
                  <Text style={styles.statBoxLabel}>Allies/Friends</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxValue}>{inf.factionCount}</Text>
                  <Text style={styles.statBoxLabel}>Factions</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxValue}>
                    {inf.connections.length}
                  </Text>
                  <Text style={styles.statBoxLabel}>Connections</Text>
                </View>
              </View>

              {inf.factions.length > 0 && (
                <View style={styles.factionsContainer}>
                  <Text style={styles.factionsLabel}>Faction Memberships:</Text>
                  <View style={styles.factionTags}>
                    {inf.factions.map(faction => (
                      <View key={faction} style={styles.factionTag}>
                        <Text style={styles.factionTagText}>{faction}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </Card>
          ))
        )}
      </Section>

      {/* Faction Power Dynamics */}
      <Section title="Faction Power Dynamics" style={styles.section}>
        {factionInfluences.length === 0 ? (
          <Card>
            <Text style={styles.emptySubtext}>No factions found</Text>
          </Card>
        ) : (
          factionInfluences.map((faction, index) => (
            <Card key={faction.name} style={styles.factionCard}>
              <View style={styles.factionHeader}>
                <View style={styles.factionRank}>
                  <Text style={styles.rankNumber}>#{index + 1}</Text>
                </View>
                <View style={styles.factionInfo}>
                  <Text style={styles.factionName}>{faction.name}</Text>
                  <Text style={styles.factionStats}>
                    {faction.memberCount} members • {faction.totalInfluence}{' '}
                    total influence
                  </Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxValue}>{faction.memberCount}</Text>
                  <Text style={styles.statBoxLabel}>Members</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxValue}>
                    {faction.totalInfluence}
                  </Text>
                  <Text style={styles.statBoxLabel}>Total Power</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxValue}>
                    {Math.round(faction.averageInfluence)}
                  </Text>
                  <Text style={styles.statBoxLabel}>Avg Power</Text>
                </View>
              </View>

              {faction.allies.length > 0 && (
                <View style={styles.relationshipsContainer}>
                  <Text style={styles.relationshipLabel}>Allied Factions:</Text>
                  <View style={styles.factionTags}>
                    {faction.allies.map(ally => (
                      <View key={ally} style={styles.allyTag}>
                        <Text style={styles.allyTagText}>{ally}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {faction.enemies.length > 0 && (
                <View style={styles.relationshipsContainer}>
                  <Text style={styles.relationshipLabel}>Enemy Factions:</Text>
                  <View style={styles.factionTags}>
                    {faction.enemies.map(enemy => (
                      <View key={enemy} style={styles.enemyTag}>
                        <Text style={styles.enemyTagText}>{enemy}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {faction.members.length > 0 && (
                <View style={styles.membersContainer}>
                  <Text style={styles.membersLabel}>Key Members:</Text>
                  <Text style={styles.membersList}>
                    {faction.members
                      .slice(0, 5)
                      .map(m => m.name)
                      .join(', ')}
                    {faction.members.length > 5
                      ? ` and ${faction.members.length - 5} more`
                      : ''}
                  </Text>
                </View>
              )}
            </Card>
          ))
        )}
      </Section>

      {/* Key Connectors */}
      {keyConnectors.length > 0 && (
        <Section title="Key Connectors" style={styles.section}>
          <Card>
            <Text style={styles.sectionDescription}>
              Characters who bridge multiple factions and maintain extensive
              relationship networks
            </Text>
          </Card>
          {keyConnectors.map(connector => (
            <Card key={connector.character.id} style={styles.connectorCard}>
              <View style={styles.connectorHeader}>
                <Text style={styles.connectorName}>
                  {connector.character.name}
                </Text>
                <View style={styles.connectorBadge}>
                  <Text style={styles.connectorBadgeText}>Connector</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxValue}>
                    {connector.factionCount}
                  </Text>
                  <Text style={styles.statBoxLabel}>Factions</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxValue}>
                    {connector.relationshipCount}
                  </Text>
                  <Text style={styles.statBoxLabel}>Relationships</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxValue}>
                    {connector.connections.length}
                  </Text>
                  <Text style={styles.statBoxLabel}>Connections</Text>
                </View>
              </View>

              <View style={styles.connectorDetails}>
                <Text style={styles.connectorDescription}>
                  Bridges {connector.factionCount} factions with{' '}
                  {connector.relationshipCount} direct relationships, creating{' '}
                  {connector.connections.length} total connections in the
                  network
                </Text>
              </View>
            </Card>
          ))}
        </Section>
      )}

      {/* Power Centers */}
      {powerCenters.length > 0 && (
        <Section title="Power Centers" style={styles.section}>
          <Card>
            <Text style={styles.sectionDescription}>
              Influential characters who maintain alliances with other
              influential individuals
            </Text>
          </Card>
          {powerCenters.map(center => (
            <Card key={center.character.id} style={styles.powerCenterCard}>
              <View style={styles.powerCenterHeader}>
                <Text style={styles.powerCenterName}>
                  {center.character.name}
                </Text>
                <View style={styles.powerCenterBadge}>
                  <Text style={styles.powerCenterBadgeText}>Power Center</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text
                    style={[
                      styles.statBoxValue,
                      { color: getInfluenceColor(center.influenceScore) },
                    ]}
                  >
                    {center.influenceScore}
                  </Text>
                  <Text style={styles.statBoxLabel}>Influence</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statBoxValue, { color: '#00B894' }]}>
                    {center.positiveRelationships}
                  </Text>
                  <Text style={styles.statBoxLabel}>Allies</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxValue}>{center.factionCount}</Text>
                  <Text style={styles.statBoxLabel}>Factions</Text>
                </View>
              </View>

              <View style={styles.powerCenterDetails}>
                <Text style={styles.powerCenterDescription}>
                  Maintains {center.positiveRelationships} alliances including
                  connections with other highly influential individuals
                </Text>
              </View>
            </Card>
          ))}
        </Section>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F23',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F23',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#B8B8CC',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#B8B8CC',
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
  },
  overviewCard: {
    margin: 16,
    marginBottom: 8,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6C5CE7',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#B8B8CC',
    textAlign: 'center',
  },
  influencerCard: {
    marginBottom: 12,
  },
  influencerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  influencerRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  influencerInfo: {
    flex: 1,
  },
  characterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  characterSpecies: {
    fontSize: 12,
    color: '#B8B8CC',
  },
  influenceScoreContainer: {
    alignItems: 'center',
  },
  influenceScore: {
    fontSize: 24,
    fontWeight: '700',
  },
  influenceScoreLabel: {
    fontSize: 10,
    color: '#B8B8CC',
  },
  influenceDetails: {
    marginBottom: 12,
  },
  influenceLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#1A1A33',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statBoxValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6C5CE7',
    marginBottom: 2,
  },
  statBoxLabel: {
    fontSize: 10,
    color: '#B8B8CC',
    textAlign: 'center',
  },
  factionsContainer: {
    marginTop: 8,
  },
  factionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B8B8CC',
    marginBottom: 6,
  },
  factionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  factionTag: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  factionTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  factionCard: {
    marginBottom: 12,
  },
  factionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  factionRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00B894',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  factionInfo: {
    flex: 1,
  },
  factionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  factionStats: {
    fontSize: 12,
    color: '#B8B8CC',
  },
  relationshipsContainer: {
    marginTop: 8,
  },
  relationshipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B8B8CC',
    marginBottom: 6,
  },
  allyTag: {
    backgroundColor: '#00B894',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  allyTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  enemyTag: {
    backgroundColor: '#D63031',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  enemyTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  membersContainer: {
    marginTop: 8,
  },
  membersLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B8B8CC',
    marginBottom: 4,
  },
  membersList: {
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#B8B8CC',
    lineHeight: 18,
    marginBottom: 0,
  },
  connectorCard: {
    marginBottom: 12,
  },
  connectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  connectorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  connectorBadge: {
    backgroundColor: '#FDCB6E',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectorBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A1A33',
  },
  connectorDetails: {
    marginTop: 8,
  },
  connectorDescription: {
    fontSize: 13,
    color: '#B8B8CC',
    lineHeight: 18,
  },
  powerCenterCard: {
    marginBottom: 12,
  },
  powerCenterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  powerCenterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  powerCenterBadge: {
    backgroundColor: '#FF6B9D',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  powerCenterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  powerCenterDetails: {
    marginTop: 8,
  },
  powerCenterDescription: {
    fontSize: 13,
    color: '#B8B8CC',
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 24,
  },
});
