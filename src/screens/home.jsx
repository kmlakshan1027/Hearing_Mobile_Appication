// home.jsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StatusBar, SafeAreaView, ActivityIndicator, Animated, Easing,
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

const getRiskStyle = (classification) => RISK_STYLES[classification] || null;

const formatDate = (isoString) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatShortDate = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
};

const HomeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [userData, setUserData] = useState(null); // { name, reports, latestRiskStatus, lastReportDate, ... }

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
          setUserData(null);
        } else {
          // Email is unique per user, so the first match is the user's own document.
          setUserData(snapshot.docs[0].data());
          setErrorMsg(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load dashboard data:', err);
        setErrorMsg('Failed to load dashboard data.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ── Derived values ──
  const reports = userData?.reports || [];
  const sortedReports = [...reports].sort((a, b) => new Date(a.testDate) - new Date(b.testDate));
  const latestReport = sortedReports.length ? sortedReports[sortedReports.length - 1] : null;

  const userName = userData?.name || 'there';
  const lastTestDateRaw = userData?.lastReportDate || latestReport?.testDate || null;
  const lastTestDateDisplay = lastTestDateRaw ? formatDate(lastTestDateRaw) : 'No tests yet';
  const riskClassification = userData?.latestRiskStatus || latestReport?.finalRisk?.classification || null;
  const riskStyle = getRiskStyle(riskClassification);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1A3C6E" />

      {/* ── Header ── */}
      <View style={{
        backgroundColor: '#1A3C6E',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
      }}>
        {/* Top row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo + title */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <EqualizerBars />
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

        {/* Welcome message */}
        <View style={{ marginTop: 18 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '800', letterSpacing: 0.2 }}>
            Welcome, {userName.split(' ')[0]} 👋
          </Text>
        </View>
      </View>

      {/* ── Body ── */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#1A3C6E" />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24, gap: 20 }}
          showsVerticalScrollIndicator={false}
        >

          {errorMsg && (
            <View style={{
              backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12,
              borderLeftWidth: 4, borderLeftColor: '#EF4444',
            }}>
              <Text style={{ fontSize: 12, color: '#991B1B' }}>{errorMsg}</Text>
            </View>
          )}

          {/* ── Hearing Health Score (hero card) ── */}
          <FadeInSection delay={90}>
            <HearingHealthScoreCard report={latestReport} navigation={navigation} />
          </FadeInSection>

          {/* ── Test Summary (chart) ── */}
          <FadeInSection delay={180}>
            <SectionBlock title="Test Summary">
              <TestSummaryChart reports={sortedReports} />
            </SectionBlock>
          </FadeInSection>

          {/* ── Latest Hearing Status ── */}
          <FadeInSection delay={270}>
            <SectionBlock title="Latest Hearing Status">
              {riskStyle && latestReport ? (
                <View style={{
                  borderRadius: 16, padding: 18,
                  backgroundColor: riskStyle.bg,
                  borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
                  shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
                }}>
                  {/* Status row */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      <View style={{
                        width: 50, height: 50, borderRadius: 25,
                        backgroundColor: riskStyle.color + '20',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Text style={{ fontSize: 24 }}>{riskStyle.icon}</Text>
                      </View>
                      <View>
                        <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }}>Risk Status</Text>
                        <Text style={{ fontSize: 20, fontWeight: '800', color: riskStyle.color }}>
                          {riskStyle.label}
                        </Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '500' }}>Last Checked</Text>
                      <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600', marginTop: 2 }}>{lastTestDateDisplay}</Text>
                    </View>
                  </View>

                  {/* View Reports CTA — reuses Results.jsx by passing the latest report directly */}
                  <TouchableOpacity
                    style={{
                      backgroundColor: riskStyle.color,
                      borderRadius: 10, paddingVertical: 12, alignItems: 'center',
                    }}
                    onPress={() => navigation.navigate('Results', { report: latestReport })}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 }}>
                      View Detailed Report
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{
                  borderRadius: 16, padding: 20,
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1, borderColor: '#E2E8F0',
                  alignItems: 'center', gap: 6,
                }}>
                  <Text style={{ fontSize: 28 }}>🎧</Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B' }}>No Tests Yet</Text>
                  <Text style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center' }}>
                    Complete your first hearing test to see your status here.
                  </Text>
                </View>
              )}
            </SectionBlock>
          </FadeInSection>

        </ScrollView>
      )}

      {/* ── Start New Test CTA ── */}
      <View style={{
        paddingHorizontal: 16, paddingBottom: 10, paddingTop: 14,
        backgroundColor: '#F8FAFC',
        borderTopWidth: 1, borderTopColor: '#E2E8F0',
      }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#1A3C6E',
            borderRadius: 14, paddingVertical: 16,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            shadowColor: '#1A3C6E',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
          }}
          onPress={() => navigation.navigate('Ready')}   // → Screen 2 (Ready Screen)
          activeOpacity={0.75}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.3 }}>
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

/**
 * Gentle, continuous "audio equalizer" pulse for the header logo bars.
 * Pure Animated API (no native module) — subtle, on-brand, not distracting.
 */
const EqualizerBars = () => {
  const barHeights = [3, 6, 9, 6, 3];
  const animValues = useRef(barHeights.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const loops = animValues.map((av, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(av, {
            toValue: 1,
            duration: 480 + i * 70,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false, // animating height, not eligible for native driver
          }),
          Animated.timing(av, {
            toValue: 0,
            duration: 480 + i * 70,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      )
    );
    Animated.stagger(90, loops).start();
  }, [animValues]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginRight: 4 }}>
      {barHeights.map((h, i) => {
        const height = animValues[i].interpolate({
          inputRange: [0, 1],
          outputRange: [h * 1.1, h * 2.3],
        });
        return (
          <Animated.View
            key={i}
            style={{ width: 3, height, backgroundColor: '#FFFFFF', borderRadius: 2 }}
          />
        );
      })}
    </View>
  );
};

/** Fade + slide-up entrance wrapper for staggered section reveals. */
const FadeInSection = ({ children, delay = 0 }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 480,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

/** Animated count-up number, e.g. 0 → 82 over ~1s. */
const AnimatedCounter = ({ value, suffix = '', duration = 1100, style }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animValue.setValue(0);
    const listenerId = animValue.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
    });
    Animated.timing(animValue, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // driving a JS state value, not a native prop
    }).start();
    return () => animValue.removeListener(listenerId);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return <Text style={style}>{displayValue}{suffix}</Text>;
};

/** Animated horizontal fill bar. */
const AnimatedProgressBar = ({ progress, color, trackColor = '#E2E8F0', height = 10 }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // animating width, not eligible for native driver
    }).start();
  }, [progress]); // eslint-disable-line react-hooks/exhaustive-deps

  const widthInterpolated = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: trackColor, overflow: 'hidden' }}>
      <Animated.View style={{ height: '100%', width: widthInterpolated, backgroundColor: color, borderRadius: height / 2 }} />
    </View>
  );
};

/**
 * Hero "Hearing Health Score" card — the visual anchor of the dashboard.
 * Shows the latest overall performance score with a count-up number and an
 * animated fill bar, colored by that test's final risk classification.
 * Falls back to an inviting call-to-action state when there's no report yet.
 */
const HearingHealthScoreCard = ({ report, navigation }) => {
  if (!report) {
    return (
      <View style={{
        borderRadius: 18, padding: 20,
        backgroundColor: '#1A3C6E',
        shadowColor: '#1A3C6E',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, shadowRadius: 14, elevation: 6,
        flexDirection: 'row', alignItems: 'center', gap: 14,
      }}>
        <View style={{
          width: 52, height: 52, borderRadius: 26,
          backgroundColor: 'rgba(255,255,255,0.15)',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 26 }}>🎧</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>
            Discover Your Hearing Health Score
          </Text>
          <Text style={{ color: '#A8C4E0', fontSize: 12, marginTop: 2 }}>
            Complete your first test to unlock it
          </Text>
        </View>
      </View>
    );
  }

  const score = report.hearingPerformance?.overallScore ?? 0;
  const category = report.hearingPerformance?.overallCategory ?? '';
  const classification = report.finalRisk?.classification;
  const style = getRiskStyle(classification) || { color: '#1A3C6E', bg: '#EEF2FF', icon: '🎧' };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate('Results', { report })}
      style={{
        borderRadius: 18, padding: 20,
        backgroundColor: '#1A3C6E',
        shadowColor: '#1A3C6E',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, shadowRadius: 14, elevation: 6,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: '#A8C4E0', fontSize: 11.5, fontWeight: '600', letterSpacing: 0.4 }}>
            HEARING HEALTH SCORE
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 4 }}>
            <AnimatedCounter
              value={score}
              suffix="%"
              style={{ color: '#FFFFFF', fontSize: 34, fontWeight: '800' }}
            />
          </View>
          <Text style={{ color: '#CBD5E1', fontSize: 12, marginTop: 2 }}>{category}</Text>
        </View>

        <View style={{
          width: 46, height: 46, borderRadius: 23,
          backgroundColor: 'rgba(255,255,255,0.12)',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 22 }}>{style.icon}</Text>
        </View>
      </View>

      <View style={{ marginTop: 16 }}>
        <AnimatedProgressBar progress={score} color={style.color} trackColor="rgba(255,255,255,0.15)" />
      </View>

      <Text style={{ color: '#A8C4E0', fontSize: 11, marginTop: 10 }}>
        Tap to view your full report →
      </Text>
    </TouchableOpacity>
  );
};

/**
 * Test Summary chart — plain React Native Views, no charting/SVG library.
 * (Deliberately avoids react-native-svg / react-native-chart-kit: those are
 * native modules requiring linking + a native rebuild, same category of
 * issue you just hit with react-native-html-to-pdf. This has zero native
 * dependency risk.)
 * Shows the last 6 tests' Overall Hearing Performance Score, bar-colored by
 * that test's final risk classification.
 */
const CHART_HEIGHT = 120;
const MAX_BARS = 6;

const TestSummaryChart = ({ reports }) => {
  if (!reports || reports.length === 0) {
    return (
      <View style={{
        backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20,
        alignItems: 'center', gap: 6,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
      }}>
        <Text style={{ fontSize: 26 }}>📊</Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B' }}>No Test History Yet</Text>
        <Text style={{ fontSize: 11.5, color: '#94A3B8', textAlign: 'center' }}>
          Your hearing performance trend will appear here after your first test.
        </Text>
      </View>
    );
  }

  const recentReports = reports.slice(-MAX_BARS);
  const averageScore = Math.round(
    (recentReports.reduce((sum, r) => sum + (r.hearingPerformance?.overallScore || 0), 0) / recentReports.length) * 10
  ) / 10;

  return (
    <View style={{
      backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '600' }}>
          Overall Hearing Performance
        </Text>
        <Text style={{ fontSize: 12, color: '#1A3C6E', fontWeight: '700' }}>
          Avg {averageScore}%
        </Text>
      </View>

      <View style={{
        flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around',
        height: CHART_HEIGHT,
      }}>
        {recentReports.map((r, index) => {
          const score = r.hearingPerformance?.overallScore ?? 0;
          const classification = r.finalRisk?.classification;
          const style = getRiskStyle(classification) || { color: '#1A3C6E' };
          const barHeight = Math.max(6, (score / 100) * CHART_HEIGHT);

          return (
            <View key={r.reportId || index} style={{ alignItems: 'center', flex: 1, gap: 6 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#475569' }}>{score}%</Text>
              <View style={{
                width: 18, height: barHeight,
                backgroundColor: style.color,
                borderRadius: 6,
              }} />
              <Text style={{ fontSize: 9, color: '#94A3B8' }}>{formatShortDate(r.testDate)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default HomeScreen;