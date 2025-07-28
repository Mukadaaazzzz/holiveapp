// screens/DataScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { purchaseData, NETWORK_OPTIONS, DATA_PLANS } from '../lib/api-services';
import * as SecureStore from 'expo-secure-store';
import { Picker } from '@react-native-picker/picker';

export default function DataScreen() {
  const [network, setNetwork] = useState('1');
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePurchase = async () => {
    if (!phone || !plan) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const selectedPlan = DATA_PLANS[network].find(p => p.id === plan);
    if (!selectedPlan) {
      Alert.alert('Error', 'Please select a valid plan');
      return;
    }

    const amount = parseFloat(selectedPlan.price.replace('₦', '').replace(',', ''));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Invalid plan price');
      return;
    }

    try {
      setLoading(true);
      const accessToken = await SecureStore.getItemAsync('access_token');
      if (!accessToken) {
        router.replace('/signin');
        return;
      }

      const result = await purchaseData({
        network,
        mobile_number: phone,
        plan,
        amount
      });

      if (result.error) {
        throw new Error(result.error);
      }

      Alert.alert(
        'Success', 
        `Data purchase successful!`,
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
      <Text style={styles.title}>Buy Data</Text>
      
      <Text style={styles.label}>Network</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={network}
          onValueChange={(value) => {
            setNetwork(value);
            setPlan('');
          }}
          style={styles.picker}
        >
          {NETWORK_OPTIONS.map(net => (
            <Picker.Item 
              key={net.id} 
              label={net.name} 
              value={net.id} 
            />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        placeholder="08012345678"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Data Plan</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={plan}
          onValueChange={setPlan}
          style={styles.picker}
          enabled={!!DATA_PLANS[network]?.length}
        >
          <Picker.Item label="Select a plan" value="" />
          {DATA_PLANS[network]?.map(plan => (
            <Picker.Item 
              key={plan.id} 
              label={`${plan.name} - ${plan.price} - (${plan.validity})`} 
              value={plan.id} 
            />
          ))}
        </Picker>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handlePurchase}
        disabled={loading || !plan}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Buy Data</Text>
        )}
      </TouchableOpacity>
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
  button: {
    height: 50,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});