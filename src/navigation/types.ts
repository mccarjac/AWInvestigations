import { GameCharacter } from '@models/types';

export type RootStackParamList = {
  CharacterList: undefined;
  CharacterStats: undefined;
  CharacterSearch: undefined;
  DataManagement: undefined;
  Factions: undefined;
  FactionDetails: { factionName: string };
  CharacterForm: { 
    character?: GameCharacter;
    onSubmit?: (character: GameCharacter) => void;
  };
  CharacterDetail: { character: GameCharacter };
};
