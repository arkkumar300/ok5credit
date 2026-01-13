import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const LegalScreen = ({ title, content }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.content}>{content}</Text>
      </ScrollView>
    </View>
  );
};

export default LegalScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  content: {
    fontSize: 14,
    lineHeight: 22,
    color: '#555',
  },
});
