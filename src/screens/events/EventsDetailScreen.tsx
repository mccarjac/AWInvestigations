import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Image } from 'react-native';
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
import { BaseDetailScreen, Section } from '@/components';

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
      <BaseDetailScreen>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading event...</Text>
        </View>
      </BaseDetailScreen>
    );
  }

  return (
    <BaseDetailScreen
      onEditPress={() => navigation.navigate('EventsForm', { event })}
      deleteConfig={{
        itemName: event.title,
        onDelete: async () => {
          await deleteEvent(eventId);
        },
      }}
    >
      {/* Event Images */}
      {((event.imageUris && event.imageUris.length > 0) || event.imageUri) && (
        <View style={styles.imageGallery}>
          {(event.imageUris && event.imageUris.length > 0
            ? event.imageUris
            : event.imageUri
              ? [event.imageUri]
              : []
          ).map((uri, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri }} style={styles.eventImage} />
            </View>
          ))}
        </View>
      )}

      <Section title="Title">
        <Text style={styles.bodyText}>{event.title}</Text>
      </Section>

      {/* Date and Time */}
      <Section title="Date & Time">
        <Text style={styles.bodyText}>
          {formatDate(event.date, event.time)}
        </Text>
      </Section>

      {/* Description */}
      {event.description && (
        <Section title="Description">
          <Text style={styles.bodyText}>{event.description}</Text>
        </Section>
      )}

      {/* Location */}
      {event.locationName && (
        <Section title="Location">
          <Text style={styles.bodyText}>{event.locationName}</Text>
        </Section>
      )}

      {/* Characters */}
      {event.characterNames.length > 0 && (
        <Section title="Characters Involved">
          <View style={styles.list}>
            {event.characterNames.map((name, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listBullet}>•</Text>
                <Text style={styles.listText}>{name}</Text>
              </View>
            ))}
          </View>
        </Section>
      )}

      {/* Factions */}
      {event.factionNames && event.factionNames.length > 0 && (
        <Section title="Factions Involved">
          <View style={styles.list}>
            {event.factionNames.map((name, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listBullet}>•</Text>
                <Text style={styles.listText}>{name}</Text>
              </View>
            ))}
          </View>
        </Section>
      )}

      {/* Notes */}
      {event.notes && (
        <Section title="Notes">
          <Text style={styles.bodyText}>{event.notes}</Text>
        </Section>
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
    </BaseDetailScreen>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: themeColors.text.secondary,
  },
  imageGallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 16,
  },
  imageContainer: {
    width: 280,
    height: 250,
  },
  eventImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: themeColors.elevated,
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
