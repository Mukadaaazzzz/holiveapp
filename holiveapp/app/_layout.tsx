import { Stack, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { AuthProvider, useAuth } from './context/AuthContext';
import { View, ActivityIndicator } from 'react-native';

function ProtectedRoutes({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const publicRoutes = ['/welcome', '/signin', '/signup'];

  const isPublic = publicRoutes.includes(pathname);

  useEffect(() => {
    if (!loading && !isAuthenticated && !isPublic) {
      router.replace('/signin');
    }
  }, [loading, isAuthenticated, pathname]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!isAuthenticated && !isPublic) {
    return null; // Block rendering protected routes until redirect
  }

  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => {
    const subscription = Linking.addEventListener('url', (event) => {
      if (event.url.includes('yourapp://paystack-callback')) {
        const url = new URL(event.url);
        const reference = url.searchParams.get('reference');
        if (reference) {
          console.log('Payment reference:', reference);
          // You can push to a screen if needed
        }
      }
    });

    Linking.getInitialURL().then((url) => {
      if (url?.includes('yourapp://paystack-callback')) {
        const urlObj = new URL(url);
        const reference = urlObj.searchParams.get('reference');
        // Handle reference
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <ProtectedRoutes>
        <Stack>
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="signin" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />
          <Stack.Screen name="fund-wallet" options={{ headerShown: false }} />
          <Stack.Screen name="transactions" options={{ headerShown: true }} />
          <Stack.Screen name="airtime" options={{ headerShown: true }} />
          <Stack.Screen name="data" options={{ headerShown: true }} />
          <Stack.Screen name="cable" options={{ headerShown: true }} />
          <Stack.Screen name="electricity" options={{ headerShown: true }} />
          <Stack.Screen name="earn" options={{ headerShown: true }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ProtectedRoutes>
    </AuthProvider>
  );
}
