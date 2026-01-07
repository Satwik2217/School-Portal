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
  where
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../firebaseConfig';

const sanitize = (i: string) => i.toUpperCase().replace(/[^A-Z0-9]/g, "").trim();

export default function HomeworkScreen() {
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<'teacher' | 'student' | null>(null);
  const [userClass, setUserClass] = useState(''); 
  const [loading, setLoading] = useState(true);
  
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submissionLink, setSubmissionLink] = useState('');
  const [activeHwId, setActiveHwId] = useState<string | null>(null);

  const isPilotMode = true; 

  useEffect(() => {
    const initialize = async () => {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const cleanClass = sanitize(userData.studentClass || "");
          setUserRole(userData.role);
          setUserClass(cleanClass);

          // FIXED: Filter submissions by class
          if (userData.role === 'teacher') {
            const subQ = query(collection(db, "submissions"), where("studentClass", "==", cleanClass), orderBy("submittedAt", "desc"));
            onSnapshot(subQ, (snapshot) => {
              setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
          }

          // FIXED: Filter homework by class
          const q = query(collection(db, "homework"), where("studentClass", "==", cleanClass), orderBy("createdAt", "desc"));
          const unsubscribe = onSnapshot(q, (snapshot) => {
            setHomeworkList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
          });
          return unsubscribe;
        }
      } catch (e) { setLoading(false); }
    };
    initialize();
  }, []);

  const handleDeleteItem = async (collectionName: string, item: any) => {
    if (userRole !== 'teacher') return;
    if (sanitize(item.studentClass || "") !== sanitize(userClass)) {
      return Alert.alert("Access Denied", "This belongs to another class.");
    }

    Alert.alert("Delete Item", "Remove this permanently?", [
      { text: "Cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try { await deleteDoc(doc(db, collectionName, item.id)); }
          catch (e) { Alert.alert("Error", "Failed to delete."); }
      }}
    ]);
  };

  const handlePostHomework = async () => {
    if (!subject || !description) return Alert.alert("Error", "Fill all fields");
    try {
      await addDoc(collection(db, "homework"), {
        subject,
        description,
        teacherEmail: auth.currentUser?.email,
        studentClass: sanitize(userClass), // Fixed: Tags with class
        createdAt: serverTimestamp()
      });
      setSubject(''); setDescription('');
      Alert.alert("Success", "Assignment posted!");
    } catch (e) { Alert.alert("Error", "Failed to post."); }
  };

  const handleSubmission = async (hwId: string) => {
    if (!submissionLink) return Alert.alert("Error", "Provide a link");
    try {
      await addDoc(collection(db, "submissions"), {
        homeworkId: hwId,
        studentEmail: auth.currentUser?.email,
        studentClass: sanitize(userClass), // Fixed: Tags with class
        content: submissionLink,
        submittedAt: serverTimestamp()
      });
      setSubmissionLink(''); setActiveHwId(null);
      Alert.alert("Sent", "Work submitted!");
    } catch (e) { Alert.alert("Error", "Failed."); }
  };

  const openValidatedURL = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert("Error", "Invalid link.");
    } catch (e) { Alert.alert("Error", "Could not open."); }
  };

  if (loading) return <ActivityIndicator style={styles.loader} />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Homework - {userClass}</Text>

      {userRole === 'teacher' && (
        <View style={styles.form}>
          <TextInput placeholder="Subject" style={styles.input} value={subject} onChangeText={setSubject} />
          <TextInput placeholder="Instructions" style={styles.input} value={description} onChangeText={setDescription} />
          <TouchableOpacity style={styles.btn} onPress={handlePostHomework}>
            <Text style={styles.btnText}>Post Assignment</Text>
          </TouchableOpacity>
        </View>
      )}

      {userRole === 'teacher' && (
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.subHeader}>Submissions</Text>
          <FlatList horizontal data={submissions} renderItem={({ item }) => (
              <View style={styles.submissionCard}>
                <View style={styles.rowBetween}>
                  <Text style={styles.studentEmail} numberOfLines={1}>{item.studentEmail}</Text>
                  <TouchableOpacity onPress={() => handleDeleteItem("submissions", item)}><Ionicons name="close-circle" size={18} color="#ef4444" /></TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => openValidatedURL(item.content)} style={styles.viewLinkBtn}><Text style={styles.viewLinkText}>View</Text></TouchableOpacity>
              </View>
          )} />
        </View>
      )}

      <Text style={styles.subHeader}>Assignments</Text>
      <FlatList data={homeworkList} renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.subjectTag}>{item.subject}</Text>
              {userRole === 'teacher' && <TouchableOpacity onPress={() => handleDeleteItem("homework", item)}><Ionicons name="trash-outline" size={20} color="#ef4444" /></TouchableOpacity>}
            </View>
            <Text style={styles.desc}>{item.description}</Text>
            {userRole === 'student' && (
              <View style={styles.submissionArea}>
                <TextInput placeholder="Paste link..." style={styles.subInput} value={activeHwId === item.id ? submissionLink : ''} onChangeText={(t) => { setActiveHwId(item.id); setSubmissionLink(t); }} />
                <TouchableOpacity style={styles.subBtn} onPress={() => handleSubmission(item.id)}><Text style={styles.btnText}>Submit</Text></TouchableOpacity>
              </View>
            )}
          </View>
      )} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa', paddingTop: 60 },
  header: { fontSize: 26, fontWeight: 'bold', marginBottom: 10 },
  subHeader: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  loader: { flex: 1, justifyContent: 'center' },
  form: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 20, elevation: 3 },
  input: { borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 10, padding: 8 },
  btn: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
  subjectTag: { color: '#007AFF', fontWeight: 'bold' },
  desc: { fontSize: 16, color: '#444' },
  submissionArea: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  subInput: { backgroundColor: '#f9f9f9', padding: 8, borderRadius: 6, marginBottom: 8 },
  subBtn: { backgroundColor: '#2ecc71', padding: 10, borderRadius: 8, alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  submissionCard: { backgroundColor: '#e1f5fe', padding: 12, borderRadius: 10, marginRight: 10, width: 140 },
  studentEmail: { fontSize: 11, fontWeight: 'bold', flex: 1 },
  viewLinkBtn: { backgroundColor: '#007AFF', padding: 6, borderRadius: 6, marginTop: 5 },
  viewLinkText: { color: '#fff', textAlign: 'center', fontSize: 10 }
});