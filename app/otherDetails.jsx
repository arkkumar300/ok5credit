// ProfileScreen.js

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet,SafeAreaView, ScrollView, TouchableOpacity, Modal, Pressable, Platform, KeyboardAvoidingViewBase } from 'react-native';
import { X, Pencil, UserRound, Share2, Store, Phone, FileText, Hash, Building2, MapPin, Mail, User, Delete, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { useRouter, useLocalSearchParams, router } from 'expo-router';
import { Appbar, Avatar, TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';

const OtherDetails = () => {
  // State to handle modals
  const [activeModal, setActiveModal] = useState(null);
  const [billCustomer, setBillCustomer] = useState(null);
  const [billNos, setBillNos] = useState("");
  const [billTypes, setBillTypes] = useState(null);
  const [userId, setUserId] = useState(null);
  const [billDates, setBillDates] = useState(null);
  const router = useRouter();
  const {
    customerId = '',
    customerName = '',
    customerMobile = '',
    billNo = '',
    billDate = ''
  } = useLocalSearchParams();
  const [billLable, setBillLable] = useState('');
  const [billNote, setBillNote] = useState('');
  const [billStore, setBillStore] = useState(null);
  const [billCreateDate, setBillCreateDate] = useState('');

  useEffect(() => {
    const customeData = async () => {
      try {
        const billCustomerStr = await AsyncStorage.getItem("billCustomer");
        const billCustomer = billCustomerStr ? JSON.parse(billCustomerStr) : {};
        setBillCustomer(billCustomer); // Assuming you want to store it as an object

        const billNo = await AsyncStorage.getItem("billNo") || "";
        setBillNos(billNo);

        const billType = await AsyncStorage.getItem("billType") || "";
        setBillTypes(billType);

        const billDate = await AsyncStorage.getItem("billDate") || "";
        setBillDates(billDate);

        const billNotes = await AsyncStorage.getItem("billNote") || "";
        setBillNote(billNotes);

        const billStoresStr = await AsyncStorage.getItem("billStore");
        const billStores = billStoresStr ? JSON.parse(billStoresStr) : {};
        
        setBillStore(billStores);

      } catch (error) {
        console.error("Error fetching bill data:", error);
      }
    };

    customeData();
  }, [billLable, billCreateDate,billNote]); // reactively update when props change



  const handleSaveBillNo = async (value) => {
    await AsyncStorage.setItem("billNo", value) || "";
    setBillLable(value); // Save bill number to state
  };

  const handleSaveNote = async (value) => {
    await AsyncStorage.setItem("billNote", value) || "";
    setBillNote(value); // Save bill number to state
  };

  const handleSaveStore = async (value) => {
    await AsyncStorage.setItem("billStore", JSON.stringify(value));
    setBillStore(value); // Save bill number to state
  };

  const handleSaveBillData = async (value) => {
    const dateStr = moment(value).format('DD MMM YYYY'); // Convert to string
    await AsyncStorage.setItem("billDate", dateStr);
    setBillCreateDate(dateStr);
    setActiveModal(null); // Make sure modal closes
  };

  useEffect(() => {
    const gerUserData = async () => {
      const userData = await AsyncStorage.getItem("userData");
      const userId = JSON.parse(userData).id;
      setUserId(userId);
    }
    gerUserData();
  }, [])

  const openModal = (key) => {
    setActiveModal(key);
  };
  const closeModal = () => setActiveModal(null);
  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={{ elevation: 3, backgroundColor: "#f4f8f8", borderBottomWidth: 2, borderColor: '#f2f7f6' }}>
        <ArrowLeft size={24} color={'#2E7D32'} style={{ marginStart: 10 }} onPress={() => {
          router.replace({ pathname: '/billGenaration', params: { customerId:billCustomer?.id || "",mode:"add",billNo: billLable||"", bill_date: billCreateDate,bill_type:billTypes} });
        }} />
        <Appbar.Content title="Other Details" titleStyle={{ color: '#333333', fontWeight: 'bold', marginLeft: 20 }} />
      </Appbar.Header>


      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Avatar.Image
            source={{ uri: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400&h=300' }}
            size={80} color="#ccc" />
          {/* <TouchableOpacity style={styles.editIcon}>
            <Text style={styles.editText}>✎</Text>
          </TouchableOpacity> */}
        </View>

        {/* Business Info List */}
        <View style={styles.card}>
          <ProfileItem label="Customer Details" subtitle={`${billCustomer?.name || "Name"},${billCustomer?.mobile || "PhoneNumber,GST,Address"}`} onPress={() => router.replace({ pathname: "add-bill-customer", params: { billNo: billNo, billDate: billDate } })} />
          <ProfileItem label="Bill Number" subtitle={billNos || 'BILL-No'} onPress={() => openModal('bill')} />
          <ProfileItem label="Bill Date" subtitle={billDates || '05 sep 2025'} onPress={() => openModal('billDate')} />
          <ProfileItem label="Add" subtitle={billNote||'Notes'} onPress={() => openModal('notes')} />
          <ProfileItem label="Business Details" subtitle={`${billStore?.name ||"Business name"},${billStore?.GST||"GST"},${billStore?.address||"address"}`} onPress={() => openModal('BusinessDetails')} />
        </View>

        {/* Modals (You can customize each one separately below) */}
        <CustomerModal visible={activeModal === 'CustomerDetails'} onClose={closeModal} />
        <BillNumberModal visible={activeModal === 'bill'} onClose={closeModal} title="Phone Number" onSave={handleSaveBillNo} />
        <BillDateModal visible={activeModal === 'billDate'} onClose={closeModal} onSave={handleSaveBillData} />
        <NotesModal visible={activeModal === 'notes'} onClose={closeModal} onSave={handleSaveNote}/>
        <BusinessDetailsModal visible={activeModal === 'BusinessDetails'} onClose={closeModal} onSave={handleSaveStore}/>
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


  useEffect(() => {
    const customeData = async () => {

      const billCustomerName = await AsyncStorage.getItem("billCustomerName");
      setName(billCustomerName);
      const billCustomerMobile = await AsyncStorage.getItem("billCustomerMobile");
      setPhone(billCustomerMobile);

    }
    customeData();
  }, []); // reactively update when props change


  const handleConfirm = () => {
    const customerData = {
      customerName,
      phone,
      GST,
      address,
      state,
    };

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

const BillNumberModal = ({ visible, onClose, onSave }) => {
  const [billNo, setBillNo] = useState('');
  useEffect(() => {
    const loadBillNo = async () => {
      const storedBillNo = await AsyncStorage.getItem("billNo");
      if (storedBillNo) setBillNo(storedBillNo);
    };

    if (visible) loadBillNo(); // only fetch if modal opens
  }, [visible]);

  const handleConfirm = async () => {
    if (onSave) {
      await onSave(billNo); // Save to parent
    }
    onClose(); // Close the modal
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
            right={<TextInput.Icon icon="check" color="green" onPress={handleConfirm} />}
            onChangeText={setBillNo}
            placeholder="Bill No."
          />
        </View>
        {/* WhatsApp Share Button */}
      </View>
    </Modal>
  )
};

const BillDateModal = ({ visible, onClose, onSave }) => {
  const [billDate, setBillDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Load date from storage when modal is shown
  useEffect(() => {
    const loadBillDate = async () => {
      const storedDate = await AsyncStorage.getItem("billDate");
      if (storedDate) {
      const rrr=moment(storedDate, 'DD MMM YYYY').toDate()
        setBillDate(new Date(rrr)); // Convert from string to Date object
      } else {
        setBillDate(new Date());
      }
    };

    if (visible) {
      loadBillDate();
    }
  }, [visible]);

  // Format date for display
  const formatDateForDisplay = (date) => {
    return moment(date).format('DD MMM YYYY');
  };

  // Save and close modal
  const handleConfirm = async () => {
    if (onSave) {
      await onSave(billDate); // Pass Date object to parent
    }
    if (onClose) {
      onClose(); // Close modal
    }
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
          <Text style={styles.subtitleText}>Update Bill Date</Text>

          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={styles.textInput}
          >
            <Text style={{ color: '#000' }}>
              {formatDateForDisplay(billDate)}
            </Text>
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

          <TouchableOpacity onPress={handleConfirm} style={styles.submitButton}>
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const NotesModal = ({ visible, onClose, onSave }) => {
  const [note, setNote] = useState('');

  // Save and close modal
  const handleConfirm = async () => {
    if (onSave) {
      await onSave(note); // Pass Date object to parent
    }
    if (onClose) {
      onClose(); // Close modal
    }
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

const BusinessDetailsModal = ({ visible, onClose,onSave }) => {
  const [storeName, setStoreName] = useState('');
  const [userID, setUserID] = useState('');
  const [GST, setGST] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  // const [state, setState] = useState('');

  useEffect(()=>{
const getUserDetails=async ()=>{
  const userData=await AsyncStorage.getItem("userData");
  const parsedUserData=JSON.parse(userData);
  setUserID(parsedUserData.id);
  setStoreName(parsedUserData.name);
  setGST(parsedUserData.GST);
  setBusinessAddress(parsedUserData.address);
}
getUserDetails()
  },[])

  const handleConfirm = async () => {
    const StoreData = {
      name:storeName,
      GST,
      address:businessAddress,
      // state,
    };
if (onSave) {
  onSave(StoreData);
}
    // TODO: Handle saving logic here (API call, state update, etc.)
    try {
      const response = await ApiService.put(`/user/${userID}`, StoreData);

      if (response.status === 200 || response.status === 201) {
        alert('User updated successfully');
      } else {
        alert('Something went wrong while updating the user.');
      }
    } catch (error) {
      console.error(error);
      alert('API request failed. Check your server.');
    } finally{
      onClose(); // Close modal after submission
    }   
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
              label="store Name"
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

            {/* <TextInput
              label="State"
              mode="outlined"
              value={state}
              onChangeText={setState}
              placeholder="Enter state"
              left={<TextInput.Icon icon="map-marker" />}
              style={styles.input}
            /> */}

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
    color: '#333',
  },
  subtitle: {
    fontSize: 14, fontWeight: '700',
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
