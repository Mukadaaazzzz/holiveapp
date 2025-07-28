import { Tabs } from 'expo-router';
import { Icon } from 'react-native-elements';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Icon name="home" type="feather" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Icon name="user" type="feather" color={color} />,
        }}
      />
    </Tabs>
  );
}
