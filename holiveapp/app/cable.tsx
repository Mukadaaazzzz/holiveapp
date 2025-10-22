// screens/CableScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { verifyCable, purchaseCable, CABLE_PROVIDERS, CABLE_PLANS, pinService } from '../lib/api-services';
import * as SecureStore from 'expo-secure-store';
import { Picker } from '@react-native-picker/picker';
import PinModal from '../components/PinModal';

export default function CableScreen() {
  const [provider, setProvider] = useState('1');
  const [smartCard, setSmartCard] = useState('');
  const [plan, setPlan] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinVerifying, setPinVerifying] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [checkingPin, setCheckingPin] = useState(true);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<any>(null);
  
  const router = useRouter();

  useEffect(() => {
    const checkPinStatus = async () => {
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
    
    checkPinStatus();
  }, []);

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
      Alert.alert('Success', 'Customer verification successful!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubscribeClick = () => {
    if (!smartCard || !plan) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (!customer) {
      Alert.alert('Error', 'Please verify your smart card first');
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

    // Store plan details for later use
    setSelectedPlanDetails({
      provider,
      smartCard,
      plan,
      amount,
      planName: selectedPlan.name,
      customerName: customer.Customer_Name
    });

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

  const verifyPinAndSubscribe = async (pin: string) => {
    setPinVerifying(true);

    try {
      // Verify PIN
      const verifyResult = await pinService.verify(pin);
      
      if (!verifyResult.success) {
        Alert.alert('Error', verifyResult.message || 'Invalid PIN');
        return;
      }

      // PIN verified, proceed with subscription
      await processCableSubscription();
      setShowPinModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'PIN verification failed');
      console.error(error);
    } finally {
      setPinVerifying(false);
    }
  };

  const processCableSubscription = async () => {
    if (!selectedPlanDetails) {
      Alert.alert('Error', 'No plan selected');
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
        cablename: selectedPlanDetails.provider,
        smart_card_number: selectedPlanDetails.smartCard,
        cableplan: selectedPlanDetails.plan,
        amount: selectedPlanDetails.amount
      });

      if (result.error) {
        throw new Error(result.error);
      }

      Alert.alert(
        'Success', 
        `Subscription successful!\n${selectedPlanDetails.planName} - ₦${selectedPlanDetails.amount.toLocaleString()}\nFor: ${selectedPlanDetails.customerName}`,
        [{ text: 'OK', onPress: () => {
          // Clear form
          setSmartCard('');
          setPlan('');
          setCustomer(null);
          setSelectedPlanDetails(null);
        }}]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Subscription failed');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedPlanPrice = () => {
    if (!plan) return 0;
    const selectedPlan = CABLE_PLANS[provider].find(p => p.id === plan);
    if (!selectedPlan) return 0;
    return parseFloat(selectedPlan.price.replace('₦', '').replace(',', ''));
  };

  const price = getSelectedPlanPrice();

  return (
    <>
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
              setSelectedPlanDetails(null);
            }}
            style={styles.picker}
            dropdownIconColor="#000"
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
          editable={!verifying}
        />

        {customer && (
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{customer.Customer_Name}</Text>
            <Text style={styles.customerPlan}>Current Plan: {customer.Current_Bouquet || 'Unknown'}</Text>
            <Text style={styles.customerAddress}>{customer.Customer_Address || ''}</Text>
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

        {/* Price Display */}
        {price > 0 && (
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Amount:</Text>
            <Text style={styles.priceValue}>₦{price.toLocaleString()}</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.verifyButton]}
            onPress={handleVerify}
            disabled={verifying || !smartCard}
          >
            {verifying ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button, 
              styles.subscribeButton,
              (!customer || !plan || checkingPin) && styles.buttonDisabled
            ]}
            onPress={handleSubscribeClick}
            disabled={loading || !customer || !plan || checkingPin}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>
                {checkingPin ? '...' : 'Subscribe'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {!hasPin && !checkingPin && (
          <Text style={styles.pinWarning}>
            * Please set up your PIN in Profile settings to make transactions
          </Text>
        )}

        {/* Subscription Summary */}
        {selectedPlanDetails && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Subscription Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Provider:</Text>
              <Text style={styles.summaryValue}>
                {CABLE_PROVIDERS.find(p => p.id === selectedPlanDetails.provider)?.name}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Customer:</Text>
              <Text style={styles.summaryValue}>{selectedPlanDetails.customerName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Smart Card:</Text>
              <Text style={styles.summaryValue}>{selectedPlanDetails.smartCard}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Plan:</Text>
              <Text style={styles.summaryValue}>{selectedPlanDetails.planName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount:</Text>
              <Text style={styles.summaryValue}>₦{selectedPlanDetails.amount.toLocaleString()}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <PinModal
        visible={showPinModal}
        onClose={() => setShowPinModal(false)}
        onVerify={verifyPinAndSubscribe}
        loading={pinVerifying}
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
    color: '#000',
  },
  customerInfo: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  customerPlan: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  customerAddress: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4F46E5',
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
  summaryContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});