import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Modal, FlatList, Image, Platform,StatusBar} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, User, Phone, Contact, CheckCircle, X } from 'lucide-react-native';
import { Appbar } from 'react-native-paper';
import * as Contacts from 'expo-contacts';
import ApiService from './components/ApiServices';
import AsyncStorage from '@react-native-async-storage/async-storage';
import cleanMobileNumber from './components/cleanMobileNumber';
import { ActivityIndicator } from 'react-native';

export default function AddSupplierScreen() {
  const [name, setName] = useState('');
  const [isExist, setIsExist] = useState(true);
  const [loading, setLoading] = useState(false);
  const [mobile, setMobile] = useState('');
  const [contacts, setContacts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const router = useRouter();

  const handleConfirm = async () => {
    setLoading(true)
    const userData = await AsyncStorage.getItem("userData");
    const userId = JSON.parse(userData).id;
    const ownerId = JSON.parse(userData).owner_user_id;
    if (name.trim() && mobile.trim()) {
      try {
        const response = await ApiService.post("/supplier", {
          ownerId: Number(ownerId),
          userId,
          name: name.trim(),
          mobile: mobile.trim(),
          created_user: Number(userId)
        }); 

        if (response.status === 200 || response.status === 201) {
          alert('Supplier added successfully');
          router.push('/dashboard');
        } else {
          alert('Something went wrong while adding the supplier.');
        }
      } catch (error) {
        console.error(error);
        alert('API request failed. Check your server.');
      } finally {
        setLoading(false)
      }
    }
  };
  const isValid = name.trim().length > 0;
  const isDisabled = !isValid || loading;

  const handleSearch = async () => {
    const userData = await AsyncStorage.getItem("userData");
    const userId = JSON.parse(userData).id;
    const ownerId = JSON.parse(userData).owner_user_id;
    if (mobile.trim()) {
      try {
        const response = await ApiService.post("/supplier/getSupplierByMobile/WithUserID", {
          ownerId: Number(ownerId),
          userId,
          mobile: mobile
        }, {
          headers: {
            "Content-Type": "application/json"
          }
        });
        if (response.data.data) {
          alert('Supplier Already Exists');
          setMobile('');
          setName('');
          setIsExist(true)
        } else {
          setIsExist(false)
        }

      } catch (error) {
        console.error(error);
        alert('API request failed. Check your server.');
      }
    }
  };

  const openContacts = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === 'granted') {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
      });

      if (data.length > 0) {
        setContacts(data.filter(c => c.phoneNumbers && c.phoneNumbers.length > 0));
        setModalVisible(true);
      }
    } else {
      alert('Permission to access contacts was denied');
    }
  };

  const handleContactSelect = (contact) => {
    const rawNumber = contact.phoneNumbers[0]?.number || "";
    const cleanedNumber = cleanMobileNumber(rawNumber);

    setName(contact.name);
    setMobile(cleanedNumber);
    setModalVisible(false);
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4D3C" />

      {/* Premium Header */}
      <View style={styles.headerSolid}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Add Supplier</Text>
            <Text style={styles.headerSubtitle}>New supplier information</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.headerBadge} />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {!isExist && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={[
              styles.inputWrapper,
              focusedInput === 'name' && styles.inputWrapperFocused
            ]}>
              <User size={20} color="#0A4D3C" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter supplier full name"
                placeholderTextColor="#94A3B8"
                autoFocus={true}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
              />
              {name.length > 0 && (
                <CheckCircle size={16} color="#0A4D3C" style={styles.inputCheck} />
              )}
            </View>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Mobile Number</Text>
          <View style={[
            styles.inputWrapper,
            focusedInput === 'mobile' && styles.inputWrapperFocused,
            mobile.length === 10 && styles.inputWrapperValid
          ]}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>+91</Text>
            </View>
            <View style={styles.inputDivider} />
            <Phone size={20} color="#0A4D3C" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={mobile}
              maxLength={10}
              onChangeText={(text) => setMobile(cleanMobileNumber(text))}
              placeholder="98765 43210"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              onFocus={() => setFocusedInput('mobile')}
              onBlur={() => setFocusedInput(null)}
            />
            {mobile.length === 10 && (
              <CheckCircle size={16} color="#0A4D3C" style={styles.inputCheck} />
            )}
          </View>
          {mobile.length > 0 && mobile.length < 10 && (
            <Text style={styles.hintText}>Enter 10-digit mobile number</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.contactsButton}
          onPress={openContacts}
          activeOpacity={0.7}
        >
          <View style={styles.contactsIcon}>
            <Contact size={20} color="#0A4D3C" />
          </View>
          <Text style={styles.contactsButtonText}>Choose from Contacts</Text>
        </TouchableOpacity>
      </View>

      {isExist ? (
        <TouchableOpacity
          style={[
            styles.confirmButton,
            mobile.trim() ? styles.confirmButtonActive : styles.confirmButtonDisabled,
          ]}
          onPress={handleSearch}
          disabled={!mobile.trim()}
          activeOpacity={0.8}
        >
          <Text style={styles.confirmButtonText}>Search Supplier</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.confirmButton,
            isDisabled ? styles.confirmButtonDisabled : styles.confirmButtonActive,
          ]}
          onPress={handleConfirm}
          disabled={isDisabled}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>Add Supplier</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Premium Modal for Contacts List */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Contact</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={contacts}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalList}
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
                      <View style={[styles.contactImage, styles.placeholderImage]}>
                        <Text style={styles.initialText}>
                          {item.name?.[0]?.toUpperCase() || '?'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.contactNumber}>
                        {item.phoneNumbers[0]?.number || 'No number'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerSolid: {
    backgroundColor: '#0A4D3C',
    paddingTop: Platform.OS === 'android' ? 20 : 0,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#0A4D3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
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
  content: {
    padding: 24,
    paddingTop: 30,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#0A4D3C',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  inputWrapperFocused: {
    borderColor: '#0A4D3C',
    shadowColor: '#0A4D3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputWrapperValid: {
    borderColor: '#0A4D3C',
  },
  inputIcon: {
    marginRight: 12,
  },
  inputCheck: {
    marginLeft: 8,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  countryCode: {
    paddingRight: 12,
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A4D3C',
  },
  inputDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },
  hintText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
    marginLeft: 4,
  },
  contactsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(10,77,60,0.05)',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  contactsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(10,77,60,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactsButtonText: {
    fontSize: 15,
    color: '#0A4D3C',
    fontWeight: '600',
  },
  confirmButton: {
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    shadowColor: '#0A4D3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonActive: {
    backgroundColor: '#0A4D3C',
  },
  confirmButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(10,77,60,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0A4D3C',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalList: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  contactItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(10,77,60,0.1)',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E2E8F0',
  },
  placeholderImage: {
    backgroundColor: '#0A4D3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 20,
  },
  contactInfo: {
    marginLeft: 16,
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A4D3C',
    marginBottom: 4,
  },
  contactNumber: {
    fontSize: 14,
    color: '#64748B',
  },
  modalCancelButton: {
    marginTop: 20,
    marginHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
});