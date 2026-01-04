import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';

export default function NoticeBoard() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'School' | 'Class'>('School');
  const [userClass, setUserClass] = useState<string>('');
  const router = useRouter();

  // 1. Initial Load: Get user data
  useEffect(() => {
    if (!auth.currentUser) {
      router.replace('/');
      return;
    }
    const getUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser!.uid));
        if (userDoc.exists()) setUserClass(userDoc.data().studentClass);
      } catch (e) { console.log(e); }
    };
    getUserData();
  }, []);

  // 2. Fetch Notices
  useEffect(() => {
    if (!auth.currentUser) return;
    setLoading(true);
    const target = activeTab === 'School' ? 'ALL' : userClass;

    const q = query(collection(db, "notices"), where("target", "==", target), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, () => setLoading(false));

    return () => unsubscribe();
  }, [activeTab, userClass]);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Notices</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'School' && styles.activeTab]} onPress={() => setActiveTab('School')}>
          <Text style={activeTab === 'School' ? styles.white : styles.blue}>School</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'Class' && styles.activeTab]} onPress={() => setActiveTab('Class')}>
          <Text style={activeTab === 'Class' ? styles.white : styles.blue}>Class {userClass}</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator style={{marginTop: 50}} /> : (
        <FlatList
          data={notices}
          keyExtractor={it => it.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.text}>{item.text}</Text>
              <Text style={styles.date}>{item.createdAt?.toDate().toLocaleDateString()}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#f8f9fa' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold' },
  logoutBtn: { backgroundColor: '#fee2e2', padding: 8, borderRadius: 8 },
  logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 12 },
  tabBar: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 10, padding: 4, marginBottom: 20 },
  tab: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#007AFF' },
  blue: { color: '#007AFF' },
  white: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
  text: { fontSize: 16, color: '#333' },
  date: { fontSize: 12, color: '#999', marginTop: 10 }
});