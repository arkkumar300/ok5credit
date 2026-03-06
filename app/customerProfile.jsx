// ProfileScreen.js

import React, { useState, useEffect } from 'react';
import {View,Text,TextInput,SafeAreaView,StyleSheet,ScrollView,TouchableOpacity,Modal,Alert,ActivityIndicator,KeyboardAvoidingView,Platform} from 'react-native';
import {X,Pencil,UserRound,Share2,Store,Phone,FileText,Hash,Building2,MapPin,Mail,User,Delete,ChevronRight,ArrowLeft,Camera,Image as ImageIcon,Check,X as XIcon} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Appbar, Avatar } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';

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

const ProfileScreen = () => {
  // State management
  const [activeModal, setActiveModal] = useState(null);
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const router = useRouter();
  const { ID, profileType } = useLocalSearchParams();

  // Fetch profile data
  useEffect(() => {
    fetchProfile();
  }, [ID, profileType]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem("userData");
      const parsedUser = JSON.parse(userData);
      const userId = parsedUser.id;
      const ownerId = parsedUser.owner_user_id;
      
      const URL = profileType === 'customer' ? `/customers/${ID}` : `/supplier/${ID}`;

      const response = await ApiService.post(URL, { userId, ownerId });
      const data = response.data;
      
      if (profileType === 'customer') {
        setProfile(data?.customer);
      } else {
        setProfile(data?.supplier);
      }
      
      setTransactions(data?.transactions || []);
      setImageUri(data?.customer?.photo || data?.supplier?.photo);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load profile data');
      Alert.alert('Error', 'Could not load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (payload) => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem("userData");
      const parsedUser = JSON.parse(userData);
      const userId = parsedUser.id;
      const ownerId = parsedUser.owner_user_id;

      const updatedPayload = {
        ...payload,
        userId,
        ownerId
      };

      const URL = profileType === 'customer' ? `/customers/${ID}` : `/supplier/${ID}`;
      const response = await ApiService.put(URL, updatedPayload);
      
      if (response?.data) {
        const updatedData = profileType === 'customer' 
          ? response.data.customer 
          : response.data.supplier;
        
        setProfile(updatedData);
        if (payload.photo) setImageUri(payload.photo);
        
        Alert.alert('Success', 'Profile updated successfully!');
        return updatedData;
      }
    } catch (err) {
      console.error('Update error:', err);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async (type) => {
    try {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert('Permission Required', 'Camera and photo library permissions are required.');
        return;
      }

      let result;
      if (type === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0].uri) {
        const localUri = result.assets[0].uri;
        setImageUri(localUri);
        
        // Upload image
        const formData = new FormData();
        const fileName = localUri.split('/').pop();
        const fileType = fileName.split('.').pop();

        formData.append('file', {
          uri: localUri,
          name: fileName,
          type: `image/${fileType}`,
        });

        const uploadResponse = await ApiService.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const photoUrl = `https://aquaservices.esotericprojects.tech/uploads/${uploadResponse.data.file_info.filename}`;
        await updateProfile({ photo: photoUrl });
      }
    } catch (error) {
      console.error('Image pick error:', error);
      Alert.alert('Error', 'Failed to process image');
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Update Profile Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: () => handleImagePick('camera') },
        { text: 'Choose from Gallery', onPress: () => handleImagePick('gallery') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Profile',
      `Are you sure you want to delete this ${profileType}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await updateProfile({ status: 'Inactive' });
            router.back();
          }
        }
      ]
    );
  };

  if (loading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Appbar.Content 
          title={profile?.name || 'Profile'} 
          titleStyle={styles.headerTitle}
        />
        <View style={{ width: 40 }} />
      </Appbar.Header>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <View style={styles.avatarContainer}>
            <Avatar.Image
              source={{ 
                uri: imageUri || 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400&h=300' 
              }}
              size={100}
              style={styles.avatar}
            />
            <TouchableOpacity 
              style={styles.cameraButton} 
              onPress={showImageOptions}
            >
              <Camera size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{profile?.name || 'No Name'}</Text>
          <Text style={styles.profileType}>
            {profileType === 'customer' ? 'Customer' : 'Supplier'}
          </Text>
        </View>

        {/* Info Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{transactions?.length || 0}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {profile?.total_amount || '0'}
            </Text>
            <Text style={styles.statLabel}>Total Amount</Text>
          </View>
        </View>

        {/* Profile Information */}
        <View style={styles.infoCard}>
          <ProfileItem 
            icon={User} 
            label="Name" 
            value={profile?.name || 'Not provided'}
            onPress={() => setActiveModal('name')}
          />
          
          <ProfileItem 
            icon={Phone} 
            label="Phone Number" 
            value={profile?.mobile || 'Not provided'}
            // onPress={() => setActiveModal('phone')}
          />
          
          <ProfileItem 
            icon={MapPin} 
            label="Address" 
            value={profile?.address || 'Not provided'}
            onPress={() => setActiveModal('address')}
            multiline
          />
          
          <ProfileItem 
            icon={Mail} 
            label="Email" 
            value={profile?.email || 'Not provided'}
            onPress={() => setActiveModal('email')}
          />

          <TouchableOpacity 
            style={[styles.item, styles.deleteItem]} 
            onPress={handleDelete}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#FFEBEE' }]}>
              <Delete size={22} color={COLORS.error} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.label, { color: COLORS.error }]}>Delete Profile</Text>
              <Text style={styles.subtitle}>Remove this {profileType}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals */}
      <EditModal
        visible={activeModal === 'name'}
        onClose={() => setActiveModal(null)}
        title="Edit Name"
        value={profile?.name}
        field="name"
        onSave={updateProfile}
        placeholder="Enter name"
      />

      {/* <EditModal
        visible={activeModal === 'phone'}
        onClose={() => setActiveModal(null)}
        title="Edit Phone Number"
        value={profile?.mobile}
        field="mobile"
        onSave={updateProfile}
        placeholder="Enter phone number"
        keyboardType="phone-pad"
      /> */}

      <EditModal
        visible={activeModal === 'address'}
        onClose={() => setActiveModal(null)}
        title="Edit Address"
        value={profile?.address}
        field="address"
        onSave={updateProfile}
        placeholder="Enter address"
        multiline
        numberOfLines={3}
      />

      <EditModal
        visible={activeModal === 'email'}
        onClose={() => setActiveModal(null)}
        title="Edit Email"
        value={profile?.email}
        field="email"
        onSave={updateProfile}
        placeholder="Enter email"
        keyboardType="email-address"
      />
    </SafeAreaView>
  );
};

// Profile Item Component
const ProfileItem = ({ icon: Icon, label, value, onPress, multiline }) => (
  <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.iconContainer}>
      <Icon size={22} color={COLORS.primary} />
    </View>
    <View style={styles.textContainer}>
      <Text style={styles.label}>{label}</Text>
      <Text 
        style={[styles.value, multiline && styles.multilineValue]} 
        numberOfLines={multiline ? 3 : 1}
      >
        {value}
      </Text>
    </View>
   {label!=='Phone Number' && <ChevronRight size={20} color={COLORS.gray} />}
  </TouchableOpacity>
);

// Edit Modal Component
const EditModal = ({ 
  visible, 
  onClose, 
  title, 
  value, 
  field, 
  onSave, 
  placeholder,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const handleSave = async () => {
    if (!inputValue.trim()) {
      Alert.alert('Error', 'Please enter a value');
      return;
    }

    setLoading(true);
    await onSave({ [field]: inputValue.trim() });
    setLoading(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <XIcon size={24} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[
              styles.modalInput,
              multiline && styles.modalTextArea
            ]}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder={placeholder}
            placeholderTextColor={COLORS.gray}
            keyboardType={keyboardType}
            multiline={multiline}
            numberOfLines={numberOfLines}
            autoFocus
          />

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]} 
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Check size={20} color={COLORS.white} />
                  <Text style={styles.saveButtonText}>Save</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginLeft: 16,
    padding: 4,
  },
  headerTitle: {
    color: COLORS.black,
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    backgroundColor: COLORS.lightGray,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  profileType: {
    fontSize: 14,
    color: COLORS.primary,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  deleteItem: {
    borderBottomWidth: 0,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '500',
  },
  multilineValue: {
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.gray,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 250,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.black,
    marginBottom: 20,
    minHeight: 50,
  },
  modalTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    gap: 8,
  },
  cancelButtonText: {
    color: COLORS.gray,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;