import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { loadCharacters } from '../utils/characterStorage';
import { calculateCharacterStats, CharacterStats } from '../utils/characterStats';
import { GameCharacter } from '@/models/types';

export const CharacterStatsScreen = () => {
  const [stats, setStats] = useState<CharacterStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const characters = await loadCharacters();
    if (!characters.length) {
      setStats(null);
      return;
    }

    const stats = calculateStats(characters);
    setStats(stats);
  };

  const calculateStats = (characters: GameCharacter[]): CharacterStats => {
    return calculateCharacterStats(characters);
  };

  if (!stats) {
    return (
      <View style={styles.container}>
        <Text>No character data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Character Statistics</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>General Stats</Text>
        <Text>Total Characters: {stats.totalCharacters}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Species Distribution</Text>
        {Object.entries(stats.speciesDistribution).map(([species, count]) => (
          <Text key={species}>{species}: {count} character{count !== 1 ? 's' : ''}</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Faction Membership</Text>
        {Object.entries(stats.factionDistribution).map(([factionName, count]) => (
          <Text key={factionName}>{factionName}: {count} characters</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Faction Standings</Text>
        {Object.entries(stats.factionStandings).map(([faction, standings]) => (
          <View key={faction} style={styles.factionItem}>
            <Text style={styles.factionName}>{faction}</Text>
            {Object.entries(standings).map(([standing, count]) => (
              <Text key={standing} style={styles.standingText}>
                {standing}: {count} character{count !== 1 ? 's' : ''}
              </Text>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Most Common Perks</Text>
        {stats.commonPerks.map(({ name, count }) => (
          <Text key={name}>{name}: {count} characters</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Most Common Distinctions</Text>
        {stats.commonDistinctions.map(({ name, count }) => (
          <Text key={name}>{name}: {count} characters</Text>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  factionItem: {
    marginVertical: 8,
    paddingLeft: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  factionName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  standingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
});