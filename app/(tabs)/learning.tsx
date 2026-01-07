import { Ionicons } from '@expo/vector-icons'; // Built-in with Expo
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function LearningScreen() {
  return (
    <View style={styles.container}>
      {/* 1. Visual Icon for Maintenance */}
      <Ionicons name="construct-outline" size={80} color="#007AFF" />
      
      {/* 2. Professional Status Message */}
      <Text style={styles.title}>Under Construction</Text>
      
      <View style={styles.card}>
        <Text style={styles.message}>
          The Digital Classroom is currently undergoing maintenance to bring you high-quality video lessons and study materials.
        </Text>
        
        <Text style={styles.subMessage}>
          Expected Launch: Coming Soon
        </Text>
      </View>

      {/* 3. Branding for your 10k project */}
      <Text style={styles.footer}>Powered by SchoolSync v1.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 30, 
    backgroundColor: '#fff', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  title: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    marginTop: 20, 
    color: '#2c3e50' 
  },
  card: { 
    padding: 20, 
    backgroundColor: '#f0f7ff', 
    borderRadius: 15, 
    marginTop: 20, 
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d0e3ff'
  },
  message: { 
    fontSize: 16, 
    color: '#34495e', 
    textAlign: 'center', 
    lineHeight: 24 
  },
  subMessage: { 
    fontSize: 14, 
    color: '#007AFF', 
    fontWeight: 'bold', 
    marginTop: 15 
  },
  footer: { 
    position: 'absolute', 
    bottom: 30, 
    color: '#bdc3c7', 
    fontSize: 12, 
    fontWeight: 'bold' 
  }
});