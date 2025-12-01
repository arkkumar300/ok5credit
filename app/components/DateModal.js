import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const DateModal = ({ visible, initialDate, onClose, onConfirm }) => {
  const [selectedDate, setSelectedDate] = useState(
    initialDate instanceof Date ? initialDate : new Date(initialDate)
  );

  const onChange = (_, date) => {
    if (date) setSelectedDate(date);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Select Due Date</Text>

          {/* Date Picker Container to avoid iOS width errors */}
          <View style={{ minWidth: 300 }}>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              onChange={onChange}
              style={{ width: '100%' }}
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.okButton}
              onPress={() => onConfirm(selectedDate)}
            >
              <Text style={styles.buttonText}>OK</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

export default DateModal;


const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
  },

  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    width: '100%',
    justifyContent: 'space-between',
  },

  cancelButton: {
    backgroundColor: '#999',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },

  okButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
