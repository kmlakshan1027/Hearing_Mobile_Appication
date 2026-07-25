//AppNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Splash from '../screens/Splash';
import SignInScreen from '../screens/Authentication/signin';
import SignUpScreen from '../screens/Authentication/signup';
import HomeScreen from '../screens/home';
import ProcessScreen from '../screens/Ready';
import PrograssScreen from '../screens/Prograss';
import GenerateScreen from '../screens/Generate';
import Questionnaire from '../screens/Authentication/Questionnaire';
import Results from '../screens/Results';
import Terms from '../screens/Authentication/Terms';
import ResultsScreen from '../screens/Results';
import ReportListScreen from '../screens/ReportList';
import HelpScreen from '../screens/Help';
import ProfileScreen from '../screens/Profile';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Ready" component={ProcessScreen} />
      <Stack.Screen name="Progress" component={PrograssScreen} />
      <Stack.Screen name="Generate" component={GenerateScreen} />
      <Stack.Screen name="Results" component={ResultsScreen} />
      <Stack.Screen name="Reports" component={ReportListScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Questionnaire" component={Questionnaire} />
      <Stack.Screen name="Terms" component={Terms} />
    </Stack.Navigator>
  );
};

export default AppNavigator;