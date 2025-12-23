import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { DiscordMessage } from '@/models/types';
import { getDiscordMessages } from '@/utils/discordStorage';
import { colors } from '@/styles/theme';

type DiscordMessageContextRouteProp = RouteProp<
  RootStackParamList,
  'DiscordMessageContext'
>;

export const DiscordMessageContextScreen: React.FC = () => {
  const route = useRoute<DiscordMessageContextRouteProp>();
  const { messageId, characterId } = route.params;
  const [messages, setMessages] = useState<DiscordMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const highlightedMessageRef = useRef<View>(null);

  useEffect(() => {
    loadMessages();
  }, [characterId]);

  const loadMessages = async () => {
    try {
      const allMessages = await getDiscordMessages();
      
      // Filter messages by characterId if provided, otherwise show all
      const filtered = characterId
        ? allMessages.filter(msg => msg.characterId === characterId)
        : allMessages;

      // Sort by timestamp (oldest first for conversation context)
      const sorted = filtered.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      setMessages(sorted);
    } catch (error) {
      console.error('[DiscordMessageContext] Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Scroll to highlighted message after render
  useEffect(() => {
    if (!loading && messages.length > 0 && highlightedMessageRef.current) {
      // Small delay to ensure layout is complete
      setTimeout(() => {
        highlightedMessageRef.current?.measureLayout(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          scrollViewRef.current as any,
          (_x, y) => {
            scrollViewRef.current?.scrollTo({
              y: Math.max(0, y - 100),
              animated: true,
            });
          },
          () => {
            console.log('[DiscordMessageContext] Failed to measure layout');
          }
        );
      }, 100);
    }
  }, [loading, messages.length]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </View>
    );
  }

  if (messages.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No messages found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {messages.map((msg, index) => {
        const isHighlighted = msg.id === messageId;
        return (
          <View
            key={msg.id || index}
            ref={isHighlighted ? highlightedMessageRef : null}
            style={[
              styles.messageContainer,
              isHighlighted && styles.highlightedMessage,
            ]}
          >
            <View style={styles.messageHeader}>
              <Text style={styles.authorName}>{msg.authorUsername}</Text>
              <Text style={styles.timestamp}>
                {new Date(msg.timestamp).toLocaleString()}
              </Text>
            </View>
            <Text style={styles.messageContent}>{msg.content || '[No content]'}</Text>
            {msg.images && msg.images.length > 0 && (
              <Text style={styles.imageIndicator}>
                📷 {msg.images.length} image{msg.images.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  messageContainer: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  highlightedMessage: {
    backgroundColor: '#3A3520',
    borderColor: '#FFA500',
    borderWidth: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  messageContent: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  imageIndicator: {
    marginTop: 8,
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
