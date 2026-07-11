// Generate.jsx  –  Screen 4: Result Generation Screen (UI only)
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Animated, Easing,
  StatusBar, SafeAreaView,
} from 'react-native';

const STEPS = [
  { key: 'retrieve',  icon: '📥', label: 'Retrieving test data' },
  { key: 'analyze',   icon: '🔬', label: 'Analyzing frequencies' },
  { key: 'score',     icon: '📊', label: 'Calculating hearing score' },
  { key: 'recommend', icon: '💡', label: 'Generating recommendations' },
  { key: 'report',    icon: '📄', label: 'Creating report' },
];

// Simulated per-step duration (ms) — UI only, replace with real progress later.
const STEP_DURATION = 1100;

const GenerateScreen = ({ navigation }) => {
  // Index of the step currently in progress. -1 = not started, STEPS.length = all done.
  const [activeIndex, setActiveIndex] = useState(0);
  const spinValue = useRef(new Animated.Value(0)).current;

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

  // Simulated sequential progression through steps (UI placeholder only)
  useEffect(() => {
    if (activeIndex >= STEPS.length) return;
    const timer = setTimeout(() => {
      setActiveIndex((prev) => prev + 1);
    }, STEP_DURATION);
    return () => clearTimeout(timer);
  }, [activeIndex]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const isComplete = activeIndex >= STEPS.length;

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
              {isComplete ? 'ANALYSIS COMPLETE' : 'PROCESSING RESULTS'}
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
            onPress={() => navigation.navigate('Results')}
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