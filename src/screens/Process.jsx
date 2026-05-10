import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Animated,
  Easing,
} from 'react-native';

import processingImg from '../components/Images/processing.jpg';

const FREQUENCIES = [500, 1000, 2000, 4000, 8000];

const ProcessScreen = ({ navigation }) => {
  const [currentFreqIndex, setCurrentFreqIndex] = useState(0);
  const [isListening, setIsListening] = useState(true);

  // Animated dots for "Listening..."
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;

  // Progress bar animated width for each ear
  const leftProgress = useRef(new Animated.Value(0)).current;
  const rightProgress = useRef(new Animated.Value(0)).current;

  const leftFreq = FREQUENCIES[currentFreqIndex] - 50;
  const rightFreq = FREQUENCIES[currentFreqIndex];
  const totalSteps = FREQUENCIES.length;
  const currentStep = currentFreqIndex + 1;

  useEffect(() => {
    // Animate dots sequentially
    const animateDots = () => {
      Animated.sequence([
        Animated.timing(dot1Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot2Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot3Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(dot1Opacity, { toValue: 0.3, duration: 200, useNativeDriver: true }),
          Animated.timing(dot2Opacity, { toValue: 0.3, duration: 200, useNativeDriver: true }),
          Animated.timing(dot3Opacity, { toValue: 0.3, duration: 200, useNativeDriver: true }),
        ]),
      ]).start(() => animateDots());
    };
    animateDots();
  }, []);

  useEffect(() => {
    // Animate progress bars on freq change
    const progress = (currentStep / totalSteps);
    Animated.parallel([
      Animated.timing(leftProgress, {
        toValue: progress,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(rightProgress, {
        toValue: progress,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [currentFreqIndex]);

  const handleContinue = () => {
    if (currentFreqIndex < FREQUENCIES.length - 1) {
      setCurrentFreqIndex(prev => prev + 1);
    } else {
      // Navigate to results/reports when done
      navigation.navigate('Reports');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1A3C6E" />

      {/* Header */}
      <View style={{
        backgroundColor: '#1A3C6E',
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 18,
        paddingHorizontal: 18,
        gap: 14,
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: 'rgba(255,255,255,0.15)',
            alignItems: 'center', justifyContent: 'center',
          }}
          activeOpacity={0.7}
        >
        
        </TouchableOpacity>
        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: 0.2 }}>
          Hearing Test in Progress
        </Text>
      </View>

      {/* Body */}
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 28, alignItems: 'center' }}>

        {/* Instruction */}
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#101625',
          textAlign: 'center',
          lineHeight: 24,
          marginBottom: 24,
          paddingHorizontal: 10,
        }}>
          Rotate the knob until the sound is just audible, then stop the rotation.
        </Text>

        {/* Knob Image */}
        <View style={{
          width: '100%',
          marginBottom: 18,
        }}>
          <Image
            source={processingImg}
            style={{ width: '100%', height: 230 }}
            resizeMode="cover"
          />

        </View>

        {/* Listening... */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginBottom: 28,
        }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#475569', letterSpacing: 0.3 }}>
            🎧 Listening
          </Text>
          {[dot1Opacity, dot2Opacity, dot3Opacity].map((opacity, i) => (
            <Animated.Text
              key={i}
              style={{ fontSize: 20, color: '#1A3C6E', opacity, fontWeight: '700' }}
            >
              .
            </Animated.Text>
          ))}
        </View>

        {/* Ear Status Cards */}
        <View style={{
          flexDirection: 'row',
          gap: 14,
          width: '100%',
          marginBottom: 32,
        }}>
          {/* Left Ear */}
          <EarCard
            label="Left Ear"
            frequency={leftFreq}
            currentStep={currentStep}
            totalSteps={totalSteps}
            progress={leftProgress}
            accentColor="#22C55E"
          />
          {/* Right Ear */}
          <EarCard
            label="Right Ear"
            frequency={rightFreq}
            currentStep={currentStep}
            totalSteps={totalSteps}
            progress={rightProgress}
            accentColor="#3B82F6"
          />
        </View>
      </View>

      {/* Continue Button */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 36, paddingTop: 6 }}>
        <TouchableOpacity
          onPress={handleContinue}
          activeOpacity={0.85}
          style={{
            backgroundColor: '#7B9EC8',
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
            shadowColor: '#1A3C6E',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 }}>
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const EarCard = ({ label, frequency, currentStep, totalSteps, progress, accentColor }) => (
  <View style={{
    flex: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  }}>
    {/* Label */}
    <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B' }}>{label}</Text>

    {/* Frequency Badge */}
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: accentColor + '18',
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 4,
      alignSelf: 'flex-start',
    }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: accentColor }} />
      <Text style={{ fontSize: 11, fontWeight: '600', color: accentColor }}>
        Frequency: {frequency} Hz
      </Text>
    </View>

    {/* Step label */}
    <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '500' }}>
      Testing {frequency} Hz ({currentStep}/{totalSteps})
    </Text>

    {/* Progress Bar */}
    <View style={{
      height: 5,
      backgroundColor: '#E2E8F0',
      borderRadius: 3,
      overflow: 'hidden',
    }}>
      <Animated.View style={{
        height: '100%',
        borderRadius: 3,
        backgroundColor: accentColor,
        width: progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0%', '100%'],
        }),
      }} />
    </View>
  </View>
);

export default ProcessScreen;