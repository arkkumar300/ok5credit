// ProfileScreen.js

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput,SafeAreaView, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { X, Pencil, UserRound, Share2, Store, Phone, FileText, Hash, Building2, MapPin, Mail, User, Delete, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Appbar, Avatar } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';


const updateData = async (payload, ID,profileType) => {
  const userData = await AsyncStorage.getItem("userData");
  const userId = JSON.parse(userData).id;
  payload = {
    ...payload,
    userId
  };
  const URL = profileType === 'customer' ? `/customers/${ID}` : `/supplier/${ID}`

  const response = await ApiService.put(URL, payload);
  if (response?.data) {
    if (profileType === 'customer') {
      console.log("response::",response.data.customer)
      return response.data.customer
    } else {
      console.log("response::",response.data.supplier)
      return response.data.supplier
    }
  }
}

const OtherProfile = () => {
  // State to handle modals
  const [activeModal, setActiveModal] = useState(null);
  const [images, setImages] = useState([]);
  const [userData, setUserData] = useState(null);
  const [imageUri, setImageUri] = useState("");
  const router = useRouter();
  const { ID, profileType } = useLocalSearchParams();
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      const userData = await AsyncStorage.getItem("userData");
      const userId = JSON.parse(userData).id;

      const URL = profileType === 'customer' ? `/customers/${ID}` : `/supplier/${ID}`

      try {
        const response = await ApiService.post(URL, { userId });
        const data = response.data;
        if (profileType === 'customer') {
          setProfile(data?.customer);
        } else if(profileType === 'supplier') {
          setProfile(data?.supplier);
        }
        setTransactions(data?.transactions?.length);
        setImageUri(profile?.photo)
      } catch (err) {
        console.error(err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const openModal = (key) => {
    setActiveModal(key);
  };
  const closeModal = () => setActiveModal(null);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert('Permission Required', 'Camera and photo library permissions are required to add images.');
      return false;
    }
    return true;
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Add Images',
      'Choose an option',
      [
        { text: 'Camera', onPress: openCamera },
        { text: 'Gallery', onPress: openGallery },
        { text: 'Cancel', style: 'cancel' }
      ],
      { cancelable: true }
    );
  };

  const uploadImage = async (uri) => {
    try {
      const formData = new FormData();

      const fileName = uri.split('/').pop();
      const fileType = fileName.split('.').pop();

      formData.append('file', {
        uri,
        name: fileName,
        type: `image/${fileType}`,
      });
      const response = await ApiService.post(`/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = response.data;

      const rrr = `https://aquaservices.esotericprojects.tech/uploads/${result.file_info.filename}`;
      return rrr;
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Upload Failed', 'Could not upload image');
    }
  };

  const openCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        cameraType: ImagePicker.CameraType.back, // ✅ Choose back camera
      });

      if (
        result &&
        !result.canceled &&
        Array.isArray(result.assets) &&
        result.assets.length > 0 &&
        result.assets[0].uri
      ) {
        const imageUri = result.assets[0].uri;
        setImageUri(imageUri);
        setImages(prev => [...prev, imageUri]);
        const photo = await uploadImage(imageUri);
        const payload = { photo: photo }
        updateData(payload, ID,profileType)
      } else {
        console.log('Camera cancelled or no image selected');
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const openGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        const imageUri = result.assets.map(asset => asset.uri);
        setImageUri(imageUri);
        setImages(prevImages => [...prevImages, ...imageUri]);
        const photo = await uploadImage(imageUri);
        const payload = { photo: photo }
        updateData(payload, ID,profileType)
      } else {
        console.log('Camera cancelled or no image selected');
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const handleUserUpdate = async (payload) => {
    const updated = await updateData(payload,ID,profileType);
    if (updated) {
      setProfile(updated); // ✅ LIVE UI UPDATE
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={{ backgroundColor: "#ffffff", borderBottomWidth: 2, borderColor: '#f2f7f6' }}>
        <ArrowLeft size={24} color={'#2E7D32'} style={{ marginStart: 10 }} onPress={() => router.back()} />
        <Appbar.Content title={profile?.name} titleStyle={{ color: '#333333', fontWeight: 'bold', marginLeft: 20 }} />
      </Appbar.Header>


      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Avatar.Image
            source={{ uri: imageUri ? imageUri : 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400&h=300' }}
            size={80} color="#ccc" />
          <TouchableOpacity style={styles.editIcon} onPress={showImagePickerOptions}>
            <Text style={styles.editText}>✎</Text>
          </TouchableOpacity>
        </View>

        {/* Business Info List */}
        <View style={styles.card}>
          <ProfileItem icon={User} label={profile?.name || "Enter your Name"} onPress={() => openModal('UserName')} />
          <ProfileItem icon={Phone} label={profile?.mobile || "Enter Mobile Number"}  />
          <ProfileItem icon={MapPin} label={profile?.address || "Enter your address"} onPress={() => openModal('address')} />
          <ProfileItem icon={Mail} label={profile?.email || "Enter your Email"} onPress={() => openModal('Email')} />
          <TouchableOpacity style={styles.item} onPress={() => openModal('DeleteCustomer')}>
            <View style={styles.iconContainer}>
              <Delete size={24} color="red" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.label}>Delete</Text>
              <Text style={styles.subtitle}>delete this profile</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Modals (You can customize each one separately below) */}
        <UseNameModal visible={activeModal === 'UserName'} onClose={closeModal} ID={ID} profileType={profileType} value={profile?.name}  onUpdate={handleUserUpdate} />
        <DeleteCustomerModal visible={activeModal === 'DeleteCustomer'} onClose={closeModal} ID={ID} profileType={profileType} />
        <ProfileModal visible={activeModal === 'phone'} onClose={closeModal} title="Phone Number" profileType={profileType} value={profile?.mobile}  onUpdate={handleUserUpdate}/>
        <AddressModal visible={activeModal === 'address'} onClose={closeModal} ID={ID} profileType={profileType} value={profile?.address}  onUpdate={handleUserUpdate} />
        <UserEmailModal visible={activeModal === 'Email'} onClose={closeModal} ID={ID} profileType={profileType} value={profile?.email}  onUpdate={handleUserUpdate}/>
      </ScrollView>
    </SafeAreaView>
  ); 
};

const ProfileItem = ({ icon: Icon, label, subtitle, isEditable, onPress }) => (
  <TouchableOpacity style={styles.item} onPress={onPress}>
    <View style={styles.iconContainer}>
      <Icon size={24} color="#007B83" />
    </View>
    <View style={styles.textContainer}>
      <Text style={styles.label}>{label}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
    <ChevronRight size={24} color="#007B83" />
  </TouchableOpacity>
);

const UseNameModal = ({ visible, onClose, ID,profileType,value,onUpdate }) => {
  const [userName, setUserName] = useState(value || '');
  useEffect(() => {
    setUserName(value || '');
  }, [value]);

    const payload = { name: userName };
  const handleConfirm = () => {
    onUpdate(payload)
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
          <Text style={styles.modalTitle}>Add Name</Text>
          <Text style={styles.subtitleText}>Please add your Name</Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={userName}
              onChangeText={setUserName}
              placeholder="Name"
            />
            <TouchableOpacity onPress={onClose} style={styles.iconButton}>
              <Text style={styles.cancelIcon}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.iconButton}>
              <Text style={styles.confirmIcon}>✔</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* WhatsApp Share Button */}
      </View>
    </Modal>
  )
};

const DeleteCustomerModal = ({ visible, onClose, ID,profileType }) => {

    const payload = { status: 'Inactive' };
  const handleConfirm = () => {
    updateData(payload, ID,profileType)
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
          <Text style={styles.modalTitle}>Delete Customer</Text>
          <Text style={styles.subtitleText}>Are you sure you want to delete customer</Text>

          <View style={{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  }}>
            <TouchableOpacity onPress={onClose} style={styles.iconButton}>
              <Text style={styles.cancelIcon}>✕ Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.iconButton}>
              <Text style={styles.confirmIcon}>✔ Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* WhatsApp Share Button */}
      </View>
    </Modal>
  )
};

const UserEmailModal = ({ visible, onClose, ID,profileType,value,onUpdate }) => {
  const [userEmail, setUserEmail] = useState(value);
  useEffect(() => {
    setUserEmail(value || '');
  }, [value]);
  const payload = { email: userEmail };
  const handleConfirm = () => {
    onUpdate(payload)
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
          <Text style={styles.modalTitle}>Add User Email</Text>
          <Text style={styles.subtitleText}>Please add your Email</Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={userEmail}
              onChangeText={setUserEmail}
              placeholder="Email"
            />
            <TouchableOpacity onPress={onClose} style={styles.iconButton}>
              <Text style={styles.cancelIcon}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.iconButton}>
              <Text style={styles.confirmIcon}>✔</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* WhatsApp Share Button */}
      </View>
    </Modal>
  )
};

const AddressModal = ({ visible, onClose, ID,profileType,value,onUpdate }) => {
  const [address, setAddress] = useState(value);
  useEffect(() => {
    setAddress(value || '');
  }, [value]);
  const payload = { address: address };
  const handleConfirm = () => {
    onUpdate(payload)
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
          <Text style={styles.modalTitle}>Add Store Address</Text>
          <Text style={styles.subtitleText}>Please add your Store Address</Text>

          <View style={styles.inputRow}>
            <TextInput
              style={[styles.textInput, { height: 100, }]}
              value={address} maxLength={200} multiline={true}
              onChangeText={setAddress}
              placeholder="Business Name"
            />
            <TouchableOpacity onPress={onClose} style={styles.iconButton}>
              <Text style={styles.cancelIcon}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.iconButton}>
              <Text style={styles.confirmIcon}>✔</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* WhatsApp Share Button */}
      </View>
    </Modal>
  )
};

const ProfileModal = ({ visible, onClose, title, ID,profileType,value,onUpdate }) => {
  const [mobile, setMobile] = useState(value);
  useEffect(() => {
    setMobile(value || '');
  }, [value]);
  const payload = { mobile: mobile };
  const handleConfirm = () => {
    onUpdate(payload)
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
          <Text style={styles.modalTitle}>Update Phone Number</Text>
          <Text style={styles.subtitleText}>Please change phone number</Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={mobile}
              onChangeText={setMobile}
              placeholder="Phone Number"
            />
            <TouchableOpacity onPress={onClose} style={styles.iconButton}>
              <Text style={styles.cancelIcon}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.iconButton}>
              <Text style={styles.confirmIcon}>✔</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* WhatsApp Share Button */}
      </View>
    </Modal>
  )
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
    top: -20, zIndex: 99,
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  editText: {
    fontSize: 12,
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
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  otpInputFilled: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timerText: {
    fontSize: 14,
    color: '#666',
  },
  whatsappButton: {
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

  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
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

export default OtherProfile;
