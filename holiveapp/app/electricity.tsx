// screens/ElectricityScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { verifyElectricity, payElectricity, ELECTRICITY_PROVIDERS, pinService } from '../lib/api-services';
import * as SecureStore from 'expo-secure-store';
import { Picker } from '@react-native-picker/picker';
import PinModal from '../components/PinModal';

export default function ElectricityScreen() {
  const [disco, setDisco] = useState('1');
  const [meter, setMeter] = useState('');
  const [meterType, setMeterType] = useState('prepaid');
  const [amount, setAmount] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinVerifying, setPinVerifying] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [checkingPin, setCheckingPin] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  
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
      Alert.alert('Success', 'Meter verification successful!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setVerifying(false);
    }
  };

  const handlePaymentClick = () => {
    if (!meter || !amount) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (!customer) {
      Alert.alert('Error', 'Please verify your meter first');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Store payment details for later use
    setPaymentDetails({
      disco,
      meter,
      meterType,
      amount: amountNum,
      customerName: customer.Customer_Name,
      customerAddress: customer.Customer_Address
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

  const verifyPinAndPay = async (pin: string) => {
    setPinVerifying(true);

    try {
      // Verify PIN
      const verifyResult = await pinService.verify(pin);
      
      if (!verifyResult.success) {
        Alert.alert('Error', verifyResult.message || 'Invalid PIN');
        return;
      }

      // PIN verified, proceed with payment
      await processElectricityPayment();
      setShowPinModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'PIN verification failed');
      console.error(error);
    } finally {
      setPinVerifying(false);
    }
  };

  const processElectricityPayment = async () => {
    if (!paymentDetails) {
      Alert.alert('Error', 'No payment details found');
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
        disco_name: paymentDetails.disco,
        meter_number: paymentDetails.meter,
        MeterType: paymentDetails.meterType,
        amount: paymentDetails.amount
      });

      if (result.error) {
        throw new Error(result.error);
      }

      const token = result.token || result.electricitytoken;
      
      Alert.alert(
        'Success', 
        `Electricity payment successful!\n\nAmount: ₦${paymentDetails.amount.toLocaleString()}\nToken: ${token || 'Generated'}\nCustomer: ${paymentDetails.customerName}`,
        [{ text: 'OK', onPress: () => {
          // Clear form
          setMeter('');
          setAmount('');
          setCustomer(null);
          setPaymentDetails(null);
        }}]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const getProviderName = () => {
    return ELECTRICITY_PROVIDERS.find(p => p.id === disco)?.name || 'Unknown';
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Electricity Bill Payment</Text>
        
        <Text style={styles.label}>Provider</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={disco}
            onValueChange={(value) => {
              setDisco(value);
              setCustomer(null);
              setPaymentDetails(null);
            }}
            style={styles.picker}
            dropdownIconColor="#000"
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
          editable={!verifying}
        />

        <Text style={styles.label}>Meter Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={meterType}
            onValueChange={setMeterType}
            style={styles.picker}
            dropdownIconColor="#000"
          >
            <Picker.Item label="Prepaid" value="prepaid" />
            <Picker.Item label="Postpaid" value="postpaid" />
          </Picker>
        </View>

        {customer && (
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{customer.Customer_Name}</Text>
            <Text style={styles.customerAddress}>{customer.Customer_Address}</Text>
            {customer.Outstanding_Balance && (
              <Text style={styles.outstandingBalance}>
                Outstanding Balance: ₦{parseFloat(customer.Outstanding_Balance).toLocaleString()}
              </Text>
            )}
          </View>
        )}

        <Text style={styles.label}>Amount (₦)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          editable={!!customer}
        />

        {/* Amount Summary */}
        {amount && parseFloat(amount) > 0 && (
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Payment Amount:</Text>
            <Text style={styles.amountValue}>₦{parseFloat(amount).toLocaleString()}</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.verifyButton]}
            onPress={handleVerify}
            disabled={verifying || !meter}
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
              styles.payButton,
              (!customer || !amount || checkingPin) && styles.buttonDisabled
            ]}
            onPress={handlePaymentClick}
            disabled={loading || !customer || !amount || checkingPin}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>
                {checkingPin ? '...' : 'Pay Now'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {!hasPin && !checkingPin && (
          <Text style={styles.pinWarning}>
            * Please set up your PIN in Profile settings to make transactions
          </Text>
        )}

        {/* Payment Summary */}
        {paymentDetails && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Payment Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Provider:</Text>
              <Text style={styles.summaryValue}>{getProviderName()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Customer:</Text>
              <Text style={styles.summaryValue}>{paymentDetails.customerName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Meter:</Text>
              <Text style={styles.summaryValue}>{paymentDetails.meter}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Type:</Text>
              <Text style={styles.summaryValue}>
                {paymentDetails.meterType === 'prepaid' ? 'Prepaid' : 'Postpaid'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount:</Text>
              <Text style={styles.summaryValue}>₦{paymentDetails.amount.toLocaleString()}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <PinModal
        visible={showPinModal}
        onClose={() => setShowPinModal(false)}
        onVerify={verifyPinAndPay}
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
  customerAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  outstandingBalance: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  amountValue: {
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
  payButton: {
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