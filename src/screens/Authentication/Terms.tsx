import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '../../../configs/FirebaseConfig';

interface TermsProps {
  onBack?: () => void;
  onAgree?: () => void;
}

const Terms: React.FC<TermsProps> = ({ onBack, onAgree }) => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [agreed, setAgreed] = useState(false);
  const [termsContent, setTermsContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const db = getFirestore(app);
        const snapshot = await getDocs(collection(db, 'Terms'));
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = doc.data();
          setTermsContent(data.value ?? 'No terms available.');
        } else {
          setTermsContent('No terms available.');
        }
      } catch (error) {
        console.error('Error fetching terms:', error);
        setTermsContent('Failed to load terms. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, []);

  const handleAgree = () => {
    if (onAgree) {
      onAgree();
    } else {
      navigation.navigate('Home');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 40 }}>
        <Text style={{ fontSize: 24, fontWeight: '600', color: '#333', marginBottom: 15, textAlign: 'center' }}>
          Terms and Conditions
        </Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#0066B2" style={{ marginTop: 40 }} />
        ) : (
          <Text style={{ fontSize: 13.5, color: '#374151', lineHeight: 22, textAlign: 'justify' }}>
            {termsContent}
          </Text>
        )}

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
            borderColor: agreed ? '#0066B2' : '#9CA3AF',
            borderRadius: 3,
            backgroundColor: agreed ? '#0066B2' : '#FFFFFF',
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
            backgroundColor: (agreed && !loading) ? '#0066B2' : '#93C5FD',
            borderRadius: 30,
            paddingVertical: 16,
            alignItems: 'center',
            shadowColor: '#0066B2',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: (agreed && !loading) ? 0.3 : 0,
            shadowRadius: 8,
            elevation: (agreed && !loading) ? 5 : 0,
          }}
          onPress={agreed && !loading ? handleAgree : undefined}
          activeOpacity={agreed && !loading ? 0.85 : 1}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 }}>
            Agree & Complete
          </Text>
        </TouchableOpacity>

        {/* Sign In Link */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10, marginTop: 10 }}>
          <Text style={{ fontSize: 14, color: '#666' }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={{ fontSize: 14, color: '#0066B2', fontWeight: '600' }}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
};

export default Terms;