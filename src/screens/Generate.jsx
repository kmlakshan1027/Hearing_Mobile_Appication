// Generate.jsx  –  Screen 4: Result Generation Screen (decision-making engine)
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Animated, Easing,
  StatusBar, SafeAreaView,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import {
  getFirestore, collection, query, where, getDocs,
  updateDoc, arrayUnion,
} from 'firebase/firestore';
import { app } from '../../configs/FirebaseConfig'; 
import { questions as QUESTIONNAIRE_QUESTIONS } from '../screens/Authentication/Questionnaire'; 
import {
  buildFrequencyTable,
  calculateHearingPerformance,
  evaluateMedicalRisk,
  evaluateFinalRisk,
  generateExplanation,
  generateRecommendations,
  generateReportId,
  getDisclaimerText,
} from '../utils/hearingRiskEngine'; 

const STEPS = [
  { key: 'retrieve',  icon: '📥', label: 'Retrieving test data' },
  { key: 'analyze',   icon: '🔬', label: 'Analyzing frequencies' },
  { key: 'score',     icon: '📊', label: 'Calculating hearing score' },
  { key: 'recommend', icon: '💡', label: 'Generating recommendations' },
  { key: 'report',    icon: '📄', label: 'Creating report' },
];

const GenerateScreen = ({ navigation, route }) => {
  const { leftResult, rightResult } = route.params || {};

  // -1 = not started, index = which step is currently active, STEPS.length = all done
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState(null);
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

  // Run the pipeline exactly once
  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    if (!leftResult || !rightResult) {
      setError('Missing test data. Please start a new hearing test.');
      return;
    }

    runPipeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runPipeline = async () => {
    try {
      // ── Step 1: Retrieving test data ──
      // Pull the signed-in user's profile + medical history from their own
      // Firestore document (matched by email, since 'Auth' docs are keyed by uid).
      setActiveIndex(0);
      const auth = getAuth(app);
      const currentEmail = auth.currentUser?.email;
      if (!currentEmail) {
        throw new Error('No signed-in user found.');
      }

      const db = getFirestore(app);
      const authCollectionRef = collection(db, 'Auth');
      const matchingUserQuery = query(authCollectionRef, where('email', '==', currentEmail));
      const snapshot = await getDocs(matchingUserQuery);

      if (snapshot.empty) {
        throw new Error(`No Auth document found for email: ${currentEmail}`);
      }

      // Email is unique per user, so the first match is the user's own document.
      const userDocSnap = snapshot.docs[0];
      const userDocRef = userDocSnap.ref;
      const userData = userDocSnap.data();
      const medicalHistory = userData.medicalHistory || {};

      // ── Step 2: Analyzing frequencies ──
      setActiveIndex(1);
      const frequencyTable = buildFrequencyTable(leftResult, rightResult);

      // ── Step 3: Calculating hearing score ──
      // Objective hearing performance (Section 5) + rule-based medical risk (Section 6).
      setActiveIndex(2);
      const performance = calculateHearingPerformance(leftResult, rightResult);
      const medicalRisk = evaluateMedicalRisk(medicalHistory);

      // ── Step 4: Generating recommendations ──
      // Final risk via the rule-based decision matrix (Section 7), then recommendations (Section 8/9).
      setActiveIndex(3);
      const finalRisk = evaluateFinalRisk(performance.overallCategory, medicalRisk.levelIndex);
      const explanation = generateExplanation(performance.overallCategory, medicalRisk, finalRisk);
      const recommendations = generateRecommendations(finalRisk.classification, medicalRisk.factors);

      // ── Step 5: Creating report ──
      // Assemble the full report object and persist it to the user's own Firestore document.
      setActiveIndex(4);
      const reportId = generateReportId();
      const now = new Date();

      const fullReport = {
        reportId,
        testDate: now.toISOString(),

        // Section 1 — User Information
        userInfo: {
          name: userData.name ?? null,
          age: userData.ageCategory ?? null,
          gender: userData.gender ?? null,
          occupation: userData.jobRole ?? null,
          phoneNumber: userData.mobile ?? null,
          email: userData.email ?? currentEmail,
          employeeId: userDocSnap.id, // uid
        },

        // Section 2 — Medical History Summary (responses exactly as entered)
        medicalHistorySummary: QUESTIONNAIRE_QUESTIONS.map((q) => ({
          questionId: q.id,
          question: q.text,
          answer: medicalHistory[q.id] ?? 'Not answered',
        })),

        // Section 3 — Hearing Screening Results
        frequencyTable,

        // Section 4 — Frequency Response Summary
        earSummary: {
          left: performance.left,
          right: performance.right,
        },

        // Section 5 — Hearing Performance Analysis
        hearingPerformance: {
          leftScore: performance.left.score,
          rightScore: performance.right.score,
          overallScore: performance.overallScore,
          leftCategory: performance.left.category,
          rightCategory: performance.right.category,
          overallCategory: performance.overallCategory,
        },

        // Section 6 — Medical Risk Analysis
        medicalRisk: {
          classification: medicalRisk.classification,
          factors: medicalRisk.factors,
          appliedRules: medicalRisk.appliedRules,
        },

        // Section 7 — Final Risk Evaluation
        finalRisk: {
          classification: finalRisk.classification,
          specialistReferral: finalRisk.specialistReferral,
          explanation,
        },

        // Section 8/9 — Personalized Recommendations
        recommendations,

        // Section 11 — Disclaimer
        disclaimer: getDisclaimerText(),
      };

      await updateDoc(userDocRef, {
        reports: arrayUnion(fullReport),
        latestReportId: reportId,
        latestRiskStatus: finalRisk.classification,
        lastReportDate: fullReport.testDate,
      });

      setActiveIndex(STEPS.length);
      setReport(fullReport);
    } catch (err) {
      console.error('Failed to generate report:', err);
      setError(err?.message || 'Something went wrong while generating your report.');
    }
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const isComplete = !!report;

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
              {error ? 'SOMETHING WENT WRONG' : isComplete ? 'ANALYSIS COMPLETE' : 'PROCESSING RESULTS'}
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

        {error ? (
          <>
            {/* ── Error State ── */}
            <View style={{ alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 40 }}>⚠️</Text>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E293B', textAlign: 'center' }}>
                Report Generation Failed
              </Text>
              <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 19 }}>
                {error}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.75}
              style={{
                borderRadius: 14, paddingVertical: 16,
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                borderWidth: 1.5, borderColor: '#CBD5E1',
              }}
            >
              <Text style={{ color: '#475569', fontSize: 16, fontWeight: '700' }}>Go Back</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* ── Status Text ── */}
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E293B', textAlign: 'center' }}>
                {isComplete ? 'Your Report is Ready' : 'Processing Your Results'}
              </Text>
              <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center' }}>
                {isComplete
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
                      index < activeIndex ? 'done'
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
          </>
        )}

      </View>

    </SafeAreaView>
  );
};

/* ─────────────────────────── Sub-component ─────────────────────────── */

const StepRow = ({ step, state, spin }) => {
  const isDone = state === 'done';
  const isActive = state === 'active';

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 14, gap: 14,
    }}>
      {/* Icon bubble */}
      <View style={{
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: isDone ? '#F0FDF4' : isActive ? '#EEF2FF' : '#F8FAFC',
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Text style={{ fontSize: 18, opacity: state === 'pending' ? 0.35 : 1 }}>
          {step.icon}
        </Text>
      </View>

      {/* Label */}
      <Text style={{
        flex: 1,
        fontSize: 14,
        fontWeight: isActive ? '700' : '600',
        color: isDone ? '#1E293B' : isActive ? '#1E293B' : '#94A3B8',
      }}>
        {step.label}
      </Text>

      {/* Trailing indicator: spinner / checkmark / empty */}
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
      </View>
    </View>
  );
};

export default GenerateScreen;