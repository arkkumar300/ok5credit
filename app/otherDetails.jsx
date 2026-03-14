// ProfileScreen.js

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
  Dimensions
} from 'react-native';
import {
  X,
  Pencil,
  UserRound,
  Share2,
  Store,
  Phone,
  FileText,
  Hash,
  Building2,
  MapPin,
  Mail,
  User,
  Delete,
  ChevronRight,
  ArrowLeft,
  Check,
  Calendar,
  File,
  Home,
  Map,
  FileEdit,
  CreditCard,
  Briefcase,
  Tag,
  Clock
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Appbar, Avatar, TextInput, Card, Divider } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

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
  }, [billLable, billCreateDate, billNote]); // reactively update when props change

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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4D3C" />

      {/* Premium Header with Gradient */}
      <LinearGradient
        colors={['#0A4D3C', '#1B6B50']}
        style={styles.headerGradient}
      >
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                router.replace({
                  pathname: '/billGenaration',
                  params: {
                    customerId: billCustomer?.id || "",
                    mode: "add",
                    billNo: billLable || "",
                    bill_date: billCreateDate,
                    bill_type: billTypes
                  }
                });
              }}
            >
              <ArrowLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Other Details</Text>
              <Text style={styles.headerSubtitle}>Additional information</Text>
            </View>

            <View style={styles.headerRight}>
              <View style={styles.headerBadge} />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <Animatable.View animation="fadeInDown" duration={600} style={styles.profileHeader}>
          <LinearGradient
            colors={['#0A4D3C', '#1B6B50']}
            style={styles.profileGradient}
          >
            <View style={styles.profileContent}>
              <View style={styles.avatarContainer}>
                <Avatar.Image
                  source={{ uri: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400&h=300' }}
                  size={80}
                  style={styles.avatar}
                />
                <View style={styles.avatarBadge}>
                  <Pencil size={12} color="#FFFFFF" />
                </View>
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{billCustomer?.name || "Customer Name"}</Text>
                <View style={styles.profilePhoneContainer}>
                  <Phone size={12} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.profilePhone}>{billCustomer?.mobile || "Phone Number"}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animatable.View>

        {/* Details Card */}
        <Animatable.View animation="fadeInUp" duration={600} delay={200} style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <Briefcase size={18} color="#0A4D3C" />
            <Text style={styles.cardHeaderTitle}>Bill Information</Text>
          </View>

          <View style={styles.cardContent}>
            <ProfileItem
              icon={<User size={18} color="#0A4D3C" />}
              label="Customer Details"
              value={`${billCustomer?.name || "Name"}, ${billCustomer?.mobile || "Phone"}`}
              onPress={() => router.replace({
                pathname: "add-bill-customer",
                params: { billNo: billNo, billDate: billDate }
              })}
            />

            <Divider style={styles.divider} />

            <ProfileItem
              icon={<Tag size={18} color="#0A4D3C" />}
              label="Bill Number"
              value={billNos || 'BILL-001'}
              onPress={() => openModal('bill')}
            />

            <Divider style={styles.divider} />

            <ProfileItem
              icon={<Calendar size={18} color="#0A4D3C" />}
              label="Bill Date"
              value={billDates || '05 Sep 2025'}
              onPress={() => openModal('billDate')}
            />

            <Divider style={styles.divider} />

            <ProfileItem
              icon={<FileEdit size={18} color="#0A4D3C" />}
              label="Notes"
              value={billNote || 'Add notes'}
              onPress={() => openModal('notes')}
            />

            <Divider style={styles.divider} />

            <ProfileItem
              icon={<Store size={18} color="#0A4D3C" />}
              label="Business Details"
              value={`${billStore?.name || "Business name"}, ${billStore?.GST || "GST"}`}
              onPress={() => openModal('BusinessDetails')}
            />
          </View>
        </Animatable.View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Modals */}
      <CustomerModal visible={activeModal === 'CustomerDetails'} onClose={closeModal} />
      <BillNumberModal visible={activeModal === 'bill'} onClose={closeModal} onSave={handleSaveBillNo} />
      <BillDateModal visible={activeModal === 'billDate'} onClose={closeModal} onSave={handleSaveBillData} />
      <NotesModal visible={activeModal === 'notes'} onClose={closeModal} onSave={handleSaveNote} />
      <BusinessDetailsModal visible={activeModal === 'BusinessDetails'} onClose={closeModal} onSave={handleSaveStore} />
    </View>
  );
};

const ProfileItem = ({ icon, label, value, onPress }) => (
  <TouchableOpacity style={styles.profileItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.profileItemLeft}>
      <View style={styles.profileItemIcon}>{icon}</View>
      <View style={styles.profileItemTextContainer}>
        <Text style={styles.profileItemLabel}>{label}</Text>
        <Text style={styles.profileItemValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
    <ChevronRight size={18} color="#0A4D3C" />
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
      setCustomerName(billCustomerName);
      const billCustomerMobile = await AsyncStorage.getItem("billCustomerMobile");
      setPhone(billCustomerMobile);
    }
    customeData();
  }, []);

  const handleConfirm = () => {
    const customerData = {
      customerName,
      phone,
      GST,
      address,
      state,
    };
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animatable.View animation="slideInUp" duration={400} style={styles.modalContent}>
          <LinearGradient
            colors={['#0A4D3C', '#1B6B50']}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Add Customer</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalSubtitle}>Please fill out customer details</Text>

            <View style={styles.modalInputWrapper}>
              <User size={18} color="#0A4D3C" style={styles.modalInputIcon} />
              <TextInput
                label="Customer Name"
                mode="outlined"
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Enter customer name"
                style={styles.modalInput}
                theme={{ colors: { primary: '#0A4D3C' } }}
              />
            </View>

            <View style={styles.modalInputWrapper}>
              <Phone size={18} color="#0A4D3C" style={styles.modalInputIcon} />
              <TextInput
                label="Phone Number"
                mode="outlined"
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                style={styles.modalInput}
                theme={{ colors: { primary: '#0A4D3C' } }}
              />
            </View>

            <View style={styles.modalInputWrapper}>
              <FileText size={18} color="#0A4D3C" style={styles.modalInputIcon} />
              <TextInput
                label="GST Number"
                mode="outlined"
                value={GST}
                onChangeText={setGST}
                placeholder="Enter GST number"
                style={styles.modalInput}
                theme={{ colors: { primary: '#0A4D3C' } }}
              />
            </View>

            <View style={styles.modalInputWrapper}>
              <MapPin size={18} color="#0A4D3C" style={styles.modalInputIcon} />
              <TextInput
                label="Address"
                mode="outlined"
                value={address}
                onChangeText={setAddress}
                placeholder="Enter address"
                multiline
                numberOfLines={3}
                style={styles.modalInput}
                theme={{ colors: { primary: '#0A4D3C' } }}
              />
            </View>

            <View style={styles.modalInputWrapper}>
              <Map size={18} color="#0A4D3C" style={styles.modalInputIcon} />
              <TextInput
                label="State"
                mode="outlined"
                value={state}
                onChangeText={setState}
                placeholder="Enter state"
                style={styles.modalInput}
                theme={{ colors: { primary: '#0A4D3C' } }}
              />
            </View>

            <TouchableOpacity onPress={handleConfirm} style={styles.modalSubmitButton}>
              <LinearGradient
                colors={['#0A4D3C', '#1B6B50']}
                style={styles.modalSubmitGradient}
              >
                <Check size={18} color="#FFFFFF" />
                <Text style={styles.modalSubmitText}>Submit</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </Animatable.View>
      </View>
    </Modal>
  )
};

const BillNumberModal = ({ visible, onClose, onSave }) => {
  const [billNo, setBillNo] = useState('');

  useEffect(() => {
    const loadBillNo = async () => {
      const storedBillNo = await AsyncStorage.getItem("billNo");
      if (storedBillNo) setBillNo(storedBillNo);
    };
    if (visible) loadBillNo();
  }, [visible]);

  const handleConfirm = async () => {
    if (onSave) {
      await onSave(billNo);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animatable.View animation="slideInUp" duration={400} style={styles.modalContentSmall}>
          <LinearGradient
            colors={['#0A4D3C', '#1B6B50']}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Bill Number</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.modalBody}>
            <Text style={styles.modalSubtitle}>Please update Bill Number</Text>

            <View style={styles.modalInputWrapper}>
              <File size={18} color="#0A4D3C" style={styles.modalInputIcon} />
              <TextInput
                mode="outlined"
                label="Bill No."
                value={billNo}
                onChangeText={setBillNo}
                placeholder="Enter bill number"
                style={styles.modalInput}
                theme={{ colors: { primary: '#0A4D3C' } }}
                right={
                  <TextInput.Icon
                    icon={() => <Check size={20} color="#0A4D3C" />}
                    onPress={handleConfirm}
                  />
                }
              />
            </View>
          </View>
        </Animatable.View>
      </View>
    </Modal>
  )
};

const BillDateModal = ({ visible, onClose, onSave }) => {
  const [billDate, setBillDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const loadBillDate = async () => {
      const storedDate = await AsyncStorage.getItem("billDate");
      if (storedDate) {
        const rrr = moment(storedDate, 'DD MMM YYYY').toDate()
        setBillDate(new Date(rrr));
      } else {
        setBillDate(new Date());
      }
    };

    if (visible) {
      loadBillDate();
    }
  }, [visible]);

  const formatDateForDisplay = (date) => {
    return moment(date).format('DD MMM YYYY');
  };

  const handleConfirm = async () => {
    if (onSave) {
      await onSave(billDate);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animatable.View animation="slideInUp" duration={400} style={styles.modalContentSmall}>
          <LinearGradient
            colors={['#0A4D3C', '#1B6B50']}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Bill Date</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.modalBody}>
            <Text style={styles.modalSubtitle}>Update Bill Date</Text>

            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={styles.datePickerButton}
            >
              <Calendar size={18} color="#0A4D3C" style={styles.datePickerIcon} />
              <Text style={styles.datePickerText}>
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

            <TouchableOpacity onPress={handleConfirm} style={styles.modalSubmitButton}>
              <LinearGradient
                colors={['#0A4D3C', '#1B6B50']}
                style={styles.modalSubmitGradient}
              >
                <Check size={18} color="#FFFFFF" />
                <Text style={styles.modalSubmitText}>Submit</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animatable.View>
      </View>
    </Modal>
  );
};

const NotesModal = ({ visible, onClose, onSave }) => {
  const [note, setNote] = useState('');

  const handleConfirm = async () => {
    if (onSave) {
      await onSave(note);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animatable.View animation="slideInUp" duration={400} style={styles.modalContentSmall}>
          <LinearGradient
            colors={['#0A4D3C', '#1B6B50']}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Add Note</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.modalBody}>
            <Text style={styles.modalSubtitle}>Please add Bill Note</Text>

            <View style={styles.modalInputWrapper}>
              <FileEdit size={18} color="#0A4D3C" style={styles.modalInputIcon} />
              <TextInput
                mode="outlined"
                label="Bill Note"
                value={note}
                onChangeText={setNote}
                placeholder="Enter note"
                multiline
                numberOfLines={4}
                style={[styles.modalInput, styles.notesInput]}
                theme={{ colors: { primary: '#0A4D3C' } }}
                right={
                  <TextInput.Icon
                    icon={() => <Check size={20} color="#0A4D3C" />}
                    onPress={handleConfirm}
                  />
                }
              />
            </View>
          </View>
        </Animatable.View>
      </View>
    </Modal>
  )
};

const BusinessDetailsModal = ({ visible, onClose, onSave }) => {
  const [storeName, setStoreName] = useState('');
  const [userID, setUserID] = useState('');
  const [GST, setGST] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');

  useEffect(() => {
    const getUserDetails = async () => {
      const userData = await AsyncStorage.getItem("userData");
      const parsedUserData = JSON.parse(userData);
      setUserID(parsedUserData.id);
      setStoreName(parsedUserData.name);
      setGST(parsedUserData.GST);
      setBusinessAddress(parsedUserData.address);
    }
    getUserDetails()
  }, [])

  const handleConfirm = async () => {
    const StoreData = {
      name: storeName,
      GST,
      address: businessAddress,
    };
    if (onSave) {
      onSave(StoreData);
    }
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
    } finally {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animatable.View animation="slideInUp" duration={400} style={styles.modalContent}>
          <LinearGradient
            colors={['#0A4D3C', '#1B6B50']}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Business Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalSubtitle}>Please fill out business details</Text>

            <View style={styles.modalInputWrapper}>
              <Store size={18} color="#0A4D3C" style={styles.modalInputIcon} />
              <TextInput
                label="Store Name"
                mode="outlined"
                value={storeName}
                onChangeText={setStoreName}
                placeholder="Enter store name"
                style={styles.modalInput}
                theme={{ colors: { primary: '#0A4D3C' } }}
              />
            </View>

            <View style={styles.modalInputWrapper}>
              <FileText size={18} color="#0A4D3C" style={styles.modalInputIcon} />
              <TextInput
                label="GST Number"
                mode="outlined"
                value={GST}
                onChangeText={setGST}
                placeholder="Enter GST number"
                style={styles.modalInput}
                theme={{ colors: { primary: '#0A4D3C' } }}
              />
            </View>

            <View style={styles.modalInputWrapper}>
              <Building2 size={18} color="#0A4D3C" style={styles.modalInputIcon} />
              <TextInput
                label="Business Address"
                mode="outlined"
                value={businessAddress}
                onChangeText={setBusinessAddress}
                placeholder="Enter business address"
                multiline
                numberOfLines={3}
                style={styles.modalInput}
                theme={{ colors: { primary: '#0A4D3C' } }}
              />
            </View>

            <TouchableOpacity onPress={handleConfirm} style={styles.modalSubmitButton}>
              <LinearGradient
                colors={['#0A4D3C', '#1B6B50']}
                style={styles.modalSubmitGradient}
              >
                <Check size={18} color="#FFFFFF" />
                <Text style={styles.modalSubmitText}>Submit</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </Animatable.View>
      </View>
    </Modal>
  )
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerRight: {
    width: 44,
  },
  headerBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    opacity: 0.5,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileHeader: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#0A4D3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  profileGradient: {
    padding: 20,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0A4D3C',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profilePhoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profilePhone: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  detailsCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A4D3C',
  },
  cardContent: {
    padding: 8,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileItemTextContainer: {
    flex: 1,
  },
  profileItemLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  profileItemValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  divider: {
    backgroundColor: '#E2E8F0',
    height: 1,
    marginHorizontal: 8,
  },
  bottomPadding: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalContentSmall: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  modalInputWrapper: {
    marginBottom: 16,
    position: 'relative',
  },
  modalInputIcon: {
    position: 'absolute',
    left: 12,
    top: 18,
    zIndex: 1,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    paddingLeft: 40,
  },
  notesInput: {
    minHeight: 100,
  },
  modalSubmitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  modalSubmitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  modalSubmitText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#F8FAFC',
    marginBottom: 20,
  },
  datePickerIcon: {
    marginRight: 10,
  },
  datePickerText: {
    fontSize: 15,
    color: '#1E293B',
    flex: 1,
  },
});

export default OtherDetails;