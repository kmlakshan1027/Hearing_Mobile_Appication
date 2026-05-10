import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StatusBar, SafeAreaView, Image, useWindowDimensions,
} from 'react-native';
import BottomNavBar from '../components/BottomNavBar';

import headphoneImg from '../components/Images/headphone.jpg';
import quietEnvImg from '../components/Images/quiet_environment.jpg';
import earTestImg from '../components/Images/ear_test.jpg';

const HomeScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const [lastTestDate] = useState('September 20, 2025');
  const [riskStatus] = useState('Medium Risk');
  const [isConnected] = useState(true);

  const getRiskColor = (status) => {
    switch (status) {
      case 'Low Risk': return '#22C55E';
      case 'Medium Risk': return '#F59E0B';
      case 'High Risk': return '#EF4444';
      default: return '#F59E0B';
    }
  };

  const getRiskBg = (status) => {
    switch (status) {
      case 'Low Risk': return '#F0FDF4';
      case 'Medium Risk': return '#FFFBEB';
      case 'High Risk': return '#FEF2F2';
      default: return '#FFFBEB';
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1A3C6E" />

      {/* Header */}
      <View style={{
        backgroundColor: '#1A3C6E',
        flexDirection: 'row',
        paddingTop: 50,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginRight: 8 }}>
            {[3, 6, 9, 6, 3].map((h, i) => (
              <View key={i} style={{ width: 3, height: h * 2, backgroundColor: '#FFFFFF', borderRadius: 2 }} />
            ))}
          </View>
          <View style={{ flexDirection: 'column' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: 0.3 }}>Hearing</Text>
            <Text style={{ color: '#A8C4E0', fontSize: 11, marginTop: 1 }}>Prevent Hearing Loss...</Text>
          </View>
        </View>
        <TouchableOpacity style={{ padding: 2 }}>
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 20, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Device Status */}
        <View style={{ gap: 10  }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B', letterSpacing: 0.1 }}>Device Status</Text>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 16,
            borderRadius: 12, paddingHorizontal: 16, paddingVertical: 20,
            backgroundColor: isConnected ? '#22C55E' : '#EF4444',
            shadowColor: isConnected ? '#22C55E' : '#EF4444',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
          }}>
            <View style={{
              width: 38, height: 38, borderRadius: 34,
              backgroundColor: 'rgba(255,255,255,0.3)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>✓</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Connected To Audiometric Device</Text>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 }}>ESP32 via USB Connection</Text>
            </View>
          </View>
        </View>

        {/* Test Preparation */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B', letterSpacing: 0.1 }}>Test Preparation</Text>
          <View style={{
            backgroundColor: '#FFFFFF', borderRadius: 16,
            paddingVertical: 20, paddingHorizontal: 10,
            flexDirection: 'row', justifyContent: 'space-between',
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
          }}>
            <PrepStep image={headphoneImg} label="Wear Headphones" screenWidth={width} />
            <PrepStep image={quietEnvImg} label="Quiet Place" screenWidth={width} />
            <PrepStep image={earTestImg} label="One Ear Test" screenWidth={width} />
          </View>
        </View>

        {/* Last Test Result */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B', letterSpacing: 0.1 }}>Last Test Result</Text>
          <View style={{
            borderRadius: 16, padding: 18, gap: 16,
            backgroundColor: getRiskBg(riskStatus),
            borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04, shadowRadius: 5, elevation: 2,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{
                  width: 48, height: 48, borderRadius: 24,
                  backgroundColor: getRiskColor(riskStatus) + '20',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 24 }}>⚠️</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>Risk Status</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: getRiskColor(riskStatus) }}>
                    {riskStatus}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '500' }}>Last Checked</Text>
                <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600', marginTop: 2 }}>{lastTestDate}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={{ backgroundColor: getRiskColor(riskStatus), borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}
              onPress={() => navigation.navigate('Reports')}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 }}>View Detailed Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Start Button */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 30, paddingTop: 10, gap: 16, alignItems: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#1E293B', letterSpacing: 0.2 }}>Are You Ready?</Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#1A3C6E',
            borderRadius: 14,
            paddingVertical: 16,
            width: '100%',
            alignItems: 'center',
            shadowColor: '#1A3C6E',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 8,
          }}
          onPress={() => navigation.navigate('Process')}
          activeOpacity={0.85}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.8 }}>START HEARING TEST</Text>
        </TouchableOpacity>
      </View>

      <BottomNavBar navigation={navigation} activeTab="Dashboard" />
    </SafeAreaView>
  );
};

const PrepStep = ({ image, label, screenWidth }) => {
  const stepSize = Math.min(screenWidth * 0.16, 64);
  return (
    <View style={{ alignItems: 'center', gap: 10, flex: 1 }}>
      <View style={{
        width: stepSize,
        height: stepSize,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <Image source={image} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
      </View>
      <Text style={{
        fontSize: 12,
        color: '#334155',
        textAlign: 'center',
        fontWeight: '600',
        lineHeight: 15,
        paddingHorizontal: 4,
      }}>{label}</Text>
    </View>
  );
};

export default HomeScreen;