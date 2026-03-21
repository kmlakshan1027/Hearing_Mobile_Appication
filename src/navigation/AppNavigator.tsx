import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SignInScreen from '../screens/Authentication/signin';
import SignUpScreen from '../screens/Authentication/signup';
import HomeScreen from '../screens/home';
import Questionnaire from '../screens/Authentication/Questionnaire';
import Terms from '../screens/Authentication/Terms';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="SignIn" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Questionnaire" component={Questionnaire} />
      <Stack.Screen name="Terms" component={Terms} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
