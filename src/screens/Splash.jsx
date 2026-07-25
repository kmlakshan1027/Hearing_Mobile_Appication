// Splash.jsx
import React, { useEffect } from 'react';
import { View, Text, StatusBar, SafeAreaView } from 'react-native';

/**
 * Splash Screen
 * Plain dark-blue background (#1A3C6E) with the white "equalizer bars" logo
 * (same mark used in the Home header, but static — no animation here) and
 * the "HearingCare" wordmark, both centered on screen.
 *
 * After a short delay, navigates to the Signin screen.
 */
const SPLASH_DURATION_MS = 2000;

const Splash = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Use reset so the user can't navigate back to the splash screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'SignIn' }], // matches Stack.Screen name="SignIn" in AppNavigator.tsx
      });
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1A3C6E' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1A3C6E" />

      <View style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}>
        <StaticEqualizerLogo />

        <Text style={{
          color: '#FFFFFF',
          fontSize: 28,
          fontWeight: '800',
          letterSpacing: 0.4,
        }}>
          HearingCare
        </Text>

        <Text style={{
          color: '#A8C4E0',
          fontSize: 13,
          marginTop: -8,
        }}>
          Prevent Hearing Loss
        </Text>
      </View>
    </SafeAreaView>
  );
};

/**
 * Static (non-animated) version of the equalizer-bars mark used in the
 * Home header — same shape/spacing, just fixed heights, larger for splash.
 */
const StaticEqualizerLogo = () => {
  const barHeights = [16, 28, 40, 28, 16];

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      {barHeights.map((h, i) => (
        <View
          key={i}
          style={{
            width: 7,
            height: h,
            backgroundColor: '#FFFFFF',
            borderRadius: 4,
          }}
        />
      ))}
    </View>
  );
};

export default Splash;