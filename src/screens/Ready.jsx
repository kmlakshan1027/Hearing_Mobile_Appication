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

const EAR_OPTIONS = ['Left Ear', 'Right Ear', 'Both Ears'];

const ReadyScreen = ({ navigation }) => {
  const [selectedEar, setSelectedEar] = useState('Both Ears');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1A3C6E" />

      {/* ── Header ── */}
      <View style={{
        backgroundColor: '#1A3C6E',
        paddingTop: 50,
        paddingBottom: 24,
        paddingHorizontal: 20,
      }}>
        {/* Back row */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18 }}
        >
          <Text style={{ color: '#A8C4E0', fontSize: 18 }}>‹</Text>
          <Text style={{ color: '#A8C4E0', fontSize: 13, fontWeight: '500' }}>Dashboard</Text>
        </TouchableOpacity>

        {/* Title block */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{
            width: 48, height: 48, borderRadius: 24,
            backgroundColor: 'rgba(255,255,255,0.15)',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
          }}>
            <Text style={{ fontSize: 22 }}>📋</Text>
          </View>
          <View>
            <Text style={{ color: '#A8C4E0', fontSize: 12, fontWeight: '500', letterSpacing: 0.4 }}>
              BEFORE YOU BEGIN
            </Text>
            <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginTop: 2 }}>
              Get Ready
            </Text>
          </View>
        </View>
      </View>

      {/* ── Body ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Instructions ── */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B', letterSpacing: 0.1 }}>
            Follow These Steps
          </Text>

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
                <InstructionRow item={item} />
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
              all frequencies automatically. Tap{' '}
              <Text style={{ fontWeight: '700' }}>Calculate</Text>{' '}
              only after your hardware is powered on and you are ready.
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

        {/* Start */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Progress')}
          activeOpacity={0.85}
          style={{
            flex: 2,
            borderRadius: 14, paddingVertical: 16,
            alignItems: 'center',
            backgroundColor: '#1A3C6E',
            shadowColor: '#1A3C6E',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.8 }}>
            Calculate
          </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
};

/* ─────────────────────────── Sub-component ─────────────────────────── */

const InstructionRow = ({ item }) => (
  <View style={{
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingVertical: 14, gap: 14,
  }}>
    {/* Step icon bubble */}
    <View style={{
      width: 42, height: 42, borderRadius: 21,
      backgroundColor: '#EEF2FF',
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

export default ReadyScreen;