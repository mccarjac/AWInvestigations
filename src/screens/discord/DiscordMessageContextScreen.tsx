import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import Markdown from 'react-native-markdown-display';
import { RootStackParamList } from '@/navigation/types';
import { DiscordMessage } from '@/models/types';
import { getDiscordMessages } from '@/utils/discordStorage';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '@/styles/theme';

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

      // Show ALL messages, not filtered by character
      // Sort by timestamp (oldest first for conversation context)
      const sorted = allMessages.sort(
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
            <View style={styles.messageContentContainer}>
              {msg.content ? (
                <Markdown style={markdownStyles}>{msg.content}</Markdown>
              ) : (
                <Text style={styles.messageContent}>[No content]</Text>
              )}
            </View>
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
    backgroundColor: colors.primary,
  },
  contentContainer: {
    padding: spacing.base,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  loadingText: {
    marginTop: spacing.base,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: spacing.xxl,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  messageContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.base,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  highlightedMessage: {
    backgroundColor: colors.elevated,
    borderColor: colors.accent.warning,
    borderWidth: 2,
    ...shadows.large,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  authorName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.accent.primary,
  },
  timestamp: {
    fontSize: typography.fontSize.sm,
    color: colors.text.muted,
    fontWeight: typography.fontWeight.normal,
  },
  messageContentContainer: {
    marginBottom: spacing.sm,
  },
  messageContent: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    lineHeight: typography.lineHeight.relaxed,
  },
  imageIndicator: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
});

const markdownStyles = {
  body: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.relaxed,
  },
  heading1: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold as const,
    marginBottom: spacing.sm,
  },
  heading2: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold as const,
    marginBottom: spacing.sm,
  },
  heading3: {
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold as const,
    marginBottom: spacing.xs,
  },
  paragraph: {
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  strong: {
    fontWeight: typography.fontWeight.bold as const,
  },
  em: {
    fontStyle: 'italic' as const,
  },
  link: {
    color: colors.accent.primary,
  },
  list_item: {
    color: colors.text.primary,
  },
  bullet_list: {
    marginBottom: spacing.sm,
  },
  ordered_list: {
    marginBottom: spacing.sm,
  },
  code_inline: {
    backgroundColor: colors.elevated,
    color: colors.accent.info,
    fontFamily: 'monospace' as const,
    padding: 2,
    borderRadius: borderRadius.sm,
  },
  code_block: {
    backgroundColor: colors.elevated,
    color: colors.text.primary,
    fontFamily: 'monospace' as const,
    padding: spacing.sm,
    borderRadius: borderRadius.base,
    marginBottom: spacing.sm,
  },
};
