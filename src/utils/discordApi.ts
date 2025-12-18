import * as FileSystem from 'expo-file-system/legacy';
import { DiscordMessage, DiscordAttachment } from '@models/types';
import {
  getDiscordConfig,
  saveDiscordConfig,
  addDiscordMessages,
  getCharacterIdForDiscordUser,
} from './discordStorage';

// Discord API base URL
const DISCORD_API_BASE = 'https://discord.com/api/v10';

/**
 * Check if Discord is configured and enabled
 */
export const isDiscordConfigured = async (): Promise<boolean> => {
  const config = await getDiscordConfig();
  return (
    config.enabled &&
    !!config.botToken &&
    !!config.guildId &&
    !!config.channelId
  );
};

/**
 * Verify Discord bot token by making a test API call
 */
export const verifyDiscordToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
      headers: {
        Authorization: `Bot ${token}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Verify channel access
 */
export const verifyChannelAccess = async (
  token: string,
  channelId: string
): Promise<boolean> => {
  try {
    const response = await fetch(`${DISCORD_API_BASE}/channels/${channelId}`, {
      headers: {
        Authorization: `Bot ${token}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
};

interface DiscordApiMessage {
  id: string;
  channel_id: string;
  author: {
    id: string;
    username: string;
    discriminator: string;
  };
  content: string;
  timestamp: string;
  attachments: Array<{
    id: string;
    filename: string;
    url: string;
    content_type?: string;
    size: number;
  }>;
}

/**
 * Fetch messages from a Discord channel
 */
export const fetchDiscordMessages = async (
  limit: number = 100,
  before?: string
): Promise<DiscordMessage[]> => {
  const config = await getDiscordConfig();
  if (!config.botToken || !config.channelId) {
    throw new Error('Discord not configured');
  }

  let url = `${DISCORD_API_BASE}/channels/${config.channelId}/messages?limit=${limit}`;
  if (before) {
    url += `&before=${before}`;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bot ${config.botToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch messages: ${response.status} ${errorText}`
    );
  }

  const messages: DiscordApiMessage[] = await response.json();

  // Convert to our format and fetch character mappings
  const convertedMessages: DiscordMessage[] = await Promise.all(
    messages.map(async msg => {
      const characterId = await getCharacterIdForDiscordUser(msg.author.id);

      // Download attachments if they are images
      const imageUris: string[] = [];
      const attachments: DiscordAttachment[] = [];

      for (const attachment of msg.attachments) {
        attachments.push({
          id: attachment.id,
          filename: attachment.filename,
          url: attachment.url,
          contentType: attachment.content_type,
          size: attachment.size,
        });

        // Download images
        if (
          attachment.content_type &&
          attachment.content_type.startsWith('image/')
        ) {
          try {
            const imageUri = await downloadDiscordImage(
              attachment.url,
              attachment.filename
            );
            if (imageUri) {
              imageUris.push(imageUri);
            }
          } catch (error) {
            console.error(
              `Failed to download Discord image ${attachment.filename}:`,
              error
            );
          }
        }
      }

      return {
        id: msg.id,
        channelId: msg.channel_id,
        authorId: msg.author.id,
        authorUsername: `${msg.author.username}#${msg.author.discriminator}`,
        content: msg.content,
        timestamp: msg.timestamp,
        characterId,
        imageUris: imageUris.length > 0 ? imageUris : undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
        createdAt: new Date().toISOString(),
      };
    })
  );

  return convertedMessages;
};

/**
 * Download an image from Discord and save it locally
 */
const downloadDiscordImage = async (
  url: string,
  filename: string
): Promise<string | null> => {
  try {
    const timestamp = Date.now();
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const localUri =
      (FileSystem.documentDirectory || FileSystem.cacheDirectory || '') +
      `discord_images/${timestamp}_${safeFilename}`;

    // Ensure directory exists
    const dirUri =
      (FileSystem.documentDirectory || FileSystem.cacheDirectory || '') +
      'discord_images/';
    const dirInfo = await FileSystem.getInfoAsync(dirUri);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
    }

    // Download the image
    const downloadResult = await FileSystem.downloadAsync(url, localUri);
    return downloadResult.uri;
  } catch (error) {
    console.error('Failed to download Discord image:', error);
    return null;
  }
};

/**
 * Sync Discord messages (fetch new messages and store them)
 */
export const syncDiscordMessages = async (
  onProgress?: (status: string) => void
): Promise<{ newMessages: number; totalMessages: number }> => {
  const configured = await isDiscordConfigured();
  if (!configured) {
    throw new Error('Discord is not configured');
  }

  onProgress?.('Fetching messages from Discord...');

  // Fetch initial batch
  let allMessages: DiscordMessage[] = [];
  let lastMessageId: string | undefined;
  let hasMore = true;
  let fetchCount = 0;
  const maxFetches = 10; // Limit to 1000 messages per sync (100 per fetch)

  while (hasMore && fetchCount < maxFetches) {
    const messages = await fetchDiscordMessages(100, lastMessageId);
    if (messages.length === 0) {
      hasMore = false;
    } else {
      allMessages = [...allMessages, ...messages];
      lastMessageId = messages[messages.length - 1].id;
      fetchCount++;
      onProgress?.(`Fetched ${allMessages.length} messages from Discord...`);
    }
  }

  // Store messages
  onProgress?.('Saving messages to local storage...');
  const beforeCount = (
    await import('./discordStorage').then(m => m.getDiscordMessages())
  ).length;
  await addDiscordMessages(allMessages);
  const afterCount = (
    await import('./discordStorage').then(m => m.getDiscordMessages())
  ).length;

  // Update last sync timestamp
  const config = await getDiscordConfig();
  config.lastSync = new Date().toISOString();
  await saveDiscordConfig(config);

  onProgress?.('Sync complete!');

  return {
    newMessages: afterCount - beforeCount,
    totalMessages: afterCount,
  };
};

/**
 * Test Discord connection
 */
export const testDiscordConnection = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const config = await getDiscordConfig();
    if (!config.botToken) {
      return { success: false, error: 'Bot token not configured' };
    }
    if (!config.channelId) {
      return { success: false, error: 'Channel ID not configured' };
    }

    const tokenValid = await verifyDiscordToken(config.botToken);
    if (!tokenValid) {
      return { success: false, error: 'Invalid bot token' };
    }

    const channelAccessible = await verifyChannelAccess(
      config.botToken,
      config.channelId
    );
    if (!channelAccessible) {
      return { success: false, error: 'Cannot access channel' };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
