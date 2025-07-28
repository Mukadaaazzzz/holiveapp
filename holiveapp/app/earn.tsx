import { View, Text, Linking, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function EarnScreen() {
  const router = useRouter();

  const handleWhatsApp = () => {
    const phoneNumber = '2348034744435'; // replace with your admin WhatsApp number
    const message = 'Hi! I’m interested in becoming a medical product partner.';
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
        Send us a message to become a partner and promote medical products.
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
