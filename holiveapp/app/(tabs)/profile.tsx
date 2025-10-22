import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabaseGateway } from '../../lib/api';
import * as SecureStore from 'expo-secure-store';
import { ChevronLeft, User, MapPin, Check, LogOut, Lock, Shield } from 'lucide-react-native';
import { pinService } from '../../lib/api-services'; // Import from api-services

export default function ProfileScreen() {
  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // PIN states
  const [hasPin, setHasPin] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isManagingPin, setIsManagingPin] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [checkingPin, setCheckingPin] = useState(true);
  
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchProfile();
        await checkPinStatus();
      } catch (error) {
        console.error('Initial load error:', error);
      }
    };
    loadData();
  }, []);

  // Check if user has PIN - USING pinService now
  async function checkPinStatus() {
    try {
      setCheckingPin(true);
      const result = await pinService.hasPin();
      console.log('PIN check result:', result);
      setHasPin(result.hasPin);
    } catch (error) {
      console.error('Error checking PIN status:', error);
    } finally {
      setCheckingPin(false);
    }
  }

  async function fetchProfile() {
    try {
      setIsLoading(true);
      
      const accessToken = await SecureStore.getItemAsync('access_token');
      
      if (!accessToken) {
        console.log('No access token found, redirecting to signin');
        router.replace('/signin');
        return;
      }

      const response = await supabaseGateway('getProfile', {
        access_token: accessToken
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data) {
        throw new Error('No data received from server');
      }

      const { data } = response;
      setEmail(data.email || '');
      setUsername(data.username || '');
      setLocation(data.location || '');
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      
      if (error.message.includes('JWT') || 
          error.message.includes('Auth') || 
          error.message.includes('401') ||
          error.message.includes('User not found')) {
        console.log('Authentication error, clearing tokens and redirecting');
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        router.replace('/signin');
      } else {
        Alert.alert(
          'Error', 
          `Failed to load profile: ${error.message}`,
          [
            {
              text: 'Retry',
              onPress: () => fetchProfile()
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
    }
  }

  async function handleUpdateProfile() {
    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    try {
      setIsUpdating(true);
      const accessToken = await SecureStore.getItemAsync('access_token');
      
      if (!accessToken) {
        Alert.alert('Error', 'User not authenticated');
        router.replace('/signin');
        return;
      }

      const response = await supabaseGateway('updateProfile', {
        access_token: accessToken,
        username: username.trim(),
        location: location.trim()
      });

      if (response.error) {
        throw new Error(response.error);
      }

      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      
      if (error.message.includes('JWT') || 
          error.message.includes('Auth') || 
          error.message.includes('401')) {
        console.log('Authentication error, clearing tokens and redirecting');
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        router.replace('/signin');
      } else {
        Alert.alert('Error', error.message || 'Failed to update profile');
      }
    } finally {
      setIsUpdating(false);
    }
  }

  // PIN Management Functions - USING pinService now
  async function handleSavePin() {
    if (!pin || pin.length !== 4) {
      Alert.alert('Error', 'Please enter a 4-digit PIN');
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }

    try {
      setIsSavingPin(true);
      
      const result = await pinService.createOrUpdate(pin);
      console.log('PIN save result:', result);

      if (result.success) {
        Alert.alert('Success', result.message);
        setHasPin(true);
        setPin('');
        setConfirmPin('');
        setIsManagingPin(false);
      } else {
        Alert.alert('Error', result.message || 'Failed to save PIN');
      }
    } catch (error: any) {
      console.error('Error saving PIN:', error);
      Alert.alert('Error', error.message || 'Failed to save PIN');
    } finally {
      setIsSavingPin(false);
    }
  }

  function openPinManagement() {
    setPin('');
    setConfirmPin('');
    setIsManagingPin(true);
  }

  function closePinManagement() {
    setPin('');
    setConfirmPin('');
    setIsManagingPin(false);
  }

  async function handleLogout() {
    try {
      setIsLoading(true);
      // Clear both Supabase session and local tokens
      await supabaseGateway('signOut', {});
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      router.replace('/signin');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to log out');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color="#4F46E5" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Profile Picture Placeholder */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <User size={48} color="#6B7280" />
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <Text style={styles.username}>{username || 'No username set'}</Text>
          <Text style={styles.email}>{email}</Text>
          
          {location ? (
            <View style={styles.locationContainer}>
              <MapPin size={16} color="#6B7280" />
              <Text style={styles.location}>{location}</Text>
            </View>
          ) : null}
        </View>

        {/* PIN Management Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color="#4F46E5" />
            <Text style={styles.sectionTitle}>Security</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.pinButton}
            onPress={openPinManagement}
            disabled={checkingPin}
          >
            <Lock size={20} color="#4F46E5" />
            <View style={styles.pinButtonTextContainer}>
              <Text style={styles.pinButtonTitle}>
                {checkingPin ? 'Checking PIN...' : 
                 hasPin ? 'Change Transaction PIN' : 'Create Transaction PIN'}
              </Text>
              <Text style={styles.pinButtonSubtitle}>
                {checkingPin ? 'Checking PIN status...' :
                 hasPin ? 'Update your 4-digit security PIN' : 'Set up a 4-digit PIN for transactions'}
              </Text>
            </View>
            <ChevronLeft size={20} color="#6B7280" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          
          {!checkingPin && (
            <Text style={[
              styles.pinStatus,
              hasPin ? styles.pinStatusActive : styles.pinStatusInactive
            ]}>
              {hasPin ? '✓ PIN is set up for transactions' : '⚠ No PIN set for transactions'}
            </Text>
          )}
        </View>

        {/* Edit Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              maxLength={30}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your location"
              value={location}
              onChangeText={setLocation}
              maxLength={50}
            />
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={handleUpdateProfile}
            disabled={isUpdating || !username.trim()}
          >
            {isUpdating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Check size={18} color="#FFFFFF" />
                <Text style={styles.editButtonText}>Save Profile</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoading}
        >
          <LogOut size={18} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* PIN Management Modal */}
      <Modal
        visible={isManagingPin}
        transparent
        animationType="slide"
        onRequestClose={closePinManagement}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {hasPin ? 'Change PIN' : 'Create PIN'}
              </Text>
              <TouchableOpacity onPress={closePinManagement}>
                <ChevronLeft size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              {hasPin 
                ? 'Enter a new 4-digit PIN to replace your current one'
                : 'Create a 4-digit PIN that you will use to authorize transactions'
              }
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PIN</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 4-digit PIN"
                value={pin}
                onChangeText={setPin}
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                editable={!isSavingPin}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm PIN</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm 4-digit PIN"
                value={confirmPin}
                onChangeText={setConfirmPin}
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                editable={!isSavingPin}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closePinManagement}
                disabled={isSavingPin}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.savePinButton,
                  (!pin || !confirmPin || pin.length !== 4) && styles.buttonDisabled
                ]}
                onPress={handleSavePin}
                disabled={isSavingPin || !pin || !confirmPin || pin.length !== 4}
              >
                {isSavingPin ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.savePinButtonText}>
                    {hasPin ? 'Change PIN' : 'Create PIN'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E5E7EB',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  username: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  pinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pinButtonTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  pinButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  pinButtonSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  pinStatus: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  pinStatusActive: {
    color: '#10B981',
  },
  pinStatusInactive: {
    color: '#EF4444',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
  },
  editButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    marginHorizontal: 20,
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  savePinButton: {
    backgroundColor: '#4F46E5',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  savePinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});