import {
  DiscordConfig,
  DiscordUserMapping,
  DiscordMessage,
  DiscordDataset,
} from '@models/types';
import { SafeAsyncStorageJSONParser } from './safeAsyncStorageJSONParser';

const DISCORD_CONFIG_KEY = 'gameCharacterManager_discord_config';
const DISCORD_MAPPINGS_KEY = 'gameCharacterManager_discord_mappings';
const DISCORD_MESSAGES_KEY = 'gameCharacterManager_discord_messages';

/**
 * Get Discord configuration
 */
export const getDiscordConfig = async (): Promise<DiscordConfig> => {
  const config =
    await SafeAsyncStorageJSONParser.getItem<DiscordConfig>(DISCORD_CONFIG_KEY);
  return (
    config || {
      enabled: false,
      autoSync: true,
    }
  );
};

/**
 * Save Discord configuration
 */
export const saveDiscordConfig = async (
  config: DiscordConfig
): Promise<void> => {
  await SafeAsyncStorageJSONParser.setItem(DISCORD_CONFIG_KEY, config);
};

/**
 * Get all Discord user mappings
 */
export const getDiscordUserMappings = async (): Promise<
  DiscordUserMapping[]
> => {
  const mappings =
    await SafeAsyncStorageJSONParser.getItem<DiscordUserMapping[]>(
      DISCORD_MAPPINGS_KEY
    );
  return mappings || [];
};

/**
 * Save Discord user mappings
 */
export const saveDiscordUserMappings = async (
  mappings: DiscordUserMapping[]
): Promise<void> => {
  await SafeAsyncStorageJSONParser.setItem(DISCORD_MAPPINGS_KEY, mappings);
};

/**
 * Add a Discord user mapping
 */
export const addDiscordUserMapping = async (
  discordUserId: string,
  discordUsername: string,
  characterId: string
): Promise<DiscordUserMapping> => {
  const mappings = await getDiscordUserMappings();

  // Check if mapping already exists for this Discord user
  const existingIndex = mappings.findIndex(
    m => m.discordUserId === discordUserId
  );

  const now = new Date().toISOString();
  const mapping: DiscordUserMapping = {
    discordUserId,
    discordUsername,
    characterId,
    createdAt: existingIndex >= 0 ? mappings[existingIndex].createdAt : now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    mappings[existingIndex] = mapping;
  } else {
    mappings.push(mapping);
  }

  await saveDiscordUserMappings(mappings);
  return mapping;
};

/**
 * Remove a Discord user mapping
 */
export const removeDiscordUserMapping = async (
  discordUserId: string
): Promise<void> => {
  const mappings = await getDiscordUserMappings();
  const filtered = mappings.filter(m => m.discordUserId !== discordUserId);
  await saveDiscordUserMappings(filtered);
};

/**
 * Get character ID for a Discord user
 */
export const getCharacterIdForDiscordUser = async (
  discordUserId: string
): Promise<string | undefined> => {
  const mappings = await getDiscordUserMappings();
  const mapping = mappings.find(m => m.discordUserId === discordUserId);
  return mapping?.characterId;
};

/**
 * Get all Discord messages
 */
export const getDiscordMessages = async (): Promise<DiscordMessage[]> => {
  const messages =
    await SafeAsyncStorageJSONParser.getItem<DiscordMessage[]>(
      DISCORD_MESSAGES_KEY
    );
  return messages || [];
};

/**
 * Save Discord messages
 */
export const saveDiscordMessages = async (
  messages: DiscordMessage[]
): Promise<void> => {
  await SafeAsyncStorageJSONParser.setItem(DISCORD_MESSAGES_KEY, messages);
};

/**
 * Add Discord messages (bulk)
 */
export const addDiscordMessages = async (
  newMessages: DiscordMessage[]
): Promise<void> => {
  const existingMessages = await getDiscordMessages();
  const existingIds = new Set(existingMessages.map(m => m.id));

  // Only add messages that don't already exist
  const uniqueNewMessages = newMessages.filter(m => !existingIds.has(m.id));

  if (uniqueNewMessages.length > 0) {
    const allMessages = [...existingMessages, ...uniqueNewMessages];
    // Sort by timestamp (oldest first)
    allMessages.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    await saveDiscordMessages(allMessages);
  }
};

/**
 * Get Discord messages for a specific character
 */
export const getDiscordMessagesForCharacter = async (
  characterId: string
): Promise<DiscordMessage[]> => {
  const messages = await getDiscordMessages();
  return messages.filter(m => m.characterId === characterId);
};

/**
 * Clear all Discord data
 */
export const clearDiscordData = async (): Promise<void> => {
  await SafeAsyncStorageJSONParser.removeItem(DISCORD_CONFIG_KEY);
  await SafeAsyncStorageJSONParser.removeItem(DISCORD_MAPPINGS_KEY);
  await SafeAsyncStorageJSONParser.removeItem(DISCORD_MESSAGES_KEY);
};

/**
 * Export Discord data as a dataset
 */
export const exportDiscordDataset = async (): Promise<DiscordDataset> => {
  const config = await getDiscordConfig();
  const userMappings = await getDiscordUserMappings();
  const messages = await getDiscordMessages();

  return {
    config,
    userMappings,
    messages,
    version: '1.0',
    lastUpdated: new Date().toISOString(),
  };
};

/**
 * Import Discord dataset
 */
export const importDiscordDataset = async (
  dataset: DiscordDataset,
  merge: boolean = true
): Promise<void> => {
  if (!merge) {
    // Replace all data
    await saveDiscordConfig(dataset.config);
    await saveDiscordUserMappings(dataset.userMappings);
    await saveDiscordMessages(dataset.messages);
  } else {
    // Merge data
    const existingConfig = await getDiscordConfig();
    const existingMappings = await getDiscordUserMappings();
    const existingMessages = await getDiscordMessages();

    // Merge config (prefer imported if enabled)
    const mergedConfig = dataset.config.enabled
      ? dataset.config
      : existingConfig;
    await saveDiscordConfig(mergedConfig);

    // Merge mappings (by Discord user ID)
    const mappingMap = new Map<string, DiscordUserMapping>();
    existingMappings.forEach(m => mappingMap.set(m.discordUserId, m));
    dataset.userMappings.forEach(m => mappingMap.set(m.discordUserId, m));
    await saveDiscordUserMappings(Array.from(mappingMap.values()));

    // Merge messages (by message ID)
    const messageMap = new Map<string, DiscordMessage>();
    existingMessages.forEach(m => messageMap.set(m.id, m));
    dataset.messages.forEach(m => messageMap.set(m.id, m));
    const mergedMessages = Array.from(messageMap.values());
    mergedMessages.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    await saveDiscordMessages(mergedMessages);
  }
};
