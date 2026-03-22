import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
  return (
    <NavigationContainer>
      <StatusBar backgroundColor="#0066B2" barStyle="light-content" />
      <AppNavigator />
    </NavigationContainer>
  );
};

export default App;
