// screens/ElectricityScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { verifyElectricity, payElectricity, ELECTRICITY_PROVIDERS } from '../lib/api-services';
import * as SecureStore from 'expo-secure-store';
import { Picker } from '@react-native-picker/picker';

export default function ElectricityScreen() {
  const [disco, setDisco] = useState('1');
  const [meter, setMeter] = useState('');
  const [meterType, setMeterType] = useState('prepaid');
  const [amount, setAmount] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const router = useRouter();

  const handleVerify = async () => {
    if (!meter) {
      Alert.alert('Error', 'Please enter meter number');
      return;
    }

    try {
      setVerifying(true);
      const accessToken = await SecureStore.getItemAsync('access_token');
      if (!accessToken) {
        router.replace('/signin');
        return;
      }

      const result = await verifyElectricity({
        disco_name: disco,
        meter_number: meter
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setCustomer(result);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setVerifying(false);
    }
  };

  const handlePayment = async () => {
    if (!meter || !amount) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      const accessToken = await SecureStore.getItemAsync('access_token');
      if (!accessToken) {
        router.replace('/signin');
        return;
      }

      const result = await payElectricity({
        disco_name: disco,
        meter_number: meter,
        MeterType: meterType,
        amount: amountNum
      });

      if (result.error) {
        throw new Error(result.error);
      }

      Alert.alert(
        'Success', 
        `Payment successful! Token: ${result.token || result.electricitytoken}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Electricity Bill Payment</Text>
      
      <Text style={styles.label}>Provider</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={disco}
          onValueChange={setDisco}
          style={styles.picker}
        >
          {ELECTRICITY_PROVIDERS.map(provider => (
            <Picker.Item 
              key={provider.id} 
              label={provider.name} 
              value={provider.id} 
            />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Meter Number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter meter number"
        value={meter}
        onChangeText={setMeter}
      />

      <Text style={styles.label}>Meter Type</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={meterType}
          onValueChange={setMeterType}
          style={styles.picker}
        >
          <Picker.Item label="Prepaid" value="prepaid" />
          <Picker.Item label="Postpaid" value="postpaid" />
        </Picker>
      </View>

      {customer && (
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{customer.Customer_Name}</Text>
          <Text style={styles.customerAddress}>{customer.Customer_Address}</Text>
        </View>
      )}

      <Text style={styles.label}>Amount (₦)</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.verifyButton]}
          onPress={handleVerify}
          disabled={verifying}
        >
          {verifying ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.payButton]}
          onPress={handlePayment}
          disabled={loading || !customer}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Pay Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  customerInfo: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  customerAddress: {
    fontSize: 14,
    color: '#666',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButton: {
    backgroundColor: '#6c757d',
    marginRight: 10,
  },
  payButton: {
    backgroundColor: '#4F46E5',
    marginLeft: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});