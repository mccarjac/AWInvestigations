import { GameCharacter, GameLocation } from '@models/types';

export type RootDrawerParamList = {
  CharacterList: undefined;
  CharacterStats: undefined;
  CharacterSearch: undefined;
  DataManagement: undefined;
  Factions: undefined;
  Locations: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  FactionDetails: { factionName: string };
  FactionForm: undefined;
  LocationDetails: { locationId: string };
  LocationForm: { location?: GameLocation };
  LocationMap: undefined;
  CharacterForm: {
    character?: GameCharacter;
    onSubmit?: (character: GameCharacter) => void;
  };
  CharacterDetail: { character: GameCharacter };
};
