import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './src/navigation/types';
import { CharacterListScreen } from './src/screens/CharacterListScreen';
import { CharacterDetailScreen } from './src/screens/CharacterDetailScreen';
import { CharacterFormScreen } from './src/screens/CharacterFormScreen';
import { CharacterStatsScreen } from './src/screens/CharacterStatsScreen';
import { CharacterSearchScreen } from './src/screens/CharacterSearchScreen';
import { DataManagementScreen } from './src/screens/DataManagementScreen';
import { FactionScreen } from './src/screens/FactionScreen';
import { FactionDetailsScreen } from './src/screens/FactionDetailsScreen';
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

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
    React.useEffect(() => {
    console.log('Window height:', window.innerHeight);
    console.log('Document height:', document.documentElement.clientHeight);
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer theme={DarkTheme}>
        <Stack.Navigator 
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
            cardStyle: {
              backgroundColor: '#0F0F23',
            },
          }}
        >
          <Stack.Screen 
            name="CharacterList" 
            component={CharacterListScreen} 
            options={{ title: 'Home' }}
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
            name="CharacterStats" 
            component={CharacterStatsScreen} 
            options={{ title: 'Character Statistics' }}
          />
          <Stack.Screen 
            name="CharacterSearch" 
            component={CharacterSearchScreen} 
            options={{ title: 'Search Characters' }}
          />
          <Stack.Screen 
            name="DataManagement" 
            component={DataManagementScreen} 
            options={{ title: 'Data Management' }}
          />
          <Stack.Screen 
            name="Factions" 
            component={FactionScreen} 
            options={{ title: 'Factions' }}
          />
          <Stack.Screen 
            name="FactionDetails" 
            component={FactionDetailsScreen} 
            options={({ route }) => ({ title: route.params.factionName })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
