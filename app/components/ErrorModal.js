// ------------------------
// BEAUTIFUL ERROR MODAL
// ------------------------
import React from 'react';
import { View, Text, StyleSheet,TouchableOpacity} from 'react-native';

const ErrorModal = ({ visible, message, onClose }) => {
    if (!visible) return null;
  
    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>⚠️ Oops!</Text>
          <Text style={styles.modalMessage}>{message}</Text>
  
          <TouchableOpacity style={styles.modalButton} onPress={onClose}>
            <Text style={styles.modalButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  export default ErrorModal;
  
  const styles = StyleSheet.create({
    /*** ERROR MODAL ***/
modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 999,
  },
  
  modalContainer: {
    width: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
  },
  
  modalMessage: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  
  modalButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    elevation: 2,
  },
  
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  
  });
  