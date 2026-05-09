// src/components/BottomNavBar.jsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const BottomNavBar = ({ navigation, activeTab = 'Dashboard' }) => {
  const tabs = [
    {
      name: 'Dashboard',
      route: 'Home',
      icon: (active) => (
        <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{
            width: 0,
            height: 0,
            borderLeftWidth: 9,
            borderRightWidth: 9,
            borderBottomWidth: 9,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: active ? '#1A3C6E' : '#94A3B8',
            marginBottom: 1,
          }} />
          <View style={{
            width: 13,
            height: 9,
            backgroundColor: active ? '#1A3C6E' : '#94A3B8',
            borderRadius: 1,
          }} />
        </View>
      ),
    },
    {
      name: 'Reports',
      route: 'Reports',
      icon: (active) => (
        <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{
            width: 16,
            height: 20,
            borderWidth: 2,
            borderColor: active ? '#1A3C6E' : '#94A3B8',
            borderRadius: 2,
            paddingHorizontal: 2,
            paddingTop: 4,
            justifyContent: 'space-evenly',
          }}>
            <View style={{ height: 2, width: 8, backgroundColor: '#94A3B8', borderRadius: 1, marginVertical: 1 }} />
            <View style={{ height: 2, width: 8, backgroundColor: '#94A3B8', borderRadius: 1, marginVertical: 1 }} />
            <View style={{ height: 2, width: 10, backgroundColor: '#94A3B8', borderRadius: 1, marginVertical: 1 }} />
          </View>
        </View>
      ),
    },
    {
      name: 'Help',
      route: 'Help',
      icon: (active) => (
        <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            borderWidth: 2,
            borderColor: active ? '#1A3C6E' : '#94A3B8',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{
              fontSize: 13,
              fontWeight: '700',
              color: active ? '#1A3C6E' : '#94A3B8',
              lineHeight: 16,
            }}>?</Text>
          </View>
        </View>
      ),
    },
  ];

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#E8EDF2',
      height: 74,
      paddingBottom:10,
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 10,
    }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 8,
              position: 'relative',
            }}
            onPress={() => navigation.navigate(tab.route)}
            activeOpacity={0.7}
          >
            {tab.icon(isActive)}
            <Text style={{
              fontSize: 11,
              color: isActive ? '#1A3C6E' : '#94A3B8',
              marginTop: 4,
              fontWeight: isActive ? '700' : '500',
            }}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default BottomNavBar;