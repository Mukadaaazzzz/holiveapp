import { View, Text, Linking, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

export default function HealthScreen() {
  const router = useRouter();

  const handleWhatsApp = () => {
    const phoneNumber = '2348150770470';
    const message = 'Hi! I’m interested in free medical consultation.';
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center', alignItems: 'center' }}>
      <Ionicons name="medkit-outline" size={60} color="#4CAF50" style={{ marginBottom: 24 }} />

      <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 }}>
        Partner With Us
      </Text>

      <Text style={{ fontSize: 16, textAlign: 'center', color: '#555', marginBottom: 32 }}>
        Start your free medical consultation as a regular user of Holive services.
      </Text>

      <TouchableOpacity
        onPress={handleWhatsApp}
        style={{
          backgroundColor: '#25D366',
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 30,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Ionicons name="logo-whatsapp" size={20} color="white" style={{ marginRight: 8 }} />
        <Text style={{ color: 'white', fontWeight: '600' }}>Message Us on WhatsApp</Text>
      </TouchableOpacity>
    </View>
  );
}
