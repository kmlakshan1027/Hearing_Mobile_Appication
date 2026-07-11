// Generate.jsx  –  Screen 4: Result Generation Screen (Decision Engine)
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Animated, Easing,
  StatusBar, SafeAreaView,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import {
  getFirestore, collection, query, where, getDocs, doc, setDoc,
} from 'firebase/firestore';
import { app } from '../../configs/FirebaseConfig'; // adjust path to match your project structure
import { buildHearingReport, generateReportId } from '../utils/hearingReportEngine';

const STEPS = [
  { key: 'retrieve',  icon: '📥', label: 'Retrieving test data' },
  { key: 'analyze',   icon: '🔬', label: 'Analyzing frequencies' },
  { key: 'score',     icon: '📊', label: 'Calculating hearing score' },
  { key: 'recommend', icon: '💡', label: 'Generating recommendations' },
  { key: 'report',    icon: '📄', label: 'Creating report' },
];

// Minimum time each step stays visible, purely so the checklist doesn't flash
// instantly even though the underlying work is fast. Real work still drives
// when each step is allowed to complete.
const MIN_STEP_VISIBLE_MS = 550;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const GenerateScreen = ({ navigation, route }) => {
  const { leftResult, rightResult } = route.params ?? {};

  // Index of the step currently in progress / last completed.
  const [activeIndex, setActiveIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const [report, setReport] = useState(null);
  const spinValue = useRef(new Animated.Value(0)).current;
  const hasRunRef = useRef(false);

  // Spin animation for the current step's loading indicator
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spinValue]);

  // --- Run the actual decision-engine pipeline, one step at a time ---
  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const run = async () => {
      try {
        if (!leftResult || !rightResult) {
          throw new Error('Missing ear test results. Please run the hearing test again.');
        }

        // ── Step 1: Retrieving test data ──
        // Test data (leftResult / rightResult) already arrived via navigation
        // params from Progress.jsx. Here we retrieve the user's profile +
        // medical history from Firestore, matched by the signed-in email —
        // same lookup pattern used when the test results were saved.
        const stepStart1 = Date.now();

        const auth = getAuth(app);
        const currentEmail = auth.currentUser?.email;
        if (!currentEmail) {
          throw new Error('No signed-in user found. Please sign in again.');
        }

        const db = getFirestore(app);
        const authCollectionRef = collection(db, 'Auth');
        const matchingUserQuery = query(authCollectionRef, where('email', '==', currentEmail));
        const userSnapshot = await getDocs(matchingUserQuery);

        if (userSnapshot.empty) {
          throw new Error('No matching user profile found in Firestore.');
        }

        const userDocSnap = userSnapshot.docs[0];
        const userDocRef = userDocSnap.ref;
        const userProfile = { ...userDocSnap.data(), uid: userDocSnap.id };
        const medicalHistoryRaw = userProfile.medicalHistory ?? {};

        await Promise.all([delay(MIN_STEP_VISIBLE_MS - (Date.now() - stepStart1))]);
        setActiveIndex(1);

        // ── Step 2 & 3: Analyzing frequencies + Calculating hearing score ──
        // These are pure, synchronous computations (Sections 3–5), but we still
        // pace them slightly so the checklist reads naturally.
        const stepStart2 = Date.now();
        await delay(Math.max(0, MIN_STEP_VISIBLE_MS - (Date.now() - stepStart2)));
        setActiveIndex(2);

        const stepStart3 = Date.now();
        await delay(Math.max(0, MIN_STEP_VISIBLE_MS - (Date.now() - stepStart3)));
        setActiveIndex(3);

        // ── Step 4: Generating recommendations ──
        // Report ID needs to know how many reports already exist for this user.
        const stepStart4 = Date.now();
        const reportsCollectionRef = collection(db, 'Auth', userDocRef.id, 'Reports');
        const existingReportsSnapshot = await getDocs(reportsCollectionRef);
        const reportId = generateReportId(existingReportsSnapshot.size);

        const fullReport = buildHearingReport({
          leftResult,
          rightResult,
          userProfile,
          medicalHistoryRaw,
          reportId,
        });

        await delay(Math.max(0, MIN_STEP_VISIBLE_MS - (Date.now() - stepStart4)));
        setActiveIndex(4);

        // ── Step 5: Creating report ──
        // Persist the full report under the user's own document, in a
        // 'Reports' subcollection keyed by the generated Report ID.
        const stepStart5 = Date.now();
        const reportDocRef = doc(db, 'Auth', userDocRef.id, 'Reports', reportId);
        await setDoc(reportDocRef, fullReport);

        await delay(Math.max(0, MIN_STEP_VISIBLE_MS - (Date.now() - stepStart5)));
        setReport(fullReport);
        setActiveIndex(STEPS.length); // all done
      } catch (error) {
        console.error('Failed to generate hearing report:', error);
        setErrorMessage(error.message || 'Something went wrong while generating your report.');
      }
    };

    run();
  }, [leftResult, rightResult]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const isComplete = activeIndex >= STEPS.length && !errorMessage;
  const hasError = !!errorMessage;

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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{
            width: 48, height: 48, borderRadius: 24,
            backgroundColor: 'rgba(255,255,255,0.15)',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
          }}>
            <Text style={{ fontSize: 22 }}>🧠</Text>
          </View>
          <View>
            <Text style={{ color: '#A8C4E0', fontSize: 12, fontWeight: '500', letterSpacing: 0.4 }}>
              {hasError ? 'GENERATION FAILED' : isComplete ? 'ANALYSIS COMPLETE' : 'PROCESSING RESULTS'}
            </Text>
            <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginTop: 2 }}>
              Generating Report
            </Text>
          </View>
        </View>
      </View>

      {/* ── Body ── */}
      <View style={{
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 32,
        gap: 28,
      }}>

        {/* ── Status Text ── */}
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E293B', textAlign: 'center' }}>
            {hasError ? 'Report Generation Failed' : isComplete ? 'Your Report is Ready' : 'Processing Your Results'}
          </Text>
          <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center' }}>
            {hasError
              ? errorMessage
              : isComplete
              ? 'All steps completed successfully'
              : 'This will only take a moment'}
          </Text>
        </View>

        {/* ── Step Checklist ── */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          paddingVertical: 8,
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
        }}>
          {STEPS.map((step, index) => (
            <View key={step.key}>
              <StepRow
                step={step}
                state={
                  hasError && index === activeIndex ? 'error'
                  : index < activeIndex ? 'done'
                  : index === activeIndex ? 'active'
                  : 'pending'
                }
                spin={spin}
              />
              {index < STEPS.length - 1 && (
                <View style={{ height: 1, backgroundColor: '#F1F5F9', marginLeft: 70 }} />
              )}
            </View>
          ))}
        </View>

        {/* ── View Results Button ── */}
        {isComplete && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Results', { report })}
            activeOpacity={0.85}
            style={{
              borderRadius: 14, paddingVertical: 16,
              alignItems: 'center',
              backgroundColor: '#1A3C6E',
              shadowColor: '#1A3C6E',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.6 }}>
              VIEW RESULTS
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Retry Button (on failure) ── */}
        {hasError && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
            style={{
              borderRadius: 14, paddingVertical: 16,
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              borderWidth: 1.5, borderColor: '#CBD5E1',
            }}
          >
            <Text style={{ color: '#475569', fontSize: 16, fontWeight: '700' }}>Go Back</Text>
          </TouchableOpacity>
        )}

      </View>

    </SafeAreaView>
  );
};

/* ─────────────────────────── Sub-component ─────────────────────────── */

const StepRow = ({ step, state, spin }) => {
  const isDone = state === 'done';
  const isActive = state === 'active';
  const isError = state === 'error';

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 14, gap: 14,
    }}>
      {/* Icon bubble */}
      <View style={{
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: isDone ? '#F0FDF4' : isActive ? '#EEF2FF' : isError ? '#FEF2F2' : '#F8FAFC',
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Text style={{ fontSize: 18, opacity: state === 'pending' ? 0.35 : 1 }}>
          {isError ? '⚠️' : step.icon}
        </Text>
      </View>

      {/* Label */}
      <Text style={{
        flex: 1,
        fontSize: 14,
        fontWeight: isActive || isError ? '700' : '600',
        color: isDone ? '#1E293B' : isActive || isError ? '#1E293B' : '#94A3B8',
      }}>
        {step.label}
      </Text>

      {/* Trailing indicator: spinner / checkmark / error / empty */}
      <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
        {isDone && (
          <Text style={{ fontSize: 16, color: '#22C55E', fontWeight: '800' }}>✓</Text>
        )}
        {isActive && (
          <Animated.View style={{
            width: 18, height: 18, borderRadius: 9,
            borderWidth: 2.5,
            borderColor: '#E2E8F0',
            borderTopColor: '#1A3C6E',
            transform: [{ rotate: spin }],
          }} />
        )}
        {isError && (
          <Text style={{ fontSize: 16, color: '#EF4444', fontWeight: '800' }}>✕</Text>
        )}
      </View>
    </View>
  );
};

export default GenerateScreen;