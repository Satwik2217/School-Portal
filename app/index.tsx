import { useRouter } from 'expo-router';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  sendPasswordResetEmail,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../firebaseConfig';

export default function SmartLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [role, setRole] = useState<'teacher' | 'student' | null>(null);
  const [studentClass, setStudentClass] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Reset loading if user switches modes or types
  useEffect(() => {
    setLoading(false);
  }, [isSigningUp, email]);

  const handleForgotPassword = async () => {
    if (!email) return Alert.alert("Error", "Enter email first");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert("Sent", "Check your email to reset password.");
    } catch (e) {
      Alert.alert("Error", "Email not found.");
    }
  };

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Error", "Enter email and password");
    setLoading(true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      
      setLoading(false);
      if (userDoc.exists()) {
        // Timeout prevents "Attempted to navigate before mounting" error
        setTimeout(() => {
          Alert.alert("Success", "Login Successful!", [
            { text: "OK", onPress: () => router.replace('/(tabs)/notices') }
          ]);
        }, 100);
      } else {
        Alert.alert("Missing Profile", "No role found. Please Sign Up.");
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert("Login Failed", "Incorrect credentials or network error.");
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !role) return Alert.alert("Error", "Fill all fields and pick a role");
    if (role === 'student' && !studentClass) return Alert.alert("Error", "Enter Class and Section");
    
    setLoading(true);
    let newUser: any = null;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      newUser = userCredential.user;

      await setDoc(doc(db, "users", newUser.uid), {
        email: email.toLowerCase().trim(),
        role: role,
        studentClass: role === 'student' ? studentClass.toUpperCase() : 'STAFF',
        createdAt: new Date()
      });
      
      setLoading(false);
      setTimeout(() => {
        Alert.alert("Registered", "Signup Successful!", [
          { text: "Continue", onPress: () => router.replace('/(tabs)/notices') }
        ]);
      }, 100);
    } catch (error: any) {
      setLoading(false);
      if (newUser) await deleteUser(newUser); // Prevent role-less users
      Alert.alert("Signup Failed", error.message);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image 
          source={require('../assets/images/school_logo.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.schoolName}>SCHOOL PORTAL</Text>
        
        <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" />
        <TextInput placeholder="Password" style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />

        {!isSigningUp && (
          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        )}

        {isSigningUp && (
          <View style={styles.roleBox}>
            <Text style={styles.label}>I am a:</Text>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.roleBtn, role === 'student' && styles.active]} onPress={() => setRole('student')}>
                <Text style={role === 'student' ? styles.white : styles.blue}>Student</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.roleBtn, role === 'teacher' && styles.active]} onPress={() => setRole('teacher')}>
                <Text style={role === 'teacher' ? styles.white : styles.blue}>Teacher</Text>
              </TouchableOpacity>
            </View>
            {role === 'student' && (
              <TextInput 
                placeholder="Class (e.g. 10-A)" 
                style={[styles.input, { marginTop: 15 }]} 
                value={studentClass} 
                onChangeText={setStudentClass} 
              />
            )}
          </View>
        )}

        <TouchableOpacity 
          style={[styles.mainBtn, (isSigningUp && !role) && {backgroundColor: '#ccc'}]} 
          onPress={isSigningUp ? handleSignUp : handleLogin} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{isSigningUp ? "Create Account" : "Sign In"}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSigningUp(!isSigningUp)}>
          <Text style={styles.toggleText}>{isSigningUp ? "Login instead" : "New User? Register"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 30, justifyContent: 'center', backgroundColor: '#fff' },
  logoImage: { width: 100, height: 100, alignSelf: 'center', marginBottom: 10 },
  schoolName: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  input: { borderBottomWidth: 1, borderBottomColor: '#ddd', padding: 12, marginBottom: 15, fontSize: 16 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { color: '#007AFF', fontSize: 13 },
  roleBox: { marginVertical: 10 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  roleBtn: { flex: 0.48, padding: 12, borderRadius: 8, borderWidth: 2, borderColor: '#007AFF', alignItems: 'center' },
  active: { backgroundColor: '#007AFF' },
  blue: { color: '#007AFF', fontWeight: 'bold' },
  white: { color: '#fff', fontWeight: 'bold' },
  mainBtn: { backgroundColor: '#007AFF', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  toggleText: { textAlign: 'center', marginTop: 30, color: '#007AFF' }
});