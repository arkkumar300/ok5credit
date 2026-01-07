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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, User, Phone, Contact } from 'lucide-react-native';
import { Appbar } from 'react-native-paper';
import * as Contacts from 'expo-contacts';
import ApiService from './components/ApiServices';
import AsyncStorage from '@react-native-async-storage/async-storage';
import cleanMobileNumber from './components/cleanMobileNumber';

export default function AddSupplierScreen() {
  const [name, setName] = useState('');
  const [isExist, setIsExist] = useState(true);
  const [mobile, setMobile] = useState('');
  const [contacts, setContacts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();
  
  const handleConfirm = async () => {
    const userData = await AsyncStorage.getItem("userData");
    const userId = JSON.parse(userData).id;
    console.log("rrr ::", userId)
    if (name.trim() && mobile.trim()) {
      try {
        const response = await ApiService.post("/supplier", {
          userId: Number(userId),
          name: name.trim(),
          mobile: mobile.trim()
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
      }
    }
  };

  const handleSearch = async () => {
    const userData = await AsyncStorage.getItem("userData");
    const userId = JSON.parse(userData).id;
    if (mobile.trim()) {
      try {
        const response = await ApiService.post("/supplier/getSupplierByMobile/WithUserID", {
          userId: Number(userId),
          mobile: mobile
        },{
          headers:{
            "Content-Type":"application/json"
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
console.log("rrr:::",status)
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
      <Appbar.Header style={{ elevation: 5 }}>
        <ArrowLeft size={24} color={'#2E7D32'} style={{ marginStart: 10 }} onPress={() => router.back()} />
        <Appbar.Content title="Add Supplier" titleStyle={{ textAlign: 'center', color: '#333333', fontWeight: 'bold' }} />
      </Appbar.Header>

      <View style={styles.content}>
        {!isExist && <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Name</Text>
          <View style={styles.inputWrapper}>
            <User size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter supplier name"
              placeholderTextColor={"#aaaaaa"}
              autoFocus={true}
            />
          </View>
        </View>
        }
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Mobile Number</Text>
          <View style={styles.inputWrapper}>
            <Phone size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={mobile}
              maxLength={10}
              onChangeText={(text) => setMobile(cleanMobileNumber(text))}
              placeholder="Enter mobile number"
              placeholderTextColor={"#aaaaaa"}
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.contactsButton} onPress={openContacts}>
          <Contact size={20} color="#2E7D32" />
          <Text style={styles.contactsButtonText}>Choose from Contacts</Text>
        </TouchableOpacity>
      </View>

      {isExist &&
        <TouchableOpacity
          style={[
            styles.confirmButton,
            mobile.trim() ? styles.confirmButtonActive : styles.confirmButtonDisabled,
          ]}
          onPress={handleSearch}
          disabled={!mobile.trim()}
        >
          <Text style={styles.confirmButtonText}>search</Text>
        </TouchableOpacity>
      }

      {!isExist &&
        <TouchableOpacity
          style={[
            styles.confirmButton,
            name.trim() ? styles.confirmButtonActive : styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={!name.trim()}
        >
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </TouchableOpacity>}

      {/* Modal for Contacts List */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select a Contact</Text>
            <FlatList
              data={contacts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.contactItem} onPress={() => handleContactSelect(item)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {item.imageAvailable && item.image?.uri ? (
                      <Image source={{ uri: item.image.uri }} style={styles.contactImage} />
                    ) : (
                      <View style={[styles.contactImage, styles.placeholderImage]}>
                        <Text style={styles.initialText}>
                          {item.name?.[0]?.toUpperCase() || '?'}
                        </Text>
                      </View>
                    )}
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.contactName}>{item.name}</Text>
                      <Text style={styles.contactNumber}>
                        {item.phoneNumbers[0]?.number || 'No number'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
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
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  contactImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
  },
  initialText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 40, // should match the height of the image
  },
  placeholderImage: {
    backgroundColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    marginBottom: 5,
    fontWeight: 'bold',
    color: '#333',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 40,
    color:'#333333'
  },
  confirmButton: {
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  confirmButtonActive: {
    backgroundColor: '#2E7D32',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  contactsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  contactsButtonText: {
    marginLeft: 8,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  contactItem: {
    paddingVertical: 10,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  contactName: {
    fontWeight: '600',
  },
  contactNumber: {
    color: '#666',
    fontSize: 12,
  },
  modalCloseButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
});
