import { Species, Recipe, Distinction, ORGANIC_SPECIES, ROBOTIC_SPECIES } from './types';

export enum PerkTag {
  Agility = 'Agility',
  Charisma = 'Charisma',
  Crafting = 'Crafting',
  Defense = 'Defense',
  Endurance = 'Endurance',
  Finesse = 'Finesse',
  Grit = 'Grit',
  Medical = 'Medical',
  Smarts = 'Smarts',
  Strength = 'Strength',
  Teamwork = 'Teamwork',
  Technical = 'Technical'
}

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
    { requiredScore: 3, limit: 1 },
    { requiredScore: 6, limit: 1 },
    { requiredScore: 10, limit: 1 }
  ],
  Charisma: [
    { requiredScore: 3, limit: 1 },
    { requiredScore: 6, limit: 1 },
    { requiredScore: 10, limit: 1 }
  ],
  Crafting: [
    { requiredScore: 3, health: 1 },
    { requiredScore: 6, limit: 1 },
    { requiredScore: 10, health: 1 }
  ],
  Defense: [
    { requiredScore: 3, limit: 1 },
    { requiredScore: 6, limit: 1, health: 1 },
    { requiredScore: 10, limit: 1, health: 1 }
  ],
  Endurance: [
    { requiredScore: 3, health: 1 },
    { requiredScore: 6, health: 1 },
    { requiredScore: 10, health: 2 }
  ],
  Finesse: [
    { requiredScore: 3, limit: 1 },
    { requiredScore: 6, limit: 1 },
    { requiredScore: 10, limit: 1 }
  ],
  Grit: [
    { requiredScore: 3, limit: 1 },
    { requiredScore: 6, health: 1 },
    { requiredScore: 10, limit: 1 }
  ],
  Medical: [
    { requiredScore: 3, limit: 1 },
    { requiredScore: 6, health: 1 },
    { requiredScore: 10, limit: 1 }
  ],
  Smarts: [
    { requiredScore: 3, limit: 1 },
    { requiredScore: 6, limit: 1 },
    { requiredScore: 10, limit: 1 }
  ],
  Strength: [
    { requiredScore: 3, health: 1 },
    { requiredScore: 6, health: 1 },
    { requiredScore: 10, health: 1 }
  ],
  Teamwork: [
    { requiredScore: 3, limit: 1 },
    { requiredScore: 6, limit: 1 },
    { requiredScore: 10, limit: 1, health: 1 }
  ],
  Technical: [
    { requiredScore: 3, limit: 1 },
    { requiredScore: 6, health: 1 },
    { requiredScore: 10, limit: 1 }
  ]
};

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
  allowedSpecies?: Species[];
  recipeIds?: RecipeId[];
}

// TODO : Populate with actual perks
export const AVAILABLE_PERKS: Perk[] = [
  {
    id: 'p1',
    name: 'Quick Reflexes',
    description: 'Enhanced reaction time in combat situations',
    tag: PerkTag.Agility,
    statModifiers: {
      limit: 1
    },
    allowedSpecies: [...ORGANIC_SPECIES]
  },
  {
    id: 'p2',
    name: 'Natural Leader',
    description: 'Inspires confidence in allies and followers',
    tag: PerkTag.Teamwork,
    statModifiers: {
      limit: 2
    },
    allowedSpecies: ['Unturned']
  },
  {
    id: 'p3',
    name: 'Tech Savvy',
    description: 'Proficient with all forms of technology',
    tag: PerkTag.Technical,
    statModifiers: {
      limit: 1
    },
    allowedSpecies: ['Android', 'Cyborg', 'Drone', 'Mook']
  },
  {
    id: 'p4',
    name: 'Survivalist',
    description: 'Expert at surviving in harsh environments',
    tag: PerkTag.Grit,
    statModifiers: {
      health: 2
    },
    allowedSpecies: ['Nomad', 'Stray', 'Roadkill']
  },
  {
    id: 'p5',
    name: 'Silver Tongue',
    description: 'Skilled at persuasion and negotiation',
    tag: PerkTag.Charisma
  },
  {
    id: 'p6',
    name: 'Combat Medic',
    description: 'Can provide medical aid even in dangerous situations',
    tag: PerkTag.Medical,
    statModifiers: {
      health: 1
    },
    allowedSpecies: ['Human', 'Mutant', 'Unturned']
  },
  {
    id: 'p7',
    name: 'Master Tactician',
    description: 'Excels at planning and strategic thinking',
    tag: PerkTag.Smarts
  },
  {
    id: 'p8',
    name: 'Resourceful',
    description: 'Makes the most of available resources',
    tag: PerkTag.Crafting,
    recipeIds: ['r1', 'r2']
  },
  {
    id: 'p9',
    name: 'Master Craftsman',
    description: 'Expert at creating complex items and machinery',
    tag: PerkTag.Crafting,
    recipeIds: ['r3', 'r4']
  }
] as const;

export const AVAILABLE_DISTINCTIONS: Distinction[] = [
  {
    id: 'd1',
    name: 'Apathetic',
    description: 'You are not particularly motivated. When resting, it takes triple the amount of time to recover limit flags.',
    xpBonus: 50
  },
  {
    id: 'd2',
    name: 'Bad with Pets',
    description: 'You just don\'t do well around wild animals. Near wild faction members, you cannot use limit flags or count as fresh/spent.',
    xpBonus: 50
  },
  {
    id: 'd3',
    name: 'Bite Vulnerability',
    description: 'Your genes are extra compatible with the virus. The number of bite cards required for you to turn is always 3.',
    xpBonus: 100,
    allowedSpecies: [...ORGANIC_SPECIES]
  },
  {
    id: 'd4',
    name: 'Brittle',
    description: 'Maybe you should stay at home. The duration of all injuries or malfunctions you possess are doubled.',
    xpBonus: 50
  },
  {
    id: 'd5',
    name: 'Burnout',
    description: 'Your candle burns bright, but from both ends. Your maximum XP cap is reduced by 250.',
    xpBonus: 100
  },
  {
    id: 'd6',
    name: 'Chem Resistant',
    description: 'Your body is resistant to the effects of chems. All numerical chem benefits are halved, and scene-long effects only last until end of encounter.',
    xpBonus: 50,
    allowedSpecies: [...ORGANIC_SPECIES]
  },
  {
    id: 'd7',
    name: 'Civil to a Fault',
    description: 'Eating people is not OK. When you hear a "FEAST" count, you must pull a limit flag or health flag.',
    xpBonus: 75
  },
  {
    id: 'd8',
    name: 'Combat Paralysis',
    description: 'You hesitate when a fight breaks out. When entering any encounter, you are hit with stun.',
    xpBonus: 100
  },
  {
    id: 'd9',
    name: 'Craven',
    description: 'You are a coward. In combat encounters, you must attempt to leave as quickly as possible or pull a limit flag.',
    xpBonus: 100
  },
  {
    id: 'd10',
    name: 'Cruel',
    description: 'You have a sadistic side that takes willpower to restrain. When encountering downed characters, you must burn a limit flag or attempt a killing blow.',
    xpBonus: 50
  },
  {
    id: 'd11',
    name: 'Cybernetic Rejection',
    description: 'Your body rejects cybernetic enhancements. The drain value of any cyberware you have installed is tripled.',
    xpBonus: 50,
    allowedSpecies: [...ORGANIC_SPECIES]
  },
  {
    id: 'd12',
    name: 'Delicate',
    description: 'Your body doesn\'t respond to trauma very quickly. Your dying count starts at 5 instead of 30.',
    xpBonus: 50
  },
  {
    id: 'd13',
    name: 'Difficult Patient',
    description: 'You are difficult to operate on. The difficulty of any surgery or maintenance on you is increased by 2.',
    xpBonus: 50,
    allowedSpecies: [...ORGANIC_SPECIES]
  },
  {
    id: 'd14',
    name: 'Easy Mark',
    description: 'Bandits just seem to know they can get something out of you. Near bandit faction members, you cannot use limit flags or count as fresh/spent.',
    xpBonus: 50
  },
  {
    id: 'd15',
    name: 'Failsafe',
    description: 'You have core programming to prevent AI violence against humanity. You cannot attack human-like characters unless they attack first.',
    xpBonus: 100,
    allowedSpecies: [...ROBOTIC_SPECIES]
  },
  {
    id: 'd16',
    name: 'Fear of the Dark',
    description: 'The night is cold and full of terror. When the sun is not visible, your max limit is lowered by one.',
    xpBonus: 50
  },
  {
    id: 'd17',
    name: 'Fumble Fingers',
    description: 'You have trouble with manual tasks. LOOTING, MEDIC, REPAIR, RECOVER and RELOAD counts are increased by 5.',
    xpBonus: 50
  },
  {
    id: 'd18',
    name: 'Insufficient Funds',
    description: 'You have trouble preparing and saving. You start with no starter kit and lose 20 caps each event check-in.',
    xpBonus: 100
  },
  {
    id: 'd19',
    name: 'It Came From Beyond',
    description: 'Off-world creatures are your worst nightmare. Near invader faction members, you cannot use limit flags or count as fresh/spent.',
    xpBonus: 50,
    allowedSpecies: [...ORGANIC_SPECIES]
  },
  {
    id: 'd20',
    name: 'Light Sensitive',
    description: 'You wear your sunglasses at night and during the day. When the sun is visible, your max limit is lowered by one.',
    xpBonus: 50
  },
  {
    id: 'd21',
    name: 'Lightweight',
    description: 'You have very little chem tolerance. When using chems, you must make a RECOVER(30)(Res) count.',
    xpBonus: 50,
    allowedSpecies: [...ORGANIC_SPECIES]
  },
  {
    id: 'd22',
    name: 'Lone Wolf',
    description: 'You don\'t work well with others. You cannot benefit from inspire calls or be part of a party/partner/ward system.',
    xpBonus: 50
  },
  {
    id: 'd23',
    name: 'Loss Prevention.exe',
    description: 'You have lingering programs to stop property damage. You cannot cause damage to bot faction members.',
    xpBonus: 50,
    allowedSpecies: [...ROBOTIC_SPECIES]
  },
  {
    id: 'd24',
    name: 'Paced',
    description: 'You move at your own pace. You cannot run.',
    xpBonus: 150
  },
  {
    id: 'd25',
    name: 'Pacifist',
    description: 'You refuse to hurt people. Your attacks must include NO DAMAGE call.',
    xpBonus: 150
  },
  {
    id: 'd26',
    name: 'Poison Vulnerable',
    description: 'You are particularly vulnerable to toxins. When hit with poison, you must burn a health flag.',
    xpBonus: 50,
    allowedSpecies: [...ORGANIC_SPECIES]
  },
  {
    id: 'd27',
    name: 'Prideful',
    description: 'You refuse to retreat from battle. To leave combat encounters, you must burn all limit flags.',
    xpBonus: 50
  },
  {
    id: 'd28',
    name: 'Rotten Luck',
    description: 'Biters just seem to catch you at the worst times. You gain a bite card every event check-in.',
    xpBonus: 50,
    allowedSpecies: [...ORGANIC_SPECIES]
  },
  {
    id: 'd29',
    name: 'Speechless',
    description: 'You don\'t speak. You may only speak for counts, calls, damage reactions, or commanded responses.',
    xpBonus: 100
  },
  {
    id: 'd30',
    name: 'The Future is Scary',
    description: 'You don\'t understand new technology. Near bot faction members, you cannot use limit flags or count as fresh/spent.',
    xpBonus: 50
  },
  {
    id: 'd31',
    name: 'Turned Averse',
    description: 'You are terrified of the zombie virus. Near turned faction members, you cannot use limit flags or count as fresh/spent.',
    xpBonus: 50
  }
] as const;