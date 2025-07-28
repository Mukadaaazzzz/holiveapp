import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabaseGateway } from '../../lib/api';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');
const CARD_PADDING = 16;
const SERVICE_CARD_WIDTH = (width - CARD_PADDING * 3) / 2;

export default function HomeScreen() {
  const [email, setEmail] = useState('');
  const [balance, setBalance] = useState<string>('0.00');
  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchUserData();
      } catch (error) {
        console.error('Initial load error:', error);
        // Don't redirect immediately on initial load failure
      }
    };
    loadData();
  }, []);
useFocusEffect(
useCallback(() => {
fetchUserData();
}, [])
);


  const fetchUserData = async () => {
    try {
      if (!isLoading) {
        setIsRefreshing(true);
      }
      
      const accessToken = await SecureStore.getItemAsync('access_token');
      console.log('Access token present:', !!accessToken);
      
      if (!accessToken) {
        console.log('No access token found, redirecting to signin');
        router.replace('/signin');
        return;
      }

      console.log('Making dashboard data request...');
      const response = await supabaseGateway('getDashboardData', {
        access_token: accessToken
      });

      console.log('Dashboard response:', response);

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data) {
        throw new Error('No data received from server');
      }

      const { data } = response;
      setEmail(data.email || '');
      setBalance(data.balance?.toString() || '0.00');
      setUsername(data.username || '');
      setLocation(data.location || '');
      
      console.log('Dashboard data loaded successfully:', {
        email: data.email,
        balance: data.balance,
        hasUsername: !!data.username
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // Check if it's an authentication error
      if (error.message.includes('JWT') || 
          error.message.includes('Auth') || 
          error.message.includes('401') ||
          error.message.includes('User not found')) {
        console.log('Authentication error, clearing tokens and redirecting');
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        router.replace('/signin');
      } else {
        // For other errors, show alert but don't redirect
        Alert.alert(
          'Error', 
          `Failed to load dashboard data: ${error.message}`,
          [
            {
              text: 'Retry',
              onPress: () => fetchUserData()
            },
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchUserData();
  };

  // Better greeting logic
  const getDisplayName = () => {
    if (username) return username;
    if (email) return email.split('@')[0];
    return 'User';
  };

  const greeting = getDisplayName();
  const formattedBalance = parseFloat(balance || '0').toLocaleString('en-US', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  });

  type RouteType =
    | '/airtime'
    | '/data'
    | '/cable'
    | '/electricity'
    | '/earn'
    | '/fund-wallet';

  const services = [
    { 
      name: 'Airtime', 
      route: '/airtime', 
      icon: require('../../assets/icons/airtime.png'),
      bgColor: '#F3F4F6'
    },
    { 
      name: 'Data', 
      route: '/data', 
      icon: require('../../assets/icons/wifi.png'),
      bgColor: '#F3F4F6'
    },
    { 
      name: 'TV', 
      route: '/cable', 
      icon: require('../../assets/icons/tv.png'),
      bgColor: '#F3F4F6'
    },
    { 
      name: 'Electricity', 
      route: '/electricity', 
      icon: require('../../assets/icons/electricity.png'),
      bgColor: '#F3F4F6'
    },
    { 
      name: 'Earn', 
      route: '/earn', 
      icon: require('../../assets/icons/earn.png'),
      bgColor: '#F3F4F6'
    },
    { 
      name: 'Fund Wallet', 
      route: '/fund-wallet', 
      icon: require('../../assets/icons/wallet.png'),
      bgColor: '#F3F4F6'
    },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome</Text>
          <Text style={styles.userName}>{greeting}</Text>
          {location && <Text style={styles.location}>from {location}</Text>}
        </View>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={isRefreshing}
        >
          <Image 
            source={require('../../assets/icons/refresh.png')}
            style={[styles.iconSmall, isRefreshing && styles.iconRotating]}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text 
          style={styles.balanceAmount}
          adjustsFontSizeToFit
          numberOfLines={1}
          minimumFontScale={0.6}
        >
          ₦{formattedBalance}
        </Text>
        <TouchableOpacity 
          style={styles.fundButton}
          onPress={() => router.push('/fund-wallet')}
        >
          <Text style={styles.fundButtonText}>Add Money</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#4F46E5"
          />
        }
      >
        <Text style={styles.sectionTitle}>Services</Text>
        
        <View style={styles.servicesGrid}>
          {services.map((service, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.serviceCard, { backgroundColor: service.bgColor }]}
              onPress={() => router.push(service.route as any)}
            >
              <Image 
                source={service.icon} 
                style={styles.serviceIcon}
                resizeMode="contain"
              />
              <Text style={styles.serviceName}>{service.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transactions</Text>
          </View>
          <View style={styles.emptyState}>
            <Image 
              source={require('../../assets/icons/history.png')}
              style={styles.emptyIcon}
            />
            <TouchableOpacity onPress={() => router.push('/transactions')}>
            <Text style={styles.emptyText}>View transactions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
  },
  userName: {
    fontSize: 20,
    color: '#111827',
    fontWeight: '600',
    marginTop: 4,
  },
  location: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconSmall: {
    width: 18,
    height: 18,
    tintColor: '#374151',
  },
  iconRotating: {
    // You can add rotation animation here if needed
    opacity: 0.5,
  },

  balanceCard: {
    backgroundColor: '#F9FAFB',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },

  balanceLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },

  balanceAmount: {
    fontSize: 28,
    color: '#111827',
    fontWeight: '600',
    marginVertical: 8,
    letterSpacing: 0.5,
  },
  
  fundButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  fundButtonText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    marginHorizontal: 24,
    marginBottom: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: CARD_PADDING,
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: SERVICE_CARD_WIDTH,
    height: SERVICE_CARD_WIDTH * 0.7,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: CARD_PADDING,
  },
  serviceIcon: {
    width: 22,
    height: 22,
    tintColor: '#111827',
    marginBottom: 12,
  },

  serviceName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },

  section: {
    marginTop: 24,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  
  seeAll: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  
  emptyState: {
    backgroundColor: '#F9FAFB',
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyIcon: {
    width: 40,
    height: 40,
    tintColor: '#9CA3AF',
    marginBottom: 16,
  },
  
  emptyText: {
    fontSize: 14,
    color: '#040d20ff',
    fontWeight: '500',
  },
});