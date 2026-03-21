import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

const TERMS_CONTENT = `By accessing and using this application, you agree to comply with these Terms and Conditions. This application is designed for preliminary hearing screening and educational purposes only and does not replace professional medical examination, diagnosis, or treatment. The audiometric results and predictive insights provided are based on user responses, external hardware input, and standardized reference data, and should be interpreted as supportive information rather than clinical conclusions.

By continuing to use this application, you consent to the collection, secure storage, and processing of your personal and hearing-related data for assessment, research, and report generation purposes only. Reasonable measures are taken to protect user data; however, the developers shall not be held responsible for inaccuracies caused by improper usage, environmental noise, hardware malfunction, or incorrect information provided by the user.

The application may be updated, modified, or discontinued at any time to improve functionality or accuracy. Continued use of the application after such updates indicates your acceptance of the revised Terms and Conditions.

By continuing to use this application, you consent to the collection, secure storage, and processing of your personal and hearing-related data for assessment, research, and report generation purposes only. Reasonable measures are taken to protect user data; however, the developers shall not be held responsible for inaccuracies caused by improper usage, environmental noise, hardware malfunction, or incorrect information provided by the user.

The application may be updated, modified, or discontinued at any time to improve functionality or accuracy. Continued use of the application after such updates indicates your acceptance of the revised Terms and Conditions.`;

interface TermsProps {
  onBack?: () => void;
  onAgree?: () => void;
}

const Terms: React.FC<TermsProps> = ({ onBack, onAgree }) => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [agreed, setAgreed] = useState(false);

  const handleAgree = () => {
    if (onAgree) {
      onAgree();
    } else {
      navigation.navigate('Home');
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 40}}>
        <Text style={{ fontSize: 24, fontWeight: '600', color: '#333', marginBottom: 24, textAlign: 'center' }}>Terms and Conditions</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <Text style={styles.body}>{TERMS_CONTENT}</Text>

        {/* Spacer so checkbox isn't hidden behind footer */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Footer: Checkbox + Button */}
      <View style={styles.footer}>
        {/* Agree Checkbox */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgreed(prev => !prev)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            I have read and agree to the Terms and Conditions
          </Text>
        </TouchableOpacity>

        {/* Agree & Complete Button */}
        <TouchableOpacity
          style={[styles.agreeButton, !agreed && styles.agreeButtonDisabled]}
          onPress={agreed ? handleAgree : undefined}
          activeOpacity={agreed ? 0.85 : 1}
        >
          <Text style={styles.agreeButtonText}>Agree & Complete</Text>
        </TouchableOpacity>

        {/* Sign In Link */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 28, marginTop: 10 }}>
          <Text style={{ fontSize: 14, color: '#666' }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={{ fontSize: 14, color: '#0066B2', fontWeight: '600' }}>Sign in</Text>
          </TouchableOpacity>
        </View>
        
      </View>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Progress
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '100%',
    backgroundColor: '#1D4ED8',
    borderRadius: 2,
  },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 28,
    color: '#374151',
    lineHeight: 32,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },

  // Text
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    fontSize: 13.5,
    color: '#374151',
    lineHeight: 22,
    textAlign: 'justify', // Added this line
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  // Checkbox
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  checkboxLabel: {
    fontSize: 13.5,
    color: '#374151',
    lineHeight: 20,
    flex: 1,
  },

  // Button
  agreeButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  agreeButtonDisabled: {
    backgroundColor: '#93C5FD',
    shadowOpacity: 0,
    elevation: 0,
  },
  agreeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default Terms;