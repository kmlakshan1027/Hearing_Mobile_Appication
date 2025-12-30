// src/screens/Authentication/signin.jsx
import React from 'react';
import { View, Text, Button } from 'react-native';

const SignInScreen = ({ navigation }) => {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Sign In Screen</Text>
      <Button
        title="Sign In"
        onPress={() => navigation.navigate('Home')}
      />
      <Button
        title="Go to Sign Up"
        onPress={() => navigation.navigate('SignUp')}
      />
    </View>
  );
};

export default SignInScreen;