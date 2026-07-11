// home.jsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StatusBar, SafeAreaView, useWindowDimensions,
} from 'react-native';
import BottomNavBar from '../components/BottomNavBar';

const HomeScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();

  // --- State (replace with real Firebase/auth data as needed) ---
  const [userName] = useState('John Doe');
  const [lastTestDate] = useState('September 20, 2025');
  const [riskStatus] = useState('Medium Risk');   // 'Low Risk' | 'Medium Risk' | 'High Risk' | 'Critical Risk'
  const [completedTests] = useState(5);
  const [isConnected] = useState(true);

  // --- Helpers ---
  const getRiskColor = (status) => {
    switch (status) {
      case 'Low Risk':      return '#22C55E';
      case 'Medium Risk':   return '#F59E0B';
      case 'High Risk':     return '#EF4444';
      case 'Critical Risk': return '#7C3AED';
      default:              return '#F59E0B';
    }
  };

  const getRiskBg = (status) => {
    switch (status) {
      case 'Low Risk':      return '#F0FDF4';
      case 'Medium Risk':   return '#FFFBEB';
      case 'High Risk':     return '#FEF2F2';
      case 'Critical Risk': return '#F5F3FF';
      default:              return '#FFFBEB';
    }
  };

  const getRiskIcon = (status) => {
    switch (status) {
      case 'Low Risk':      return '✅';
      case 'Medium Risk':   return '⚠️';
      case 'High Risk':     return '🔴';
      case 'Critical Risk': return '🚨';
      default:              return '⚠️';
    }
  };


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
        {/* Top row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo + title */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginRight: 4 }}>
              {[3, 6, 9, 6, 3].map((h, i) => (
                <View key={i} style={{ width: 3, height: h * 2, backgroundColor: '#FFFFFF', borderRadius: 2 }} />
              ))}
            </View>
            <View>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: 0.3 }}>HearingCare</Text>
              <Text style={{ color: '#A8C4E0', fontSize: 11, marginTop: 1 }}>Prevent Hearing Loss</Text>
            </View>
          </View>

          {/* Profile button */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={{ padding: 2 }}
            activeOpacity={0.7}
          >
            <View style={{
              width: 38, height: 38, borderRadius: 19,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
            }}>
              <Text style={{ fontSize: 18 }}>👤</Text>
            </View>
          </TouchableOpacity>
        </View>

      </View>

      {/* ── Body ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Quick Stats Row ── */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <StatCard
            icon="🗓️"
            label="Last Test"
            value={lastTestDate}
            flex={1.6}
          />
          <StatCard
            icon="📋"
            label="Tests Done"
            value={String(completedTests)}
            flex={1}
          />
        </View>

        {/* ── Latest Hearing Status ── */}
        <SectionBlock title="Latest Hearing Status">
          <View style={{
            borderRadius: 16, padding: 18,
            backgroundColor: getRiskBg(riskStatus),
            borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
          }}>
            {/* Status row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{
                  width: 50, height: 50, borderRadius: 25,
                  backgroundColor: getRiskColor(riskStatus) + '20',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 24 }}>{getRiskIcon(riskStatus)}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }}>Risk Status</Text>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: getRiskColor(riskStatus) }}>
                    {riskStatus}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '500' }}>Last Checked</Text>
                <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600', marginTop: 2 }}>{lastTestDate}</Text>
              </View>
            </View>

            {/* View Reports CTA */}
            <TouchableOpacity
              style={{
                backgroundColor: getRiskColor(riskStatus),
                borderRadius: 10, paddingVertical: 12, alignItems: 'center',
              }}
              onPress={() => navigation.navigate('Reports')}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 }}>
                View Detailed Report
              </Text>
            </TouchableOpacity>
          </View>
        </SectionBlock>

      </ScrollView>

      {/* ── Start New Test CTA ── */}
      <View style={{
        paddingHorizontal: 16, paddingBottom: 30, paddingTop: 12,
        backgroundColor: '#F8FAFC',
        borderTopWidth: 1, borderTopColor: '#E2E8F0',
        alignItems: 'center', gap: 12,
      }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#1E293B', letterSpacing: 0.2 }}>
          Are You Ready?
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#1A3C6E',
            borderRadius: 14, paddingVertical: 16,
            width: '100%', alignItems: 'center',
            shadowColor: '#1A3C6E',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
          }}
          onPress={() => navigation.navigate('Ready')}   // → Screen 2 (Ready Screen)
          activeOpacity={0.85}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.8 }}>
            START NEW TEST
          </Text>
        </TouchableOpacity>
      </View>

      <BottomNavBar navigation={navigation} activeTab="Dashboard" />
    </SafeAreaView>
  );
};

/* ─────────────────────────── Sub-components ─────────────────────────── */

/** Reusable section wrapper with a bold title */
const SectionBlock = ({ title, children }) => (
  <View style={{ gap: 10 }}>
    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B', letterSpacing: 0.1 }}>{title}</Text>
    {children}
  </View>
);

/** Small stat card */
const StatCard = ({ icon, label, value, flex = 1 }) => (
  <View style={{
    flex,
    backgroundColor: '#FFFFFF',
    borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 5, elevation: 2,
    gap: 6,
  }}>
    <Text style={{ fontSize: 22 }}>{icon}</Text>
    <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '500' }}>{label}</Text>
    <Text style={{ fontSize: 13, color: '#1E293B', fontWeight: '700', flexShrink: 1 }}>{value}</Text>
  </View>
);

/** Quick action button */
const QuickAction = ({ icon, label, onPress, flex = 1 }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    style={{
      flex,
      backgroundColor: '#FFFFFF',
      borderRadius: 14, paddingVertical: 16,
      alignItems: 'center', gap: 8,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 5, elevation: 2,
      borderWidth: 1, borderColor: '#EEF2FF',
    }}
  >
    <Text style={{ fontSize: 26 }}>{icon}</Text>
    <Text style={{ fontSize: 13, color: '#1A3C6E', fontWeight: '700' }}>{label}</Text>
  </TouchableOpacity>
);

export default HomeScreen;