import { Image } from 'react-native';

export default function Logo() {
  return (
    <Image
      source={require('../assets/logoh.png')} // Replace with your actual logo file
      style={{ width: 120, height: 120, resizeMode: 'contain' }}
    />
  );
}
