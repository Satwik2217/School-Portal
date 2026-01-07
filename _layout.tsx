import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF', // Professional Blue
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        tabBarStyle: {
          height: 65,
          paddingBottom: 10,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
        },
      }}
    >
      {/* 1. NOTICES */}
      <Tabs.Screen
        name="notices"
        options={{
          title: 'Notices',
          tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} />,
        }}
      />

      {/* 2. HOMEWORK */}
      <Tabs.Screen
        name="homework"
        options={{
          title: 'Homework',
          tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} />,
        }}
      />

      {/* 3. DIGITAL CLASSROOM (NEW) */}
      <Tabs.Screen
  name="learning" // MUST MATCH THE FILE NAME learning.tsx
  options={{
    title: 'Learning',
    tabBarIcon: ({ color, size }) => <Ionicons name="videocam-outline" size={size} color={color} />,
    headerTitle: 'Digital Classroom', // Users see this at the top
  }}
/>

      {/* 4. GRADES (NEW) */}
      <Tabs.Screen
        name="grades"
        options={{
          title: 'Grades',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} />,
        }}
      />

      {/* 5. QUERIES */}
      <Tabs.Screen
        name="queries"
        options={{
          title: 'Queries',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" size={size} color={color} />,
        }}
      />

      {/* 6. INFO (NEW) */}
      <Tabs.Screen
        name="info"
        options={{
          title: 'Info',
          tabBarIcon: ({ color, size }) => <Ionicons name="information-circle-outline" size={size} color={color} />,
          headerTitle: 'School Information',
        }}
      />

      {/* 7. PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}