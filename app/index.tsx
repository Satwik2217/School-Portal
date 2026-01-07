import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../firebaseConfig';

// 1. UPDATED SANITIZER: Strictly allows only Alphanumeric characters and removes ALL spaces
const sanitizeClassName = (input: string) => {
  if (!input) return "";
  return input
    .toUpperCase()              // Forces uppercase
    .replace(/\s+/g, '')        // Removes all spaces (internal, start, and end)
    .replace(/[^A-Z0-9]/g, "")  // Removes any character that isn't a letter or a number
    .trim();
};

export default function SmartLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  // UPDATED: Added 'principal' to the allowed roles
  const [role, setRole] = useState<'teacher' | 'student' | 'principal' | null>(null);
  const [studentClass, setStudentClass] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setTimeout(() => router.replace('/(tabs)/notices'), 500);
      } else {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!auth.currentUser) setLoading(false);
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
      
      if (userDoc.exists()) {
        setLoading(false);
      } else {
        setLoading(false);
        Alert.alert("Missing Profile", "No role found. Please Sign Up.");
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert("Login Failed", "Incorrect credentials or network error.");
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !role) return Alert.alert("Error", "Fill all fields and pick a role");
    
    // Principal doesn't need to enter a class manually, it defaults to ALL
    if (role !== 'principal' && !studentClass) return Alert.alert("Error", "Enter Class and Section");
    
    setLoading(true);
    let newUser: any = null;

    // LOGIC: Principal gets "ALL" class, others use the sanitized input
    const cleanClass = role === 'principal' ? 'ALL' : sanitizeClassName(studentClass);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      newUser = userCredential.user;

      await setDoc(doc(db, "users", newUser.uid), {
        email: email.toLowerCase().trim(),
        role: role,
        studentClass: cleanClass, 
        createdAt: serverTimestamp()
      });
      
      setLoading(false);
      Alert.alert("Registered", `Success! Account created as ${role.toUpperCase()}`); 
    } catch (error: any) {
      setLoading(false);
      if (newUser) await deleteUser(newUser); 
      Alert.alert("Signup Failed", error.message);
    }
  };

  if (loading && !auth.currentUser) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image 
          source={require('../assets/images/school_logo.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.schoolName}>SCHOOL PORTAL</Text>
        
        <TextInput 
          placeholder="Email" 
          style={styles.input} 
          value={email} 
          onChangeText={setEmail} 
          autoCapitalize="none" 
        />

        <View style={styles.passwordWrapper}>
          <TextInput 
            placeholder="Password" 
            style={styles.passwordInput} 
            secureTextEntry={!showPassword} 
            value={password} 
            onChangeText={setPassword} 
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#999" />
          </TouchableOpacity>
        </View>

        {!isSigningUp && (
          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        )}

        {isSigningUp && (
          <View style={styles.roleBox}>
            <Text style={styles.label}>I am a:</Text>
            {/* UPDATED: Principal Button added to the selection */}
            <View style={styles.row}>
              <TouchableOpacity style={[styles.roleBtn, role === 'student' && styles.active]} onPress={() => setRole('student')}>
                <Text style={role === 'student' ? styles.white : styles.blue}>Student</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.roleBtn, role === 'teacher' && styles.active]} onPress={() => setRole('teacher')}>
                <Text style={role === 'teacher' ? styles.white : styles.blue}>Teacher</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.roleBtn, role === 'principal' && styles.active]} onPress={() => setRole('principal')}>
                <Text style={role === 'principal' ? styles.white : styles.blue}>Principal</Text>
              </TouchableOpacity>
            </View>

            {role && role !== 'principal' && (
              <View>
                <TextInput 
                  placeholder={role === 'teacher' ? "Class (e.g. 10A)" : "Your class (e.g. 10A)"}
                  style={[styles.input, { marginTop: 15 }]} 
                  value={studentClass} 
                  onChangeText={setStudentClass} 
                  autoCapitalize="characters"
                />
                <Text style={styles.previewText}>
                  Sync ID: <Text style={{fontWeight:'bold', color: '#007AFF'}}>{sanitizeClassName(studentClass)}</Text>
                </Text>
              </View>
            )}

            {role === 'principal' && (
              <Text style={[styles.previewText, {marginTop: 15, color: '#6366f1'}]}>
                Principals have global access to all school notices.
              </Text>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoImage: { width: 100, height: 100, alignSelf: 'center', marginBottom: 10 },
  schoolName: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  input: { borderBottomWidth: 1, borderBottomColor: '#ddd', padding: 12, marginBottom: 15, fontSize: 16 },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ddd', marginBottom: 15 },
  passwordInput: { flex: 1, padding: 12, fontSize: 16 },
  eyeIcon: { padding: 10 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { color: '#007AFF', fontSize: 13 },
  roleBox: { marginVertical: 10 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  // UPDATED: Flex adjusted for 3 buttons
  roleBtn: { flex: 0.31, padding: 10, borderRadius: 8, borderWidth: 2, borderColor: '#007AFF', alignItems: 'center' },
  active: { backgroundColor: '#007AFF' },
  blue: { color: '#007AFF', fontWeight: 'bold', fontSize: 12 },
  white: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  mainBtn: { backgroundColor: '#007AFF', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  toggleText: { textAlign: 'center', marginTop: 30, color: '#007AFF' },
  previewText: { fontSize: 11, color: '#666', marginTop: -10, marginLeft: 12 }
});