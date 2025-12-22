import {
  DiscordConfig,
  DiscordUserMapping,
  DiscordMessage,
  DiscordDataset,
  DiscordCharacterAlias,
} from '@models/types';
import { SafeAsyncStorageJSONParser } from './safeAsyncStorageJSONParser';

const DISCORD_CONFIG_KEY = 'gameCharacterManager_discord_config';
const DISCORD_MAPPINGS_KEY = 'gameCharacterManager_discord_mappings';
const DISCORD_MESSAGES_KEY = 'gameCharacterManager_discord_messages';
const DISCORD_ALIASES_KEY = 'gameCharacterManager_discord_aliases';

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
 * Updates existing messages and adds new ones
 */
export const addDiscordMessages = async (
  newMessages: DiscordMessage[]
): Promise<void> => {
  const existingMessages = await getDiscordMessages();
  const existingMap = new Map(existingMessages.map(m => [m.id, m]));

  console.log(
    `[Discord Storage] Adding messages - existing: ${existingMessages.length}, new: ${newMessages.length}`
  );
  if (newMessages.length > 0) {
    console.log(
      `[Discord Storage] Sample new message content:`,
      newMessages[0].content?.substring(0, 100) || '(empty)'
    );
  }

  let updatedCount = 0;
  let addedCount = 0;

  // Merge new messages with existing ones
  newMessages.forEach(newMsg => {
    const existing = existingMap.get(newMsg.id);
    if (existing) {
      // Update existing message - merge fields, preferring non-empty content
      existingMap.set(newMsg.id, {
        ...existing,
        ...newMsg,
        // Preserve existing non-empty content if new content is empty
        content:
          newMsg.content && newMsg.content.trim() !== ''
            ? newMsg.content
            : existing.content,
      });
      updatedCount++;
    } else {
      // Add new message
      existingMap.set(newMsg.id, newMsg);
      addedCount++;
    }
  });

  const allMessages = Array.from(existingMap.values());
  // Sort by timestamp (oldest first)
  allMessages.sort(
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  await saveDiscordMessages(allMessages);
  console.log(
    `[Discord Storage] Updated ${updatedCount} messages, added ${addedCount} messages, total: ${allMessages.length}`
  );
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
 * Clear all Discord messages only
 */
export const clearDiscordMessages = async (): Promise<void> => {
  await SafeAsyncStorageJSONParser.removeItem(DISCORD_MESSAGES_KEY);
  console.log('[Discord Storage] Cleared all Discord messages');
};

/**
 * Clear all Discord data
 */
export const clearDiscordData = async (): Promise<void> => {
  await SafeAsyncStorageJSONParser.removeItem(DISCORD_CONFIG_KEY);
  await SafeAsyncStorageJSONParser.removeItem(DISCORD_MAPPINGS_KEY);
  await SafeAsyncStorageJSONParser.removeItem(DISCORD_MESSAGES_KEY);
  await SafeAsyncStorageJSONParser.removeItem(DISCORD_ALIASES_KEY);
};

/**
 * Get all Discord character aliases
 */
export const getDiscordCharacterAliases = async (): Promise<
  DiscordCharacterAlias[]
> => {
  const aliases =
    await SafeAsyncStorageJSONParser.getItem<DiscordCharacterAlias[]>(
      DISCORD_ALIASES_KEY
    );
  return aliases || [];
};

/**
 * Save Discord character aliases
 */
export const saveDiscordCharacterAliases = async (
  aliases: DiscordCharacterAlias[]
): Promise<void> => {
  await SafeAsyncStorageJSONParser.setItem(DISCORD_ALIASES_KEY, aliases);
};

/**
 * Add or update a character alias
 */
export const addOrUpdateCharacterAlias = async (
  alias: string,
  characterId: string,
  discordUserId: string,
  confidence: number = 1.0
): Promise<DiscordCharacterAlias> => {
  const aliases = await getDiscordCharacterAliases();
  const normalizedAlias = alias.toLowerCase().trim();

  // Find existing alias for this user
  const existingIndex = aliases.findIndex(
    a =>
      a.alias.toLowerCase() === normalizedAlias &&
      a.discordUserId === discordUserId
  );

  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    // Update existing alias
    const existing = aliases[existingIndex];
    aliases[existingIndex] = {
      ...existing,
      characterId,
      confidence: Math.max(confidence, existing.confidence),
      usageCount: existing.usageCount + 1,
      updatedAt: now,
    };
    await saveDiscordCharacterAliases(aliases);
    return aliases[existingIndex];
  } else {
    // Create new alias
    const newAlias: DiscordCharacterAlias = {
      alias: normalizedAlias,
      characterId,
      discordUserId,
      confidence,
      usageCount: 1,
      createdAt: now,
      updatedAt: now,
    };
    aliases.push(newAlias);
    await saveDiscordCharacterAliases(aliases);
    return newAlias;
  }
};

/**
 * Get character ID for an alias
 */
export const getCharacterIdForAlias = async (
  alias: string,
  discordUserId: string
): Promise<string | undefined> => {
  const aliases = await getDiscordCharacterAliases();
  const normalizedAlias = alias.toLowerCase().trim();

  // First try exact match for this user
  const exactMatch = aliases.find(
    a =>
      a.alias.toLowerCase() === normalizedAlias &&
      a.discordUserId === discordUserId
  );

  if (exactMatch && exactMatch.confidence > 0.5) {
    return exactMatch.characterId;
  }

  return undefined;
};

/**
 * Apply an alias to all matching messages
 * Updates all messages from the same user with the same extracted name
 */
export const applyAliasToMessages = async (
  alias: string,
  characterId: string,
  discordUserId: string
): Promise<number> => {
  const messages = await getDiscordMessages();
  const normalizedAlias = alias.toLowerCase().trim();
  let updateCount = 0;

  const updatedMessages = messages.map(msg => {
    // Check if this message is from the same user and has matching extracted name
    if (
      msg.authorId === discordUserId &&
      msg.extractedCharacterName &&
      msg.extractedCharacterName.toLowerCase().trim() === normalizedAlias
    ) {
      updateCount++;
      return {
        ...msg,
        characterId,
      };
    }
    return msg;
  });

  if (updateCount > 0) {
    await saveDiscordMessages(updatedMessages);
    console.log(
      `[Discord Storage] Applied alias "${alias}" to ${updateCount} messages`
    );
  }

  return updateCount;
};

/**
 * Find potential character matches for an alias
 */
export const findPotentialCharacterMatches = async (
  alias: string,
  discordUserId: string,
  allCharacters: Array<{ id: string; name: string }>
): Promise<
  Array<{ characterId: string; name: string; confidence: number }>
> => {
  const normalizedAlias = alias.toLowerCase().trim();
  const matches: Array<{
    characterId: string;
    name: string;
    confidence: number;
  }> = [];

  // Check existing aliases first
  const aliases = await getDiscordCharacterAliases();
  const existingAlias = aliases.find(
    a =>
      a.alias.toLowerCase() === normalizedAlias &&
      a.discordUserId === discordUserId
  );

  if (existingAlias) {
    const character = allCharacters.find(
      c => c.id === existingAlias.characterId
    );
    if (character) {
      matches.push({
        characterId: character.id,
        name: character.name,
        confidence: existingAlias.confidence,
      });
    }
  }

  // Try fuzzy matching against all characters
  for (const character of allCharacters) {
    const normalizedCharName = character.name.toLowerCase().trim();

    // Exact match
    if (normalizedCharName === normalizedAlias) {
      if (!matches.find(m => m.characterId === character.id)) {
        matches.push({
          characterId: character.id,
          name: character.name,
          confidence: 1.0,
        });
      }
      continue;
    }

    // Starts with
    if (normalizedCharName.startsWith(normalizedAlias)) {
      if (!matches.find(m => m.characterId === character.id)) {
        matches.push({
          characterId: character.id,
          name: character.name,
          confidence: 0.8,
        });
      }
      continue;
    }

    // Contains
    if (normalizedCharName.includes(normalizedAlias)) {
      if (!matches.find(m => m.characterId === character.id)) {
        matches.push({
          characterId: character.id,
          name: character.name,
          confidence: 0.6,
        });
      }
    }
  }

  // Sort by confidence descending
  matches.sort((a, b) => b.confidence - a.confidence);

  return matches;
};

/**
 * Export Discord data as a dataset
 */
export const exportDiscordDataset = async (): Promise<DiscordDataset> => {
  const config = await getDiscordConfig();
  const userMappings = await getDiscordUserMappings();
  const messages = await getDiscordMessages();
  const characterAliases = await getDiscordCharacterAliases();

  return {
    config,
    userMappings,
    messages,
    characterAliases,
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
    await saveDiscordCharacterAliases(dataset.characterAliases || []);
  } else {
    // Merge data
    const existingConfig = await getDiscordConfig();
    const existingMappings = await getDiscordUserMappings();
    const existingMessages = await getDiscordMessages();
    const existingAliases = await getDiscordCharacterAliases();

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

    // Merge aliases (by alias + user ID)
    const aliasMap = new Map<string, DiscordCharacterAlias>();
    existingAliases.forEach(a =>
      aliasMap.set(`${a.alias}-${a.discordUserId}`, a)
    );
    (dataset.characterAliases || []).forEach(a =>
      aliasMap.set(`${a.alias}-${a.discordUserId}`, a)
    );
    await saveDiscordCharacterAliases(Array.from(aliasMap.values()));

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
