import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, Alert, ScrollView, Image, Dimensions, StatusBar, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Camera, Paperclip as PaperclipIcon, X, AlertTriangle, Calendar, Clock, CheckCircle, FileText, CreditCard, IndianRupee } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Appbar } from 'react-native-paper';
import ProgressButton from './components/ProgressButton';
import DateModal from './components/DateModal';
import { sendTransaction } from '../hooks/sendSMS';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import Modal from 'react-native-modal';

const { width } = Dimensions.get('window');

export default function TransactionScreen() {
  const router = useRouter();
  const { mobile, transactionType, transaction_for, id, personName, isSubscribe_user, transaction_limit, userAmountStatus, transactionAmount } = useLocalSearchParams();
  const [amount, setAmount] = useState(Number(transactionAmount) || "")
  const [note, setNote] = useState('');
  const [images, setImages] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [billID, setBillID] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [paymentType, setPaymentType] = useState('paid'); // 'paid' | 'credit'
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showChangeDueDatePicker, setShowChangeDueDatePicker] = useState(false);
  const [dueDate, setDueDate] = useState(new Date());
  const [changeUpcommigDueDate, setChangeUpcommigDueDate] = useState(new Date());
  const [upcommigDueDate, setUpcommigDueDate] = useState(new Date());

  // Success Popup States
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);

  const handleNumberPress = (num) => {
    if (amount === '0') {
      setAmount(num);
    } else {
      setAmount(amount + num);
    }
  };

  const uploadImages = async () => {
    if (!images.length) return [];

    try {
      const formData = new FormData();

      // Append each image to formData
      images.forEach((img, index) => {
        formData.append("files", {
          uri: img.uri,
          name: img.fileName || `image_${index}.jpg`,
          type: img.type ? `${img.type}/jpeg` : "image/jpeg",
        });
      });

      console.log("FormData ready:", formData);

      const response = await ApiService.post(`/upload/multi`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.loaded / progressEvent.total;
          console.log("Upload progress:", progress);
          // Optionally update a state for progress bar
        },
      });

      const result = response.data;
      console.log("Upload success:", result);

      // If your backend returns an array of uploaded files
      if (result.files && Array.isArray(result.files)) {
        return result.files.map(f => `https://aquaservices.esotericprojects.tech/uploads/${f.filename}`);
      }

      return [];
    } catch (error) {
      console.error("Upload failed:", error);
      Alert.alert("Upload Failed", "Could not upload images");
      return [];
    }
  };

  const handleOperationPress = (operation) => {
    switch (operation) {
      case 'clear':
        setAmount('0');
        break;
      case 'delete':
        setAmount(amount.length > 1 ? amount.slice(0, -1) : '0');
        break;
      case 'decimal':
        if (!amount.includes('.')) {
          setAmount(amount + '.');
        }
        break;
    }
  };

  const fetchCustomerDueDate = async () => {
    const userData = await AsyncStorage.getItem("userData");
    const userId = JSON.parse(userData).id;
    const payload = {
      user_id: userId
    }
    if (transaction_for === "customer") {
      payload.customer_id = id;
    } else {
      payload.supplier_id = id;
    }
    try {
      const url =
        transaction_for === "customer"
          ? "/customers/upcoming/DueDate"
          : "/supplier/upcoming/DueDate";

      const response = await ApiService.post(url, payload);
      const data = response.data;
      setUpcommigDueDate(data.upcoming_due_date);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateTransactionDueDate = async (newDuedate) => {
    const dueDatePayload = {
      isDuedateChange: true,
      dueDate: newDuedate
    };

    if (transaction_for === "customer") {
      dueDatePayload.customer_id = id;
    } else {
      dueDatePayload.supplier_id = id;
    }

    try {
      const response = await ApiService.put(
        `transactions/updateTransactions/DueDate`,
        dueDatePayload
      );

      if (response.status === 200) {
        Alert.alert("DueDate updated successfully")
      } else {
        alert("Failed to update due date");
      }
    } catch (error) {
      console.error(error);
      alert("Error updating due date");
    }
  }

  const addTransaction = async () => {
    if (loading) return; // Prevent double taps

    const date = moment(selectedDate).format('YYYY-MM-DD');
    setUploadProgress(0);
    setLoading(true);

    try {
      // Get user details
      const userData = await AsyncStorage.getItem("userData");
      const userId = JSON.parse(userData).id;
      const ownerId = JSON.parse(userData).owner_user_id;
      const userName = JSON.parse(userData).name;

      const userRole = JSON.parse(userData).role;
      console.log("role:::",userRole)
      if (paymentType === 'credit' && !dueDate) {
        Alert.alert('Validation Error', 'Please select a due date');
        setLoading(false);
        return;
      }

      const formattedDueDate =
        paymentType === 'credit'
          ? moment(dueDate).format('YYYY-MM-DD')
          : undefined;

      const transactionFor =
        transaction_for === "customer" ? "customer" : "supplier";

      // -----------------------
      // 📌 Upload Images ONLY if exist
      // -----------------------
      let images_url = null;

      if (images && Array.isArray(images) && images.length > 0) {
        images_url = await uploadImages(images);     // Upload array images
      }

      // -----------------------
      // 📌 Build Base Payload
      // -----------------------
      const isEmployeeGot = transactionType === "you_got" && userRole === "employee";
      console.log("isEmployeeGot:::",isEmployeeGot)
      const commonPayload = {
        userId,
        ownerId,
        created_user: userId,
        transaction_type: transactionType,
        transaction_for: transactionFor,
        amount: Number(amount),
        paidAmount: paymentType === 'credit' ? 0 : Number(amount),
        remainingAmount: paymentType === 'credit' ? Number(amount) : 0,
        description: note,
        transaction_date: date,
        due_date: formattedDueDate,
        paymentType: paymentType,
        // Add image fields only if available
        is_Approved: isEmployeeGot,
        ...(isEmployeeGot && { status: "approved" }),
        ...(images_url ? { transaction_pic: images_url } : {}),
        ...(billID ? { bill_id: billID } : {}),
        ...(paymentType === 'credit' && formattedDueDate
          ? { due_date: formattedDueDate }
          : {}),
      };

      // -----------------------
      // 📌 Add customer/supplier ID
      // -----------------------
      const payload =
        transactionFor === "customer"
          ? { ...commonPayload, customer_id: Number(id) }
          : { ...commonPayload, supplier_id: Number(id) };

      // -----------------------
      // 📌 API Endpoint
      // -----------------------
      const url =
        transactionFor === "customer"
          ? "/transactions/customer"
          : "/transactions/supplier";

      // -----------------------
      // 📌 Submit Transaction
      // -----------------------
      const response = await ApiService.post(url, payload, {
        onUploadProgress: (e) => {
          if (e.total > 0) {
            setUploadProgress(e.loaded / e.total);
          }
        },
      });

      const invoice = response.data.transaction.id;
      sendTransaction(mobile, personName, amount, userName, invoice);

      if (transactionType === 'you_got') {
        updateTransactionDueDate(changeUpcommigDueDate);
      }

      // Store transaction details for popup
      setTransactionDetails({
        id: invoice,
        amount: amount,
        date: moment(selectedDate).format('DD MMM YYYY'),
        type: transactionType === 'you_got' ? 'Payment Received' : 'Credit Given',
        personName: personName,
        note: note || 'No note added',
        imagesCount: images.length,
        paymentType: paymentType === 'paid' ? 'Paid Now' : 'Credit',
        dueDate: paymentType === 'credit' ? moment(dueDate).format('DD MMM YYYY') : null,
        isPayment: transactionType === 'you_got',
        mobile: mobile
      });

      // Show success popup
      setShowSuccessPopup(true);
      setLoading(false);

    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
      Alert.alert("Error", "Failed to add transaction");
    }
  };

  const handleClosePopup = () => {
    setShowSuccessPopup(false);
    // Navigate back after popup closes
    if (transaction_for === "customer") {
      router.push({
        pathname: "/customerDetails",
        params: {
          personName: personName,
          personType: transaction_for,
          personId: id,
        },
      });
    } else {
      router.push({
        pathname: "/supplierDetails",
        params: {
          personName: personName,
          personType: transaction_for,
          personId: id,
        },
      });
    }
  };

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Add Images',
      'Choose an option',
      [
        { text: 'Camera', onPress: handleCamera },
        { text: 'Gallery', onPress: handleGallery },
        { text: 'Cancel', style: 'cancel' }
      ],
      { cancelable: true }
    );
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera permission is required!');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 1,
        allowsEditing: false,
        saveToPhotos: true,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const imageData = {
          uri: asset.uri,
          type: asset.type,
          fileName: asset.fileName,
          size: asset.fileSize,
        };
        setImages(prev => [...prev, imageData]);
      }
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

  const handleGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Photo library permission is required!');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled) {
        const assetsData = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type,
          fileName: asset.fileName,
          size: asset.fileSize,
        }));
        setImages(prev => [...prev, ...assetsData]);
      }
    } catch (error) {
      console.error('Gallery error:', error);
    }
  };

  const deleteImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const openPreview = (imgUri) => {
    setSelectedImage(imgUri);
    setPreviewVisible(true);
  };

  const closePreview = () => {
    setPreviewVisible(false);
    setSelectedImage(null);
  };

  useEffect(() => {
    if (typeof selectedDate === "string") {
      setSelectedDate(new Date(selectedDate));
    }
  }, []);

  useEffect(() => {
    fetchCustomerDueDate()
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* Elegant Header */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#1E293B" />
          </TouchableOpacity>

          <View style={styles.personInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{getInitial(personName)}</Text>
            </View>
            <View style={styles.personDetails}>
              <Text style={styles.personName}>{personName}</Text>
              <View style={styles.balanceContainer}>
                <Text style={[
                  styles.balanceText,
                  { color: userAmountStatus?.includes('Due') ? '#DC2626' : '#059669' }
                ]}>
                  {userAmountStatus}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.securedBadge}>
            <CheckCircle size={10} color="#059669" />
            <Text style={styles.securedText}>SECURED</Text>
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Plan Limit Banner - Refined */}
          {isSubscribe_user === false && (
            <View style={styles.limitCard}>
              <View style={styles.limitContent}>
                <View style={styles.limitIconContainer}>
                  <CreditCard size={14} color="#64748B" />
                </View>
                <Text style={styles.limitText}>
                  {transactionType === "you_gave" ? (
                    <>Daily Give Limit: <Text style={styles.limitValue}>{transaction_limit}/8</Text></>
                  ) : (
                    <>Daily Receive Limit: <Text style={styles.limitValue}>{transaction_limit}/8</Text></>
                  )}
                </Text>
              </View>
              <Text style={styles.planText}>Basic Plan</Text>
            </View>
          )}

          {/* Amount Card - Refined & Smaller */}
          <View style={styles.amountCard}>
            <View style={styles.amountHeader}>
              <IndianRupee size={18} color="#0A4D3C" />
              <Text style={styles.amountLabel}>Transaction Amount</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <Text style={styles.amountDisplay}>{amount || '0'}</Text>
            </View>
            <View style={styles.amountDivider} />
          </View>

          {/* {transactionType === "you_got" && (
            <View style={styles.warningBox}>
              <AlertTriangle size={18} color="#D97706" />
              <Text style={styles.warningText}>
                This payment transaction cannot be edited or deleted.
              </Text>
            </View>
          )} */}
          {amount ? (
            <>
              {/* Date Selection - Compact */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Transaction Date</Text>
                <TouchableOpacity
                  style={styles.selectorButton}
                  onPress={() => setShowCalendar(true)}
                  activeOpacity={0.7}
                >
                  <Calendar size={16} color="#64748B" />
                  <Text style={styles.selectorText}>
                    {moment(selectedDate).format("DD MMM YYYY")}
                  </Text>
                </TouchableOpacity>

                {showCalendar && (
                  <DateTimePicker
                    value={selectedDate instanceof Date ? selectedDate : new Date()}
                    mode="date"
                    display="spinner"
                    onChange={(event, date) => {
                      if (date) {
                        setSelectedDate(date);
                      }
                      setShowCalendar(false);
                    }}
                  />
                )}
              </View>

              {/* Action Buttons - Rounded */}
              <View style={styles.actionRow}>
                {transactionType === "you_gave" && transaction_for === "customer" && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.createBillButton]}
                    onPress={async () => {
                      const userData = await AsyncStorage.getItem("userData");
                      const ownerId = JSON.parse(userData).owner_user_id;
                      await AsyncStorage.removeItem("billNo");
                      router.push({
                        pathname: "/billGenaration",
                        params: {
                          Id: id,
                          ownerId,
                          bill_type: "BILL",
                          mode: "add",
                          bill_date: moment(selectedDate).format("DD MMM YYYY"),
                          transaction_for: transaction_for
                        }
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    <FileText size={16} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Create Bill</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.attachBillButton,
                    transactionType === "you_gave" && transaction_for === "customer" && styles.halfWidthButton
                  ]}
                  onPress={showImagePickerOptions}
                  activeOpacity={0.7}
                >
                  <Camera size={16} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Attach Bill</Text>
                </TouchableOpacity>
              </View>

              {/* Images Preview - Compact */}
              {images.length > 0 && (
                <View style={styles.imagesSection}>
                  <Text style={styles.sectionLabel}>Attachments ({images.length})</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {images.map((img, index) => (
                      <View key={index} style={styles.imageItem}>
                        <Image source={{ uri: img.uri }} style={styles.thumbnailImage} />
                        <TouchableOpacity
                          onPress={() => deleteImage(index)}
                          style={styles.removeImageButton}
                        >
                          <X size={10} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Note Input - Minimal */}
              <View style={styles.noteSection}>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Add a note (optional)"
                  placeholderTextColor="#94A3B8"
                  value={note}
                  onChangeText={setNote}
                  multiline
                />
              </View>

              {/* Payment Type Toggle - Clean */}
              {transactionType === "you_gave" && (
                <View style={styles.toggleSection}>
                  <TouchableOpacity
                    style={[
                      styles.toggleOption,
                      paymentType === 'paid' && styles.activeToggleOption
                    ]}
                    onPress={() => setPaymentType('paid')}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.toggleOptionText,
                      paymentType === 'paid' && styles.activeToggleOptionText
                    ]}>
                      Paid Now
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.toggleOption,
                      paymentType === 'credit' && styles.activeToggleOption
                    ]}
                    onPress={() => setPaymentType('credit')}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.toggleOptionText,
                      paymentType === 'credit' && styles.activeToggleOptionText
                    ]}>
                      Credit
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Due Date Section - Clean */}
              {paymentType === 'credit' && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Due Date</Text>
                  <TouchableOpacity
                    style={styles.selectorButton}
                    onPress={() => setShowDueDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <Clock size={16} color="#64748B" />
                    <Text style={styles.selectorText}>
                      {moment(dueDate).format('DD MMM YYYY')}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.upcomingDueRow}>
                    <Text style={styles.upcomingDueLabel}>Upcoming Due:</Text>
                    <Text style={styles.upcomingDueValue}>
                      {moment(upcommigDueDate).format('DD MMM YYYY')}
                    </Text>
                  </View>

                  {showDueDatePicker && (
                    <DateTimePicker
                      value={dueDate}
                      mode="date"
                      display="spinner"
                      onChange={(event, date) => {
                        if (date) {
                          setDueDate(date);
                        }
                        setShowDueDatePicker(false);
                      }}
                    />
                  )}
                </View>
              )}

              {/* Update Due Date Section */}
              {transactionType === 'you_got' && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Update Due Date</Text>
                  <TouchableOpacity
                    style={styles.selectorButton}
                    onPress={() => setShowChangeDueDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <Clock size={16} color="#64748B" />
                    <Text style={styles.selectorText}>
                      {moment(changeUpcommigDueDate).format('DD MMM YYYY')}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.upcomingDueRow}>
                    <Text style={styles.upcomingDueLabel}>Current Due:</Text>
                    <Text style={styles.upcomingDueValue}>
                      {moment(upcommigDueDate).format('DD MMM YYYY')}
                    </Text>
                  </View>

                  {showChangeDueDatePicker && (
                    <DateTimePicker
                      value={changeUpcommigDueDate}
                      mode="date"
                      display="spinner"
                      onChange={(event, date) => {
                        if (date) {
                          setChangeUpcommigDueDate(date);
                        }
                        setShowChangeDueDatePicker(false);
                      }}
                    />
                  )}
                </View>
              )}

              {/* Submit Button - Rounded */}
              <View style={styles.submitContainer}>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={addTransaction}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <Text style={styles.submitButtonText}>Processing...</Text>
                  ) : (
                    <Text style={styles.submitButtonText}>Submit Transaction</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Calculator - Refined */}
      <View style={styles.calculatorContainer}>
        <View style={styles.calculatorRow}>
          {['1', '2', '3'].map((num) => (
            <TouchableOpacity
              key={num}
              style={styles.calcButton}
              onPress={() => handleNumberPress(num)}
            >
              <Text style={styles.calcButtonText}>{num}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.calcButton, styles.operatorButton]}
            onPress={() => handleOperationPress('delete')}
          >
            <Text style={styles.operatorButtonText}>⌫</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.calculatorRow}>
          {['4', '5', '6'].map((num) => (
            <TouchableOpacity
              key={num}
              style={styles.calcButton}
              onPress={() => handleNumberPress(num)}
            >
              <Text style={styles.calcButtonText}>{num}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.calcButton, styles.operatorButton]}
            onPress={() => handleOperationPress('clear')}
          >
            <Text style={styles.operatorButtonText}>C</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.calculatorRow}>
          {['7', '8', '9'].map((num) => (
            <TouchableOpacity
              key={num}
              style={styles.calcButton}
              onPress={() => handleNumberPress(num)}
            >
              <Text style={styles.calcButtonText}>{num}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.calcButton, styles.operatorButton]}
            onPress={() => handleNumberPress('-')}
          >
            <Text style={styles.operatorButtonText}>−</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.calculatorRow}>
          <TouchableOpacity
            style={styles.calcButton}
            onPress={() => handleOperationPress('decimal')}
          >
            <Text style={styles.calcButtonText}>.</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.calcButton}
            onPress={() => handleNumberPress('0')}
          >
            <Text style={styles.calcButtonText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.calcButton, styles.equalsButton]}
            onPress={() => {
              try {
                if (amount && !amount.includes('+') && !amount.includes('-')) {
                  setAmount(amount);
                } else if (amount) {
                  const result = eval(amount);
                  setAmount(String(result));
                }
              } catch (e) {
                // Ignore eval errors
              }
            }}
          >
            <Text style={styles.equalsButtonText}>=</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.calcButton, styles.operatorButton]}
            onPress={() => handleNumberPress('+')}
          >
            <Text style={styles.operatorButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Image Preview Modal - Using react-native-modal */}
      <Modal
        isVisible={previewVisible}
        onBackdropPress={closePreview}
        onBackButtonPress={closePreview}
        style={styles.previewModal}
      >
        <View style={styles.previewContent}>
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          <TouchableOpacity onPress={closePreview} style={styles.closePreviewButton}>
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Success Popup Modal - Using react-native-modal */}
      <Modal
        isVisible={showSuccessPopup}
        onBackdropPress={() => setShowSuccessPopup(false)}
        onBackButtonPress={() => setShowSuccessPopup(false)}
        style={styles.popupModal}
      >
        <Animatable.View
          animation="bounceIn"
          duration={600}
          style={styles.popupContainer}
        >
          <View style={styles.popupHeader}>
            <View style={styles.successIconContainer}>
              <CheckCircle size={32} color="#0A4D3C" />
            </View>
            <Text style={styles.popupTitle}>Transaction Successful!</Text>
          </View>

          {transactionDetails && (
            <View style={styles.popupContent}>
              {/* Warning for Payment Transactions */}
              {transactionDetails.isPayment && (
                <View style={styles.popupWarningBox}>
                  <AlertTriangle size={18} color="#D97706" />
                  <Text style={styles.popupWarningText}>
                    This payment transaction cannot be edited or deleted.
                  </Text>
                </View>
              )}

              {/* Transaction Details */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Transaction ID:</Text>
                <Text style={styles.detailValue}>#{transactionDetails.id}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Person:</Text>
                <Text style={styles.detailValue}>{transactionDetails.personName}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type:</Text>
                <View style={[styles.typeBadge, { backgroundColor: transactionDetails.isPayment ? '#E8F5E9' : '#FEE2E2' }]}>
                  <Text style={[styles.typeBadgeText, { color: transactionDetails.isPayment ? '#0A4D3C' : '#EF4444' }]}>
                    {transactionDetails.type}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount:</Text>
                <Text style={[styles.detailAmount, { color: transactionDetails.isPayment ? '#0A4D3C' : '#EF4444' }]}>
                  ₹ {parseFloat(transactionDetails.amount).toFixed(2)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>{transactionDetails.date}</Text>
              </View>

              {transactionDetails.paymentType === 'Credit' && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Due Date:</Text>
                  <Text style={styles.detailValue}>{transactionDetails.dueDate}</Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Mode:</Text>
                <Text style={styles.detailValue}>{transactionDetails.paymentType}</Text>
              </View>

              {transactionDetails.imagesCount > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Attachments:</Text>
                  <Text style={styles.detailValue}>{transactionDetails.imagesCount} image(s)</Text>
                </View>
              )}

              <View style={styles.noteBox}>
                <Text style={styles.noteBoxLabel}>Note:</Text>
                <Text style={styles.noteBoxText}>{transactionDetails.note}</Text>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoBoxText}>
                  A confirmation SMS has been sent to {transactionDetails.mobile || 'the customer'}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.popupActions}>
            <TouchableOpacity
              style={styles.popupButton}
              onPress={handleClosePopup}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#0A4D3C', '#1B6B50']}
                style={styles.popupButtonGradient}
              >
                <Text style={styles.popupButtonText}>View Details</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.popupSecondaryButton}
              onPress={handleClosePopup}
              activeOpacity={0.7}
            >
              <Text style={styles.popupSecondaryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Animatable.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerSafeArea: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0A4D3C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  personDetails: {
    flex: 1,
  },
  personName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceText: {
    fontSize: 11,
    fontWeight: '500',
  },
  securedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  securedText: {
    fontSize: 9,
    color: '#475569',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 250,
  },
  limitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  limitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  limitIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  limitText: {
    fontSize: 12,
    color: '#475569',
  },
  limitValue: {
    fontWeight: '700',
    color: '#0A4D3C',
  },
  planText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  amountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  amountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  amountLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: 24,
    color: '#0A4D3C',
    marginRight: 4,
    fontWeight: '300',
  },
  amountDisplay: {
    fontSize: 36,
    fontWeight: '600',
    color: '#1E293B',
  },
  amountDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginTop: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginLeft: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },

  warningText: {
    marginLeft: 8,
    color: "#92400E",
    fontSize: 14,
    flex: 1,
  },
  selectorText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 25,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  createBillButton: {
    backgroundColor: '#0A4D3C',
  },
  attachBillButton: {
    backgroundColor: '#059669',
  },
  halfWidthButton: {
    flex: 0.48,
  },
  actionButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  imagesSection: {
    marginBottom: 16,
  },
  imageItem: {
    position: 'relative',
    marginRight: 10,
  },
  thumbnailImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteSection: {
    marginBottom: 16,
  },
  noteInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
    minHeight: 45,
  },
  toggleSection: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  toggleOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  activeToggleOption: {
    backgroundColor: '#0A4D3C',
    borderColor: '#0A4D3C',
  },
  toggleOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  activeToggleOptionText: {
    color: '#FFFFFF',
  },
  upcomingDueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
    gap: 6,
  },
  upcomingDueLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  upcomingDueValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0A4D3C',
  },
  submitContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#0A4D3C',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  calculatorContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  calculatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  calcButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  calcButtonText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1E293B',
  },
  operatorButton: {
    backgroundColor: '#F1F5F9',
  },
  operatorButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
  },
  equalsButton: {
    backgroundColor: '#0A4D3C',
    borderColor: '#0A4D3C',
  },
  equalsButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  previewModal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContent: {
    width: width - 32,
    height: '70%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  closePreviewButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupModal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  popupHeader: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  successIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  popupContent: {
    padding: 20,
  },
  popupWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FCD34D',
    gap: 10,
  },
  popupWarningText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  detailAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  noteBox: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  noteBoxLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '500',
  },
  noteBoxText: {
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 18,
  },
  infoBox: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#C6E6D7',
  },
  infoBoxText: {
    fontSize: 12,
    color: '#0A4D3C',
    textAlign: 'center',
    fontWeight: '500',
  },
  popupActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 20,
    paddingTop: 0,
  },
  popupButton: {
    flex: 2,
    borderRadius: 25,
    overflow: 'hidden',
  },
  popupButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  popupButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  popupSecondaryButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 25,
  },
  popupSecondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
});