import { GameCharacter } from '@models/types';

export type RootStackParamList = {
  CharacterList: undefined;
  CharacterStats: undefined;
  CharacterSearch: undefined;
  CharacterForm: { 
    character?: GameCharacter;
    onSubmit?: (character: GameCharacter) => void;
  };
  CharacterDetail: { character: GameCharacter };
};
