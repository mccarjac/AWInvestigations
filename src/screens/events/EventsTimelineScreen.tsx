import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Text,
  TextInput,
  Image,
} from 'react-native';
import { GameEvent } from '@models/types';
import {
  loadEvents,
  loadCharacters,
  loadLocations,
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
import { colors as themeColors } from '@/styles/theme';
import { commonStyles } from '@/styles/commonStyles';
import { Picker } from '@react-native-picker/picker';

type EventsNavigationProp = CompositeNavigationProp<
  DrawerNavigationProp<RootDrawerParamList, 'Events'>,
  StackNavigationProp<RootStackParamList>
>;

interface EventWithDetails extends GameEvent {
  locationName?: string;
  characterNames: string[];
}

export const EventsTimelineScreen: React.FC = () => {
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterLocation, setFilterLocation] = useState<string>('');
  const [filterCharacter, setFilterCharacter] = useState<string>('');
  const [filterFaction, setFilterFaction] = useState<string>('');
  const [characters, setCharacters] = useState<{ id: string; name: string }[]>(
    []
  );
  const [locations, setLocations] = useState<{ id: string; name: string }[]>(
    []
  );
  const [factions, setFactions] = useState<string[]>([]);
  const navigation = useNavigation<EventsNavigationProp>();

  const loadData = useCallback(async () => {
    const eventsData = await loadEvents();
    const charactersData = await loadCharacters();
    const locationsData = await loadLocations();
    const factionsData = await loadFactions();

    // Create lookup maps
    const locationMap = new Map(locationsData.map(l => [l.id, l.name]));
    const characterMap = new Map(charactersData.map(c => [c.id, c.name]));

    // Enhance events with location and character names
    const eventsWithDetails: EventWithDetails[] = eventsData.map(event => ({
      ...event,
      locationName: event.locationId
        ? locationMap.get(event.locationId)
        : undefined,
      characterNames:
        event.characterIds?.map(id => characterMap.get(id) || 'Unknown') || [],
    }));

    // Sort by date descending (newest first)
    eventsWithDetails.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setEvents(eventsWithDetails);

    // Set filter options
    setCharacters(
      charactersData
        .map(c => ({ id: c.id, name: c.name }))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
    setLocations(
      locationsData
        .map(l => ({ id: l.id, name: l.name }))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
    setFactions(
      factionsData.map(f => f.name).sort((a, b) => a.localeCompare(b))
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('EventsForm', {})}
        >
          <Text style={styles.addButtonText}>+ Add Event</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const getFilteredEvents = useCallback(() => {
    let filtered = events;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        event =>
          event.title.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.notes?.toLowerCase().includes(query)
      );
    }

    // Filter by location ID
    if (filterLocation) {
      filtered = filtered.filter(event => event.locationId === filterLocation);
    }

    // Filter by character ID
    if (filterCharacter) {
      filtered = filtered.filter(event =>
        event.characterIds?.includes(filterCharacter)
      );
    }

    // Filter by faction name
    if (filterFaction) {
      filtered = filtered.filter(event =>
        event.factionNames?.includes(filterFaction)
      );
    }

    return filtered;
  }, [events, searchQuery, filterLocation, filterCharacter, filterFaction]);

  const formatDate = (dateString: string, timeString?: string): string => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    return timeString ? `${dateStr} at ${timeString}` : dateStr;
  };

  const renderEvent = ({ item }: { item: EventWithDetails }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => navigation.navigate('EventsDetail', { eventId: item.id })}
    >
      <View style={styles.eventHeader}>
        <View style={styles.eventTitleContainer}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventDate}>
            {formatDate(item.date, item.time)}
          </Text>
        </View>
        {item.imageUri && (
          <Image
            source={{ uri: item.imageUri }}
            style={styles.eventThumbnail}
          />
        )}
      </View>

      {item.description && (
        <Text style={styles.eventDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.eventMeta}>
        {item.locationName && (
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Location:</Text>
            <Text style={styles.metaValue}>{item.locationName}</Text>
          </View>
        )}

        {item.characterNames.length > 0 && (
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Characters:</Text>
            <Text style={styles.metaValue} numberOfLines={1}>
              {item.characterNames.join(', ')}
            </Text>
          </View>
        )}

        {item.factionNames && item.factionNames.length > 0 && (
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Factions:</Text>
            <Text style={styles.metaValue} numberOfLines={1}>
              {item.factionNames.join(', ')}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const filteredEvents = getFilteredEvents();

  return (
    <View style={commonStyles.layout.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search events..."
          placeholderTextColor={themeColors.text.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={filterLocation}
            onValueChange={setFilterLocation}
            style={styles.picker}
            dropdownIconColor={themeColors.text.secondary}
          >
            <Picker.Item label="All Locations" value="" />
            {locations.map(location => (
              <Picker.Item
                key={location.id}
                label={location.name}
                value={location.id}
              />
            ))}
          </Picker>
        </View>

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={filterCharacter}
            onValueChange={setFilterCharacter}
            style={styles.picker}
            dropdownIconColor={themeColors.text.secondary}
          >
            <Picker.Item label="All Characters" value="" />
            {characters.map(character => (
              <Picker.Item
                key={character.id}
                label={character.name}
                value={character.id}
              />
            ))}
          </Picker>
        </View>

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={filterFaction}
            onValueChange={setFilterFaction}
            style={styles.picker}
            dropdownIconColor={themeColors.text.secondary}
          >
            <Picker.Item label="All Factions" value="" />
            {factions.map(faction => (
              <Picker.Item key={faction} label={faction} value={faction} />
            ))}
          </Picker>
        </View>
      </View>

      <FlatList
        data={filteredEvents}
        renderItem={renderEvent}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No events found</Text>
            <Text style={styles.emptySubtext}>
              Tap "+ Add Event" to create your first event
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  addButton: {
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: themeColors.accent.primary,
    borderRadius: 8,
  },
  addButtonText: {
    color: themeColors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  searchInput: {
    backgroundColor: themeColors.elevated,
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: 8,
    padding: 12,
    color: themeColors.text.primary,
    fontSize: 16,
  },
  filtersContainer: {
    padding: 16,
    paddingTop: 8,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
    gap: 8,
  },
  pickerContainer: {
    backgroundColor: themeColors.elevated,
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    color: themeColors.text.primary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  eventCard: {
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: themeColors.text.primary,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: themeColors.text.secondary,
  },
  eventThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: themeColors.elevated,
  },
  eventDescription: {
    fontSize: 14,
    color: themeColors.text.secondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  eventMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: themeColors.text.muted,
    fontWeight: '600',
    marginRight: 6,
    minWidth: 70,
  },
  metaValue: {
    fontSize: 12,
    color: themeColors.text.secondary,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: themeColors.text.secondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: themeColors.text.muted,
    textAlign: 'center',
  },
});
