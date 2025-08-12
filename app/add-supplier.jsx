import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Phone } from 'lucide-react-native';

export default function AddSupplierScreen() {
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [showMobileInput, setShowMobileInput] = useState(false);
  const router = useRouter();

  const handleConfirm = () => {
    if (name.trim()) {
      router.push({
        pathname: '/transaction',
        params: {
          personName: name,
          personType: 'supplier',
          isNew: 'true'
        }
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Supplier By Yourself</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Name</Text>
          <View style={styles.inputWrapper}>
            <User size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter supplier name"
              autoFocus={true}
            />
          </View>
        </View>

        {!showMobileInput ? (
          <TouchableOpacity 
            style={styles.addMobileButton}
            onPress={() => setShowMobileInput(true)}
          >
            <Phone size={20} color="#666" />
            <Text style={styles.addMobileText}>+ Add Mobile Number (Optional)</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <View style={styles.inputWrapper}>
              <Phone size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={mobileNumber}
                onChangeText={setMobileNumber}
                placeholder="Enter mobile number"
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.confirmButton, name.trim() ? styles.confirmButtonActive : styles.confirmButtonDisabled]}
        onPress={handleConfirm}
        disabled={!name.trim()}
      >
        <Text style={styles.confirmButtonText}>Confirm</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    color: '#333',
  },
  addMobileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  addMobileText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  confirmButton: {
    marginHorizontal: 24,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonActive: {
    backgroundColor: '#4CAF50',
  },
  confirmButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});