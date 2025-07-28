import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');
const LOGO_CONTAINER_SIZE = Math.min(width, height) * 0.3; // Responsive square size

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/signin');
    }, 3000); // Redirect after 2 seconds



    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Black background covering entire screen */}
      <View style={styles.background} />
      
      {/* White square container for logo */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/logoh.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000', // Pure black background
  },
  logoContainer: {
    width: LOGO_CONTAINER_SIZE,
    height: LOGO_CONTAINER_SIZE,
    backgroundColor: '#fff', // Pure white container
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24, // Slightly rounded corners
    elevation: 10, // Android shadow
    shadowColor: '#fff', // iOS shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    zIndex: 2, // Ensure it stays above background
  },
  logo: {
    width: '80%', // Logo takes 80% of container
    height: '80%',
  },
});