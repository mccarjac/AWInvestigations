import { Species } from './types';

export type PerkTag = 
  | 'Agility'
  | 'Charisma'
  | 'Crafting'
  | 'Defense'
  | 'Endurance'
  | 'Finesse'
  | 'Grit'
  | 'Medical'
  | 'Smarts'
  | 'Strength'
  | 'Teamwork'
  | 'Technical';

export interface PerkStatModifiers {
  health?: number;
  limit?: number;
}

export interface TagScoreBonus {
  requiredScore: number;
  health?: number;
  limit?: number;
}

export type TagBonusConfig = {
  [key in PerkTag]: TagScoreBonus[];
};

// TODO : Populate with actual tag score bonuses
export const TAG_SCORE_BONUSES: TagBonusConfig = {
  Agility: [
    { requiredScore: 1, limit: 100, health: 1000 },
    { requiredScore: 7, limit: 1 }
  ],
  Charisma: [
    { requiredScore: 5, limit: 1 }
  ],
  Crafting: [
    { requiredScore: 3, limit: 1 },
    { requiredScore: 8, limit: 1 }
  ],
  Defense: [
    { requiredScore: 2, health: 1 },
    { requiredScore: 5, health: 1 },
    { requiredScore: 8, health: 1 }
  ],
  Endurance: [
    { requiredScore: 3, health: 1 },
    { requiredScore: 6, health: 1 },
    { requiredScore: 9, health: 1 }
  ],
  Finesse: [
    { requiredScore: 4, limit: 1 },
    { requiredScore: 8, limit: 1 }
  ],
  Grit: [
    { requiredScore: 3, health: 1 },
    { requiredScore: 7, health: 1 }
  ],
  Medical: [
    { requiredScore: 4, health: 1 },
    { requiredScore: 8, health: 1 }
  ],
  Smarts: [
    { requiredScore: 5, limit: 1 },
    { requiredScore: 9, limit: 1 }
  ],
  Strength: [
    { requiredScore: 3, health: 1 },
    { requiredScore: 6, health: 1 },
    { requiredScore: 9, health: 1 }
  ],
  Teamwork: [
    { requiredScore: 4, limit: 1 },
    { requiredScore: 8, limit: 1 }
  ],
  Technical: [
    { requiredScore: 3, limit: 1 },
    { requiredScore: 7, limit: 1 }
  ]
};

import { Recipe } from './types';

export type RecipeId = typeof AVAILABLE_RECIPES[number]['id'];

// TODO : Populate with actual recipes
export const AVAILABLE_RECIPES: Recipe[] = [
  {
    id: 'r1',
    name: 'Makeshift Battery',
    description: 'A jury-rigged power cell that can power small devices',
    materials: ['Scrap Electronics', 'Copper Wire', 'Chemical Solution']
  },
  {
    id: 'r2',
    name: 'Scrap Armor',
    description: 'Basic protection crafted from salvaged materials',
    materials: ['Metal Scraps', 'Leather', 'Fasteners']
  },
  {
    id: 'r3',
    name: 'Advanced Power Armor',
    description: 'High-tech protective suit with power assistance',
    materials: ['Rare Alloy', 'Power Core', 'Hydraulic Systems', 'Control Circuit']
  },
  {
    id: 'r4',
    name: 'Energy Shield Generator',
    description: 'Personal defense system that projects an energy barrier',
    materials: ['Crystal Matrix', 'Power Core', 'Shield Emitter', 'Control Circuit']
  }
] as const;

export interface Perk {
  id: string;
  name: string;
  description: string;
  tag: PerkTag;
  statModifiers?: PerkStatModifiers;
  requiredSpecies?: Species;
  recipeIds?: RecipeId[];
}

// TODO : Populate with actual perks
export const AVAILABLE_PERKS: Perk[] = [
  {
    id: 'p1',
    name: 'Quick Reflexes',
    description: 'Enhanced reaction time in combat situations',
    tag: 'Agility',
    statModifiers: {
      limit: 1
    },
    requiredSpecies: 'Android'
  },
  {
    id: 'p2',
    name: 'Natural Leader',
    description: 'Inspires confidence in allies and followers',
    tag: 'Teamwork',
    statModifiers: {
      limit: 2
    },
    requiredSpecies: 'Human'
  },
  {
    id: 'p3',
    name: 'Tech Savvy',
    description: 'Proficient with all forms of technology',
    tag: 'Technical',
    statModifiers: {
      limit: 1
    },
    requiredSpecies: 'Android'
  },
  {
    id: 'p4',
    name: 'Survivalist',
    description: 'Expert at surviving in harsh environments',
    tag: 'Grit',
    statModifiers: {
      health: 2
    },
    requiredSpecies: 'Nomad'
  },
  {
    id: 'p5',
    name: 'Silver Tongue',
    description: 'Skilled at persuasion and negotiation',
    tag: 'Charisma'
  },
  {
    id: 'p6',
    name: 'Combat Medic',
    description: 'Can provide medical aid even in dangerous situations',
    tag: 'Medical',
    statModifiers: {
      health: 1
    },
    requiredSpecies: 'Human'
  },
  {
    id: 'p7',
    name: 'Master Tactician',
    description: 'Excels at planning and strategic thinking',
    tag: 'Smarts' as PerkTag
  },
  {
    id: 'p8',
    name: 'Resourceful',
    description: 'Makes the most of available resources',
    tag: 'Crafting' as PerkTag,
    recipeIds: ['r1', 'r2']
  },
  {
    id: 'p9',
    name: 'Master Craftsman',
    description: 'Expert at creating complex items and machinery',
    tag: 'Crafting' as PerkTag,
    recipeIds: ['r3', 'r4']
  }
] as const;

// TODO : Populate with actual distinctions
export const AVAILABLE_DISTINCTIONS = [
  {
    id: 'd1',
    name: 'Veteran',
    description: 'Has seen numerous battles and lived to tell the tales'
  },
  {
    id: 'd2',
    name: 'Noble',
    description: 'Comes from an aristocratic background'
  },
  {
    id: 'd3',
    name: 'Outcast',
    description: 'Rejected by society but strengthened by adversity'
  },
  {
    id: 'd4',
    name: 'Scholar',
    description: 'Deeply educated in academic subjects'
  },
  {
    id: 'd5',
    name: 'Street Rat',
    description: 'Grew up on the mean streets, learning to survive'
  },
  {
    id: 'd6',
    name: 'Mystic',
    description: 'Connected to supernatural or mysterious forces'
  },
  {
    id: 'd7',
    name: 'Merchant',
    description: 'Skilled in trade and commerce'
  },
  {
    id: 'd8',
    name: 'Explorer',
    description: 'Driven by wanderlust and discovery'
  }
] as const;