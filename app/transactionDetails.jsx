import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Image, ScrollView, TouchableOpacity,
  Alert, Modal, TextInput
} from 'react-native';
import { Linking } from 'react-native';
import { Calendar, MessageCircle, Share2, Check, FileText, HelpCircle, ArrowLeft, Plus, Edit, Delete } from 'lucide-react-native';
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
      console.log("rrr:::", response)
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
      console.log("rrr:::", uploadedFile)
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

      console.log("UPDATE PAYLOAD:", payload);

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
    console.log("rrr:::", updatedImages)
    try {
      const url = `/transactions/${transaction.id}`


      const payload = { transaction_pic: updatedImages };

      console.log("UPDATE PAYLOAD:", payload);

      const response = await ApiService.put(url, payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (!response.data) {
        Alert.alert("Update Failed", response.data?.message || "Unknown error");
      }
      console.log("rer:::", response)
    } catch (error) {
      console.error("API Error:", error);
      Alert.alert("Error", "Something went wrong!");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Appbar.Header style={[styles.header, { borderColor: "#f3f3f3", borderBottomWidth: 3 }]}>
        <ArrowLeft size={24} onPress={() => navigation.goBack()} style={{ marginHorizontal: 10 }} />

        <View style={styles.userInfo}>
          <Avatar.Text size={30} label={Name?.charAt(0).toUpperCase()} style={{ marginLeft: 10 }} />
          <Text style={[styles.userName, { marginLeft: 10 }]}>{Name}</Text>
        </View>

        <HelpCircle color="#555" size={24} onPress={() => router.replace('./help') // better UX than push
        } />
      </Appbar.Header>

      {/* Amount */}
      <View style={styles.amountContainer}>
        <Text style={styles.amount}>₹ {Number(transaction?.amount || 0).toFixed(2)}</Text>
      </View>

      {/* Details */}
      <ScrollView style={styles.detailsContainer}>
        {images.length > 0 && (
          <View style={{ marginTop: 20, backgroundColor: '#f3f3f3', padding: 10, borderRadius: 10 }}>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontWeight: "bold" }}>
                Transaction Images
              </Text>

              <TouchableOpacity onPress={openImageOptions}>
                <Plus size={22} color="#25D366" />
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              {images.map((img, index) => (
                <Image
                  key={index}
                  source={{ uri: img }}
                  style={{
                    width: 85,
                    height: 85,
                    marginRight: 10,
                    borderRadius: 8,
                    backgroundColor: "#ffffff",
                  }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}
        <View style={styles.row}>
          <FileText size={18} color="#555" />
          <Text style={styles.rowText}>Bill Number: {transaction?.bill_id ?? "N/A"}</Text>
        </View>

        <View style={styles.row}>
          <Check size={18} color="#4CAF50" />
          <Text style={styles.rowText}>Sync Successful</Text>
        </View>

        <View style={styles.row}>
          <Calendar size={18} color="#555" />
          <Text style={styles.rowText}>Added On {formateDate(transaction?.transaction_date)}</Text>
        </View>

        {transactionType === "you_gave" && (
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              setNewAmount(String(transaction?.amount));
              setShowEditModal(true);
            }}
          >
            <Edit size={18} color="#25D366" />
            <Text style={[styles.rowText, { color: "#25D366" }]}>Edit Transaction</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowDeleteModal(true)}
        >
          <Delete size={18} color="red" />
          <Text style={[styles.rowText, { color: "red" }]}>Delete Transaction</Text>
        </TouchableOpacity>
        <View style={styles.shareContainer}>
          {/* SMS */}
          <TouchableOpacity
            style={[styles.materialBtn, styles.smsBtn]}
            onPress={handleSmsShare}
            activeOpacity={0.85}
          >
            <MessageCircle size={20} color="#fff" />
            <Text style={styles.materialBtnText}>SMS</Text>
          </TouchableOpacity>

          {/* WhatsApp */}
          <TouchableOpacity
            style={[styles.materialBtn, styles.whatsappBtn]}
            onPress={handleWhatsAppShare}
            activeOpacity={0.85}
          >
            <Share2 size={20} color="#fff" />
            <Text style={styles.materialBtnText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ---------------- MODAL FOR EDIT --------------------- */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContainer}>
            <Text style={modalStyles.title}>Edit Amount</Text>

            <TextInput
              value={newAmount}
              onChangeText={setNewAmount}
              keyboardType="numeric"
              style={modalStyles.input}
              placeholder="Enter new amount"
            />

            <View style={modalStyles.btnRow}>
              <TouchableOpacity
                style={[modalStyles.button, { backgroundColor: "#ccc" }]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={modalStyles.btnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[modalStyles.button, { backgroundColor: "#25D366" }]}
                onPress={handleUpdateTransaction}
              >
                <Text style={[modalStyles.btnText, { color: "#fff" }]}>
                  Update
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ---------------- DELETE CONFIRM MODAL --------------------- */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContainer}>
            <Text style={modalStyles.title}>Delete Transaction?</Text>
            <Text style={{ textAlign: "center", marginBottom: 20 }}>
              Are you sure you want to delete this transaction?
            </Text>

            <View style={modalStyles.btnRow}>
              <TouchableOpacity
                style={[modalStyles.button, { backgroundColor: "#ccc" }]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={modalStyles.btnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[modalStyles.button, { backgroundColor: "red" }]}
                onPress={handleDeleteTransaction}
              >
                <Text style={[modalStyles.btnText, { color: "#fff" }]}>Delete</Text>
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
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", padding: 16, justifyContent: "space-between" },
  userInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  userName: { fontSize: 16, fontWeight: "600" },
  amountContainer: { alignItems: "center", paddingVertical: 20 },
  amount: { fontSize: 40, fontWeight: "bold", color: "#000" },
  detailsContainer: { paddingHorizontal: 20 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 15, borderBottomColor: "#eee", borderBottomWidth: 1 },
  rowText: { marginLeft: 12, fontSize: 15 },
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
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },

  shareContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 20,
    gap: 12,
  },

  materialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12, // Material 3
    elevation: 3, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },

  smsBtn: {
    backgroundColor: '#1E88E5', // Material Blue
  },

  whatsappBtn: {
    backgroundColor: '#25D366', // WhatsApp Green
  },


  title: { fontSize: 18, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  input: {
    borderWidth: 1, borderColor: "#aaa", padding: 12, borderRadius: 8, fontSize: 16,
    marginBottom: 20,
  },
  btnRow: { flexDirection: "row", justifyContent: "space-between" },
  button: { padding: 12, borderRadius: 8, width: "48%", alignItems: "center" },
  btnText: { fontWeight: "600", fontSize: 16 },
});
