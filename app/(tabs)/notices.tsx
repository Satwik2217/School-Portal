import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../firebaseConfig';

const sanitize = (i: string) => i.toUpperCase().replace(/[^A-Z0-9]/g, "").trim();

export default function NoticeBoard() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'School' | 'Class'>('School');
  const [userClass, setUserClass] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [newNotice, setNewNotice] = useState(''); 
  const router = useRouter();

  // Determine if user has administrative posting rights
  const isPrincipal = userRole === 'principal';

  useEffect(() => {
    if (!auth.currentUser) {
      router.replace('/');
      return;
    }
    const getUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser!.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserClass(sanitize(data.studentClass || ""));
          setUserRole(data.role);
        }
      } catch (e) { console.log(e); }
    };
    getUserData();
  }, []);

  useEffect(() => {
    if (!auth.currentUser || (activeTab === 'Class' && !userClass)) return;
    
    setLoading(true);
    const cleanClass = sanitize(userClass);

    // FIXED: Filtering logic remains consistent
    const targetClass = activeTab === 'School' ? 'ALL' : cleanClass;
    const q = query(
      collection(db, "notices"), 
      where("studentClass", "==", targetClass), 
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Fetch error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTab, userClass]);

  const handlePostNotice = async () => {
    if (!newNotice.trim()) return Alert.alert("Error", "Notice cannot be empty");
    
    try {
      // Determine the tag: if Principal is on School tab, use 'ALL'. Otherwise use teacher's class.
      const postTag = (isPrincipal && activeTab === 'School') ? 'ALL' : sanitize(userClass);

      await addDoc(collection(db, "notices"), {
        text: newNotice.trim(),
        studentClass: postTag, 
        authorEmail: auth.currentUser?.email,
        authorRole: userRole,
        createdAt: serverTimestamp(),
      });
      setNewNotice('');
      Alert.alert("Success", `Notice posted to ${postTag === 'ALL' ? 'the School' : 'your Class'}!`);
    } catch (e) {
      Alert.alert("Error", "Failed to post notice");
    }
  };

  const handleDeleteNotice = async (noticeId: string, itemClass: string) => {
    // Principal can delete global notices (ALL). Teachers can only delete their specific class notices.
    const isOwner = sanitize(itemClass) === sanitize(userClass);
    const isAdminDelete = isPrincipal && itemClass === 'ALL';

    if (!isOwner && !isAdminDelete) {
      return Alert.alert("Access Denied", "You do not have permission to delete this notice.");
    }
    
    Alert.alert("Delete Notice", "Remove this notice forever?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          try { await deleteDoc(doc(db, "notices", noticeId)); }
          catch (e) { Alert.alert("Error", "Could not delete."); }
        }
      }
    ]);
  };

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
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'School' && styles.activeTab]} 
          onPress={() => setActiveTab('School')}
        >
          <Text style={activeTab === 'School' ? styles.white : styles.blue}>School</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Class' && styles.activeTab]} 
          onPress={() => setActiveTab('Class')}
        >
          <Text style={activeTab === 'Class' ? styles.white : styles.blue}>Class {userClass}</Text>
        </TouchableOpacity>
      </View>

      {/* Logic: Show upload box for Principals in School tab, or Teachers in Class tab */}
      {((isPrincipal && activeTab === 'School') || (userRole === 'teacher' && activeTab === 'Class')) && (
        <View style={styles.uploadBox}>
          <Text style={styles.roleLabel}>
            POSTING AS: {isPrincipal && activeTab === 'School' ? "PRINCIPAL (GLOBAL)" : `TEACHER (${userClass})`}
          </Text>
          <TextInput 
            style={styles.input} 
            placeholder={isPrincipal && activeTab === 'School' ? "Write a global announcement..." : "Notice for your class..."} 
            value={newNotice} 
            onChangeText={setNewNotice} 
            multiline 
          />
          <TouchableOpacity 
            style={[styles.postBtn, isPrincipal && activeTab === 'School' && {backgroundColor: '#6366f1'}]} 
            onPress={handlePostNotice}
          >
            <Text style={styles.postBtnText}>Post Notice</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? <ActivityIndicator style={{marginTop: 50}} /> : (
        <FlatList
          data={notices}
          keyExtractor={it => it.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardContent}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.text}>{item.text}</Text>
                  <Text style={styles.date}>
                    {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Just now'} 
                    {item.studentClass === 'ALL' && " • Global"}
                  </Text>
                </View>
                {(isPrincipal || userRole === 'teacher') && (
                  <TouchableOpacity onPress={() => handleDeleteNotice(item.id, item.studentClass)} style={styles.deleteIcon}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No {activeTab === 'School' ? 'school-wide' : 'class'} notices found.
            </Text>
          }
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
  uploadBox: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 20, elevation: 3 },
  roleLabel: { fontSize: 10, fontWeight: 'bold', color: '#6366f1', marginBottom: 5 },
  input: { borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 12, padding: 8, fontSize: 16 },
  postBtn: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center' },
  postBtnText: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  text: { fontSize: 16, color: '#333' },
  date: { fontSize: 12, color: '#999', marginTop: 10 },
  deleteIcon: { padding: 5, marginLeft: 10 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40 }
});