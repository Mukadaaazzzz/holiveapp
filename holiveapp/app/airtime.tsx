// screens/AirtimeScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { purchaseAirtime, NETWORK_OPTIONS, pinService } from '../lib/api-services';
import * as SecureStore from 'expo-secure-store';
import { debugAuthState } from './utils/debugAuth';
import PinModal from '../components/PinModal';

export default function AirtimeScreen() {
  const [network, setNetwork] = useState('1');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [checkingPin, setCheckingPin] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndPin = async () => {
      await debugAuthState();
      
      // Check if user has PIN
      try {
        setCheckingPin(true);
        const pinResult = await pinService.hasPin();
        setHasPin(pinResult.hasPin);
      } catch (error) {
        console.error('Error checking PIN:', error);
      } finally {
        setCheckingPin(false);
      }
    };
    checkAuthAndPin();
  }, []);

  const handlePurchaseClick = () => {
    if (!phone || !amount) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Check if user has PIN set
    if (!hasPin) {
      Alert.alert(
        'PIN Required',
        'Please set up your PIN in Profile settings before making transactions.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Profile', onPress: () => router.push('/profile') }
        ]
      );
      return;
    }

    // Show PIN modal
    setShowPinModal(true);
  };

  const verifyPinAndPurchase = async (pin: string) => {
    setVerifying(true);

    try {
      // Verify PIN
      const verifyResult = await pinService.verify(pin);
      
      if (!verifyResult.success) {
        Alert.alert('Error', verifyResult.message || 'Invalid PIN');
        return;
      }

      // PIN verified, proceed with purchase
      await processAirtimePurchase();
      setShowPinModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'PIN verification failed');
      console.error(error);
    } finally {
      setVerifying(false);
    }
  };

  const processAirtimePurchase = async () => {
    try {
      setLoading(true);
      const accessToken = await SecureStore.getItemAsync('access_token');
      if (!accessToken) {
        router.replace('/signin');
        return;
      }

      const amountNum = parseFloat(amount);
      const result = await purchaseAirtime({
        network,
        mobile_number: phone,
        amount: amountNum
      });

      if (result.error) {
        throw new Error(result.error);
      }

      Alert.alert(
        'Success', 
        `Airtime purchase successful!`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
      
      // Clear form
      setPhone('');
      setAmount('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Buy Airtime</Text>
        
        <Text style={styles.label}>Network</Text>
        <View style={styles.networkContainer}>
          {NETWORK_OPTIONS.map(net => (
            <TouchableOpacity
              key={net.id}
              style={[
                styles.networkButton,
                network === net.id && styles.selectedNetwork
              ]}
              onPress={() => setNetwork(net.id)}
            >
              <Text style={network === net.id ? styles.selectedNetworkText : styles.networkText}>
                {net.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="08012345678"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Amount (₦)</Text>
        <TextInput
          style={styles.input}
          placeholder="500"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={[
            styles.button,
            (!phone || !amount || checkingPin) && styles.buttonDisabled
          ]}
          onPress={handlePurchaseClick}
          disabled={loading || !phone || !amount || checkingPin}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>
              {checkingPin ? 'Checking...' : 'Buy Airtime'}
            </Text>
          )}
        </TouchableOpacity>

        {!hasPin && !checkingPin && (
          <Text style={styles.pinWarning}>
            * Please set up your PIN in Profile settings to make transactions
          </Text>
        )}
      </ScrollView>

      <PinModal
        visible={showPinModal}
        onClose={() => setShowPinModal(false)}
        onVerify={verifyPinAndPurchase}
        loading={verifying}
        title="Enter Your PIN"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    color: '#000',
  },
  networkContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  networkButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  selectedNetwork: {
    backgroundColor: '#4F46E5',
  },
  networkText: {
    color: '#333',
  },
  selectedNetworkText: {
    color: '#fff',
  },
  button: {
    height: 50,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pinWarning: {
    marginTop: 15,
    fontSize: 12,
    color: '#FF6B35',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});