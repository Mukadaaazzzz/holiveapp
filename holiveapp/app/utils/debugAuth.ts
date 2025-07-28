// utils/debugAuth.ts
import * as SecureStore from 'expo-secure-store';

export const debugAuthState = async () => {
  try {
    const accessToken = await SecureStore.getItemAsync('access_token');
    const refreshToken = await SecureStore.getItemAsync('refresh_token');
    const userId = await SecureStore.getItemAsync('userId');
    
    console.log('=== AUTH DEBUG STATE ===');
    console.log('Access Token exists:', !!accessToken);
    console.log('Access Token preview:', accessToken ? `${accessToken.substring(0, 20)}...` : 'null');
    console.log('Refresh Token exists:', !!refreshToken);
    console.log('UserId exists:', !!userId);
    console.log('UserId value:', userId);
    console.log('========================');
    
    return {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hasUserId: !!userId,
      userId
    };
  } catch (error) {
    console.error('Error checking auth state:', error);
    return null;
  }
};

export const clearAuthState = async () => {
  try {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('userId');
    console.log('Auth state cleared');
  } catch (error) {
    console.error('Error clearing auth state:', error);
  }
};