import { collection, onSnapshot, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebaseConfig';

export default function LearningScreen() {
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "curriculum"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLessons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Digital Classroom</Text>
      <FlatList
        data={lessons}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => Linking.openURL(item.videoLink)} // Opens a YouTube video or PDF
          >
            <Text style={styles.subject}>{item.subject}</Text>
            <Text style={styles.topic}>{item.topic}</Text>
            <Text style={styles.linkText}>▶ Watch Lesson</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { padding: 20, backgroundColor: '#f0f7ff', borderRadius: 15, marginBottom: 15 },
  subject: { fontSize: 12, color: '#007AFF', fontWeight: 'bold', textTransform: 'uppercase' },
  topic: { fontSize: 18, fontWeight: '500', marginVertical: 5 },
  linkText: { color: '#007AFF', marginTop: 10, fontWeight: 'bold' }
});