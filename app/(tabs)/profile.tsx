import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../../firebaseConfig';

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = () => {
    signOut(auth).then(() => {
      // This sends you back to the very first screen (login)
      router.replace('/'); 
    });
  };

  return (
    <View style={styles.container}>
      <Text>Logged in as: {auth.currentUser?.email}</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  button: { backgroundColor: 'red', padding: 15, borderRadius: 10, marginTop: 20 },
  buttonText: { color: 'white', fontWeight: 'bold' }
});