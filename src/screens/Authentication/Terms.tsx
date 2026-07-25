// Terms.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app } from '../../../configs/FirebaseConfig';

interface TermsProps {
  onBack?: () => void;
  onAgree?: () => void;
}

// Hardcoded directly in the app — no longer fetched from Firestore.
// Update this text here whenever the Terms need to change; it ships with
// the app build rather than depending on a database read succeeding.
const TERMS_AND_CONDITIONS_TEXT = `Last updated: July 2026

1. ACCEPTANCE OF TERMS
By creating an account and using the HearingCare application ("the App"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the App.

2. PURPOSE OF SERVICE
HearingCare provides a mobile-integrated hearing screening tool intended for occupational hearing monitoring and early detection purposes. The App works together with an external audiometric screening device to collect hearing test data, analyze results, and generate risk classifications and recommendations.

3. NOT A MEDICAL DIAGNOSIS
The hearing screening results, risk classifications, and recommendations provided by this App are for informational and monitoring purposes only. They are NOT a substitute for a professional audiological diagnosis, a clinical audiometric examination, or medical advice from a licensed audiologist, ENT specialist, or physician. If your results indicate a Moderate, High, or Critical risk classification, or if you experience any hearing-related symptoms, you should consult a qualified healthcare professional.

4. ACCOUNT REGISTRATION
You agree to provide accurate, current, and complete information during registration, including your name, contact details, occupational information, and medical history responses. You are responsible for maintaining the confidentiality of your password and for all activity that occurs under your account.

5. DATA COLLECTION AND PRIVACY
By using this App, you consent to the collection and storage of:
   • Personal and demographic information provided at registration
   • Medical history questionnaire responses
   • Hearing test results collected via the connected screening device
   • Generated hearing reports and risk assessments

This data is stored securely and is associated only with your own account. It is not shared with other users of the App. Your data may be used to generate your personal hearing health reports and to track your hearing health over time.

6. ACCURACY OF DEVICE RESULTS
The App relies on data uploaded by an external ESP32-based screening device. The App does not control or generate the hearing test itself. The accuracy of your results depends on correct use of the device, a quiet testing environment, and proper device calibration. HearingCare is not responsible for inaccurate results caused by improper device use.

7. USER RESPONSIBILITIES
You agree to:
   • Use the App and screening device as instructed
   • Provide truthful answers in the medical history questionnaire
   • Seek professional medical evaluation when recommended by your report
   • Not rely solely on this App for any medical or occupational safety decision

8. LIMITATION OF LIABILITY
HearingCare and its developers shall not be held liable for any indirect, incidental, or consequential damages arising from your use of the App, including reliance on screening results or recommendations, to the fullest extent permitted by applicable law.

9. ACCOUNT DELETION
You may delete your account at any time from the Profile screen. Deleting your account will permanently remove your profile information and all associated hearing test reports. This action cannot be undone.

10. CHANGES TO THESE TERMS
We may update these Terms and Conditions from time to time. Continued use of the App after changes constitutes acceptance of the revised Terms.

11. CONTACT
If you have questions about these Terms, please contact our support team through the Help section of the App.

By tapping "Agree & Complete" below, you confirm that you have read, understood, and agree to these Terms and Conditions.`;

const Terms: React.FC<TermsProps> = ({ onBack, onAgree }) => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const route = useRoute<any>();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAgree = async () => {
    if (!agreed || loading) return;

    setLoading(true);
    try {
      const { signupData, questionnaireData } = route.params || {};

      if (signupData && signupData.uid) {
        const db = getFirestore(app);
        // Save all gathered data to the 'Auth' collection
        await setDoc(doc(db, 'Auth', signupData.uid), {
          ...signupData,
          medicalHistory: questionnaireData,
          agreedToTerms: true,
          createdAt: new Date().toISOString(),
        });
        console.log('Final data saved for user:', signupData.uid);
      }

      if (onAgree) {
        onAgree();
      } else {
        navigation.navigate('Home');
      }
    } catch (error) {
      console.error('Error completing registration:', error);
      // You might want to show an alert here if data saving fails
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>

      {/* Header */}
      <View style={{             
            backgroundColor: '#1A3C6E',
            paddingTop: 60, paddingHorizontal: 20,
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255,255,255,0.08)', }}>
        <Text style={{ fontSize: 24, fontWeight: '600', color: '#ffffff', marginBottom: 15, textAlign: 'center' }}>
          Terms and Conditions
        </Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: 13.5, color: '#374151', lineHeight: 22, textAlign: 'justify' }}>
          {TERMS_AND_CONDITIONS_TEXT}
        </Text>

        <View style={{ height: 10 }} />

      {/* Footer: Checkbox + Button */}
      <View style={{
        paddingHorizontal: 20,
        paddingBottom: 28,
        paddingTop: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
      }}>
        {/* Agree Checkbox */}
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}
          onPress={() => setAgreed(prev => !prev)}
          activeOpacity={0.7}
          disabled={loading}
        >
          <View style={{
            width: 20,
            height: 20,
            borderWidth: 2,
            borderColor: agreed ? '#1A3C6E' : '#9CA3AF',
            borderRadius: 3,
            backgroundColor: agreed ? '#1A3C6E' : '#FFFFFF',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 10,
            marginTop: 1,
            flexShrink: 0,
          }}>
            {agreed && (
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700', lineHeight: 16 }}>✓</Text>
            )}
          </View>
          <Text style={{ fontSize: 13.5, color: '#374151', lineHeight: 20, flex: 1 }}>
            I have read and agree to the Terms and Conditions
          </Text>
        </TouchableOpacity>

        {/* Agree & Complete Button */}
        <TouchableOpacity
          style={{
            backgroundColor: (agreed && !loading) ? '#1A3C6E' : '#93C5FD',
            borderRadius: 30,
            paddingVertical: 16,
            alignItems: 'center',
            shadowColor: '#1A3C6E',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: (agreed && !loading) ? 0.3 : 0,
            shadowRadius: 8,
            elevation: (agreed && !loading) ? 5 : 0,
          }}
          onPress={agreed && !loading ? handleAgree : undefined}
          activeOpacity={agreed && !loading ? 0.85 : 1}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 }}>
              Agree & Complete
            </Text>
          )}
        </TouchableOpacity>

        {/* Sign In Link */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10, marginTop: 10 }}>
          <Text style={{ fontSize: 14, color: '#666' }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={{ fontSize: 14, color: '#1A3C6E', fontWeight: '600' }}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
};

export default Terms;