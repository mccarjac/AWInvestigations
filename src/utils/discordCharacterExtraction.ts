import { loadCharacters } from './characterStorage';
import {
  getCharacterIdForAlias,
  addOrUpdateCharacterAlias,
  findPotentialCharacterMatches,
} from './discordStorage';

/**
 * Extract character name from message content
 * Looks for patterns like >[Name] at the beginning of the message
 */
export const extractCharacterName = (content: string): string | null => {
  // Match >[Name] at the start, with optional whitespace
  const match = content.match(/^>\s*\[([^\]]+)\]/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
};

/**
 * Get the message content without the character name prefix
 */
export const stripCharacterNameFromContent = (content: string): string => {
  const match = content.match(/^>\s*\[[^\]]+\]\s*(.*)/s);
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

  // If we have a high confidence match, use it
  if (matches.length > 0 && matches[0].confidence >= 0.9) {
    // Store this as an alias for future use
    await addOrUpdateCharacterAlias(
      characterName,
      matches[0].characterId,
      discordUserId,
      matches[0].confidence
    );

    return {
      characterId: matches[0].characterId,
      needsManualSelection: false,
      suggestions: matches,
    };
  }

  // Multiple low-confidence matches or no matches - need manual selection
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
