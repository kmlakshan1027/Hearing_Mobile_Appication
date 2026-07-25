// src/screens/Authentication/signin.jsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '../../../configs/FirebaseConfig';
import Alert from '../../components/Alert';
import { usernameToAuthEmail } from '../../utils/authUsername';

const auth = getAuth(app);
const db = getFirestore(app);

const SignInScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const showAlertMessage = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

  const handleSignIn = async () => {
    if (!username.trim()) {
      showAlertMessage('Please enter your username.');
      return;
    }
    if (!password.trim()) {
      showAlertMessage('Please enter your password.');
      return;
    }

    // Same derivation used at signup — turns the Username into the internal
    // email-formatted identifier Firebase Auth actually authenticates against.
    const authEmail = usernameToAuthEmail(username);

    setLoading(true);
    try {
      // 1. Authenticate against Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, authEmail, password);
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
          showAlertMessage('Username contains characters that are not allowed.');
          break;
        case 'auth/user-not-found':
        case 'auth/invalid-credential':
          showAlertMessage('No account found with this username and password.');
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
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Brand Header ── */}
          <View style={{ alignItems: 'center', paddingTop: 64, paddingBottom: 28 }}>
            <EqualizerLogo />
            <Text style={{ color: '#1A3C6E', fontSize: 24, fontWeight: '800', letterSpacing: 0.3, marginTop: 14 }}>
              HearingCare
            </Text>
            <Text style={{ color: '#94A3B8', fontSize: 12.5, marginTop: 3, paddingBottom: 30 }}>
              Prevent Hearing Loss
            </Text>
          </View>

          {/* ── Form ── */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>

            {/* Username field */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 3 }}>
                Username
              </Text>
              <Text style={{ fontSize: 11.5, color: '#94A3B8', marginBottom: 10 }}>
                ඔබගේ පරිශීලක නාමය ඇතුලත් කරන්න.
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#F0F0F0', borderRadius: 12,
                  paddingHorizontal: 16, paddingVertical: 15,
                  fontSize: 14.5, color: '#333',
                }}
                placeholder="e.g. john_doe123"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#999"
                editable={!loading}
              />
            </View>

            {/* Password field */}
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 3 }}>
                Password
              </Text>
              <Text style={{ fontSize: 11.5, color: '#94A3B8', marginBottom: 10 }}>
                මුරපදය ඇතුලත් කරන්න.
              </Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: '#F0F0F0', borderRadius: 12,
                paddingHorizontal: 16,
              }}>
                <TextInput
                  style={{ flex: 1, paddingVertical: 15, fontSize: 14.5, color: '#333' }}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#999"
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPassword((p) => !p)} activeOpacity={0.7}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#1A3C6E', letterSpacing: 0.3 }}>
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={{
                backgroundColor: loading ? '#7D9BC2' : '#1A3C6E',
                borderRadius: 14, paddingVertical: 16, alignItems: 'center',
                marginTop: 24, marginBottom: 20,
                shadowColor: '#1A3C6E',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
              }}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.4 }}>
                  Log In
                </Text>
              )}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 13.5, color: '#64748B' }}>No account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={{ fontSize: 13.5, color: '#1A3C6E', fontWeight: '700' }}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Alert
        isVisible={showAlert}
        message={alertMessage}
        onClose={handleCloseAlert}
      />
    </View>
  );
};

/**
 * Animated "audio equalizer" logo mark — same visual language and animation
 * pattern as the header bars on home.jsx. Pure Animated API, no image asset
 * or native dependency.
 */
const EqualizerLogo = () => {
  const barHeights = [10, 20, 30, 20, 10];
  const animValues = useRef(barHeights.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const loops = animValues.map((av, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(av, {
            toValue: 1,
            duration: 480 + i * 70,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false, // animating height, not eligible for native driver
          }),
          Animated.timing(av, {
            toValue: 0,
            duration: 480 + i * 70,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      )
    );
    Animated.stagger(90, loops).start();
  }, [animValues]);

  return (
    <View style={{
      width: 92, height: 92, borderRadius: 46,
      backgroundColor: '#FFFFFF',
      alignItems: 'center', justifyContent: 'center',
      flexDirection: 'row', gap: 5,
      shadowColor: '#1A3C6E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15, shadowRadius: 10, elevation: 4,
    }}>
      {barHeights.map((h, i) => {
        const height = animValues[i].interpolate({
          inputRange: [0, 1],
          outputRange: [h * 0.6, h * 1.4],
        });
        return (
          <Animated.View
            key={i}
            style={{ width: 5, height, backgroundColor: '#1A3C6E', borderRadius: 3 }}
          />
        );
      })}
    </View>
  );
};

export default SignInScreen;