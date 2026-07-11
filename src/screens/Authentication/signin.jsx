// src/screens/Authentication/signin.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../../../configs/FirebaseConfig'; // adjust path to match your project structure
import HearingLogo from '../../components/Images/Hearing-png2.png';
import Alert from '../../components/Alert'; // Import the custom Alert component

const auth = getAuth(app);
const db = getFirestore(app);

const SignInScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const showAlertMessage = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

  const handleSignIn = async () => {
    if (!email.trim()) {
      showAlertMessage('Please enter your email address.');
      return;
    }
    if (!password.trim()) {
      showAlertMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      // 1. Authenticate against Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // 2. Look up this user's Firestore document directly by uid —
      //    the 'Auth' collection is keyed by uid, same as signup/Terms write to.
      const userDocRef = doc(db, 'Auth', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Firebase Auth account exists, but registration was never finished
        // (e.g. the app was closed before reaching the Questionnaire/Terms steps).
        showAlertMessage('Please complete your registration to continue.');
        navigation.navigate('Questionnaire', {
          signupData: { uid: user.uid, email: user.email },
        });
        return;
      }

      const userData = userDocSnap.data();

      if (!userData.agreedToTerms) {
        // Registration started (partial Firestore doc exists) but the user
        // never finished the Questionnaire / Terms & Conditions step.
        showAlertMessage('Please complete your registration to continue.');
        navigation.navigate('Questionnaire', {
          signupData: { uid: user.uid, ...userData },
        });
        return;
      }

      // 3. Fully registered — proceed to the app
      navigation.navigate('Home');

    } catch (error) {
      console.error('Sign in error:', error);

      switch (error.code) {
        case 'auth/invalid-email':
          showAlertMessage('Please enter a valid email address.');
          break;
        case 'auth/user-not-found':
        case 'auth/invalid-credential':
          showAlertMessage('No account found with these credentials.');
          break;
        case 'auth/wrong-password':
          showAlertMessage('Incorrect password. Please try again.');
          break;
        case 'auth/too-many-requests':
          showAlertMessage('Too many attempts. Please try again later.');
          break;
        default:
          showAlertMessage('Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
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

        {/* Email Input */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, color: '#333', marginBottom: 2 }}>Enter Your E-mail Address</Text>
          <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>ඔබගේ ඊ-මේල් ලිපිනය ඇතුලත් කරන්න.</Text>
          <TextInput
            style={{ backgroundColor: '#F0F0F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, fontSize: 14, color: '#333' }}
            placeholder="XXXXXX@gmail.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#999"
            editable={!loading}
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
            editable={!loading}
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={{
            backgroundColor: loading ? '#99C2E0' : '#0066B2',
            borderRadius: 12, paddingVertical: 16, alignItems: 'center',
            marginTop: 16, marginBottom: 24,
          }}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Log in</Text>
          )}
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