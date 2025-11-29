// ProfileScreen.js

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable, Platform, KeyboardAvoidingViewBase } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Pencil, UserRound, Share2, Store, Phone, FileText, Hash, Building2, MapPin, Mail, User, Delete, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Appbar, Avatar, TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { KeyboardAvoidingView } from 'react-native-web';

const OtherDetails = () => {
  // State to handle modals
  const [activeModal, setActiveModal] = useState(null);
  const router = useRouter();
  const openModal = (key) => {
    setActiveModal(key);
  };
  const closeModal = () => setActiveModal(null);

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={{elevation:3, backgroundColor: "#f4f8f8", borderBottomWidth: 2, borderColor: '#f2f7f6' }}>
        <ArrowLeft size={24} color={'#2E7D32'} style={{ marginStart: 10 }} onPress={() => router.back()} />
        <Appbar.Content title="Other Details" titleStyle={{ color: '#333333', fontWeight: 'bold', marginLeft: 20 }} />
      </Appbar.Header>


      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Avatar.Image
            source={{ uri: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400&h=300' }}
            size={80} color="#ccc" />
          <TouchableOpacity style={styles.editIcon}>
            <Text style={styles.editText}>✎</Text>
          </TouchableOpacity>
        </View>

        {/* Business Info List */}
        <View style={styles.card}>
          <ProfileItem label="Customer Details" subtitle={'Amma'} onPress={() => openModal('CustomerDetails')} />
          <ProfileItem label="Bill Number" subtitle={'BILL-4'} onPress={() => openModal('bill')} />
          <ProfileItem label="Bill Date" subtitle={'05 sep 2025'} onPress={() => openModal('billDate')} />
          <ProfileItem label="Add" subtitle={'Notes'} onPress={() => openModal('notes')} />
          <ProfileItem label="Business Details" subtitle={'Business name,GST,address'} onPress={() => openModal('BusinessDetails')} />
        </View>

        {/* Modals (You can customize each one separately below) */}
        <CustomerModal visible={activeModal === 'CustomerDetails'} onClose={closeModal} />
        <BillNumberModal visible={activeModal === 'bill'} onClose={closeModal} title="Phone Number" />
        <BillDateModal visible={activeModal === 'billDate'} onClose={closeModal} />
        <NotesModal visible={activeModal === 'notes'} onClose={closeModal} />
        <BusinessDetailsModal visible={activeModal === 'BusinessDetails'} onClose={closeModal} />
      </ScrollView>
    </SafeAreaView>
  );
};

const ProfileItem = ({ label, subtitle, onPress }) => (
  <TouchableOpacity style={styles.item} onPress={onPress}>

    <View style={styles.textContainer}>
      <Text style={styles.label}>{label}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
    <View style={styles.iconContainer}>
      <ChevronRight size={24} color="#007B83" />
    </View>
  </TouchableOpacity>
);

const CustomerModal = ({ visible, onClose }) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [GST, setGST] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('');

  const handleConfirm = () => {
    const customerData = {
      customerName,
      phone,
      GST,
      address,
      state,
    };

    console.log('Customer Data:', customerData);
    // TODO: Handle saving logic here (API call, state update, etc.)

    onClose(); // Close modal after submission
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackground}>
        <View style={styles.bottomSheet}>
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={styles.modalTitle}>Add Customer</Text>
            <Text style={styles.subtitleText}>Please fill out customer details</Text>


            <TextInput
              label="Customer Name"
              mode="outlined"
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Enter customer name"
              left={<TextInput.Icon icon="account" />}
              style={styles.input}
            />

            <TextInput
              label="Phone Number"
              mode="outlined"
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              left={<TextInput.Icon icon="phone" />}
              style={styles.input}
            />

            <TextInput
              label="GST Number"
              mode="outlined"
              value={GST}
              onChangeText={setGST}
              placeholder="Enter GST number"
              left={<TextInput.Icon icon="file-document-outline" />}
              style={styles.input}
            />

            <TextInput
              label="Address"
              mode="outlined"
              value={address}
              onChangeText={setAddress}
              placeholder="Enter address"
              multiline
              numberOfLines={3}
              left={<TextInput.Icon icon="home" />}
              style={styles.input}
            />

            <TextInput
              label="State"
              mode="outlined"
              value={state}
              onChangeText={setState}
              placeholder="Enter state"
              left={<TextInput.Icon icon="map-marker" />}
              style={styles.input}
            />

            <TouchableOpacity onPress={handleConfirm} style={styles.submitButton}>
              <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>)
};

const BillNumberModal = ({ visible, onClose }) => {
  const [billNo, setBillNo] = useState('');

  const handleConfirm = () => {
    // Save the business Email logic here (e.g., update state or API call)
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackground}>
        <View style={styles.bottomSheet}>
          <Text style={styles.modalTitle}>Bill Number</Text>
          <Text style={styles.subtitleText}>Please update Bill Number</Text>

          <TextInput
            style={styles.input}
            value={billNo}
            mode="outlined"
            label={'Bill No.'}
            outlineColor='#aaaaaa'
            activeOutlineColor='#333333'
            left={<TextInput.Icon icon="file" />}
            right={<TextInput.Icon icon="check" color={'green'} onPress={handleConfirm} />}
            onChangeText={setBillNo}
            placeholder="Bill No."
          />
        </View>
        {/* WhatsApp Share Button */}
      </View>
    </Modal>
  )
};

const BillDateModal = ({ visible, onClose }) => {
  const [billDate, setBillDate] = useState(new Date()); // Use Date object
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleConfirm = () => {
    // Save the business Email logic here (e.g., update state or API call)
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackground}>
        <View style={styles.bottomSheet}>
          <Text style={styles.modalTitle}>Bill Date</Text>
          <Text style={styles.subtitleText}>update Bill Date</Text>

          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.textInput}>
            <Text style={{ color: billDate ? '#000' : '#999' }}>
              {billDate ? billDate.toDateString() : 'Select Bill Date'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleConfirm} style={styles.submitButton}>
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={billDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setBillDate(selectedDate);
                }
              }}
            />
          )}

          {/* WhatsApp Share Button */}
        </View>
      </View>
    </Modal>
  )
};

const NotesModal = ({ visible, onClose }) => {
  const [note, setNote] = useState('');

  const handleConfirm = () => {
    // Save the business name logic here (e.g., update state or API call)
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackground}>
        <View style={styles.bottomSheet}>
          <Text style={styles.modalTitle}>Add Note</Text>
          <Text style={styles.subtitleText}>Please add Bill Note</Text>

          <TextInput
            style={[styles.input, { height: 100, }]}
            label="Bill Note"
            mode="outlined"
            outlineColor='#aaaaaa'
            activeOutlineColor='#333333'
            left={<TextInput.Icon icon="map" />}
            right={<TextInput.Icon icon="check" color={'green'} onPress={handleConfirm} />}
            value={note}
            maxLength={200} multiline={true}
            onChangeText={setNote}
            placeholder="Bill Note"
          />
        </View>
        {/* WhatsApp Share Button */}
      </View>
    </Modal>
  )
};

const BusinessDetailsModal = ({ visible, onClose }) => {
  const [storeName, setStoreName] = useState('');
  const [GST, setGST] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [state, setState] = useState('');

  const handleConfirm = () => {
    const StoreData = {
      storeName,
      GST,
      businessAddress,
      state,
    };

    console.log('Store Data:', StoreData);
    // TODO: Handle saving logic here (API call, state update, etc.)

    onClose(); // Close modal after submission
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackground}>
        <View style={styles.bottomSheet}>
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={styles.modalTitle}>Add Store</Text>
            <Text style={styles.subtitleText}>Please fill out Store details</Text>

            <TextInput
              label="Customer Name"
              mode="outlined"
              value={storeName}
              onChangeText={setStoreName}
              placeholder="Enter customer name"
              left={<TextInput.Icon icon="store" />}
              style={styles.input}
            />

            <TextInput
              label="GST Number"
              mode="outlined"
              value={GST}
              onChangeText={setGST}
              placeholder="Enter GST number"
              left={<TextInput.Icon icon="file-document-outline" />}
              style={styles.input}
            />

            <TextInput
              label="Business Address"
              mode="outlined"
              value={businessAddress}
              onChangeText={setBusinessAddress}
              placeholder="Enter business address"
              multiline
              numberOfLines={3}
              left={<TextInput.Icon icon="home-map-marker" />}
              style={styles.input}
            />

            <TextInput
              label="State"
              mode="outlined"
              value={state}
              onChangeText={setState}
              placeholder="Enter state"
              left={<TextInput.Icon icon="map-marker" />}
              style={styles.input}
            />

            <TouchableOpacity onPress={handleConfirm} style={styles.submitButton}>
              <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>)
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f8f8',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  editIcon: {
    position: 'relative',
    right: -20,
    top: -20,
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 8, zIndex: 99,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  editText: {
    fontSize: 12,
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  iconContainer: {
    width: 30,
    marginRight: 12,
    marginTop: 4,
  },
  textContainer: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  optionItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  optionText: {
    fontSize: 16,
    color: '#333',
  },

  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  subtitle: {
    fontSize: 12,
    color: '#777',
  },
  editSymbol: {
    fontSize: 16,
    color: '#007B83',
  },

  // Modal Styles
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 24,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#007B83',
    paddingVertical: 12,
    borderRadius: 8,
  },
  businessModal: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  businessTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  businessSubtitle: {
    fontSize: 14,
    color: '#555',
    marginVertical: 10,
  },
  cardPreview: {
    backgroundColor: '#0c1e4d',
    borderRadius: 12, justifyContent: 'center',
    padding: 20, height: 200,
    marginVertical: 16,
  },
  cardNumber: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 6,
  },
  cardName: {
    color: '#fff',
    fontSize: 16,
  },
  aquaCreditBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#fff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  aquaCreditText: {
    fontSize: 10,
    color: '#666',
  },
  verifyButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  verifyButtonActive: {
    backgroundColor: '#4CAF50',
  },
  verifyButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  aquaCreditBrand: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2a9d8f',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitleText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  submitButton: {
    backgroundColor: 'green',
    paddingVertical: 12,
    borderRadius: 10, alignSelf: 'center',
    alignItems: 'center',
    marginTop: 10, width: '50%'
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }, whatsappButton: {
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  whatsappButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  subtitleText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  iconButton: {
    padding: 10,
  },

  cancelIcon: {
    fontSize: 18,
    color: 'red',
  },

  confirmIcon: {
    fontSize: 20,
    color: 'green',
  },

});

export default OtherDetails;
