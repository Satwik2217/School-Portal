import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp
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

// Define the shape of our data for TypeScript
interface Homework {
  id: string;
  subject: string;
  description: string;
  teacherEmail: string;
  createdAt: Timestamp;
}

export default function HomeworkScreen() {
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<'teacher' | 'student' | null>(null);
  const [loading, setLoading] = useState(true);
  
  // States for Teacher input
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  // States for Student submission
  const [submissionLink, setSubmissionLink] = useState('');
  const [activeHwId, setActiveHwId] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      if (!auth.currentUser) return;

      // 1. Get User Role from Firestore
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role as 'teacher' | 'student');
        }

        // 2. Listen for Homework
        const q = query(collection(db, "homework"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Homework[];
          setHomeworkList(items);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error("Initialization error:", error);
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const handlePostHomework = async () => {
    if (!subject || !description) return Alert.alert("Error", "Fill all fields");
    try {
      await addDoc(collection(db, "homework"), {
        subject,
        description,
        teacherEmail: auth.currentUser?.email,
        createdAt: serverTimestamp()
      });
      setSubject('');
      setDescription('');
      Alert.alert("Success", "Homework assigned!");
    } catch (e) {
      Alert.alert("Error", "Failed to post homework");
    }
  };

  const handleSubmission = async (hwId: string) => {
    if (!submissionLink) return Alert.alert("Error", "Provide a link or note");
    try {
      await addDoc(collection(db, "submissions"), {
        homeworkId: hwId,
        studentUid: auth.currentUser?.uid,
        studentEmail: auth.currentUser?.email,
        content: submissionLink,
        status: 'pending', // Teacher will change this to 'verified' later
        submittedAt: serverTimestamp()
      });
      setSubmissionLink('');
      setActiveHwId(null);
      Alert.alert("Sent", "Your work has been sent to the teacher for verification.");
    } catch (e) {
      Alert.alert("Error", "Submission failed");
    }
  };

  if (loading) return <ActivityIndicator style={styles.loader} />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Homework Tracker</Text>

      {/* Teacher View: Assignment Form */}
      {userRole === 'teacher' && (
        <View style={styles.form}>
          <TextInput placeholder="Subject" style={styles.input} value={subject} onChangeText={setSubject} />
          <TextInput placeholder="Instructions" style={styles.input} value={description} onChangeText={setDescription} />
          <TouchableOpacity style={styles.btn} onPress={handlePostHomework}>
            <Text style={styles.btnText}>Post Assignment</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={homeworkList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.subjectTag}>{item.subject}</Text>
            <Text style={styles.desc}>{item.description}</Text>
            
            {/* Student View: Submission Form */}
            {userRole === 'student' && (
              <View style={styles.submissionArea}>
                <TextInput 
                  placeholder="Paste PDF link or status..." 
                  style={styles.subInput}
                  value={activeHwId === item.id ? submissionLink : ''}
                  onChangeText={(text) => {
                    setActiveHwId(item.id);
                    setSubmissionLink(text);
                  }}
                />
                <TouchableOpacity style={styles.subBtn} onPress={() => handleSubmission(item.id)}>
                  <Text style={styles.btnText}>Submit for Verification</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa', paddingTop: 60 },
  header: { fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  loader: { flex: 1, justifyContent: 'center' },
  form: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 20, elevation: 3 },
  input: { borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 10, padding: 8 },
  btn: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
  subjectTag: { color: '#007AFF', fontWeight: 'bold', fontSize: 12, marginBottom: 5 },
  desc: { fontSize: 16, color: '#444' },
  submissionArea: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  subInput: { backgroundColor: '#f9f9f9', padding: 8, borderRadius: 6, marginBottom: 8 },
  subBtn: { backgroundColor: '#2ecc71', padding: 10, borderRadius: 8, alignItems: 'center' }
});