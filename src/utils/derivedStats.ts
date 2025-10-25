import { GameCharacter } from '@/models/types';
import { SPECIES_BASE_STATS } from '@/models/types';
import { AVAILABLE_PERKS, PerkTag, TAG_SCORE_BONUSES } from '@/models/gameData';

export interface CharacterDerivedStats {
  maxHealth: number;
  maxLimit: number;
}

export const calculateDerivedStats = (character: GameCharacter): CharacterDerivedStats => {
  // Get base stats from species
  const baseStats = SPECIES_BASE_STATS[character.species];
  
  // Initialize with base values
  let maxHealth = baseStats.baseHealth;
  let maxLimit = baseStats.baseLimit;

  // Get all perks the character has
  const characterPerks = AVAILABLE_PERKS.filter(perk => 
    character.perkIds.includes(perk.id)
  );

  // Calculate tag scores
  const tagScores = new Map<PerkTag, number>();
  characterPerks.forEach(perk => {
    const currentScore = tagScores.get(perk.tag) || 0;
    tagScores.set(perk.tag, currentScore + 1);
  });

  // Apply perk modifiers
  characterPerks.forEach(perk => {
    if (perk.statModifiers) {
      if (perk.statModifiers.health) {
        maxHealth += perk.statModifiers.health;
      }
      if (perk.statModifiers.limit) {
        maxLimit += perk.statModifiers.limit;
      }
    }
  });

  // Apply tag score bonuses
  tagScores.forEach((score, tag) => {
    const tagBonuses = TAG_SCORE_BONUSES[tag];
    tagBonuses.forEach(bonus => {
      if (score >= bonus.requiredScore) {
        if (bonus.health) {
          maxHealth += bonus.health;
        }
        if (bonus.limit) {
          maxLimit += bonus.limit;
        }
      }
    });
  });

  // Apply species caps
  maxHealth = Math.min(maxHealth, baseStats.healthCap);
  maxLimit = Math.min(maxLimit, baseStats.limitCap);

  return {
    maxHealth,
    maxLimit
  };
};