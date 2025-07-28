// screens/CableScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { verifyCable, purchaseCable, CABLE_PROVIDERS, CABLE_PLANS } from '../lib/api-services';
import * as SecureStore from 'expo-secure-store';
import { Picker } from '@react-native-picker/picker';

export default function CableScreen() {
  const [provider, setProvider] = useState('1');
  const [smartCard, setSmartCard] = useState('');
  const [plan, setPlan] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const router = useRouter();

  const handleVerify = async () => {
    if (!smartCard) {
      Alert.alert('Error', 'Please enter smart card number');
      return;
    }

    try {
      setVerifying(true);
      const accessToken = await SecureStore.getItemAsync('access_token');
      if (!accessToken) {
        router.replace('/signin');
        return;
      }

      const result = await verifyCable({
        cablename: provider,
        smart_card_number: smartCard
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

  const handleSubscribe = async () => {
    if (!smartCard || !plan) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const selectedPlan = CABLE_PLANS[provider].find(p => p.id === plan);
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

      const result = await purchaseCable({
        cablename: provider,
        smart_card_number: smartCard,
        cableplan: plan,
        amount
      });

      if (result.error) {
        throw new Error(result.error);
      }

      Alert.alert(
        'Success', 
        `Subscription successful!`,
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
      <Text style={styles.title}>Cable TV Subscription</Text>
      
      <Text style={styles.label}>Provider</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={provider}
          onValueChange={(value) => {
            setProvider(value);
            setPlan('');
            setCustomer(null);
          }}
          style={styles.picker}
        >
          {CABLE_PROVIDERS.map(prov => (
            <Picker.Item 
              key={prov.id} 
              label={prov.name} 
              value={prov.id} 
            />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Smart Card Number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter smart card number"
        value={smartCard}
        onChangeText={setSmartCard}
      />

      {customer && (
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{customer.Customer_Name}</Text>
          <Text style={styles.customerPlan}>Current Plan: {customer.Current_Bouquet || 'Unknown'}</Text>
        </View>
      )}

      <Text style={styles.label}>Select Plan</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={plan}
          onValueChange={setPlan}
          style={styles.picker}
          enabled={!!CABLE_PLANS[provider]?.length && !!customer}
        >
          <Picker.Item label="Select a plan" value="" />
          {CABLE_PLANS[provider]?.map(plan => (
            <Picker.Item 
              key={plan.id} 
              label={`${plan.name} - ${plan.price}`} 
              value={plan.id} 
            />
          ))}
        </Picker>
      </View>

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
          style={[styles.button, styles.subscribeButton]}
          onPress={handleSubscribe}
          disabled={loading || !customer || !plan}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Subscribe</Text>
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
  customerPlan: {
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
  subscribeButton: {
    backgroundColor: '#4F46E5',
    marginLeft: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});