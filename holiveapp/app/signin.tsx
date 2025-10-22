import { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { supabaseGateway } from '../lib/api';
import * as SecureStore from 'expo-secure-store';
import React from 'react';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in both email and password');
      return;
    }

    setLoading(true);
    try {
      console.log('Step 1: Signing in user...');
      const { data, error } = await supabaseGateway('signIn', {
        email: email.trim(),
        password,
      });

      if (error) {
        Alert.alert('Sign In Error', error);
        return;
      }

      console.log('Step 2: Storing tokens...');
      // Store both tokens
      await SecureStore.setItemAsync('access_token', data.session.access_token);
      await SecureStore.setItemAsync('refresh_token', data.session.refresh_token);

      console.log('Step 3: Getting dashboard data to fetch userId...');
      // Get dashboard data which includes userId
      const dashboardResponse = await supabaseGateway('getDashboardData', {
        access_token: data.session.access_token
      });

      if (dashboardResponse.error) {
        console.error('Dashboard data error:', dashboardResponse.error);
        Alert.alert('Error', 'Failed to get user data');
        return;
      }

      if (dashboardResponse.data?.userId) {
        console.log('Step 4: Storing userId:', dashboardResponse.data.userId);
        // Store userId for services
        await SecureStore.setItemAsync('userId', dashboardResponse.data.userId);
      } else {
        console.error('No userId in dashboard response:', dashboardResponse.data);
        Alert.alert('Error', 'Failed to get user ID');
        return;
      }

      console.log('Sign in successful, navigating to home...');
      router.replace('/(tabs)/home');
      
    } catch (err) {
      console.error('Sign in error:', err);
      Alert.alert('Error', 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password?',
      'Password reset is currently available through our website. Would you like to visit the website to reset your password?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Go to Website',
          onPress: () => {
            Linking.openURL('https://holiveservices.com.ng/login').catch(err => {
              Alert.alert('Error', 'Failed to open website. Please manually visit: https://holiveservices.com.ng/login');
            });
          },
        },
      ]
    );
  };

  const handleForgotPasswordInstructions = () => {
    Alert.alert(
      'Password Reset Instructions',
      `To reset your password:

1. Visit: https://holiveservices.com.ng/login
2. Click on "Forgot Password" link
3. Enter your email address
4. Click "Forgot Password" again
5. Check your email for reset instructions
6. Follow the link in the email to create a new password
7. Return to the app and sign in with your new password

If you need further assistance, please contact support.`,
      [
        {
          text: 'Open Website',
          onPress: () => {
            Linking.openURL('https://holiveservices.com.ng/login').catch(err => {
              Alert.alert('Error', 'Failed to open website. Please manually visit: https://holiveservices.com.ng/login');
            });
          },
        },
        {
          text: 'OK',
          style: 'default',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#999" 
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        placeholderTextColor="#999" 
        secureTextEntry
      />

      {/* Forgot Password Link */}
      <TouchableOpacity 
        style={styles.forgotPasswordContainer}
        onPress={handleForgotPasswordInstructions}
        disabled={loading}
      >
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleSignIn} 
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => router.push('/signup')} 
        disabled={loading}
        style={styles.signUpContainer}
      >
        <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>

   
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    height: 48,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#000',
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signUpContainer: {
    marginBottom: 32,
  },
  linkText: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  helpSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  websiteButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  websiteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});