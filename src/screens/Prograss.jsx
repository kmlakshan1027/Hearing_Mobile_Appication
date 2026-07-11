// Progress.jsx  –  Screen 3: Progress Screen
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Animated, Easing,
  StatusBar, SafeAreaView,
} from 'react-native';
import { ref, get, onChildAdded, off } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import {
  getFirestore, collection, query, where, getDocs,
  updateDoc, arrayUnion, increment,
} from 'firebase/firestore';
import { app, database } from '../../configs/FirebaseConfig'; // adjust path to match your project structure

const HEARING_TEST_PATH = 'hearing_test';

const ProgressScreen = ({ navigation }) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const [dots, setDots] = useState('.');

  // --- Firebase-driven state ---
  const [leftResult, setLeftResult] = useState(null);
  const [rightResult, setRightResult] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Keys that already existed in the DB before this screen started listening.
  // Anything with a key already in this set is an OLD result and must be ignored.
  const seenKeysRef = useRef(new Set());
  const testStartTimeRef = useRef(Date.now());
  const navigatedRef = useRef(false);

  // Spin animation for the loading ring
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spinValue]);

  // Pulse animation for the center icon
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.15,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseValue]);

  // Animated "..." dots for waiting text
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '.' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Elapsed waiting time (based on when this screen mounted, i.e. testStartTimeRef)
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - testStartTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Firebase Realtime Database listener: wait for LEFT and RIGHT ear results ---
  useEffect(() => {
    const hearingTestRef = ref(database, HEARING_TEST_PATH);
    let isMounted = true;

    const handleChildAdded = (snapshot) => {
      // Ignore results that already existed before this screen started listening —
      // those belong to a previous test session, not this one.
      if (seenKeysRef.current.has(snapshot.key)) return;
      seenKeysRef.current.add(snapshot.key);

      const data = snapshot.val();
      if (!data || !data.ear) return;

      // Tag with the time WE received it (client wall-clock), since the device's
      // own `timestamp` field is uptime-based, not a real date/time.
      const receivedAt = Date.now();
      const record = { ...data, key: snapshot.key, receivedAt };

      if (!isMounted) return;

      if (data.ear === 'LEFT') {
        setLeftResult(record);
      } else if (data.ear === 'RIGHT') {
        setRightResult(record);
      }
    };

    // 1. Snapshot existing children first, so we know what to ignore.
    // 2. Only THEN attach the child_added listener.
    get(hearingTestRef)
      .then((snapshot) => {
        snapshot.forEach((child) => {
          seenKeysRef.current.add(child.key);
        });
        onChildAdded(hearingTestRef, handleChildAdded);
      })
      .catch((error) => {
        console.error('Failed to read existing hearing_test data:', error);
        // Even if the initial read fails, still listen for new results.
        onChildAdded(hearingTestRef, handleChildAdded);
      });

    return () => {
      isMounted = false;
      off(hearingTestRef, 'child_added', handleChildAdded);
    };
  }, []);

  // --- Save the completed test results into the signed-in user's Firestore document ---
  // The 'Auth' collection is keyed by uid, so we find the user's doc by matching
  // the unique 'email' field against the currently signed-in Firebase Auth user.
  const saveResultsToUserDocument = async (left, right) => {
    const auth = getAuth(app);
    const currentEmail = auth.currentUser?.email;

    if (!currentEmail) {
      console.warn('No signed-in user email found — skipping Firestore save.');
      return;
    }

    const db = getFirestore(app);
    const authCollectionRef = collection(db, 'Auth');
    const matchingUserQuery = query(authCollectionRef, where('email', '==', currentEmail));
    const snapshot = await getDocs(matchingUserQuery);

    if (snapshot.empty) {
      console.warn(`No Auth document found for email: ${currentEmail}`);
      return;
    }

    // Email is unique per user, so the first match is the user's own document.
    const userDocRef = snapshot.docs[0].ref;

    const testRecord = {
      id: `${Date.now()}`,
      testDate: new Date().toISOString(),
      left: {
        ear: left.ear,
        heard_count: left.heard_count,
        heard_frequencies: left.heard_frequencies,
        missed_count: left.missed_count,
        missed_frequencies: left.missed_frequencies,
        deviceTimestamp: left.timestamp,
      },
      right: {
        ear: right.ear,
        heard_count: right.heard_count,
        heard_frequencies: right.heard_frequencies,
        missed_count: right.missed_count,
        missed_frequencies: right.missed_frequencies,
        deviceTimestamp: right.timestamp,
      },
    };

    await updateDoc(userDocRef, {
      hearingTests: arrayUnion(testRecord),
      completedTests: increment(1),
      lastTestDate: testRecord.testDate,
    });
  };

  // --- Once both ears are in: save to Firestore, then navigate to Result Generation screen ---
  useEffect(() => {
    if (leftResult && rightResult && !navigatedRef.current) {
      navigatedRef.current = true;

      const persistAndNavigate = async () => {
        try {
          await saveResultsToUserDocument(leftResult, rightResult);
        } catch (error) {
          console.error('Failed to save hearing test results to Firestore:', error);
          // Still proceed to the Generate screen — the raw results are passed
          // along via navigation params regardless of whether the save succeeded.
        } finally {
          navigation.replace('Generate', { leftResult, rightResult });
        }
      };

      persistAndNavigate();
    }
  }, [leftResult, rightResult, navigation]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const formatElapsed = (totalSeconds) => {
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${m}:${s}`;
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{
            width: 48, height: 48, borderRadius: 24,
            backgroundColor: 'rgba(255,255,255,0.15)',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
          }}>
            <Text style={{ fontSize: 22 }}>🎧</Text>
          </View>
          <View>
            <Text style={{ color: '#A8C4E0', fontSize: 12, fontWeight: '500', letterSpacing: 0.4 }}>
              TEST IN PROGRESS
            </Text>
            <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginTop: 2 }}>
              Hearing Test
            </Text>
          </View>
        </View>
      </View>

      {/* ── Body ── */}
      <View style={{
        flex: 1,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
      }}>

        {/* ── Loading Animation ── */}
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          {/* Spinning ring */}
          <Animated.View style={{
            width: 140, height: 140, borderRadius: 70,
            borderWidth: 6,
            borderColor: '#E2E8F0',
            borderTopColor: '#1A3C6E',
            transform: [{ rotate: spin }],
            position: 'absolute',
          }} />
          {/* Pulsing center icon */}
          <Animated.View style={{
            width: 90, height: 90, borderRadius: 45,
            backgroundColor: '#EEF2FF',
            alignItems: 'center', justifyContent: 'center',
            transform: [{ scale: pulseValue }],
          }}>
            <Text style={{ fontSize: 40 }}>👂</Text>
          </Animated.View>
        </View>

        {/* ── Status Text ── */}
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 19, fontWeight: '800', color: '#1E293B', textAlign: 'center' }}>
            Hearing Test in Progress
          </Text>
          <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 19 }}>
            Waiting for test results{dots}
          </Text>
          <Text style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 2 }}>
            Please continue the test on your device
          </Text>
          <Text style={{ fontSize: 11, color: '#CBD5E1', textAlign: 'center', marginTop: 2 }}>
            Elapsed: {formatElapsed(elapsedSeconds)}
          </Text>
        </View>

        {/* ── Ear Status Cards ── */}
        <View style={{ width: '100%', gap: 12 }}>
          <EarStatusRow label="Left Ear" icon="👂" status={leftResult ? 'done' : 'waiting'} />
          <EarStatusRow label="Right Ear" icon="👂" status={rightResult ? 'done' : 'waiting'} />
        </View>

        {/* ── Info Notice ── */}
        <View style={{
          backgroundColor: '#EFF6FF',
          borderRadius: 14, padding: 14,
          borderLeftWidth: 4, borderLeftColor: '#1A3C6E',
          flexDirection: 'row', gap: 12, alignItems: 'flex-start',
          width: '100%',
        }}>
          <Text style={{ fontSize: 18, marginTop: 1 }}>ℹ️</Text>
          <Text style={{ flex: 1, fontSize: 12, color: '#475569', lineHeight: 18 }}>
            This screen updates automatically once your device uploads the results.
            No manual refresh is needed.
          </Text>
        </View>

      </View>

      {/* ── Bottom Cancel Button ── */}
      <View style={{
        paddingHorizontal: 16, paddingBottom: 30, paddingTop: 12,
        backgroundColor: '#F8FAFC',
        borderTopWidth: 1, borderTopColor: '#E2E8F0',
      }}>
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
          <Text style={{ color: '#475569', fontSize: 16, fontWeight: '700' }}>Cancel Test</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
};

/* ─────────────────────────── Sub-component ─────────────────────────── */

const EarStatusRow = ({ label, icon, status }) => {
  const isDone = status === 'done';
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: '#FFFFFF',
      borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
      borderWidth: 1, borderColor: isDone ? '#DCFCE7' : '#F1F5F9',
    }}>
      <View style={{
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: isDone ? '#F0FDF4' : '#F8FAFC',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B' }}>{label}</Text>
        <Text style={{
          fontSize: 12, fontWeight: '600', marginTop: 1,
          color: isDone ? '#22C55E' : '#94A3B8',
        }}>
          {isDone ? 'Result Received' : 'Waiting for result...'}
        </Text>
      </View>
      <Text style={{ fontSize: 18 }}>{isDone ? '✅' : '⏳'}</Text>
    </View>
  );
};

export default ProgressScreen;