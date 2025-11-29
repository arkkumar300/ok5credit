// ProfileScreen.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, SafeAreaView, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Mic, X, Pencil, Paperclip as PaperclipIcon, Camera, Share2, Store, Phone, FileText, Hash, Building2, MapPin, Mail, ArrowLeft, User } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Appbar, Avatar } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';
import { useFocusEffect } from '@react-navigation/native';

const updateUserData = async (payload) => {
  const userData = await AsyncStorage.getItem("userData");
  const userId = JSON.parse(userData).id;
  console.log("payload::",payload)
  const response = await ApiService.put(`/user/${userId}`, payload);
  if (response?.data) {
    console.log('updated successfully',response?.data)
  }
}

const ProfileScreen = () => {
  // State to handle modals
  const [activeModal, setActiveModal] = useState(null);
  const [images, setImages] = useState('');
  const [imageUri, setImageUri] = useState("");
  const [userData, setUserData] = useState(null);
  const [initialsLetter, setInitialsLetter] = useState("");

  const router = useRouter();

  const openModal = (key) => {
    setActiveModal(key);

    if (key === 'otp') {
      setTimer(60); // reset timer every time OTP modal opens
    }
  };
  const closeModal = () => setActiveModal(null);

  useEffect(() => {
    let interval;

    if (activeModal === 'otp') {
      interval = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeModal]);

  useFocusEffect(
    useCallback(() => {
      const fetchUser = async () => {
        const userData = await AsyncStorage.getItem("userData");
        const userId = JSON.parse(userData).id;
        const rrr = JSON.parse(userData);
        setUserData(rrr)
        const name = rrr?.name?.trim() || '';
        const initials = name
          .split(' ')
          .filter(Boolean)             // removes empty strings
          .map(word => word[0]?.toUpperCase())
          .join('');
        setInitialsLetter(initials)
        const response = await ApiService.get(`/user/${userId}`);
        setUserData(response.data)
        setImageUri(response?.data.photo)

      }
      fetchUser()
    }, [activeModal])
  )

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
      console.log('Upload success:', result);
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
        const localUri = result.assets[0].uri;

        // Optional: preview the local image first
        setImageUri(localUri);

        // Upload the image (assuming uploadImage returns a URL)
        const uploadedUrl = await uploadImage(localUri);

        // Save the uploaded image URL
        setImageUri(uploadedUrl);
        setImages([uploadedUrl]); // Store it as an array with one image

        const payload = { photo: uploadedUrl }
        updateUserData(payload)
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
        const localUri = result.assets[0].uri;

        // Optional: preview the local image first
        setImageUri(localUri);

        // Upload the image (assuming uploadImage returns a URL)
        const uploadedUrl = await uploadImage(localUri);

        // Save the uploaded image URL
        setImageUri(uploadedUrl);
        setImages([uploadedUrl]); // Store it as an array with one image

        const payload = { photo: uploadedUrl }
        updateUserData(payload)
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
  };


  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={{ backgroundColor: "#ffffff", borderBottomWidth: 2, borderColor: '#f2f7f6' }}>
        <ArrowLeft size={24} color={'#2E7D32'} style={{ marginStart: 10 }} onPress={() => router.back()} />
        <Appbar.Content title={userData?.name} titleStyle={{ color: '#333333', fontWeight: 'bold', marginLeft: 20, textTransform: 'capitalize' }} />
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
          <ProfileItem icon={Share2} label="Share your business card" onPress={() => openModal('businessCard')} />
          <ProfileItem icon={Store} label={userData?.businessName || "ARK STORES"} subtitle="Profile name will be visible to your customers" onPress={() => openModal('storeName')} />
          <ProfileItem icon={Phone} label={userData?.mobile || "9494130839"} isEditable />
          <ProfileItem icon={FileText} label={userData?.GST || "Enter your GST number"} onPress={() => openModal('gst')} />
          {/* <ProfileItem icon={Hash} label="Enter your Udyam number" onPress={() => openModal('udyam')} /> */}
          <ProfileItem icon={Building2} label={userData?.businessType || "Select your business type"} onPress={() => openModal('businessType')} />
          {/* <ProfileItem icon={Building2} label="Select your category" onPress={() => openModal('category')} /> */}
          <ProfileItem icon={User} label={userData?.name || "Enter your Name"} onPress={() => openModal('UserName')} />
          <ProfileItem icon={Mail} label={userData?.email || "Enter your Email"} onPress={() => openModal('Email')} />
          <ProfileItem icon={MapPin} label={userData?.address || "Enter your address"} onPress={() => openModal('address')} />
        </View>

        {/* Modals (You can customize each one separately below) */}
        <BusinessCardModal visible={activeModal === 'businessCard'} onClose={closeModal} userDetails={userData}/>
        <StoreNameModal visible={activeModal === 'storeName'} onClose={closeModal} businessName={userData?.businessName || ""} />
        {/* <ProfileModal visible={activeModal === 'phone'} onClose={closeModal} title="Phone Number" phone={userData?.mobile} /> */}
        <GSTModal visible={activeModal === 'gst'} onClose={closeModal} userGST={userData?.GST || ""} />
        {/* <ProfileModal visible={activeModal === 'udyam'} onClose={closeModal} title="Udyam Number" /> */}
        <BusinessTypeModal visible={activeModal === 'businessType'} onClose={closeModal} businessType={userData?.businessType || ""} />
        {/* <ProfileModal visible={activeModal === 'category'} onClose={closeModal} title="Category" /> */}
        <UseNameModal visible={activeModal === 'UserName'} onClose={closeModal} name={userData?.name || ""} />
        <OTPModal visible={activeModal === 'OTP'} onClose={closeModal}  />
        <UserEmailModal visible={activeModal === 'Email'} onClose={closeModal} email={userData?.email || ""} />
        <AddressModal visible={activeModal === 'address'} onClose={closeModal} userAddress={userData?.address || ""} />
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
    {isEditable && <Text style={styles.editSymbol}>✎</Text>}
  </TouchableOpacity>
);


const BusinessCardModal = ({ visible, onClose,userDetails }) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent
    onRequestClose={onClose}
  >
    <View style={styles.modalBackground}>
      <View style={styles.bottomSheet}>
        {/* Header */}
        <View style={styles.businessHeader}>
          <Text style={styles.businessTitle}>Business Card</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <Text style={styles.businessSubtitle}>Expand your business by sharing business card</Text>

        {/* Card Preview */}
        <View style={styles.cardPreview}>
          <Text style={[styles.cardNumber, { alignSelf: 'center' }]}>{userDetails?.mobile}</Text>
          <Text style={[styles.cardNumber, { alignSelf: 'center' }]}>{userDetails?.businessName}</Text>
          <View style={styles.aquaCreditBadge}>
            <Text style={styles.aquaCreditText}>Verified User</Text>
            <Text style={styles.aquaCreditBrand}>AquaCredit</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.whatsappButton}>
          <Text style={styles.whatsappButtonText}>📤 Share on Whatsapp</Text>
        </TouchableOpacity>
      </View>

      {/* WhatsApp Share Button */}
    </View>
  </Modal>
);

const StoreNameModal = ({ visible, onClose, businessName }) => {
  const [storeName, setStoreName] = useState();
  useEffect(()=>{
    setStoreName(businessName)
  },[businessName])
  const payload = { businessName: storeName };
  const handleConfirm = () => {
    updateUserData(payload)
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
          <Text style={styles.modalTitle}>Add Store Name</Text>
          <Text style={styles.subtitleText}>Please add your Store Name</Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={storeName}
              onChangeText={setStoreName}
              placeholder="Store Name"
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

const UseNameModal = ({ visible, onClose,name }) => {
  const [userName, setUserName] = useState('');
  useEffect(()=>{
    setUserName(name)
  },[name])

  const handleConfirm = () => {
    const payload = { name: userName }
    updateUserData(payload)
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

const OTPModal = ({ visible, onClose, onOpen }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef([]);
  const handleConfirm = () => {
    // Save the business name logic here (e.g., update state or API call)
    onClose();
  };
  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(digit => digit !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = (otpCode = otp.join('')) => {
    if (otpCode.length === 6) {
      // Simulate OTP verification
      onClose();
      onOpen('phone')
    }
  };

  const handleResendOTP = () => {
    setTimer(30);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
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

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[styles.otpInput, digit && styles.otpInputFilled]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="numeric"
                maxLength={1}
                autoFocus={index === 0}
              />
            ))}
          </View>
          <View style={styles.timerContainer}>
            {timer > 0 ? (
              <Text style={styles.timerText}>Resend OTP in {timer}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResendOTP}>
                <Text style={styles.resendText}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.verifyButton, otp.every(digit => digit !== '') ? styles.verifyButtonActive : styles.verifyButtonDisabled]}
            onPress={() => handleVerify()}
            disabled={!otp.every(digit => digit !== '')}
          >
            <Text style={styles.verifyButtonText}>Verify & Continue</Text>
          </TouchableOpacity>
        </View>
        {/* WhatsApp Share Button */}
      </View>
    </Modal>
  )
};

const UserEmailModal = ({ visible, onClose,email }) => {
  const [userEmail, setUserEmail] = useState('');
  useEffect(()=>{
    setUserEmail(email)
  },[email])

  const handleConfirm = () => {
    const payload = { email: userEmail }
    updateUserData(payload)
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

const AddressModal = ({ visible, onClose,userAddress }) => {
  const [address, setAddress] = useState('');
  useEffect(()=>{
    setAddress(userAddress)
  },[userAddress])

  const handleConfirm = () => {
    const payload = { address: address }
    updateUserData(payload)
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

const GSTModal = ({ visible, onClose,userGST }) => {
  const [GST, setGST] = useState('');
  const payload = { GST: GST }
  useEffect(()=>{
    setGST(userGST)
  },[userGST])

  const handleConfirm = () => {
    updateUserData(payload)
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
          <Text style={styles.modalTitle}>Add GST Number</Text>
          <Text style={styles.subtitleText}>Please add your GST Number</Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={GST}
              onChangeText={setGST}
              placeholder="GST Number"
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

const BusinessTypeModal = ({ visible, onClose, businessType }) => {
  const businessTypes = [
    'Retail Shop',
    'Wholesale/Distributor', 
    'Personal Use',
    'Online Services',
  ];

  const handleSelect = (type) => {
    const payload = { businessType: type }
    updateUserData(payload)
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
          <View style={{flexDirection:'row',justifyContent:'space-between'}}>

          <Text style={styles.modalTitle}>Select your business type</Text>
          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
              <Text style={styles.cancelIcon}>✕</Text>
            </TouchableOpacity>
          </View>
          {businessTypes.map((type, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionItem}
              onPress={() => handleSelect(type)}
            >
              <Text style={businessType !== type ? styles.optionText : styles.selectOptionText}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
};

const ProfileModal = ({ visible, onClose, title }) => {
  const [mobile, setMobile] = useState('');
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
    paddingVertical: 14, textTransform: 'capitalize',
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

  selectOptionText: {
    fontSize: 16,borderRadius:5,
    color: '#3A933A', padding: 8,
    backgroundColor: "#E6FFE6",
    fontWeight:'bold'
  },

  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    textTransform: 'capitalize'
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

export default ProfileScreen;
