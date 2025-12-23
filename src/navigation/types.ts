import { GameCharacter, GameLocation, GameEvent } from '@models/types';

export type RootDrawerParamList = {
  CharacterList: undefined;
  DataManagement: undefined;
  Factions: undefined;
  Locations: undefined;
  Events: undefined;
  InfluenceReport: undefined;
  DiscordConfig: undefined;
  DiscordCharacterMapping: undefined;
  DiscordMessages: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  CharacterSearch: undefined;
  CharacterStats: undefined;
  FactionStats: undefined;
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
  DiscordMessageContext: { messageId: string; characterId?: string };
};
