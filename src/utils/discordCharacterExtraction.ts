import { loadCharacters } from './characterStorage';
import {
  getCharacterIdForAlias,
  addOrUpdateCharacterAlias,
  findPotentialCharacterMatches,
} from './discordStorage';

/**
 * Strip markdown formatting from text
 * Removes **bold**, __underline__, ~~strikethrough~~, *italic*, _italic_
 */
const stripMarkdown = (text: string): string => {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1') // **bold**
    .replace(/__(.+?)__/g, '$1') // __underline__
    .replace(/~~(.+?)~~/g, '$1') // ~~strikethrough~~
    .replace(/\*(.+?)\*/g, '$1') // *italic*
    .replace(/_(.+?)_/g, '$1') // _italic_
    .trim();
};

/**
 * Extract character name from message content
 * Looks for patterns like >>[Name] at the beginning of the message
 * Strips markdown formatting from the extracted name
 */
export const extractCharacterName = (content: string): string | null => {
  // Match >>[Name] at the start, with optional whitespace
  const match = content.match(/^>>\s*\[([^\]]+)\]/);
  if (match && match[1]) {
    const rawName = match[1].trim();
    const cleanName = stripMarkdown(rawName);
    return cleanName;
  }
  return null;
};

/**
 * Get the message content without the character name prefix
 */
export const stripCharacterNameFromContent = (content: string): string => {
  const match = content.match(/^>>\s*\[[^\]]+\]\s*(.*)/s);
  if (match && match[1]) {
    return match[1].trim();
  }
  return content;
};

/**
 * Attempt to resolve a character name to a character ID
 * Returns the character ID if found, null if needs manual selection
 */
export const resolveCharacterFromName = async (
  characterName: string,
  discordUserId: string
): Promise<{
  characterId: string | null;
  needsManualSelection: boolean;
  suggestions: Array<{ characterId: string; name: string; confidence: number }>;
}> => {
  // First check if we have a stored alias for this user
  const aliasCharacterId = await getCharacterIdForAlias(
    characterName,
    discordUserId
  );

  if (aliasCharacterId) {
    return {
      characterId: aliasCharacterId,
      needsManualSelection: false,
      suggestions: [],
    };
  }

  // Try to find matches
  const allCharacters = await loadCharacters();
  const matches = await findPotentialCharacterMatches(
    characterName,
    discordUserId,
    allCharacters.map(c => ({ id: c.id, name: c.name }))
  );

  console.log(
    `[Character Resolution] Attempting to match "${characterName}" for user ${discordUserId.substring(0, 8)}...`
  );
  console.log(
    `[Character Resolution] Found ${matches.length} potential matches`
  );
  if (matches.length > 0) {
    console.log(
      `[Character Resolution] Best match: "${matches[0].name}" (confidence: ${matches[0].confidence})`
    );
  }

  // If we have a high confidence match, use it
  if (matches.length > 0 && matches[0].confidence >= 0.9) {
    // Store this as an alias for future use
    await addOrUpdateCharacterAlias(
      characterName,
      matches[0].characterId,
      discordUserId,
      matches[0].confidence
    );

    console.log(
      `[Character Resolution] Auto-matched to "${matches[0].name}" - confidence ${matches[0].confidence}`
    );

    return {
      characterId: matches[0].characterId,
      needsManualSelection: false,
      suggestions: matches,
    };
  }

  // Multiple low-confidence matches or no matches - need manual selection
  console.log(
    `[Character Resolution] Needs manual selection - confidence too low or no matches`
  );

  return {
    characterId: null,
    needsManualSelection: true,
    suggestions: matches,
  };
};

/**
 * Manually confirm a character mapping
 * This stores the alias for future automatic resolution
 */
export const confirmCharacterMapping = async (
  characterName: string,
  characterId: string,
  discordUserId: string
): Promise<void> => {
  await addOrUpdateCharacterAlias(
    characterName,
    characterId,
    discordUserId,
    1.0 // High confidence since it's manually confirmed
  );
};
