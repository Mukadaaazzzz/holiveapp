import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabaseGateway } from '../../lib/api';
import * as SecureStore from 'expo-secure-store';
import { ChevronLeft, LogOut, User, MapPin, Check } from 'lucide-react-native';

export default function ProfileScreen() {
  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchProfile();
      } catch (error) {
        console.error('Initial load error:', error);
      }
    };
    loadData();
  }, []);

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

      {/* Edit Form */}
      <View style={styles.formContainer}>
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
              <Text style={styles.editButtonText}>Save/Edit</Text>
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
    marginBottom: 30,
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
  formContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
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
  },
  editButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
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
});