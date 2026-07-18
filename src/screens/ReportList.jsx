// ReportList.jsx  –  Reports Tab: All Test Reports List
// Lists every report saved in the signed-in user's own Firestore document
// (Auth collection, matched by email), newest first. Tapping a report opens
// the full detail view in Results.jsx.
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StatusBar, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';
import { app } from '../../configs/FirebaseConfig'; // adjust path to match your project structure
import BottomNavBar from '../components/BottomNavBar';

// ── Risk classification → color mapping (must match hearingRiskEngine.js output: LOW / MODERATE / HIGH / CRITICAL) ──
const RISK_STYLES = {
  LOW:      { color: '#22C55E', bg: '#F0FDF4', icon: '✅', label: 'Low Risk' },
  MODERATE: { color: '#F59E0B', bg: '#FFFBEB', icon: '⚠️', label: 'Moderate Risk' },
  HIGH:     { color: '#EF4444', bg: '#FEF2F2', icon: '🔴', label: 'High Risk' },
  CRITICAL: { color: '#7C3AED', bg: '#F5F3FF', icon: '🚨', label: 'Critical Risk' },
};

const getRiskStyle = (classification) =>
  RISK_STYLES[classification] || { color: '#64748B', bg: '#F1F5F9', icon: '❔', label: classification || 'Unknown' };

const formatDate = (isoString) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatTime = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const ReportListScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [reports, setReports] = useState([]);

  // ── Live Firestore listener: signed-in user's own document, matched by email ──
  useEffect(() => {
    const auth = getAuth(app);
    const currentEmail = auth.currentUser?.email;

    if (!currentEmail) {
      setErrorMsg('No signed-in user found.');
      setLoading(false);
      return;
    }

    const db = getFirestore(app);
    const authCollectionRef = collection(db, 'Auth');
    const matchingUserQuery = query(authCollectionRef, where('email', '==', currentEmail));

    const unsubscribe = onSnapshot(
      matchingUserQuery,
      (snapshot) => {
        if (snapshot.empty) {
          setErrorMsg('No profile found for this account.');
          setReports([]);
        } else {
          // Email is unique per user, so the first match is the user's own document.
          const userData = snapshot.docs[0].data();
          const allReports = userData.reports || [];

          // Newest first, based on the report's actual test date/time.
          const sorted = [...allReports].sort(
            (a, b) => new Date(b.testDate) - new Date(a.testDate)
          );

          setReports(sorted);
          setErrorMsg(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load reports:', err);
        setErrorMsg('Failed to load your reports.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const renderItem = ({ item, index }) => {
    const style = getRiskStyle(item.finalRisk?.classification);
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('Results', { report: item })}
        activeOpacity={0.75}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 14,
          backgroundColor: '#FFFFFF',
          borderRadius: 14, padding: 14,
          marginBottom: 12,
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
        }}
      >
        <View style={{
          width: 46, height: 46, borderRadius: 23,
          backgroundColor: style.bg,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 21 }}>{style.icon}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#1E293B' }}>
              {formatDate(item.testDate)}
            </Text>
            {index === 0 && (
              <View style={{ backgroundColor: '#1A3C6E', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 }}>LATEST</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>
            {formatTime(item.testDate)} • {item.reportId}
          </Text>
          <Text style={{ fontSize: 12.5, fontWeight: '700', color: style.color, marginTop: 4 }}>
            {style.label}
          </Text>
        </View>

        <Text style={{ fontSize: 20, color: '#CBD5E1' }}>›</Text>
      </TouchableOpacity>
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
        <Text style={{
          color: '#FFFFFF', fontSize: 19, fontWeight: '700', letterSpacing: 0.3, textAlign: 'center',
        }}>
          {loading ? 'Test Reports' : `Test Reports (${reports.length})`}
        </Text>
      </View>

      {/* ── Body ── */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#1A3C6E" />
        </View>
      ) : errorMsg ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 34, marginBottom: 10 }}>⚠️</Text>
          <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center' }}>{errorMsg}</Text>
        </View>
      ) : reports.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 }}>
          <Text style={{ fontSize: 40 }}>🎧</Text>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E293B' }}>No Reports Yet</Text>
          <Text style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>
            Complete a hearing test from the Dashboard to see your reports here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item, index) => item.reportId || String(index)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomNavBar navigation={navigation} activeTab="Reports" />
    </SafeAreaView>
  );
};

export default ReportListScreen;