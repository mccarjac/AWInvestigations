import { GameCharacter } from '@models/types';

export type RootDrawerParamList = {
  CharacterList: undefined;
  CharacterStats: undefined;
  CharacterSearch: undefined;
  DataManagement: undefined;
  Factions: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  FactionDetails: { factionName: string };
  FactionForm: undefined;
  CharacterForm: { 
    character?: GameCharacter;
    onSubmit?: (character: GameCharacter) => void;
  };
  CharacterDetail: { character: GameCharacter };
};
