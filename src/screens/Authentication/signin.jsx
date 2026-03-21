// src/screens/Authentication/signin.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Image
} from 'react-native';
import HearingLogo from '../../components/Images/Hearing-png2.png';
import Alert from '../../components/Alert'; // Import the custom Alert component
import { ScrollView } from 'react-native-gesture-handler';
const SignInScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handleSignIn = () => {
    if (!name.trim()) {
      setAlertMessage('Please enter your name.');
      setShowAlert(true);
      return;
    }
    if (!password.trim()) {
      setAlertMessage('Please enter your password.');
      setShowAlert(true);
      return;
    }

    // Perform actual sign-in logic here
    console.log('Signing in with:', { name, password });
    navigation.navigate('Home');
  };

  const handleCloseAlert = () => {
    setShowAlert(false);
    setAlertMessage('');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 40 }}>
        {/* Logo Section */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Image 
            source={HearingLogo} 
            style={{ width: 300, height: 250, resizeMode: 'contain' }} // Adjust width/height as needed
          />
        </View>

        {/* Login Form */}
        <Text style={{ fontSize: 24, fontWeight: '600', color: '#333', textAlign: 'center', marginBottom: 32 }}>
          Log in
        </Text>

        {/* Name Input */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, color: '#333', marginBottom: 2 }}>Enter Your Name</Text>
          <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>ඔබගේ නම ඇතුලත් කරන්න.</Text>
          <TextInput
            style={{ backgroundColor: '#F0F0F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, fontSize: 14, color: '#333' }}
            placeholder="AHCTRUINMY"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#999"
          />
        </View>

        {/* Password Input */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, color: '#333', marginBottom: 2 }}>Enter Password</Text>
          <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>මුරපදය ඇතුලත් කරන්න.</Text>
          <TextInput
            style={{ backgroundColor: '#F0F0F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, fontSize: 14, color: '#333' }}
            placeholder="• • • • • •"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#999"
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity 
          style={{ backgroundColor: '#0066B2', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 16, marginBottom: 24 }}
          onPress={handleSignIn}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Log in</Text>
        </TouchableOpacity>

        {/* Sign Up Link */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: '#666' }}>No account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={{ fontSize: 14, color: '#0066B2', fontWeight: '600' }}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Alert
        isVisible={showAlert}
        message={alertMessage}
        onClose={handleCloseAlert}
      />
    </ScrollView>
  );
};

export default SignInScreen;