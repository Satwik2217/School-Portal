import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SchoolInfo() {
  return (
    <ScrollView style={styles.container}>
      {/* Header with School Branding */}
      <View style={styles.header}>
        <Ionicons name="school" size={60} color="white" />
        <Text style={styles.schoolName}>Bright Future Academy</Text>
        <Text style={styles.motto}>"Excellence in Every Step"</Text>
      </View>

      {/* Contact Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('tel:+919876543210')}>
          <Ionicons name="call" size={20} color="#007AFF" />
          <Text style={styles.rowText}>+91 98765 43210</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('mailto:help@school.com')}>
          <Ionicons name="mail" size={20} color="#007AFF" />
          <Text style={styles.rowText}>help@school.com</Text>
        </TouchableOpacity>
      </View>

      {/* Location Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Visit Us</Text>
        <Text style={styles.addressText}>123 Education Lane, Knowledge City, PIN: 110022</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#007AFF', padding: 40, alignItems: 'center' },
  schoolName: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 10 },
  motto: { color: '#e1f5fe', fontSize: 14, fontStyle: 'italic' },
  section: { backgroundColor: 'white', margin: 15, padding: 20, borderRadius: 15, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  rowText: { marginLeft: 10, fontSize: 16, color: '#007AFF' },
  addressText: { fontSize: 15, color: '#666', lineHeight: 22 }
});