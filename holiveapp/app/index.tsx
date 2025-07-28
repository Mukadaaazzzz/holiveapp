import { View, Text, Button } from 'react-native';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ marginBottom: 16 }}>👋 Welcome to Holive</Text>
      <Link href="/signin" asChild>
        <Button title="Sign In" />
      </Link>
    </View>
  );
}
