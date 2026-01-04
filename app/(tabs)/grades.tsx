import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';

export default function GradebookScreen() {
  const [myGrades, setMyGrades] = useState<any[]>([]);
  const currentUserEmail = auth.currentUser?.email?.toLowerCase();

  useEffect(() => {
    // Only fetch grades belonging to THIS student
    const q = query(
      collection(db, "grades"), 
      where("studentEmail", "==", currentUserEmail)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMyGrades(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Grade Report</Text>
      <FlatList 
        data={myGrades}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.gradeRow}>
            <Text style={styles.subject}>{item.subject}</Text>
            <View style={styles.scoreBox}>
              <Text style={styles.score}>{item.marks}/{item.total}</Text>
              <Text style={styles.examType}>{item.examName}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No grades released yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff', paddingTop: 50 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 30 },
  gradeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  subject: { fontSize: 18, fontWeight: '500' },
  scoreBox: { alignItems: 'flex-end' },
  score: { fontSize: 18, fontWeight: 'bold', color: '#2ecc71' },
  examType: { fontSize: 12, color: 'gray' },
  empty: { textAlign: 'center', marginTop: 50, color: 'gray' }
});