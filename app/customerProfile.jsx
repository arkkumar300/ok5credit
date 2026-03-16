// ProfileScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, SafeAreaView, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar} from 'react-native';
import { X, Pencil, UserRound, Share2, Store, Phone, FileText, Hash, Building2, MapPin, Mail, User, Delete, ChevronRight, ArrowLeft, Camera, Image as ImageIcon, Check, X as XIcon, Award, TrendingUp, Wallet} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Appbar, Avatar } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  primary: '#0A4D3C',
  primaryLight: '#1B6B50',
  primaryDark: '#064332',
  secondary: '#059669',
  accent: '#F59E0B',
  background: '#F8F9FA',
  white: '#FFFFFF',
  black: '#1E293B',
  gray: '#64748B',
  lightGray: '#94A3B8',
  lighterGray: '#F1F5F9',
  error: '#DC2626',
  success: '#059669',
  warning: '#F59E0B',
  border: '#F1F5F9',
  cardBg: '#FFFFFF',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Premium Header with Gradient */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color={COLORS.white} />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>{profile?.name || 'Profile'}</Text>
              <Text style={styles.headerSubtitle}>
                {profileType === 'customer' ? 'Customer Details' : 'Supplier Details'}
              </Text>
            </View>

            <View style={styles.headerRight} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Photo Section with Card */}
        <View style={styles.photoCard}>
          <View style={styles.avatarContainer}>
            <Avatar.Image
              source={{
                uri: imageUri || 'https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=400&h=400'
              }}
              size={100}
              style={styles.avatar}
            />
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={showImageOptions}
            >
              <Camera size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{profile?.name || 'No Name'}</Text>
          <View style={styles.profileTypeBadge}>
            <Text style={styles.profileTypeText}>
              {profileType === 'customer' ? 'Customer' : 'Supplier'}
            </Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(10,77,60,0.1)' }]}>
              <Wallet size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.statNumber}>{transactions?.length || 0}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(5,150,105,0.1)' }]}>
              <TrendingUp size={20} color={COLORS.secondary} />
            </View>
            <Text style={styles.statNumber}>
              ₹{Math.abs(profile?.total_amount || 0).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.statLabel}>Total Amount</Text>
          </View>
        </View>

        {/* Profile Information */}
        <View style={styles.infoCard}>
          <ProfileItem
            icon={User}
            label="Full Name"
            value={profile?.name || 'Not provided'}
            onPress={() => setActiveModal('name')}
          />

          <ProfileItem
            icon={User}
            label="Nick Name"
            value={profile?.nickName || 'Not provided'}
            onPress={() => setActiveModal('nickName')}
          />

          <ProfileItem
            icon={Phone}
            label="Phone Number"
            value={profile?.mobile || 'Not provided'}
            onPress={() => setActiveModal('mobile')}
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
            label="Email Address"
            value={profile?.email || 'Not provided'}
            onPress={() => setActiveModal('email')}
          />

          <TouchableOpacity
            style={[styles.item, styles.deleteItem]}
            onPress={handleDelete}
          >
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(220,38,38,0.1)' }]}>
              <Delete size={20} color={COLORS.error} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.label, { color: COLORS.error }]}>Delete Profile</Text>
              <Text style={styles.subtitle}>Remove this {profileType} permanently</Text>
            </View>
            <ChevronRight size={16} color={COLORS.gray} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals */}
      <EditModal
        visible={activeModal === 'name'}
        onClose={() => setActiveModal(null)}
        title="Edit Full Name"
        value={profile?.name}
        field="name"
        onSave={updateProfile}
        placeholder="Enter full name"
      />

      <EditModal
        visible={activeModal === 'nickName'}
        onClose={() => setActiveModal(null)}
        title="Edit Nick Name"
        value={profile?.nickName}
        field="nickName"
        onSave={updateProfile}
        placeholder="Enter nick name"
      />

      <EditModal
        visible={activeModal === 'mobile'}
        onClose={() => setActiveModal(null)}
        title="Edit Phone Number"
        value={profile?.mobile}
        field="mobile"
        onSave={updateProfile}
        placeholder="Enter phone number"
        keyboardType="phone-pad"
      />

      <EditModal
        visible={activeModal === 'address'}
        onClose={() => setActiveModal(null)}
        title="Edit Address"
        value={profile?.address}
        field="address"
        onSave={updateProfile}
        placeholder="Enter complete address"
        multiline
        numberOfLines={3}
      />

      <EditModal
        visible={activeModal === 'email'}
        onClose={() => setActiveModal(null)}
        title="Edit Email Address"
        value={profile?.email}
        field="email"
        onSave={updateProfile}
        placeholder="Enter email address"
        keyboardType="email-address"
      />
    </View>
  );
};

// Profile Item Component
const ProfileItem = ({ icon: Icon, label, value, onPress, multiline }) => (
  <TouchableOpacity
    style={styles.item}
    onPress={onPress}
    activeOpacity={0.7}
    disabled={!onPress}
  >
    <View style={styles.iconContainer}>
      <Icon size={18} color={COLORS.primary} />
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
    {onPress && <ChevronRight size={16} color={COLORS.gray} />}
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
              <XIcon size={20} color={COLORS.gray} />
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
            placeholderTextColor={COLORS.textMuted}
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
                  <Check size={16} color={COLORS.white} />
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
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 15,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
  },
  photoCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: COLORS.lighterGray,
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  profileTypeBadge: {
    backgroundColor: 'rgba(10,77,60,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  profileTypeText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(10,77,60,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  multilineValue: {
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
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
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    minHeight: 280,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  modalCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: 24,
    minHeight: 56,
    backgroundColor: COLORS.background,
  },
  modalTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 25,
    gap: 6,
  },
  cancelButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ProfileScreen;