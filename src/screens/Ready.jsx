// Ready.jsx  –  Screen 2: Ready Screen (UI only)
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StatusBar, SafeAreaView,
} from 'react-native';

const INSTRUCTIONS = [
  {
    step: '01',
    icon: '🔌',
    title: 'Power ON the Device',
    description: 'Switch on your audiometric hearing device and wait for it to initialise.',
  },
  {
    step: '02',
    icon: '🎧',
    title: 'Wear Headphones',
    description: 'Put on the headphones properly — left cup on your left ear, right cup on your right ear.',
  },
  {
    step: '03',
    icon: '🤫',
    title: 'Find a Quiet Place',
    description: 'Sit in a quiet environment. Minimise background noise for accurate results.',
  },
  {
    step: '04',
    icon: '👂',
    title: 'Select the Ear to Test',
    description: 'On the device, select which ear you are testing first — Left or Right.',
  },
  {
    step: '05',
    icon: '⬜',
    title: 'Press White Button When Heard',
    description: 'Each time you hear a frequency, press the White Button on the device.',
  },
  {
    step: '06',
    icon: '🟥',
    title: 'Press Red Button When Not Heard',
    description: 'If you cannot hear a frequency, press the Red Button on the device.',
  },
  {
    step: '07',
    icon: '🔄',
    title: 'Complete Both Ears',
    description: 'Repeat the test for the other ear. Both ears must be tested before results are uploaded.',
  },
];

const ReadyScreen = ({ navigation }) => {
  // Track which steps have been checked off by the user
  const [checkedSteps, setCheckedSteps] = useState({});

  const allChecked = INSTRUCTIONS.every((item) => checkedSteps[item.step]);
  const checkedCount = INSTRUCTIONS.filter((item) => checkedSteps[item.step]).length;

  const toggleStep = (step) => {
    setCheckedSteps((prev) => ({ ...prev, [step]: !prev[step] }));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1A3C6E" />

      {/* ── Header ── */}
      <View style={{
        backgroundColor: '#1A3C6E',
        paddingTop: 50,
        paddingBottom: 28,
        paddingHorizontal: 20,
        alignItems: 'center',
      }}>
        <Text style={{
          color: '#A8C4E0',
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 1.2,
          textAlign: 'center',
        }}>
          BEFORE YOU BEGIN
        </Text>
        <Text style={{
          color: '#FFFFFF',
          fontSize: 24,
          fontWeight: '800',
          marginTop: 4,
          textAlign: 'center',
          letterSpacing: 0.2,
        }}>
          Get Ready
        </Text>
        <View style={{
          width: 40,
          height: 3,
          borderRadius: 2,
          backgroundColor: 'rgba(255,255,255,0.35)',
          marginTop: 12,
        }} />
      </View>

      {/* ── Body ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Instructions ── */}
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B', letterSpacing: 0.1 }}>
              Follow These Steps
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: allChecked ? '#16A34A' : '#94A3B8' }}>
              {checkedCount}/{INSTRUCTIONS.length} completed
            </Text>
          </View>

          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            paddingVertical: 8,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
            overflow: 'hidden',
          }}>
            {INSTRUCTIONS.map((item, index) => (
              <View key={item.step}>
                <InstructionRow
                  item={item}
                  checked={!!checkedSteps[item.step]}
                  onToggle={() => toggleStep(item.step)}
                />
                {index < INSTRUCTIONS.length - 1 && (
                  <View style={{ height: 1, backgroundColor: '#F1F5F9', marginLeft: 70 }} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* ── Important Notice ── */}
        <View style={{
          backgroundColor: '#EFF6FF',
          borderRadius: 14, padding: 14,
          borderLeftWidth: 4, borderLeftColor: '#1A3C6E',
          flexDirection: 'row', gap: 12, alignItems: 'flex-start',
        }}>
          <Text style={{ fontSize: 20, marginTop: 1 }}>ℹ️</Text>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#1A3C6E' }}>
              Important
            </Text>
            <Text style={{ fontSize: 12, color: '#475569', lineHeight: 18 }}>
              The mobile app does not control the hearing test. The external device generates
              all frequencies automatically. Check off each step above, then tap{' '}
              <Text style={{ fontWeight: '700' }}>Next</Text>{' '}
              once your hardware is powered on and you are ready.
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* ── Bottom Action Buttons ── */}
      <View style={{
        paddingHorizontal: 16, paddingBottom: 30, paddingTop: 12,
        backgroundColor: '#F8FAFC',
        borderTopWidth: 1, borderTopColor: '#E2E8F0',
        flexDirection: 'row', gap: 12,
      }}>
        {/* Back */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
          style={{
            flex: 1,
            borderRadius: 14, paddingVertical: 16,
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            borderWidth: 1.5, borderColor: '#CBD5E1',
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
          }}
        >
          <Text style={{ color: '#475569', fontSize: 16, fontWeight: '700' }}>Back</Text>
        </TouchableOpacity>

        {/* Start — only enabled once every step is checked off */}
        <TouchableOpacity
          onPress={() => allChecked && navigation.navigate('Progress')}
          activeOpacity={allChecked ? 0.85 : 1}
          disabled={!allChecked}
          style={{
            flex: 2,
            borderRadius: 14, paddingVertical: 16,
            alignItems: 'center',
            backgroundColor: allChecked ? '#1A3C6E' : '#CBD5E1',
            shadowColor: allChecked ? '#1A3C6E' : 'transparent',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: allChecked ? 0.35 : 0,
            shadowRadius: 10, elevation: allChecked ? 8 : 0,
          }}
        >
          <Text style={{
            color: allChecked ? '#FFFFFF' : '#64748B',
            fontSize: 17, fontWeight: '700', letterSpacing: 0.8,
          }}>
            Next
          </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
};

/* ─────────────────────────── Sub-component ─────────────────────────── */

const InstructionRow = ({ item, checked, onToggle }) => (
  <TouchableOpacity
    onPress={onToggle}
    activeOpacity={0.7}
    style={{
      flexDirection: 'row', alignItems: 'flex-start',
      paddingHorizontal: 16, paddingVertical: 14, gap: 14,
    }}
  >
    {/* Step icon bubble */}
    <View style={{
      width: 42, height: 42, borderRadius: 21,
      backgroundColor: checked ? '#EEF2FF' : '#F8FAFC',
      borderWidth: 1,
      borderColor: checked ? '#C7D2FE' : '#E2E8F0',
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Text style={{ fontSize: 20 }}>{item.icon}</Text>
    </View>

    {/* Text */}
    <View style={{ flex: 1, gap: 3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{
          fontSize: 10, fontWeight: '800', color: '#1A3C6E',
          letterSpacing: 0.8, opacity: 0.6,
        }}>
          {item.step}
        </Text>
        <Text style={{
          fontSize: 14, fontWeight: '700',
          color: checked ? '#1E293B' : '#1E293B',
        }}>
          {item.title}
        </Text>
      </View>
      <Text style={{ fontSize: 12, color: '#64748B', lineHeight: 18 }}>
        {item.description}
      </Text>
    </View>

    {/* Checkbox */}
    <View style={{
      width: 24, height: 24, borderRadius: 7,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: checked ? '#1A3C6E' : '#FFFFFF',
      borderWidth: 1.5,
      borderColor: checked ? '#1A3C6E' : '#CBD5E1',
      marginTop: 2,
      flexShrink: 0,
    }}>
      {checked && (
        <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>✓</Text>
      )}
    </View>
  </TouchableOpacity>
);

export default ReadyScreen;