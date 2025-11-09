import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import {
  RootStackParamList,
  RootDrawerParamList,
} from './src/navigation/types';
import { CharacterListScreen } from './src/screens/character/CharacterListScreen';
import { CharacterDetailScreen } from './src/screens/character/CharacterDetailScreen';
import { CharacterFormScreen } from './src/screens/character/CharacterFormScreen';
import { CharacterStatsScreen } from './src/screens/CharacterStatsScreen';
import { CharacterSearchScreen } from './src/screens/character/CharacterSearchScreen';
import { DataManagementScreen } from './src/screens/DataManagementScreen';
import { FactionListScreen } from './src/screens/faction/FactionListScreen';
import { FactionDetailsScreen } from './src/screens/faction/FactionDetailScreen';
import { FactionFormScreen } from './src/screens/faction/FactionFormScreen';
import { LocationListScreen } from './src/screens/location/LocationListScreen';
import { LocationDetailsScreen } from './src/screens/location/LocationDetailScreen';
import { LocationFormScreen } from './src/screens/location/LocationFormScreen';
import { LocationMapScreen } from './src/screens/location/LocationMapScreen';
import { EventsTimelineScreen } from './src/screens/events/EventsListScreen';
import { EventsFormScreen } from './src/screens/events/EventsFormScreen';
import { EventsDetailScreen } from './src/screens/events/EventsDetailScreen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Dark theme for navigation
const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6C5CE7',
    background: '#0F0F23',
    card: '#262647',
    text: '#FFFFFF',
    border: '#404066',
    notification: '#6C5CE7',
  },
};

const Drawer = createDrawerNavigator<RootDrawerParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// Main drawer navigator for primary screens
function MainDrawer() {
  return (
    <Drawer.Navigator
      initialRouteName="CharacterList"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#262647',
          borderBottomWidth: 1,
          borderBottomColor: '#404066',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
          letterSpacing: 0.3,
        },
        drawerStyle: {
          backgroundColor: '#262647',
          width: 280,
        },
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
        drawerActiveTintColor: '#6C5CE7',
        drawerInactiveTintColor: '#B8B8CC',
        drawerActiveBackgroundColor: 'rgba(108, 92, 231, 0.1)',
      }}
    >
      <Drawer.Screen
        name="CharacterList"
        component={CharacterListScreen}
        options={{
          title: 'Characters',
          drawerLabel: 'Characters',
        }}
      />
      <Drawer.Screen
        name="Factions"
        component={FactionListScreen}
        options={{
          title: 'Factions',
          drawerLabel: 'Factions',
        }}
      />
      <Drawer.Screen
        name="Locations"
        component={LocationListScreen}
        options={{
          title: 'Locations',
          drawerLabel: 'Locations',
        }}
      />
      <Drawer.Screen
        name="Events"
        component={EventsTimelineScreen}
        options={{
          title: 'Events',
          drawerLabel: 'Events',
        }}
      />
      <Drawer.Screen
        name="CharacterStats"
        component={CharacterStatsScreen}
        options={{
          title: 'Statistics',
          drawerLabel: 'Statistics',
        }}
      />
      <Drawer.Screen
        name="CharacterSearch"
        component={CharacterSearchScreen}
        options={{
          title: 'Search',
          drawerLabel: 'Search Characters',
        }}
      />
      <Drawer.Screen
        name="DataManagement"
        component={DataManagementScreen}
        options={{
          title: 'Data Management',
          drawerLabel: 'Data Management',
        }}
      />
    </Drawer.Navigator>
  );
}

// Root stack navigator for the entire app
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer theme={DarkTheme}>
        <Stack.Navigator
          initialRouteName="Main"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#262647',
              borderBottomWidth: 1,
              borderBottomColor: '#404066',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: '600',
              fontSize: 18,
              letterSpacing: 0.3,
            },
            cardStyle: {
              backgroundColor: '#0F0F23',
            },
          }}
        >
          <Stack.Screen
            name="Main"
            component={MainDrawer}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CharacterDetail"
            component={CharacterDetailScreen}
            options={({ route }) => ({ title: route.params.character.name })}
          />
          <Stack.Screen
            name="CharacterForm"
            component={CharacterFormScreen}
            options={{ title: 'Character Form' }}
          />
          <Stack.Screen
            name="FactionDetails"
            component={FactionDetailsScreen}
            options={({ route }) => ({ title: route.params.factionName })}
          />
          <Stack.Screen
            name="FactionForm"
            component={FactionFormScreen}
            options={{ title: 'Create Faction' }}
          />
          <Stack.Screen
            name="LocationDetails"
            component={LocationDetailsScreen}
            options={{ title: 'Location Details' }}
          />
          <Stack.Screen
            name="LocationForm"
            component={LocationFormScreen}
            options={{ title: 'Create Location' }}
          />
          <Stack.Screen
            name="LocationMap"
            component={LocationMapScreen}
            options={{ title: 'Junktown Map' }}
          />
          <Stack.Screen
            name="EventsTimeline"
            component={EventsTimelineScreen}
            options={{ title: 'Events Timeline' }}
          />
          <Stack.Screen
            name="EventsForm"
            component={EventsFormScreen}
            options={{ title: 'Event Form' }}
          />
          <Stack.Screen
            name="EventsDetail"
            component={EventsDetailScreen}
            options={{ title: 'Event Details' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
