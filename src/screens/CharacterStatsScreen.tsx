import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { loadCharacters } from '../utils/characterStorage';
import { calculateCharacterStats, CharacterStats } from '../utils/characterStats';
import { GameCharacter } from '@/models/types';

export const CharacterStatsScreen = () => {
  const [stats, setStats] = useState<CharacterStats | null>(null);
  const [selectedSlice, setSelectedSlice] = useState<string | null>(null);
  const [showOnlyPresent, setShowOnlyPresent] = useState<boolean>(false);
  const [allCharacters, setAllCharacters] = useState<GameCharacter[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    // Recalculate stats when filter changes
    if (allCharacters.length > 0) {
      const filteredCharacters = showOnlyPresent 
        ? allCharacters.filter(c => c.present === true)
        : allCharacters;
      
      if (filteredCharacters.length === 0) {
        setStats(null);
      } else {
        const stats = calculateStats(filteredCharacters);
        setStats(stats);
      }
    }
  }, [showOnlyPresent, allCharacters]);

  const loadStats = async () => {
    const characters = await loadCharacters();
    setAllCharacters(characters);
    
    if (!characters.length) {
      setStats(null);
      return;
    }

    const filteredCharacters = showOnlyPresent 
      ? characters.filter(c => c.present === true)
      : characters;
    
    if (filteredCharacters.length === 0) {
      setStats(null);
    } else {
      const stats = calculateStats(filteredCharacters);
      setStats(stats);
    }
  };

  const calculateStats = (characters: GameCharacter[]): CharacterStats => {
    return calculateCharacterStats(characters);
  };

  const getSpeciesPieChartData = () => {
    if (!stats) return [];
    
    // More distinct and readable colors
    const colors = [
      '#E74C3C', // Red
      '#3498DB', // Blue
      '#F39C12', // Orange
      '#2ECC71', // Green
      '#9B59B6', // Purple
      '#1ABC9C', // Teal
      '#E67E22', // Dark Orange
      '#34495E', // Dark Blue-Gray
      '#F1C40F', // Yellow
      '#95A5A6', // Gray
      '#E91E63', // Pink
      '#00BCD4', // Cyan
      '#FF9800', // Amber
      '#4CAF50', // Light Green
      '#673AB7'  // Deep Purple
    ];
    
    return Object.entries(stats.speciesDistribution).map(([species, count], index) => ({
      value: count,
      color: colors[index % colors.length],
      text: `${count}`, // Show count on slice
      label: species,
      onPress: () => handleSlicePress(species, count),
    }));
  };

  const handleSlicePress = (species: string, count: number) => {
    const percentage = ((count / (stats?.totalCharacters || 1)) * 100).toFixed(1);
    setSelectedSlice(selectedSlice === species ? null : species);
    
    // Show a temporary alert or tooltip-like behavior
    if (selectedSlice !== species) {
      setTimeout(() => {
        setSelectedSlice(null);
      }, 3000); // Auto-hide after 3 seconds
    }
  };

  const getSpeciesColors = () => {
    if (!stats) return {};
    
    const colors = [
      '#E74C3C', '#3498DB', '#F39C12', '#2ECC71', '#9B59B6',
      '#1ABC9C', '#E67E22', '#34495E', '#F1C40F', '#95A5A6',
      '#E91E63', '#00BCD4', '#FF9800', '#4CAF50', '#673AB7'
    ];
    
    const colorMap: { [key: string]: string } = {};
    Object.keys(stats.speciesDistribution).forEach((species, index) => {
      colorMap[species] = colors[index % colors.length];
    });
    
    return colorMap;
  };

  if (!stats) {
    return (
      <View style={styles.container}>
        <Text>No character data available</Text>
      </View>
    );
  }

  return (
    <View style={{ height: 882, overflow: 'scroll' }}>
                <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={true}
          >
      <Text style={styles.header}>Character Statistics</Text>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, showOnlyPresent && styles.filterButtonActive]}
          onPress={() => setShowOnlyPresent(!showOnlyPresent)}
        >
          <Text style={[styles.filterButtonText, showOnlyPresent && styles.filterButtonTextActive]}>
            {showOnlyPresent ? 'Present Only ✓' : 'Show Present Only'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.filterInfo}>
          {showOnlyPresent 
            ? `Showing ${stats?.totalCharacters || 0} present characters` 
            : `Showing all ${stats?.totalCharacters || 0} characters`}
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>General Stats</Text>
        <Text>Total Characters: {stats.totalCharacters}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Species Distribution</Text>
        {getSpeciesPieChartData().length > 0 && (
          <View style={styles.chartContainer}>
            <PieChart
              data={getSpeciesPieChartData()}
              donut
              showText
              textColor="white"
              textSize={14}
              fontWeight="bold"
              radius={100}
              innerRadius={40}
              innerCircleColor={'#f8f9fa'}
              strokeColor="white"
              strokeWidth={2}
              sectionAutoFocus
              focusOnPress
              toggleFocusOnPress
              centerLabelComponent={() => {
                if (selectedSlice && stats) {
                  const count = stats.speciesDistribution[selectedSlice];
                  const percentage = ((count / stats.totalCharacters) * 100).toFixed(1);
                  return (
                    <View style={styles.centerLabel}>
                      <Text style={styles.centerLabelSpecies}>
                        {selectedSlice}
                      </Text>
                      <Text style={styles.centerLabelNumber}>
                        {count}
                      </Text>
                      <Text style={styles.centerLabelText}>
                        {percentage}%
                      </Text>
                    </View>
                  );
                }
                return (
                  <View style={styles.centerLabel}>
                    <Text style={styles.centerLabelNumber}>
                      {stats?.totalCharacters}
                    </Text>
                    <Text style={styles.centerLabelText}>
                      Characters
                    </Text>
                  </View>
                );
              }}
            />
            {selectedSlice && (
              <View style={styles.tooltip}>
                <Text style={styles.tooltipText}>
                  Tap slice again or wait to return to overview
                </Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.speciesLegend}>
          {Object.entries(stats.speciesDistribution).map(([species, count]) => {
            const colors = getSpeciesColors();
            const percentage = ((count / stats.totalCharacters) * 100).toFixed(1);
            const isSelected = selectedSlice === species;
            return (
              <View 
                key={species} 
                style={[
                  styles.legendItem, 
                  isSelected && styles.legendItemSelected
                ]}
              >
                <View 
                  style={[
                    styles.legendColorBox, 
                    { backgroundColor: colors[species] },
                    isSelected && styles.legendColorBoxSelected
                  ]} 
                />
                <Text style={[
                  styles.legendText,
                  isSelected && styles.legendTextSelected
                ]}>
                  {species}: {count} ({percentage}%)
                </Text>
              </View>
            );
          })}
        </View>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 100,
    backgroundColor: '#fff',
  },
  scrollView: {
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  filterContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    borderWidth: 1,
    borderColor: '#BDBDBD',
    marginBottom: 8,
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#388E3C',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  filterInfo: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
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
  chartContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  centerLabel: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLabelNumber: {
    fontSize: 24,
    color: '#2C3E50',
    fontWeight: 'bold',
  },
  centerLabelText: {
    fontSize: 12,
    color: '#7F8C8D',
    textTransform: 'uppercase',
  },
  centerLabelSpecies: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  tooltip: {
    position: 'absolute',
    bottom: -30,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'center',
  },
  tooltipText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  speciesLegend: {
    marginTop: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    paddingHorizontal: 8,
  },
  legendColorBox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  legendText: {
    fontSize: 15,
    color: '#2C3E50',
    fontWeight: '500',
    flex: 1,
  },
  legendItemSelected: {
    backgroundColor: '#E8F4FD',
    borderRadius: 6,
    paddingVertical: 2,
  },
  legendColorBoxSelected: {
    borderWidth: 2,
    borderColor: '#2C3E50',
    transform: [{ scale: 1.1 }],
  },
  legendTextSelected: {
    fontWeight: 'bold',
    color: '#1A252F',
  },
  speciesText: {
    fontSize: 14,
    marginVertical: 2,
  },
});