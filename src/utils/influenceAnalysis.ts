import {
  GameCharacter,
  NEGATIVE_RELATIONSHIP_TYPE,
  POSITIVE_RELATIONSHIP_TYPE,
  RelationshipStanding,
} from '@models/types';

export interface CharacterInfluence {
  character: GameCharacter;
  influenceScore: number;
  relationshipCount: number;
  positiveRelationships: number;
  negativeRelationships: number;
  factionCount: number;
  factions: string[];
  connections: string[]; // Character names they're connected to
}

export interface FactionInfluence {
  name: string;
  memberCount: number;
  totalInfluence: number;
  averageInfluence: number;
  members: GameCharacter[];
  allies: string[]; // Other factions with ally relationships
  enemies: string[]; // Other factions with enemy relationships
}

export interface RelationshipNetwork {
  character: GameCharacter;
  allies: GameCharacter[];
  friends: GameCharacter[];
  neutral: GameCharacter[];
  hostile: GameCharacter[];
  enemies: GameCharacter[];
}

/**
 * Calculate influence score for a character based on:
 * - Number of relationships (more = more influential)
 * - Quality of relationships (allies/friends = positive, enemies = negative)
 * - Faction memberships (more factions = more reach)
 * - Being referenced by other characters
 */
export const calculateCharacterInfluence = (
  character: GameCharacter,
  allCharacters: GameCharacter[]
): CharacterInfluence => {
  let influenceScore = 0;

  // Count relationships
  const relationshipCount = character.relationships?.length || 0;
  const positiveRelationships =
    character.relationships?.filter(r =>
      POSITIVE_RELATIONSHIP_TYPE.includes(r.relationshipType)
    ).length || 0;
  const negativeRelationships =
    character.relationships?.filter(r =>
      NEGATIVE_RELATIONSHIP_TYPE.includes(r.relationshipType)
    ).length || 0;

  // Relationships add to influence
  influenceScore += positiveRelationships * 3; // Allies/friends worth 3 points
  influenceScore -= negativeRelationships * 2; // Enemies/hostile subtract 2 points

  // Faction memberships add influence
  const factionCount = character.factions?.length || 0;
  influenceScore += factionCount * 5; // Each faction adds 5 points

  // Being referenced by other characters adds influence (reverse relationships)
  /*
  const referencedByCount = allCharacters.filter(otherChar =>
    otherChar.relationships?.some(rel => rel.characterName === character.name)
  ).length;
  influenceScore += referencedByCount * 4; // Being referenced is worth 4 points
  */

  // Get list of all connections (people they know or who know them)
  const connections = new Set<string>();
  character.relationships?.forEach(rel => {
    connections.add(rel.characterName);
  });
  allCharacters.forEach(otherChar => {
    if (
      otherChar.relationships?.some(rel => rel.characterName === character.name)
    ) {
      connections.add(otherChar.name);
    }
  });

  return {
    character,
    influenceScore,
    relationshipCount,
    positiveRelationships,
    negativeRelationships,
    factionCount,
    factions: character.factions?.map(f => f.name) || [],
    connections: Array.from(connections),
  };
};

/**
 * Get top influential characters sorted by influence score
 */
export const getTopInfluencers = (
  characters: GameCharacter[],
  limit = 10
): CharacterInfluence[] => {
  const influences = characters.map(char =>
    calculateCharacterInfluence(char, characters)
  );

  return influences
    .filter(inf => inf.influenceScore > 0) // Only include characters with some influence
    .sort((a, b) => b.influenceScore - a.influenceScore)
    .slice(0, limit);
};

/**
 * Analyze faction influence based on members and their connections
 */
export const analyzeFactionInfluence = (
  characters: GameCharacter[]
): FactionInfluence[] => {
  const factionMap = new Map<string, GameCharacter[]>();

  // Group characters by faction
  characters.forEach(char => {
    char.factions?.forEach(faction => {
      if (!factionMap.has(faction.name)) {
        factionMap.set(faction.name, []);
      }
      const factionMembers = factionMap.get(faction.name);
      if (factionMembers) {
        factionMembers.push(char);
      }
    });
  });

  // Calculate influence for each faction
  const factionInfluences: FactionInfluence[] = [];

  factionMap.forEach((members, factionName) => {
    const totalInfluence = members.reduce((sum, member) => {
      const influence = calculateCharacterInfluence(member, characters);
      return sum + influence.influenceScore;
    }, 0);

    const averageInfluence =
      members.length > 0 ? totalInfluence / members.length : 0;

    // Find allied and enemy factions based on member relationships
    const alliedFactions = new Set<string>();
    const enemyFactions = new Set<string>();

    members.forEach(member => {
      // Check faction standings of this member
      member.factions?.forEach(otherFaction => {
        if (otherFaction.name !== factionName) {
          if (
            otherFaction.standing === RelationshipStanding.Ally ||
            otherFaction.standing === RelationshipStanding.Friend
          ) {
            alliedFactions.add(otherFaction.name);
          } else if (
            otherFaction.standing === RelationshipStanding.Enemy ||
            otherFaction.standing === RelationshipStanding.Hostile
          ) {
            enemyFactions.add(otherFaction.name);
          }
        }
      });
    });

    factionInfluences.push({
      name: factionName,
      memberCount: members.length,
      totalInfluence,
      averageInfluence,
      members,
      allies: Array.from(alliedFactions),
      enemies: Array.from(enemyFactions),
    });
  });

  // Sort by total influence
  return factionInfluences.sort((a, b) => b.totalInfluence - a.totalInfluence);
};

/**
 * Build relationship network for a character
 */
export const buildRelationshipNetwork = (
  character: GameCharacter,
  allCharacters: GameCharacter[]
): RelationshipNetwork => {
  const network: RelationshipNetwork = {
    character,
    allies: [],
    friends: [],
    neutral: [],
    hostile: [],
    enemies: [],
  };

  // Direct relationships
  character.relationships?.forEach(rel => {
    const relatedChar = allCharacters.find(c => c.name === rel.characterName);
    if (relatedChar) {
      switch (rel.relationshipType) {
        case RelationshipStanding.Ally:
          network.allies.push(relatedChar);
          break;
        case RelationshipStanding.Friend:
          network.friends.push(relatedChar);
          break;
        case RelationshipStanding.Neutral:
          network.neutral.push(relatedChar);
          break;
        case RelationshipStanding.Hostile:
          network.hostile.push(relatedChar);
          break;
        case RelationshipStanding.Enemy:
          network.enemies.push(relatedChar);
          break;
      }
    }
  });

  return network;
};

/**
 * Find characters with shared faction memberships
 */
export const findFactionConnections = (
  character: GameCharacter,
  allCharacters: GameCharacter[]
): Map<string, GameCharacter[]> => {
  const connections = new Map<string, GameCharacter[]>();

  character.factions?.forEach(faction => {
    const factionMembers = allCharacters.filter(
      otherChar =>
        otherChar.id !== character.id &&
        otherChar.factions?.some(f => f.name === faction.name)
    );

    if (factionMembers.length > 0) {
      connections.set(faction.name, factionMembers);
    }
  });

  return connections;
};

/**
 * Find mutual relationships (characters who know each other)
 */
export const findMutualRelationships = (
  characters: GameCharacter[]
): Array<{
  character1: GameCharacter;
  character2: GameCharacter;
  relationship1: RelationshipStanding;
  relationship2: RelationshipStanding;
}> => {
  const mutualRelationships: Array<{
    character1: GameCharacter;
    character2: GameCharacter;
    relationship1: RelationshipStanding;
    relationship2: RelationshipStanding;
  }> = [];

  characters.forEach(char1 => {
    char1.relationships?.forEach(rel => {
      const char2 = characters.find(c => c.name === rel.characterName);
      if (char2) {
        const reverseRel = char2.relationships?.find(
          r => r.characterName === char1.name
        );
        if (reverseRel) {
          // Check if we haven't already added this pair (avoid duplicates)
          const alreadyAdded = mutualRelationships.some(
            mr =>
              (mr.character1.id === char1.id &&
                mr.character2.id === char2.id) ||
              (mr.character1.id === char2.id && mr.character2.id === char1.id)
          );

          if (!alreadyAdded) {
            mutualRelationships.push({
              character1: char1,
              character2: char2,
              relationship1: rel.relationshipType,
              relationship2: reverseRel.relationshipType,
            });
          }
        }
      }
    });
  });

  return mutualRelationships;
};

/**
 * Find characters who could be key connectors (high relationship count across different factions)
 */
export const findKeyConnectors = (
  characters: GameCharacter[],
  limit = 5
): CharacterInfluence[] => {
  const influences = characters.map(char =>
    calculateCharacterInfluence(char, characters)
  );

  // Sort by combination of relationship count and faction count
  return influences
    .filter(inf => inf.factionCount > 1 && inf.relationshipCount > 2)
    .sort((a, b) => {
      const scoreA = a.factionCount * 10 + a.relationshipCount;
      const scoreB = b.factionCount * 10 + b.relationshipCount;
      return scoreB - scoreA;
    })
    .slice(0, limit);
};

/**
 * Find power centers - characters with many allies who themselves are influential
 */
export const findPowerCenters = (
  characters: GameCharacter[],
  limit = 5
): CharacterInfluence[] => {
  const influences = characters.map(char =>
    calculateCharacterInfluence(char, characters)
  );

  // Calculate power center score
  const powerCenters = influences.map(inf => {
    // Count how many of their allies are also influential
    const influentialAllies =
      inf.character.relationships?.filter(rel => {
        const allyChar = characters.find(c => c.name === rel.characterName);
        if (!allyChar) return false;

        const allyInfluence = calculateCharacterInfluence(allyChar, characters);
        return (
          (rel.relationshipType === RelationshipStanding.Ally ||
            rel.relationshipType === RelationshipStanding.Friend) &&
          allyInfluence.influenceScore > 10
        );
      }).length || 0;

    return {
      ...inf,
      powerCenterScore: inf.influenceScore + influentialAllies * 5,
    };
  });

  return powerCenters
    .filter(pc => pc.powerCenterScore > 15)
    .sort((a, b) => b.powerCenterScore - a.powerCenterScore)
    .slice(0, limit);
};
