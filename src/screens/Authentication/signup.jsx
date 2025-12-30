// src/screens/Authentication/signup.jsx
import React from 'react';
import { View, Text, Button } from 'react-native';

const SignUpScreen = ({ navigation }) => {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Sign Up Screen</Text>
      <Button
        title="Sign Up"
        onPress={() => navigation.navigate('Home')}
      />
      <Button
        title="Go to Sign In"
        onPress={() => navigation.navigate('SignIn')}
      />
    </View>
  );
};

export default SignUpScreen;