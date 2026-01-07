import { Ionicons } from '@expo/vector-icons';
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
  updateDoc,
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

export default function QueriesScreen() {
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'teacher' | 'student' | null>(null);
  const [userClass, setUserClass] = useState('');
  
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const initialize = async () => {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const cleanClass = sanitize(data.studentClass || "");
          setUserRole(data.role);
          setUserClass(cleanClass);

          // FIXED: Strictly filter queries by class for teachers
          const q = data.role === 'teacher' 
            ? query(collection(db, "queries"), where("studentClass", "==", cleanClass), orderBy("createdAt", "desc"))
            : query(collection(db, "queries"), where("studentEmail", "==", auth.currentUser.email), orderBy("createdAt", "desc"));

          onSnapshot(q, (snapshot) => {
            setQueries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
          });
        }
      } catch (e) { setLoading(false); }
    };
    initialize();
  }, []);

  const handleDeleteQuery = (item: any) => {
    if (userRole === 'teacher' && sanitize(item.studentClass) !== sanitize(userClass)) {
      return Alert.alert("Access Denied", "Cannot delete other class queries.");
    }
    
    Alert.alert("Delete", "Remove this query?", [
      { text: "Cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          await deleteDoc(doc(db, "queries", item.id));
      }}
    ]);
  };

  const toggleStatus = async (item: any) => {
    if (userRole !== 'teacher') return;
    const nextStatus = item.status === 'Pending' ? 'Resolved' : 'Pending';
    try {
      await updateDoc(doc(db, "queries", item.id), { status: nextStatus });
    } catch (e) { Alert.alert("Error", "Update failed."); }
  };

  const handleRaiseQuery = async () => {
    if (!subject || !message) return Alert.alert("Error", "Fill all fields");
    try {
      await addDoc(collection(db, "queries"), {
        subject,
        message,
        status: 'Pending',
        studentEmail: auth.currentUser?.email,
        studentClass: sanitize(userClass), // Fixed: Tags with class
        createdAt: serverTimestamp()
      });
      setSubject(''); setMessage('');
      Alert.alert("Success", "Query sent!");
    } catch (e) { Alert.alert("Error", "Failed."); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Queries - Class {userClass}</Text>

      {userRole === 'student' && (
        <View style={styles.form}>
          <TextInput placeholder="Subject" style={styles.input} value={subject} onChangeText={setSubject} />
          <TextInput placeholder="Message" style={[styles.input, { height: 60 }]} multiline value={message} onChangeText={setMessage} />
          <TouchableOpacity style={styles.submitBtn} onPress={handleRaiseQuery}><Text style={styles.submitText}>Send Query</Text></TouchableOpacity>
        </View>
      )}

      {loading ? <ActivityIndicator size="large" /> : (
        <FlatList data={queries} renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.subjectText}>{item.subject}</Text>
                <TouchableOpacity onPress={() => toggleStatus(item)} disabled={userRole !== 'teacher'}>
                  <View style={[styles.statusBadge, { backgroundColor: item.status === 'Pending' ? '#ff9f43' : '#2ecc71' }]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteQuery(item)}><Ionicons name="trash-outline" size={18} color="#ef4444" /></TouchableOpacity>
              </View>
              <Text style={styles.messageText}>{item.message}</Text>
              <Text style={styles.footer}>From: {item.studentEmail}</Text>
            </View>
        )} keyExtractor={it => it.id} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#f8f9fa' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  form: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 25, elevation: 3 },
  input: { borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 15, padding: 8 },
  submitBtn: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  subjectText: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, marginRight: 10 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  messageText: { color: '#666', fontSize: 14 },
  footer: { fontSize: 11, color: '#999', marginTop: 10, fontStyle: 'italic' }
});