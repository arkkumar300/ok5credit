import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Image, ScrollView, TouchableOpacity,
  Alert, Modal, TextInput, StatusBar, Platform
} from 'react-native';
import { Linking } from 'react-native';
import { Calendar, MessageCircle, Share2, Check, FileText, HelpCircle, ArrowLeft, Plus, Edit, Delete, Clock, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Appbar, Avatar } from 'react-native-paper';
import moment from 'moment';
import ApiService from './components/ApiServices';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function TransactionDetails() {
  const navigation = useNavigation();
  const { transactionDetails, mobile, Name } = useLocalSearchParams();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transaction, setTransaction] = useState(null);
  const [transactionType, setTransactionType] = useState(null);
  const [images, setImages] = useState([]);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const router = useRouter();
  const customerMobile = mobile; // <-- confirm key
  const amount = Number(transaction?.amount || 0).toFixed(2);

  const messageText = `Hi ${Name}, your transaction amount is ₹${amount}. Thank you.`;

  const handleSmsShare = async () => {
    if (!customerMobile) {
      Alert.alert("Error", "Customer mobile number not available");
      return;
    }
    console.log("SMS:::", customerMobile);
    console.log("messageText:::", messageText);
    const smsUrl = `sms:${customerMobile}?body=${encodeURIComponent(messageText)}`;

    const supported = await Linking.canOpenURL(smsUrl);
    if (supported) {
      Linking.openURL(smsUrl);
    } else {
      Alert.alert("Error", "SMS not supported on this device");
    }
  };

  const handleWhatsAppShare = async () => {
    if (!customerMobile) {
      Alert.alert("Error", "Customer mobile number not available");
      return;
    }

    const whatsappUrl = `https://wa.me/${customerMobile}?text=${encodeURIComponent(messageText)}`;

    const supported = await Linking.canOpenURL(whatsappUrl);
    if (supported) {
      Linking.openURL(whatsappUrl);
    } else {
      Alert.alert("Error", "WhatsApp not installed");
    }
  };


  const formateDate = (date) =>
    date ? moment(date).format("DD MMM YYYY") : "";

  const handleDeleteTransaction = async () => {
    try {
      const url = `/transactions/delete/${transaction.id}`;
      const idPayload =
        transaction.transaction_for === "customer"
          ? { customer_id: transaction.customer_id }
          : { supplier_id: transaction.supplier_id };

      const payload = {
        ...idPayload,
        userId: transaction.business_owner_id,
        transaction_type: transactionType,
        transaction_for: transaction.transaction_for,
        amount: Number(newAmount),
      };

      const response = await ApiService.put(url, payload, {
        headers: { "Content-Type": "application/json" },
      });
      if (response.data) {
        Alert.alert("Deleted", "Transaction deleted successfully");
        setShowDeleteModal(false);

        // go back to previous screen
        navigation.goBack();
      } else {
        Alert.alert("Delete Failed", response.data?.message || "Unknown error");
      }
    } catch (error) {
      console.log("Delete Error:", error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  useEffect(() => {
    if (!transactionDetails) return;

    const tx = JSON.parse(transactionDetails);
    setTransaction(tx);
    setTransactionType(tx?.transaction_type);

    let parsedImages = [];

    if (Array.isArray(tx?.transaction_pic)) {
      const firstItem = tx.transaction_pic[0];

      if (typeof firstItem === 'string' && firstItem.startsWith('[')) {
        try {
          parsedImages = JSON.parse(firstItem);
        } catch (e) {
          console.error("Invalid transaction_pic JSON", e);
        }
      } else {
        parsedImages = tx.transaction_pic;
      }
    }

    setImages(parsedImages);
  }, [transactionDetails]);


  const uploadImage = async (uri) => {
    try {
      const formData = new FormData();

      formData.append("file", {
        uri,
        name: `image-${Date.now()}.jpg`,
        type: "image/jpeg",
      });

      const response = await ApiService.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        }
      });

      if (!response) {
        throw new Error(response?.message || "Upload failed");
      }
      return response.data.file_info.filename; // or filename if backend gives URL
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Upload failed", "Unable to upload image");
      return null;
    }
  };

  // ---------------------- Image API ----------------------

  const openImageOptions = () => {
    Alert.alert(
      "Add Image",
      "Choose an option",
      [
        { text: "Camera", onPress: openCamera },
        { text: "Gallery", onPress: openGallery },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Camera access is needed");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });

    if (!result.canceled) {
      const uploadedFile = await uploadImage(result.assets[0].uri);
      if (!uploadedFile) return;
      const imageUrl = `https://aquaservices.esotericprojects.tech/uploads/${uploadedFile}`;

      const updatedImages = [...images, imageUrl];

      // update UI immediately
      setImages(updatedImages);

      // update backend with correct data
      await handleUpdateTransactionPics(updatedImages);
    }
  };

  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Gallery access is needed");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      const uploadedUrls = [];

      for (const asset of result.assets) {
        const uploadedFile = await uploadImage(asset.uri);
        if (uploadedFile) {
          const imageUrl = `https://aquaservices.esotericprojects.tech/uploads/${uploadedFile}`;
          uploadedUrls.push(imageUrl);
        }
      }

      if (uploadedUrls.length === 0) return;

      const updatedImages = [...images, ...uploadedUrls];

      // Update UI
      setImages(updatedImages);

      // Sync with backend
      await handleUpdateTransactionPics(updatedImages);
    }
  };

  // ---------------------- HANDLE EDIT API ----------------------
  const handleUpdateTransaction = async () => {
    if (!newAmount || isNaN(Number(newAmount))) {
      Alert.alert("Invalid Amount", "Please enter a valid number.");
      return;
    }

    try {
      const url = transaction.transaction_for === "customer" ? `/transactions/customer/${transaction.id}` : `/transactions/supplier/${transaction.id}`;

      // If transaction_for === "customer" → send customer_id
      // If transaction_for === "supplier" → send supplier_id
      const idPayload =
        transaction.transaction_for === "customer"
          ? { customer_id: transaction.customer_id }
          : { supplier_id: transaction.supplier_id };

      const payload = {
        ...idPayload,
        userId: transaction.business_owner_id,
        transaction_type: transactionType,
        transaction_for: transaction.transaction_for,
        amount: Number(newAmount),
      };

      const response = await ApiService.put(url, payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data) {
        Alert.alert("Success", "Transaction updated successfully");

        setTransaction(prev => ({
          ...prev,
          amount: Number(newAmount),
        }));

        setShowEditModal(false);
      } else {
        Alert.alert("Update Failed", response.data?.message || "Unknown error");
      }
    } catch (error) {
      console.error("API Error:", error);
      Alert.alert("Error", "Something went wrong!");
    }
  };

  const handleUpdateTransactionPics = async (updatedImages) => {
    try {
      const url = `/transactions/${transaction.id}`


      const payload = { transaction_pic: updatedImages };

      const response = await ApiService.put(url, payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (!response.data) {
        Alert.alert("Update Failed", response.data?.message || "Unknown error");
      }
    } catch (error) {
      console.error("API Error:", error);
      Alert.alert("Error", "Something went wrong!");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4D3C" />

      {/* Premium Header */}
      <View style={styles.headerSolid}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.userInfo}>
            <Avatar.Text
              size={36}
              label={Name?.charAt(0).toUpperCase()}
              style={styles.avatar}
              color="#FFFFFF"
              theme={{ colors: { primary: '#0A4D3C' } }}
            />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{Name}</Text>
              <Text style={styles.transactionType}>
                {transaction?.transaction_type === 'you_got' ? 'Received' : 'Given'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => router.replace('./help')}
          >
            <HelpCircle size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Amount Card */}
      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>Transaction Amount</Text>
        <Text style={styles.amount}>₹ {Number(transaction?.amount || 0).toFixed(2)}</Text>
        <View style={styles.amountBadge}>
          <Clock size={12} color="#64748B" />
          <Text style={styles.dateText}>{formateDate(transaction?.transaction_date)}</Text>
        </View>
      </View>

      {/* Details */}
      <ScrollView
        style={styles.detailsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.detailsContent}
      >
        {/* Images Section */}
        {images.length > 0 && (
          <View style={styles.imagesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Transaction Images</Text>
              <TouchableOpacity onPress={openImageOptions} style={styles.addImageButton}>
                <Plus size={18} color="#0A4D3C" />
                <Text style={styles.addImageText}>Add</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
              {images.map((img, index) => (
                <Image
                  key={index}
                  source={{ uri: img }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Details Cards */}
        <View style={styles.detailsCard}>
          {transaction?.bill_id && (
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: 'rgba(10,77,60,0.1)' }]}>
                <FileText size={18} color="#0A4D3C" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Bill Number</Text>
                <Text style={styles.detailValue}>{transaction.bill_id}</Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <View style={[styles.detailIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
              <Check size={18} color="#10B981" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={styles.detailValue}>Sync Successful</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={[styles.detailIcon, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
              <Calendar size={18} color="#F59E0B" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Transaction Date</Text>
              <Text style={styles.detailValue}>{formateDate(transaction?.transaction_date)}</Text>
            </View>
          </View>

          {transactionType === "you_gave" && (
            <TouchableOpacity
              style={styles.detailRow}
              onPress={() => {
                setNewAmount(String(transaction?.amount));
                setShowEditModal(true);
              }}
            >
              <View style={[styles.detailIcon, { backgroundColor: 'rgba(37,211,102,0.1)' }]}>
                <Edit size={18} color="#10B981" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Edit Transaction</Text>
                <Text style={[styles.detailValue, styles.editText]}>Tap to edit amount</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.detailRow, styles.deleteRow]}
            onPress={() => setShowDeleteModal(true)}
          >
            <View style={[styles.detailIcon, { backgroundColor: 'rgba(220,38,38,0.1)' }]}>
              <Delete size={18} color="#DC2626" />
            </View>
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: '#DC2626' }]}>Delete Transaction</Text>
              <Text style={[styles.detailValue, { color: '#DC2626' }]}>Remove permanently</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Share Buttons */}
        <View style={styles.shareContainer}>
          <TouchableOpacity
            style={[styles.shareButton, styles.smsButton]}
            onPress={handleSmsShare}
            activeOpacity={0.8}
          >
            <MessageCircle size={18} color="#FFFFFF" />
            <Text style={styles.shareButtonText}>SMS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareButton, styles.whatsappButton]}
            onPress={handleWhatsAppShare}
            activeOpacity={0.8}
          >
            <Share2 size={18} color="#FFFFFF" />
            <Text style={styles.shareButtonText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContainer}>
            <View style={modalStyles.modalHeader}>
              <Text style={modalStyles.modalTitle}>Edit Amount</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)} style={modalStyles.closeButton}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TextInput
              value={newAmount}
              onChangeText={setNewAmount}
              keyboardType="numeric"
              style={modalStyles.input}
              placeholder="Enter new amount"
              placeholderTextColor="#94A3B8"
              autoFocus
            />

            <View style={modalStyles.buttonRow}>
              <TouchableOpacity
                style={[modalStyles.button, modalStyles.cancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={modalStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[modalStyles.button, modalStyles.updateButton]}
                onPress={handleUpdateTransaction}
              >
                <Text style={modalStyles.updateButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContainer}>
            <View style={modalStyles.modalHeader}>
              <Text style={modalStyles.modalTitle}>Delete Transaction?</Text>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)} style={modalStyles.closeButton}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={modalStyles.modalMessage}>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </Text>

            <View style={modalStyles.buttonRow}>
              <TouchableOpacity
                style={[modalStyles.button, modalStyles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={modalStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[modalStyles.button, modalStyles.deleteButton]}
                onPress={handleDeleteTransaction}
              >
                <Text style={modalStyles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ---------- STYLES ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  headerSolid: {
    backgroundColor: '#0A4D3C',
    paddingTop: Platform.OS === 'android' ? 20 : 0,
    paddingBottom: 16,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
  },
  avatar: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  userDetails: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  transactionType: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  amountCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.1)',
  },
  amountLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#0A4D3C',
    marginBottom: 12,
  },
  amountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  dateText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  detailsContainer: {
    flex: 1,
  },
  detailsContent: {
    padding: 16,
    paddingBottom: 30,
  },
  imagesSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A4D3C',
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10,77,60,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  addImageText: {
    fontSize: 11,
    color: '#0A4D3C',
    fontWeight: '600',
  },
  imagesScroll: {
    marginTop: 4,
  },
  thumbnailImage: {
    width: 80,
    height: 80,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.1)',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.1)',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(10,77,60,0.1)',
  },
  deleteRow: {
    borderBottomWidth: 0,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  editText: {
    color: '#10B981',
  },
  shareContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  smsButton: {
    backgroundColor: '#0A4D3C',
  },
  whatsappButton: {
    backgroundColor: '#10B981',
  },
  shareButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

// ---------- MODAL STYLES ----------
const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A4D3C',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 24,
    backgroundColor: '#F8FAFC',
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F1F5F9",
  },
  updateButton: {
    backgroundColor: "#0A4D3C",
  },
  deleteButton: {
    backgroundColor: "#DC2626",
  },
  cancelButtonText: {
    color: "#64748B",
    fontWeight: "600",
    fontSize: 15,
  },
  updateButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
});