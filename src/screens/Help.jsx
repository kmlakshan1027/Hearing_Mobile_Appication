// Help.jsx  –  Help Tab: How-to Guide, FAQ, and Contact Support
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StatusBar, SafeAreaView, Linking,
} from 'react-native';
import BottomNavBar from '../components/BottomNavBar';

// ── Content ──────────────────────────────────────────────────────────────
// Mirrors the same 7 steps shown on the Ready screen, for consistency.
const HOW_TO_STEPS = [
  { step: '01', icon: '🔌', title: 'Power ON the Device', description: 'Switch on your audiometric hearing device and wait for it to initialise.' },
  { step: '02', icon: '🎧', title: 'Wear Headphones', description: 'Put on the headphones properly — left cup on your left ear, right cup on your right ear.' },
  { step: '03', icon: '🤫', title: 'Find a Quiet Place', description: 'Sit in a quiet environment. Minimise background noise for accurate results.' },
  { step: '04', icon: '👂', title: 'Select the Ear to Test', description: 'On the device, select which ear you are testing first — Left or Right.' },
  { step: '05', icon: '⬜', title: 'Press White Button When Heard', description: 'Each time you hear a frequency, press the White Button on the device.' },
  { step: '06', icon: '🟥', title: 'Press Red Button When Not Heard', description: 'If you cannot hear a frequency, press the Red Button on the device.' },
  { step: '07', icon: '🔄', title: 'Complete Both Ears', description: 'Repeat the test for the other ear. Both ears must be tested before results are uploaded.' },
];

const FAQ_ITEMS = [
  {
    question: 'How accurate is this hearing screening?',
    answer: 'This screening is designed for occupational hearing monitoring and early detection purposes. It is not a substitute for a full clinical audiometric examination performed by a licensed audiologist.',
  },
  {
    question: 'Why do I need to test both ears separately?',
    answer: 'Hearing loss can affect each ear differently. Testing both ears individually gives a more accurate picture of your overall hearing health and helps identify asymmetric hearing loss.',
  },
  {
    question: 'What should I do if I get a High or Critical risk result?',
    answer: 'A High or Critical risk classification means we recommend consulting an audiologist or ENT specialist for further evaluation. You can view the specific recommendations on your report screen.',
  },
  {
    question: 'How often should I take a hearing test?',
    answer: 'For general monitoring, an annual test is recommended. If you work in a noisy environment or have ongoing symptoms, more frequent testing may be advised in your report recommendations.',
  },
  {
    question: 'My device is not connecting. What should I do?',
    answer: 'Make sure the device is powered on and connected via USB before starting a new test. If the issue continues, try restarting the device or reconnecting the cable.',
  },
  {
    question: 'Is my hearing test data kept private?',
    answer: 'Yes. Your test results and medical history are stored securely in your own account and are not shared with other users.',
  },
];

// Update these with your organization's real support details.
const SUPPORT_EMAIL = 'support@hearingcare.app';
const SUPPORT_PHONE = '+94 11 234 5678';

const HelpScreen = ({ navigation }) => {
  const [expandedFaqIndex, setExpandedFaqIndex] = useState(null);

  const toggleFaq = (index) => {
    setExpandedFaqIndex((prev) => (prev === index ? null : index));
  };

  const handleEmailPress = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() =>
      console.warn('Unable to open mail client')
    );
  };

  const handleCallPress = () => {
    Linking.openURL(`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`).catch(() =>
      console.warn('Unable to open dialer')
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1A3C6E" />

      {/* ── Header ── */}
      <View style={{
        backgroundColor: '#1A3C6E',
        paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
      }}>
        <Text style={{ color: '#FFFFFF', fontSize: 19, fontWeight: '700', letterSpacing: 0.3 }}>
          Help &amp; Support
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24, gap: 22 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── How-to Guide ── */}
        <Section title="How to Use the Device">
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            paddingVertical: 8,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
          }}>
            {HOW_TO_STEPS.map((item, index) => (
              <View key={item.step}>
                <HowToRow item={item} />
                {index < HOW_TO_STEPS.length - 1 && (
                  <View style={{ height: 1, backgroundColor: '#F1F5F9', marginLeft: 70 }} />
                )}
              </View>
            ))}
          </View>
        </Section>

        {/* ── FAQ ── */}
        <Section title="Frequently Asked Questions">
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            paddingVertical: 4,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
          }}>
            {FAQ_ITEMS.map((item, index) => (
              <View key={index}>
                <FaqRow
                  item={item}
                  expanded={expandedFaqIndex === index}
                  onPress={() => toggleFaq(index)}
                />
                {index < FAQ_ITEMS.length - 1 && (
                  <View style={{ height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 }} />
                )}
              </View>
            ))}
          </View>
        </Section>

        {/* ── Contact Support ── */}
        <Section title="Contact Support">
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            gap: 12,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
          }}>
            <Text style={{ fontSize: 12.5, color: '#64748B', lineHeight: 19 }}>
              Have a question that isn't covered above, or need help with your account?
              Reach out to our support team.
            </Text>

            <ContactRow
              icon="✉️"
              label="Email Support"
              value={SUPPORT_EMAIL}
              onPress={handleEmailPress}
            />
            <ContactRow
              icon="📞"
              label="Call Support"
              value={SUPPORT_PHONE}
              onPress={handleCallPress}
              last
            />
          </View>
        </Section>

      </ScrollView>

      <BottomNavBar navigation={navigation} activeTab="Help" />
    </SafeAreaView>
  );
};

/* ─────────────────────────── Sub-components ─────────────────────────── */

const Section = ({ title, children }) => (
  <View style={{ gap: 10 }}>
    <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E293B', letterSpacing: 0.1 }}>
      {title}
    </Text>
    {children}
  </View>
);

const HowToRow = ({ item }) => (
  <View style={{
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingVertical: 14, gap: 14,
  }}>
    <View style={{
      width: 42, height: 42, borderRadius: 21,
      backgroundColor: '#EEF2FF',
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Text style={{ fontSize: 20 }}>{item.icon}</Text>
    </View>
    <View style={{ flex: 1, gap: 3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 10, fontWeight: '800', color: '#1A3C6E', letterSpacing: 0.8, opacity: 0.6 }}>
          {item.step}
        </Text>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B' }}>
          {item.title}
        </Text>
      </View>
      <Text style={{ fontSize: 12, color: '#64748B', lineHeight: 18 }}>
        {item.description}
      </Text>
    </View>
  </View>
);

const FaqRow = ({ item, expanded, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <Text style={{ flex: 1, fontSize: 13.5, fontWeight: '700', color: '#1E293B', lineHeight: 19 }}>
        {item.question}
      </Text>
      <Text style={{ fontSize: 16, color: '#1A3C6E', fontWeight: '700' }}>
        {expanded ? '−' : '+'}
      </Text>
    </View>
    {expanded && (
      <Text style={{ fontSize: 12.5, color: '#64748B', lineHeight: 19, marginTop: 8 }}>
        {item.answer}
      </Text>
    )}
  </TouchableOpacity>
);

const ContactRow = ({ icon, label, value, onPress, last = false }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={{
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 4,
      borderTopWidth: last ? 0 : 0,
    }}
  >
    <View style={{
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: '#F8FAFC',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: 17 }}>{icon}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: '600' }}>{label}</Text>
      <Text style={{ fontSize: 13.5, fontWeight: '700', color: '#1A3C6E', marginTop: 1 }}>{value}</Text>
    </View>
    <Text style={{ fontSize: 18, color: '#CBD5E1' }}>›</Text>
  </TouchableOpacity>
);

export default HelpScreen;