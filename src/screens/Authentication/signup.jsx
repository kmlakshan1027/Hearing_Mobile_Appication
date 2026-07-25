// src/screens/Authentication/signup.jsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import Alert from '../../components/Alert';

// Firebase imports
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app } from '../../../configs/FirebaseConfig';
import { generateEmployeeId } from '../../utils/generateEmployeeId';
import { normalizeUsername, validateUsername, usernameToAuthEmail } from '../../utils/authUsername';

const auth = getAuth(app);
const db = getFirestore(app);

const InputField = ({ label, subLabel, placeholder, value, onChange, secureTextEntry = false, keyboardType = 'default', note, autoCapitalize = 'sentences' }) => (
  <View style={{ marginBottom: 24 }}>
    <Text style={{ fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 2 }}>{label}</Text>
    <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{subLabel}</Text>
    <TextInput
      style={{ backgroundColor: '#F0F0F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: '#333' }}
      placeholder={placeholder}
      value={value}
      onChangeText={onChange}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      autoCorrect={false}
      placeholderTextColor="#999"
    />
    {note && (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
        <Text style={{ fontSize: 11 }}>🔒</Text>
        <Text style={{ fontSize: 11, color: '#94A3B8', flex: 1 }}>{note}</Text>
      </View>
    )}
  </View>
);

const SelectField = ({ label, subLabel, value, onChange, options, placeholder }) => (
  <View style={{ marginBottom: 24 }}>
    <Text style={{ fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 2 }}>{label}</Text>
    <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{subLabel}</Text>
    <TouchableOpacity
      style={{
        backgroundColor: '#F0F0F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
      onPress={() => {
        const currentIndex = options.findIndex(opt => opt.value === value);
        const nextIndex = (currentIndex + 1) % options.length;
        onChange(options[nextIndex].value);
      }}
    >
      <Text style={{ fontSize: 14, color: value ? '#333' : '#999' }}>
        {value ? options.find(opt => opt.value === value)?.label : placeholder}
      </Text>
      <Text style={{ fontSize: 14, color: '#999' }}>▼</Text>
    </TouchableOpacity>
  </View>
);

const SignUpScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    username: '',
    ageCategory: '',
    gender: '',
    jobRole: '',
    workPlace: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const showAlertMessage = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

  const handleSignUp = async () => {
    const { name, mobile, username, ageCategory, gender, jobRole, workPlace, password, confirmPassword } = formData;

    // Basic validation
    if (!name || !mobile || !username || !ageCategory || !gender || !jobRole || !workPlace || !password || !confirmPassword) {
      showAlertMessage('Please fill in all fields.');
      return;
    }

    const usernameError = validateUsername(username);
    if (usernameError) {
      showAlertMessage(usernameError);
      return;
    }

    if (password !== confirmPassword) {
      showAlertMessage('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      showAlertMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const normalizedUsername = normalizeUsername(username);
      // Firebase Auth needs an email-formatted identifier — derive one from
      // the username. The user never sees or types this; it's purely how
      // Firebase Auth (and existing Firestore queries elsewhere in the app
      // that look up 'email') identify the account under the hood.
      const authEmail = usernameToAuthEmail(normalizedUsername);

      // 1. Create user with Firebase Auth. If this username is already taken,
      //    Firebase throws 'auth/email-already-in-use' — same protection a
      //    real email would get, for free.
      const userCredential = await createUserWithEmailAndPassword(auth, authEmail, password);
      const user = userCredential.user;

      // 2. Generate a short, human-friendly sequential ID (EM0001, EM0002, ...)
      //    for display/reference purposes. Firestore's own document ID stays
      //    as the Firebase Auth uid — that one is what Auth, security rules,
      //    and the rest of the app (e.g. Questionnaire edit mode) rely on.
      const employeeId = await generateEmployeeId(db);

      const signupData = {
        uid: user.uid,
        employeeId,
        name,
        mobile,
        username: normalizedUsername,
        email: authEmail, // internal synthetic identifier — kept so existing
                           // Firestore queries elsewhere (matched by 'email')
                           // continue to work unchanged
        ageCategory,
        gender,
        jobRole,
        workPlace,
      };

      // 3. Immediately write a PARTIAL Firestore document, marked as not yet
      //    agreed to Terms. This guarantees the user's own document exists
      //    from the moment their Auth account is created — so if they close
      //    the app before finishing Questionnaire/Terms, Sign In can detect
      //    the incomplete registration and route them back to finish it,
      //    without losing their already-entered details.
      await setDoc(doc(db, 'Auth', user.uid), {
        ...signupData,
        agreedToTerms: false,
        createdAt: new Date().toISOString(),
      });

      console.log('User authenticated and partial profile saved:', user.uid, employeeId);
      navigation.navigate('Questionnaire', { signupData });

    } catch (error) {
      console.error('Sign up error:', error);

      // User-friendly error messages
      switch (error.code) {
        case 'auth/email-already-in-use':
          showAlertMessage('This username is already taken. Please choose another.');
          break;
        case 'auth/invalid-email':
          showAlertMessage('Username contains characters that are not allowed. Use letters, numbers, underscores, or dots only.');
          break;
        case 'auth/weak-password':
          showAlertMessage('Password is too weak. Use at least 6 characters.');
          break;
        default:
          showAlertMessage('Sign up failed. Please try again.');
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header — matches Questionnaire.tsx's header style */}
      <View style={{
        backgroundColor: '#1A3C6E',
        paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
      }}>
        <Text style={{ fontSize: 24, fontWeight: '600', color: '#FFFFFF', textAlign: 'center' }}>
          Create Account
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 40 }}>

          {/* All Fields */}
          <View>
            <InputField
              label="Enter Your Name"
              subLabel="ඔබගේ නම ඇතුලත් කරන්න."
              placeholder="XXXXXXXX"
              value={formData.name}
              onChange={(val) => handleInputChange('name', val)}
            />

            <InputField
              label="Enter Your Mobile Number"
              subLabel="ඔබගේ දුරකතන අංකය ඇතුලත් කරන්න."
              placeholder="070XXXXXXX2"
              value={formData.mobile}
              onChange={(val) => handleInputChange('mobile', val)}
              keyboardType="phone-pad"
            />

            <InputField
              label="Choose a Username"
              subLabel="පරිශීලක නාමයක් තෝරන්න. (අකුරු 6කට වඩා)"
              placeholder="e.g. john_doe123"
              value={formData.username}
              onChange={(val) => handleInputChange('username', val)}
              autoCapitalize="none"
              note="Must be more than 5 characters and unique. This cannot be changed after registration — please choose carefully."
            />

            <SelectField
              label="Select Your Age Category"
              subLabel="ඔබගේ වයස් කාණ්ඩය තෝරන්න."
              placeholder="16 - 25"
              value={formData.ageCategory}
              onChange={(val) => handleInputChange('ageCategory', val)}
              options={[
                { value: '16-25', label: '16 - 25' },
                { value: '26-35', label: '26 - 35' },
                { value: '36-45', label: '36 - 45' },
                { value: '46-55', label: '46 - 55' },
                { value: '56+', label: '56+' }
              ]}
            />

            <SelectField
              label="Select Your Gender"
              subLabel="ඔබගේ ස්ත්‍රී පුරුෂ බව තෝරන්න."
              placeholder="Male"
              value={formData.gender}
              onChange={(val) => handleInputChange('gender', val)}
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' }
              ]}
            />

            <SelectField
              label="Select Job Role"
              subLabel="ඔබගේ රැකියා භූමිකාව තෝරන්න."
              placeholder="Production Assistant"
              value={formData.jobRole}
              onChange={(val) => handleInputChange('jobRole', val)}
              options={[
                { value: 'production-assistant', label: 'Production Assistant' },
                { value: 'supervisor', label: 'Supervisor' },
                { value: 'manager', label: 'Manager' },
                { value: 'technician', label: 'Technician' },
                { value: 'operator', label: 'Operator' }
              ]}
            />

            <InputField
              label="Enter Your Work Place Name"
              subLabel="ඔබ සේවය කරන ආයතනයේ නම ඇතුළත් කරන්න."
              placeholder="Abc (pvt) Ltd"
              value={formData.workPlace}
              onChange={(val) => handleInputChange('workPlace', val)}
            />

            <InputField
              label="Enter New Password"
              subLabel="නව මුරපදයක් ඇතුළත් කරන්න."
              placeholder="••••••••"
              value={formData.password}
              onChange={(val) => handleInputChange('password', val)}
              secureTextEntry={true}
              note="Choose carefully — your password cannot be changed later from within the app."
            />

            <InputField
              label="Re-Enter Your Password"
              subLabel="මුරපදය නැවත ඇතුළත් කරන්න."
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(val) => handleInputChange('confirmPassword', val)}
              secureTextEntry={true}
            />
          </View>

          {/* Next Button */}
          <TouchableOpacity
            onPress={handleSignUp}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#99C2E0' : '#1A3C6E',
              borderRadius: 20,
              paddingVertical: 12,
              alignItems: 'center',
              marginTop: 16,
              marginBottom: 30
            }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>Next</Text>
            )}
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 32 }}>
            <Text style={{ fontSize: 14, color: '#666' }}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={{ fontSize: 14, color: '#1A3C6E', fontWeight: '600' }}>Sign in</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      <Alert
        isVisible={showAlert}
        message={alertMessage}
        onClose={handleCloseAlert}
      />
    </SafeAreaView>
  );
};

export default SignUpScreen;