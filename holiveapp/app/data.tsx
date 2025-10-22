// screens/DataScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { purchaseData, NETWORK_OPTIONS, DATA_PLANS, pinService } from '../lib/api-services';
import * as SecureStore from 'expo-secure-store';
import { Picker } from '@react-native-picker/picker';
import PinModal from '../components/PinModal';

export default function DataScreen() {
  const [network, setNetwork] = useState('1');
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
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

  const handlePurchaseClick = () => {
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

    // Store plan details for later use
    setSelectedPlanDetails({
      network,
      phone,
      plan,
      amount,
      planName: selectedPlan.name
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
      await processDataPurchase();
      setShowPinModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'PIN verification failed');
      console.error(error);
    } finally {
      setVerifying(false);
    }
  };

  const processDataPurchase = async () => {
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

      const result = await purchaseData({
        network: selectedPlanDetails.network,
        mobile_number: selectedPlanDetails.phone,
        plan: selectedPlanDetails.plan,
        amount: selectedPlanDetails.amount
      });

      if (result.error) {
        throw new Error(result.error);
      }

      Alert.alert(
        'Success', 
        `Data purchase successful!\n${selectedPlanDetails.planName} - ₦${selectedPlanDetails.amount}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
      
      // Clear form
      setPhone('');
      setPlan('');
      setSelectedPlanDetails(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedPlanPrice = () => {
    if (!plan) return 0;
    const selectedPlan = DATA_PLANS[network].find(p => p.id === plan);
    if (!selectedPlan) return 0;
    return parseFloat(selectedPlan.price.replace('₦', '').replace(',', ''));
  };

  const price = getSelectedPlanPrice();

  return (
    <>
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
            dropdownIconColor="#000"
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

        {/* Price Display */}
        {price > 0 && (
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Amount:</Text>
            <Text style={styles.priceValue}>₦{price.toLocaleString()}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            (!phone || !plan || checkingPin) && styles.buttonDisabled
          ]}
          onPress={handlePurchaseClick}
          disabled={loading || !phone || !plan || checkingPin}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>
              {checkingPin ? 'Checking...' : 'Buy Data'}
            </Text>
          )}
        </TouchableOpacity>

        {!hasPin && !checkingPin && (
          <Text style={styles.pinWarning}>
            * Please set up your PIN in Profile settings to make transactions
          </Text>
        )}

        {/* Purchase Summary */}
        {selectedPlanDetails && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Purchase Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Network:</Text>
              <Text style={styles.summaryValue}>
                {NETWORK_OPTIONS.find(n => n.id === selectedPlanDetails.network)?.name}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phone:</Text>
              <Text style={styles.summaryValue}>{selectedPlanDetails.phone}</Text>
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