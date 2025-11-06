import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import {
  loadEvents,
  loadCharacters,
  loadLocations,
  deleteEvent,
} from '@utils/characterStorage';
import { GameEvent } from '@models/types';
import { colors as themeColors } from '@/styles/theme';
import { commonStyles } from '@/styles/commonStyles';

type EventsDetailNavigationProp = StackNavigationProp<
  RootStackParamList,
  'EventsDetail'
>;

type EventsDetailRouteProp = RouteProp<RootStackParamList, 'EventsDetail'>;

interface EventWithDetails extends GameEvent {
  locationName?: string;
  characterNames: string[];
}

export const EventsDetailScreen: React.FC = () => {
  const navigation = useNavigation<EventsDetailNavigationProp>();
  const route = useRoute<EventsDetailRouteProp>();
  const { eventId } = route.params;

  const [event, setEvent] = useState<EventWithDetails | null>(null);

  const loadEventDetails = useCallback(async () => {
    const events = await loadEvents();
    const characters = await loadCharacters();
    const locations = await loadLocations();

    const foundEvent = events.find(e => e.id === eventId);
    if (!foundEvent) {
      Alert.alert('Error', 'Event not found', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      return;
    }

    // Create lookup maps
    const locationMap = new Map(locations.map(l => [l.id, l.name]));
    const characterMap = new Map(characters.map(c => [c.id, c.name]));

    const eventWithDetails: EventWithDetails = {
      ...foundEvent,
      locationName: foundEvent.locationId
        ? locationMap.get(foundEvent.locationId)
        : undefined,
      characterNames:
        foundEvent.characterIds?.map(id => characterMap.get(id) || 'Unknown') ||
        [],
    };

    setEvent(eventWithDetails);
  }, [eventId, navigation]);

  useFocusEffect(
    useCallback(() => {
      loadEventDetails();
    }, [loadEventDetails])
  );

  useLayoutEffect(() => {
    if (event) {
      navigation.setOptions({
        title: event.title,
        headerRight: () => (
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('EventsForm', { event })}
            >
              <Text style={styles.headerButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Text style={[styles.headerButtonText, styles.deleteButtonText]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        ),
      });
    }
  }, [navigation, event]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(eventId);
              Alert.alert('Success', 'Event deleted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert(
                'Error',
                'Failed to delete event. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string, timeString?: string): string => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return timeString ? `${dateStr} at ${timeString}` : dateStr;
  };

  if (!event) {
    return (
      <View style={commonStyles.layout.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading event...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={commonStyles.layout.scrollView}
      contentContainerStyle={styles.content}
    >
      {/* Event Image */}
      {event.imageUri && (
        <Image source={{ uri: event.imageUri }} style={styles.eventImage} />
      )}

      {/* Date and Time */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Date & Time</Text>
        <Text style={styles.dateText}>
          {formatDate(event.date, event.time)}
        </Text>
      </View>

      {/* Description */}
      {event.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.bodyText}>{event.description}</Text>
        </View>
      )}

      {/* Location */}
      {event.locationName && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Text style={styles.bodyText}>{event.locationName}</Text>
        </View>
      )}

      {/* Characters */}
      {event.characterNames.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Characters Involved</Text>
          <View style={styles.list}>
            {event.characterNames.map((name, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listBullet}>•</Text>
                <Text style={styles.listText}>{name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Factions */}
      {event.factionNames && event.factionNames.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Factions Involved</Text>
          <View style={styles.list}>
            {event.factionNames.map((name, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listBullet}>•</Text>
                <Text style={styles.listText}>{name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Notes */}
      {event.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.bodyText}>{event.notes}</Text>
        </View>
      )}

      {/* Metadata */}
      <View style={styles.metadata}>
        <Text style={styles.metadataText}>
          Created: {new Date(event.createdAt).toLocaleDateString()}
        </Text>
        {event.updatedAt !== event.createdAt && (
          <Text style={styles.metadataText}>
            Updated: {new Date(event.updatedAt).toLocaleDateString()}
          </Text>
        )}
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: themeColors.text.secondary,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    marginRight: 16,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: themeColors.accent.primary,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: themeColors.accent.danger,
  },
  headerButtonText: {
    color: themeColors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: themeColors.text.primary,
  },
  eventImage: {
    width: '100%',
    height: 250,
    backgroundColor: themeColors.elevated,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: themeColors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: themeColors.text.primary,
    lineHeight: 24,
  },
  bodyText: {
    fontSize: 16,
    color: themeColors.text.secondary,
    lineHeight: 24,
  },
  list: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  listBullet: {
    fontSize: 16,
    color: themeColors.text.secondary,
    marginRight: 8,
    lineHeight: 24,
  },
  listText: {
    fontSize: 16,
    color: themeColors.text.secondary,
    flex: 1,
    lineHeight: 24,
  },
  metadata: {
    padding: 16,
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
    color: themeColors.text.muted,
  },
  footer: {
    height: 50,
  },
});
