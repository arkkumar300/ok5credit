import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  FlatList,
  Image,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  User,
  Phone,
  Contact,
  Check,
  X,
  Search,
  ChevronRight,
  UserPlus,
  Users
} from 'lucide-react-native';
import { ActivityIndicator } from 'react-native-paper';
import * as Contacts from 'expo-contacts';
import ApiService from './components/ApiServices';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

export default function AddBillCustomerScreen() {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const router = useRouter();
  const {
    customerId = '',
    customerName = '',
    customerMobile = '',
    billNo = '',
    billDate = ''
  } = useLocalSearchParams();

  useEffect(() => {
    setName(customerName);
    setMobile(customerMobile);
  }, [customerName, customerMobile]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(contact =>
        contact.name?.toLowerCase().includes(query.toLowerCase()) ||
        (contact.phoneNumbers?.[0]?.number &&
          contact.phoneNumbers[0].number.includes(query))
      );
      setFilteredContacts(filtered);
    }
  };

  const handleConfirm = async () => {
    if (!name.trim() || !mobile.trim()) {
      alert('Please fill all required fields');
      return;
    }

    setAddingCustomer(true);
    try {
      const userData = await AsyncStorage.getItem("userData");
      const parsedUserData = JSON.parse(userData);
      const userId = parsedUserData.id;
      const ownerId = parsedUserData.owner_user_id;

      const response = await ApiService.post("/customers", {
        ownerId: Number(ownerId),
        userId: Number(userId),
        name: name.trim(),
        mobile: mobile.trim(),
        created_user: Number(userId)
      });

      if (response.status === 200 || response.status === 201 || response.data?.success) {
        alert('Customer added successfully');
        const customerData = response?.data?.customer?.[0] || response?.data;

        await AsyncStorage.setItem("billCustomer", JSON.stringify(customerData));

        router.replace({
          pathname: '/otherDetails',
          params: {
            customerId: customerData?.id || '',
            customerName: customerData?.name || name,
            customerMobile: customerData?.mobile || mobile,
            billNo: billNo,
            billDate: billDate
          }
        });
      } else {
        alert('Something went wrong while adding the customer.');
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'API request failed. Check your server.');
    } finally {
      setAddingCustomer(false);
    }
  };

  const openContacts = async () => {
    setLoading(true);
    const { status } = await Contacts.requestPermissionsAsync();

    if (status === 'granted') {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
      });

      if (data.length > 0) {
        const validContacts = data.filter(c => c.phoneNumbers && c.phoneNumbers.length > 0);
        setContacts(validContacts);
        setFilteredContacts(validContacts);
        setModalVisible(true);
      }
    } else {
      alert('Permission to access contacts was denied');
    }
    setLoading(false);
  };

  const handleContactSelect = (contact) => {
    setName(contact.name);
    setMobile(contact.phoneNumbers[0]?.number || '');
    setModalVisible(false);
    setSearchQuery('');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
              onPress={() => router.back()}
            >
              <ArrowLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Add Customer</Text>
              <Text style={styles.headerSubtitle}>New customer for bill</Text>
            </View>

            <View style={styles.headerRight}>
              <View style={styles.headerBadge} />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form Card */}
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <UserPlus size={20} color="#0A4D3C" />
              <Text style={styles.formHeaderTitle}>Customer Information</Text>
            </View>

            <View style={styles.formContent}>
              {/* Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  Full Name <Text style={styles.required}>*</Text>
                </Text>
                <View style={[
                  styles.inputWrapper,
                  focusedInput === 'name' && styles.inputWrapperFocused
                ]}>
                  <User size={18} color="#0A4D3C" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter customer full name"
                    placeholderTextColor="#94A3B8"
                    autoFocus={true}
                    onFocus={() => setFocusedInput('name')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>

              {/* Mobile Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  Mobile Number <Text style={styles.required}>*</Text>
                </Text>
                <View style={[
                  styles.inputWrapper,
                  focusedInput === 'mobile' && styles.inputWrapperFocused
                ]}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <View style={styles.inputDivider} />
                  <Phone size={18} color="#0A4D3C" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={mobile}
                    onChangeText={setMobile}
                    placeholder="98765 43210"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    maxLength={10}
                    onFocus={() => setFocusedInput('mobile')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
                {mobile.length > 0 && mobile.length < 10 && (
                  <Text style={styles.hintText}>Enter 10-digit mobile number</Text>
                )}
              </View>

              {/* Contacts Button */}
              <TouchableOpacity
                style={styles.contactsButton}
                onPress={openContacts}
                activeOpacity={0.7}
              >
                <View style={styles.contactsContent}>
                  <View style={styles.contactsIcon}>
                    <Contact size={20} color="#0A4D3C" />
                  </View>
                  <Text style={styles.contactsButtonText}>Choose from Contacts</Text>
                  <ChevronRight size={16} color="#0A4D3C" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Confirm Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (name.trim() && mobile.trim() && !addingCustomer)
              ? styles.confirmButtonActive
              : styles.confirmButtonDisabled
          ]}
          onPress={handleConfirm}
          disabled={!name.trim() || !mobile.trim() || addingCustomer}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#0A4D3C', '#1B6B50']}
            style={styles.confirmButtonGradient}
          >
            {addingCustomer ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <UserPlus size={18} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>Add Customer</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Contacts Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSearchQuery('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['#0A4D3C', '#1B6B50']}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>Select Contact</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setSearchQuery('');
                }}
                style={styles.modalCloseButton}
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>

            {/* Search Bar */}
            <View style={styles.modalSearchContainer}>
              <Search size={18} color="#64748B" style={styles.modalSearchIcon} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search contacts..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>

            {loading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#0A4D3C" />
                <Text style={styles.modalLoadingText}>Loading contacts...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredContacts}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalList}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <View style={styles.modalEmpty}>
                    <Users size={40} color="#E2E8F0" />
                    <Text style={styles.modalEmptyText}>No contacts found</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.contactItem}
                    onPress={() => handleContactSelect(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.contactRow}>
                      {item.imageAvailable && item.image?.uri ? (
                        <Image source={{ uri: item.image.uri }} style={styles.contactImage} />
                      ) : (
                        <LinearGradient
                          colors={['#0A4D3C', '#1B6B50']}
                          style={[styles.contactImage, styles.placeholderImage]}
                        >
                          <Text style={styles.initialText}>
                            {getInitials(item.name)}
                          </Text>
                        </LinearGradient>
                      )}
                      <View style={styles.contactInfo}>
                        <Text style={styles.contactName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <View style={styles.contactPhoneContainer}>
                          <Phone size={10} color="#64748B" />
                          <Text style={styles.contactNumber}>
                            {item.phoneNumbers[0]?.number || 'No number'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? 20 : 0,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: '#0A4D3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  formHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A4D3C',
  },
  formContent: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
    marginLeft: 4,
  },
  required: {
    color: '#DC2626',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    minHeight: 52,
  },
  inputWrapperFocused: {
    borderColor: '#0A4D3C',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 15,
    color: '#1E293B',
    padding: 0,
  },
  countryCode: {
    paddingRight: 10,
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0A4D3C',
  },
  inputDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
    marginRight: 10,
  },
  hintText: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 4,
    marginLeft: 4,
  },
  contactsButton: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0A4D3C',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  contactsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  contactsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactsButtonText: {
    flex: 1,
    fontSize: 15,
    color: '#0A4D3C',
    fontWeight: '600',
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  confirmButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#0A4D3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  confirmButtonActive: {
    opacity: 1,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
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
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalSearchIcon: {
    marginRight: 8,
  },
  modalSearchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: '#1E293B',
  },
  modalLoading: {
    padding: 40,
    alignItems: 'center',
  },
  modalLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  modalList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  modalEmpty: {
    padding: 40,
    alignItems: 'center',
  },
  modalEmptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  contactItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 18,
  },
  contactInfo: {
    marginLeft: 12,
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0A4D3C',
    marginBottom: 4,
  },
  contactPhoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactNumber: {
    fontSize: 12,
    color: '#64748B',
  },
});