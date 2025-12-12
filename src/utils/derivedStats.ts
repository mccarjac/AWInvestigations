import { GameCharacter } from '@/models/types';
import { SPECIES_BASE_STATS, MUTANT_SPECIES } from '@/models/speciesTypes';
import { AVAILABLE_PERKS, PerkTag, TAG_SCORE_BONUSES } from '@/models/gameData';

export interface CharacterDerivedStats {
  maxHealth: number;
  maxLimit: number;
  tagScores?: Map<PerkTag, number>;
}

export const calculateDerivedStats = (
  character: GameCharacter
): CharacterDerivedStats => {
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
    // Perfect Mutants don't get tag score bonuses from MUTANT_SPECIES restricted perks
    if (
      character.species !== 'Perfect Mutant' ||
      !perk.allowedSpecies ||
      !(
        perk.allowedSpecies.length === MUTANT_SPECIES.length &&
        MUTANT_SPECIES.every(species => perk.allowedSpecies!.includes(species))
      )
    ) {
      const currentScore = tagScores.get(perk.tag) || 0;
      tagScores.set(perk.tag, currentScore + 1);
    }

    // Apply perk modifiers
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

  // Apply cyberware modifiers
  if (character.cyberware && character.cyberware.length > 0) {
    character.cyberware.forEach(cyber => {
      if (cyber.statModifiers) {
        if (cyber.statModifiers.health) {
          maxHealth += cyber.statModifiers.health;
        }
        if (cyber.statModifiers.limit) {
          maxLimit += cyber.statModifiers.limit;
        }
        if (cyber.statModifiers.healthCap) {
          baseStats.healthCap += cyber.statModifiers.healthCap;
        }
        if (cyber.statModifiers.limitCap) {
          baseStats.limitCap += cyber.statModifiers.limitCap;
        }
        // Tag modifiers can be added to tag scores if needed
        if (cyber.statModifiers.tagModifiers) {
          Object.entries(cyber.statModifiers.tagModifiers).forEach(
            ([tag, modifier]) => {
              const currentScore = tagScores.get(tag as PerkTag) || 0;
              tagScores.set(tag as PerkTag, currentScore + modifier);
            }
          );
        }
      }
    });
  }

  // Apply species caps
  maxHealth = Math.min(maxHealth, baseStats.healthCap);
  maxLimit = Math.min(maxLimit, baseStats.limitCap);

  return {
    maxHealth,
    maxLimit,
    tagScores,
  };
};
