import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#faf9fb', justifyContent: 'center', alignItems: 'center' }}>
      <Image
        source={require('../assets/images/welcome.png')} // Place your image in the assets folder and update the path
        style={{ width: 200, height: 200, marginBottom: 32 }}
        resizeMode="contain"
      />
      <Text style={{ fontSize: 24, fontWeight: '500', color: '#333', marginBottom: 32 }}>
        Welcome to EKSAQ
      </Text>
      <TouchableOpacity
        onPress={() => router.replace('/(tabs)/audio')}
        style={{
          backgroundColor: '#fff',
          borderRadius: 30,
          padding: 16,
          elevation: 2,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 8,
        }}
      >
        <Text style={{ fontSize: 32, color: '#333' }}>{'→'}</Text>
      </TouchableOpacity>
    </View>
  );
}