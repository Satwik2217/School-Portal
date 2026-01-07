import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../firebaseConfig';

export default function ProfileScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) {
        router.replace('/');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
        setLoading(false);
      } catch (error) {
        console.error("Profile Fetch Error:", error);
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => {
          await signOut(auth);
          router.replace('/');
        } 
      }
    ]);
  };

  const handlePasswordReset = async () => {
    if (auth.currentUser?.email) {
      try {
        await sendPasswordResetEmail(auth, auth.currentUser.email);
        Alert.alert("Reset Email Sent", "Check your inbox to change your password.");
      } catch (e) {
        Alert.alert("Error", "Could not send reset email.");
      }
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#007AFF" style={{ flex: 1 }} />;

  return (
    <ScrollView style={styles.container}>
      {/* 1. Header & Identity */}
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={50} color="#fff" />
        </View>
        <Text style={styles.email}>{userData?.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: userData?.role === 'teacher' ? '#e67e22' : '#007AFF' }]}>
          <Text style={styles.roleText}>{userData?.role?.toUpperCase()}</Text>
        </View>
      </View>

      {/* 2. Academic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Academic Details</Text>
        <View style={styles.infoRow}>
          <Ionicons name="school-outline" size={20} color="#666" />
          <Text style={styles.infoLabel}>Class & Section:</Text>
          <Text style={styles.infoValue}>{userData?.studentClass || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="finger-print-outline" size={20} color="#666" />
          <Text style={styles.infoLabel}>SyncID:</Text>
          <Text style={styles.infoValue}>{auth.currentUser?.uid.slice(0, 8).toUpperCase()}</Text>
        </View>
      </View>

      {/* 3. Account Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <TouchableOpacity style={styles.actionRow} onPress={handlePasswordReset}>
          <Ionicons name="lock-closed-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Change Password</Text>
          <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionRow} onPress={() => Alert.alert("Support", "Contact Developer at: your@email.com")}>
          <Ionicons name="help-circle-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* 4. Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
        <Text style={styles.logoutText}>Logout from SchoolSync</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: '#fff', padding: 40, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  email: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 8 },
  roleBadge: { paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20 },
  roleText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  section: { backgroundColor: '#fff', marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 13, color: '#999', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 15 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
  infoLabel: { marginLeft: 10, color: '#666', flex: 1 },
  infoValue: { fontWeight: 'bold', color: '#333' },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
  actionText: { marginLeft: 10, flex: 1, color: '#333', fontSize: 16 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', marginTop: 40, padding: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee' },
  logoutText: { marginLeft: 10, color: '#FF3B30', fontSize: 16, fontWeight: 'bold' }
});