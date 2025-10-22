import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabaseGateway } from '../lib/api';
import * as SecureStore from 'expo-secure-store';
import { ChevronLeft, CreditCard, Info } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import * as Linking from 'expo-linking';

export default function FundWalletScreen() {
  const [amount, setAmount] = useState<string>('');
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [showWebView, setShowWebView] = useState<boolean>(false);
  const [paystackUrl, setPaystackUrl] = useState<string>('');
  const [currentReference, setCurrentReference] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchUserData();
    
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = async (event: { url: string }) => {
    const { url } = event;
    console.log('Deep link URL:', url);
    
    if (url.includes('paystack-callback')) {
      try {
        // Extract reference from URL if needed
        const urlObj = new URL(url);
        const reference = urlObj.searchParams.get('reference') || currentReference;
        console.log('Payment callback received, verifying reference:', reference);
        await verifyPayment(reference);
      } catch (error) {
        console.error('Error handling callback:', error);
        Alert.alert('Error', 'Failed to process payment callback');
      } finally {
        setShowWebView(false);
      }
    } else if (url.includes('paystack-cancel')) {
      console.log('Payment cancelled by user');
      setShowWebView(false);
      setIsProcessingPayment(false);
      Alert.alert('Info', 'Payment was cancelled');
    }
  };

  async function fetchUserData() {
    try {
      setIsLoading(true);
      const accessToken = await SecureStore.getItemAsync('access_token');
      if (!accessToken) {
        router.replace('/signin');
        return;
      }

      const response = await supabaseGateway('getDashboardData', {
        access_token: accessToken
      });

      if (response.error) throw new Error(response.error);
      
      if (response.data) {
        setEmail(response.data.email || '');
        setUserId(response.data.userId || '');
        setBalance(response.data.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  }

  const initializePayment = async () => {
    if (!validateAmount() || isProcessingPayment) return;

    try {
      setIsProcessingPayment(true);
      setIsLoading(true);
      const accessToken = await SecureStore.getItemAsync('access_token');
      
      if (!accessToken) {
        router.replace('/signin');
        return;
      }

      const response = await supabaseGateway('initializeTransaction', {
        access_token: accessToken,
        email,
        amount: parseFloat(amount),
        userId
      });

      if (response.error) throw new Error(response.error);

      if (response.data?.authorization_url && response.data?.reference) {
        console.log('Payment initialized with reference:', response.data.reference);
        setPaystackUrl(response.data.authorization_url);
        setCurrentReference(response.data.reference);
        setShowWebView(true);
      } else {
        throw new Error('Failed to initialize payment: Missing authorization URL or reference');
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      Alert.alert('Error', error.message || 'Failed to initialize payment');
      setIsProcessingPayment(false);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPayment = async (reference: string) => {
    try {
      setIsLoading(true);
      const accessToken = await SecureStore.getItemAsync('access_token');
      if (!accessToken) {
        router.replace('/signin');
        return;
      }

      console.log('Verifying payment with reference:', reference);
      const verifyResponse = await supabaseGateway('verifyPayment', {
        access_token: accessToken,
        reference,
        email,
        amount: parseFloat(amount),
        userId
      });

      console.log('Full verification response:', verifyResponse);

      if (verifyResponse.error) {
        throw new Error(verifyResponse.error);
      }

      // Check multiple possible success indicators
      const isSuccess = verifyResponse.status === 'success' || 
                       verifyResponse.data?.status === 'success' ||
                       verifyResponse.message?.toLowerCase().includes('success');

      if (isSuccess) {
        console.log('Payment verified successfully');
        await fetchUserData(); // Refresh balance
        
        // Show success alert
        Alert.alert(
          'Payment Successful', 
          `₦${amount} has been added to your wallet!`,
          [
            { 
              text: 'OK', 
              onPress: () => {
                setAmount('');
                router.push('/fund-wallet');
              }
            }
          ]
        );
      } else {
        throw new Error(verifyResponse.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      Alert.alert(
        'Payment Error', 
        error.message || 'We could not verify your payment. Please check your transaction history.'
      );
    } finally {
      setIsLoading(false);
      setIsProcessingPayment(false);
      setCurrentReference('');
    }
  };

  const validateAmount = (): boolean => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than zero');
      return false;
    }
    return true;
  };

  if (isLoading && !showWebView) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (showWebView) {
    return (
      <View style={{ flex: 1 }}>
        <WebView
          source={{ uri: paystackUrl }}
          style={{ flex: 1 }}
          onNavigationStateChange={(navState) => {
            console.log('WebView navigating to:', navState.url);
            
            // Handle Paystack's close URL
            if (navState.url.includes('https://standard.paystack.co/close')) {
              console.log('Payment window closed by user');
              setShowWebView(false);
              setIsProcessingPayment(false);
              return false;
            }
            
            // Handle success callback
            if (navState.url.includes('paystack-callback')) {
              console.log('Payment callback detected in WebView');
              const urlObj = new URL(navState.url);
              const reference = urlObj.searchParams.get('reference') || currentReference;
              verifyPayment(reference);
              setShowWebView(false);
              return false;
            }
            
            return true;
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
            </View>
          )}
          onError={(error) => {
            console.error('WebView error:', error);
            Alert.alert('Error', 'Payment failed to load');
            setShowWebView(false);
          }}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#4F46E5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fund Wallet</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>₦{balance.toLocaleString()}</Text>
      </View>

      {/* Transfer Recommendation Banner */}
      <View style={styles.recommendationBanner}>
        <Info size={20} color="#2563EB" />
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>Save on Fees!</Text>
          <Text style={styles.bannerSubtitle}>
            Bank transfer has lower fees than card payments
          </Text>
        </View>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.inputLabel}>Amount to Fund (₦)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          returnKeyType="done"
        />

        <TouchableOpacity
          style={[
            styles.fundButton,
            (!amount || isLoading) && styles.disabledButton
          ]}
          onPress={initializePayment}
          disabled={!amount || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <CreditCard size={18} color="#FFFFFF" />
              <Text style={styles.fundButtonText}>Proceed to Payment</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.userEmail}>Payment will be processed for: {email}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  balanceCard: {
    backgroundColor: '#F9FAFB',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111827',
  },
  recommendationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  bannerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#374151',
  },
  formContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    marginBottom: 20,
  },
  fundButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#A5B4FC',
  },
  fundButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  userEmail: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
  },
});