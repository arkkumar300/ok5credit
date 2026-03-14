// ProfileScreen.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, SafeAreaView, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal, Dimensions, StatusBar } from 'react-native';
import { Mic, X, Pencil, Paperclip as PaperclipIcon, Camera, Share2, Store, Phone, FileText, Hash, Building2, MapPin, Mail, ArrowLeft, User, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Appbar, Avatar } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';
import { useFocusEffect } from '@react-navigation/native';
import ViewShot from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const COLORS = {
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  primaryDark: '#1B5E20',
  secondary: '#007B83',
  background: '#F5F7FA',
  white: '#FFFFFF',
  black: '#333333',
  gray: '#757575',
  lightGray: '#E0E0E0',
  error: '#D32F2F',
  success: '#388E3C',
  border: '#E8E8E8'
};

const updateUserData = async (payload) => {
  const userData = await AsyncStorage.getItem("userData");
  if (!userData) return null;

  const parsedUserData = JSON.parse(userData);
  const userId = parsedUserData.id;
  try {

    const response = await ApiService.put(`/user/${userId}`, payload);

    if (response?.data) {
      // merge old data + payload
      const updatedUserData = {
        ...parsedUserData,
        ...payload,
      };

      // save back to AsyncStorage
      await AsyncStorage.setItem(
        "userData",
        JSON.stringify(updatedUserData)
      );
      console.log('Updated successfully & AsyncStorage synced');
      return updatedUserData;

    }
  } catch (error) {
    console.log('error::', error);
  }
  return null;
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
        quality: 0.8
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
  const handleUserUpdate = async (payload) => {
    const updated = await updateUserData(payload);
    if (updated) {
      setUserData(updated); // ✅ LIVE UI UPDATE
    }
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4D3C" />

      {/* Premium Header - Solid Color */}
      <View style={styles.headerSolid}>
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ArrowLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Profile</Text>
              <Text style={styles.headerSubtitle}>{userData?.name || 'Your Account'}</Text>
            </View>

            <View style={styles.headerRight}>
              <View style={styles.headerBadge} />
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header with Avatar */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <Avatar.Image
              source={{
                uri: imageUri ? imageUri : 'https://img.freepik.com/premium-psd/professional-businessman-portrait_1296994-97379.jpg?w=1060' // Professional suit image
              }}
              size={100}
              style={styles.avatar}
            />
            <View style={styles.cameraButtonSolid}>
              <TouchableOpacity onPress={showImagePickerOptions}>
                <Camera size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userData?.name || 'Add Your Name'}</Text>
            <View style={styles.profileBadge}>
              <CheckCircle size={14} color="#0A4D3C" />
              <Text style={styles.profileBadgeText}>Verified User</Text>
            </View>
          </View>
        </View>

        {/* Business Info Card */}
        <View style={styles.premiumCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Business Information</Text>
            <Text style={styles.cardSubtitle}>Manage your profile details</Text>
          </View>

          <View style={styles.divider} />

          {/* Profile Items */}
          <ProfileItem
            icon={Share2}
            label="Share your business card"
            onPress={() => openModal('businessCard')}
            isPremium
          />

          <ProfileItem
            icon={Store}
            label={userData?.businessName || "Enter Business Name"}
            subtitle="Profile name will be visible to your customers"
            onPress={() => openModal('storeName')}
          />

          <ProfileItem
            icon={Phone}
            label={userData?.mobile || "Enter your Number"}
            isEditable={false}
          />

          <ProfileItem
            icon={FileText}
            label={userData?.GST || "Enter your GST Number"}
            onPress={() => openModal('gst')}
          />

          <ProfileItem
            icon={Building2}
            label={userData?.businessType || "Select Your Business Type"}
            onPress={() => openModal('businessType')}
          />

          <ProfileItem
            icon={User}
            label={userData?.name || "Enter your Name"}
            onPress={() => openModal('UserName')}
          />

          <ProfileItem
            icon={Mail}
            label={userData?.email || "Enter your Email"}
            onPress={() => openModal('Email')}
          />

          <ProfileItem
            icon={MapPin}
            label={userData?.address || "Enter your address"}
            onPress={() => openModal('address')}
          />
        </View>

        {/* Modals */}
        <BusinessCardModal
          visible={activeModal === 'businessCard'}
          onClose={closeModal}
          userDetails={userData}
        />

        <StoreNameModal
          visible={activeModal === 'storeName'}
          onClose={closeModal}
          businessName={userData?.businessName || ""}
          onUpdate={handleUserUpdate}
        />

        <GSTModal
          visible={activeModal === 'gst'}
          onClose={closeModal}
          userGST={userData?.GST || ""}
          onUpdate={handleUserUpdate}
        />

        <BusinessTypeModal
          visible={activeModal === 'businessType'}
          onClose={closeModal}
          businessType={userData?.businessType || ""}
          onUpdate={handleUserUpdate}
        />

        <UseNameModal
          visible={activeModal === 'UserName'}
          onClose={closeModal}
          name={userData?.name || ""}
          onUpdate={handleUserUpdate}
        />

        <UserEmailModal
          visible={activeModal === 'Email'}
          onClose={closeModal}
          email={userData?.email || ""}
          onUpdate={handleUserUpdate}
        />

        <AddressModal
          visible={activeModal === 'address'}
          onClose={closeModal}
          userAddress={userData?.address || ""}
          onUpdate={handleUserUpdate}
        />
      </ScrollView>
    </View>
  );
};

// Enhanced ProfileItem Component
const ProfileItem = ({ icon: Icon, label, subtitle, isEditable = true, onPress, isPremium }) => (
  <TouchableOpacity
    style={styles.item}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.iconContainer}>
      <View style={styles.iconSolid}>
        <Icon size={22} color="#0A4D3C" />
      </View>
    </View>

    <View style={styles.textContainer}>
      <Text style={[styles.label, !label.includes('Enter') && styles.labelFilled]}>
        {label}
      </Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
    {isEditable && (
      <ChevronRight size={20} color="#0A4D3C" />
    )}
  </TouchableOpacity>
);

const BusinessCardModal = ({ visible, onClose, userDetails }) => {
  const cardRef = useRef(null);

  const shareOnWhatsApp = async () => {
    try {
      const uri = await cardRef.current.capture();

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing not available');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share Business Card',
      });
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to share business card');
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
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Your Business Card</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <XCircle size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ViewShot
            ref={cardRef}
            options={{ format: 'png', quality: 1.0 }}
          >
            <View style={styles.premiumCardPreviewSolid}>
              <View style={styles.cardContent}>
                <View style={styles.cardLogoSolid}>
                  <Text style={styles.cardLogoText}>A</Text>
                </View>

                <Text style={styles.cardBusinessName}>
                  {userDetails?.businessName || 'Your Business Name'}
                </Text>

                <View style={styles.cardDetail}>
                  <Phone size={14} color="#FFFFFF" />
                  <Text style={styles.cardDetailText}>
                    {userDetails?.mobile || '+91 98765 43210'}
                  </Text>
                </View>

                <View style={styles.cardDetail}>
                  <MapPin size={14} color="#FFFFFF" />
                  <Text style={styles.cardDetailText}>
                    {userDetails?.address || 'Your Business Address'}
                  </Text>
                </View>

                <View style={styles.cardBadgeSolid}>
                  <CheckCircle size={12} color="#10B981" />
                  <Text style={styles.cardBadgeText}>Verified User</Text>
                </View>

                <Text style={styles.cardBrand}>AquaCredit</Text>
              </View>
            </View>
          </ViewShot>

          <TouchableOpacity
            style={styles.whatsappButtonSolid}
            onPress={shareOnWhatsApp}
            activeOpacity={0.8}
          >
            <Share2 size={20} color="#FFFFFF" />
            <Text style={styles.whatsappButtonText}>Share on WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Enhanced StoreNameModal - Solid Colors
const StoreNameModal = ({ visible, onClose, businessName, onUpdate }) => {
  const [storeName, setStoreName] = useState('');

  useEffect(() => {
    setStoreName(businessName);
  }, [businessName]);

  const payload = { businessName: storeName };

  const handleConfirm = async () => {
    await onUpdate(payload);
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
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Store Name</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <XCircle size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>Please enter your store name</Text>

          <View style={styles.inputContainer}>
            <Store size={20} color="#0A4D3C" style={styles.inputIcon} />
            <TextInput
              style={styles.modalInput}
              value={storeName}
              onChangeText={setStoreName}
              placeholder="Store Name"
              placeholderTextColor="#94A3B8"
              autoFocus
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButtonSolid]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Enhanced UseNameModal - Solid Colors
const UseNameModal = ({ visible, onClose, name, onUpdate }) => {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    setUserName(name);
  }, [name]);

  const payload = { name: userName };

  const handleConfirm = async () => {
    await onUpdate(payload);
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
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Your Name</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <XCircle size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>Please enter your full name</Text>

          <View style={styles.inputContainer}>
            <User size={20} color="#0A4D3C" style={styles.inputIcon} />
            <TextInput
              style={styles.modalInput}
              value={userName}
              onChangeText={setUserName}
              placeholder="Your Name"
              placeholderTextColor="#94A3B8"
              autoFocus
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButtonSolid]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Enhanced UserEmailModal - Solid Colors
const UserEmailModal = ({ visible, onClose, email, onUpdate }) => {
  const [userEmail, setUserEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    setUserEmail(email || '');
    setEmailError('');
  }, [email]);

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleConfirm = async () => {
    if (!validateEmail(userEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailError('');
    const payload = { email: userEmail };
    await onUpdate(payload);
    onClose();
  };

  const handleChange = (text) => {
    setUserEmail(text);

    if (validateEmail(text)) {
      setEmailError('');
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
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Email Address</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <XCircle size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>Please enter your email address</Text>

          <View style={[
            styles.inputContainer,
            emailError ? styles.inputError : null
          ]}>
            <Mail size={20} color="#0A4D3C" style={styles.inputIcon} />
            <TextInput
              style={styles.modalInput}
              value={userEmail}
              onChangeText={handleChange}
              placeholder="email@example.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />
          </View>

          {userEmail.length > 0 && (
            <View style={styles.validationContainer}>
              {validateEmail(userEmail) ? (
                <>
                  <CheckCircle size={14} color="#0A4D3C" />
                  <Text style={styles.validText}>Valid email address</Text>
                </>
              ) : (
                <>
                  <XCircle size={14} color="#EF4444" />
                  <Text style={styles.errorText}>Invalid email address</Text>
                </>
              )}
            </View>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButtonSolid]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Enhanced AddressModal - Solid Colors
const AddressModal = ({ visible, onClose, userAddress, onUpdate }) => {
  const [address, setAddress] = useState('');

  useEffect(() => {
    setAddress(userAddress);
  }, [userAddress]);

  const handleConfirm = async () => {
    const payload = { address: address };
    await onUpdate(payload);
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
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Address</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <XCircle size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>Please enter your business address</Text>

          <View style={styles.inputContainer}>
            <MapPin size={20} color="#0A4D3C" style={styles.inputIcon} />
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your full address"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              maxLength={200}
              autoFocus
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButtonSolid]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Enhanced GSTModal - Solid Colors
const GSTModal = ({ visible, onClose, userGST, onUpdate }) => {
  const [GST, setGST] = useState('');

  useEffect(() => {
    setGST(userGST);
  }, [userGST]);

  const payload = { GST: GST };

  const handleConfirm = async () => {
    await onUpdate(payload);
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
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add GST Number</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <XCircle size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>Please enter your GST number</Text>

          <View style={styles.inputContainer}>
            <FileText size={20} color="#0A4D3C" style={styles.inputIcon} />
            <TextInput
              style={styles.modalInput}
              value={GST}
              onChangeText={setGST}
              placeholder="22AAAAA0000A1Z5"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              autoFocus
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButtonSolid]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Enhanced BusinessTypeModal - Solid Colors
const BusinessTypeModal = ({ visible, onClose, businessType, onUpdate }) => {
  const businessTypes = [
    'Retail Shop',
    'Wholesale/Distributor',
    'Personal Use',
    'Online Services',
  ];

  const handleSelect = async (type) => {
    const payload = { businessType: type };
    await onUpdate(payload);
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
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Business Type</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <XCircle size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>Choose your business category</Text>

          <ScrollView style={styles.optionsList}>
            {businessTypes.map((type, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionItem,
                  businessType === type && styles.optionItemSelected
                ]}
                onPress={() => handleSelect(type)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.optionText,
                  businessType === type && styles.optionTextSelected
                ]}>
                  {type}
                </Text>
                {businessType === type && (
                  <CheckCircle size={18} color="#0A4D3C" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButtonFull]}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerSolid: {
    backgroundColor: '#0A4D3C',
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
    paddingVertical: 10,
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
    backgroundColor: '#10B981',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: -30,
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cameraButtonSolid: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0A4D3C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0A4D3C',
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  profileBadgeText: {
    fontSize: 12,
    color: '#0A4D3C',
    fontWeight: '600',
  },
  premiumCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.1)',
  },
  cardHeader: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A4D3C',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(16,185,129,0.1)',
    marginVertical: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16,185,129,0.1)',
  },
  iconContainer: {
    marginRight: 16,
  },
  iconSolid: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16,185,129,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#94A3B8',
  },
  labelFilled: {
    color: '#0A4D3C',
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0A4D3C',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  inputIcon: {
    marginRight: 12,
  },
  modalInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#0A4D3C',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  validationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginLeft: 4,
    gap: 8,
  },
  validText: {
    fontSize: 13,
    color: '#0A4D3C',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 16,
  },
  cancelButtonFull: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 16,
    marginTop: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  confirmButtonSolid: {
    backgroundColor: '#0A4D3C',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 16,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  optionsList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16,185,129,0.1)',
    borderRadius: 12,
  },
  optionItemSelected: {
    backgroundColor: 'rgba(16,185,129,0.05)',
  },
  optionText: {
    fontSize: 16,
    color: '#64748B',
  },
  optionTextSelected: {
    color: '#0A4D3C',
    fontWeight: '600',
  },
  premiumCardPreviewSolid: {
    backgroundColor: '#0A4D3C',
    borderRadius: 20,
    padding: 20,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardContent: {
    height: 200,
    justifyContent: 'space-between',
  },
  cardLogoSolid: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cardLogoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardBusinessName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  cardDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardDetailText: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  cardBadgeSolid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 4,
  },
  cardBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  cardBrand: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    opacity: 0.7,
    alignSelf: 'flex-end',
  },
  whatsappButtonSolid: {
    backgroundColor: '#0A4D3C',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    shadowColor: '#0A4D3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  whatsappButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ProfileScreen;
