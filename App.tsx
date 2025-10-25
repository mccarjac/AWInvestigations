import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './src/navigation/types';
import { CharacterListScreen } from './src/screens/CharacterListScreen';
import { CharacterDetailScreen } from './src/screens/CharacterDetailScreen';
import { CharacterFormScreen } from './src/screens/CharacterFormScreen';
import { CharacterStatsScreen } from './src/screens/CharacterStatsScreen';
import { CharacterSearchScreen } from './src/screens/CharacterSearchScreen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
    React.useEffect(() => {
    console.log('Window height:', window.innerHeight);
    console.log('Document height:', document.documentElement.clientHeight);
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="CharacterList">
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
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
