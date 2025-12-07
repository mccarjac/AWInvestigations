import { GameCharacter, GameLocation, GameEvent } from '@models/types';

export type RootDrawerParamList = {
  CharacterList: undefined;
  CharacterStats: undefined;
  FactionStats: undefined;
  DataManagement: undefined;
  Factions: undefined;
  Locations: undefined;
  Events: undefined;
  InfluenceReport: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  CharacterSearch: undefined;
  FactionDetails: { factionName: string };
  FactionForm: { factionName?: string };
  LocationDetails: { locationId: string };
  LocationForm: { location?: GameLocation };
  LocationMap: undefined;
  CharacterForm: {
    character?: GameCharacter;
    onSubmit?: (character: GameCharacter) => void;
  };
  CharacterDetail: { character: GameCharacter };
  EventsTimeline: undefined;
  EventsForm: { event?: GameEvent };
  EventsDetail: { eventId: string };
};
