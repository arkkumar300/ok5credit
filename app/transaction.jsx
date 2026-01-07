import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, Alert, ScrollView, Image, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ArrowLeft, Camera, Paperclip as PaperclipIcon, Mic, X, ArrowRight, ArrowRightIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Modal } from 'react-native-paper';
import ProgressButton from './components/ProgressButton';
import DateModal from './components/DateModal';
import { sendTransaction } from '../hooks/sendSMS';

export default function TransactionScreen() {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState('');
  // const [selectedDate, setSelectedDate] = useState(moment().format('DD MMM YYYY'));
  const [activeType, setActiveType] = useState(null);
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

  const router = useRouter();
  const { mobile, transactionType, transaction_for, id, personName, isSubscribe_user, transaction_limit } = useLocalSearchParams();

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
    const payload={
      user_id: userId 
    }
    if (transaction_for === "customer") {
      payload.customer_id =id ;
    } else {
      payload.supplier_id =id ;
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
      setError('Failed to load data');
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
      dueDatePayload.customer_id =id ;
    } else {
      dueDatePayload.supplier_id =id ;
    }
  
    try {

      // Use the selected date (date), NOT dueDate
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
      const userName = JSON.parse(userData).name;
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
      const commonPayload = {
        userId,
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
          ? { ...commonPayload, customer_id: id }
          : { ...commonPayload, supplier_id: id };

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

      const invoice = response.data.transaction.id
      sendTransaction(mobile, personName, amount, userName, invoice)

      if (transactionType==='you_got') {
        updateTransactionDueDate(changeUpcommigDueDate)
      }
      // -----------------------
      // 🎉 Success animation + navigation
      // -----------------------
      setTimeout(() => {
        setSuccess(true);
        setLoading(false);
        if (transactionFor === "customer") {
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
      }, 1000);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
      Alert.alert("Error", "Failed to add transaction");
    }
  };

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

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
        { text: 'Camera', onPress: handleCamera },
        { text: 'Gallery', onPress: handleGallery },
        { text: 'Cancel', style: 'cancel' }
      ],
      { cancelable: true }
    );
  };

  const handleCamera = async () => {
    // Request camera permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera permission is required!');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],  // correct        quality: 1,
        allowsEditing: false,
        saveToPhotos: true,
      });

      if (!result.canceled) {
        const asset = result.assets[0];

        const imageData = {
          uri: asset.uri,
          type: asset.type,          // usually "image"
          fileName: asset.fileName,  // actual filename
          size: asset.fileSize,      // in bytes
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
        mediaTypes: ["images"],  // correct
        allowsMultipleSelection: true,            // for multiple images
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
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.personInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitial(personName)}</Text>
            </View>
            <View>
              <Text style={styles.personName}>{personName}</Text>
              <Text style={styles.balanceText}>₹0</Text>
            </View>
          </View>
          <View style={styles.securedBadge}>
            <Text style={styles.securedText}>SECURED</Text>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        </View>
        {isSubscribe_user === false &&
          <>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              margin: 10, paddingHorizontal: 20,
              paddingVertical: 10,
              backgroundColor: "#f3f3f3",
              borderRadius: 20
            }}>
              {
                transactionType === "you_gave" ? (
                  <Text style={{ fontSize: 14, borderRadius: 5, fontWeight: 'bold', color: '#388E3C90' }}>Give   :    {transaction_limit} / 20</Text>

                ) : (
                  <Text style={{ fontSize: 14, borderRadius: 5, fontWeight: 'bold', color: '#33333390' }}>Receive :   {transaction_limit}  / 8 </Text>
                )
              }
              <Text style={{ fontSize: 14, borderRadius: 5, fontWeight: 'bold', color: '#333333' }}>Daily Transaction Limit Left Basic Plan </Text>

              <ArrowRight size={15} color="#666" />

            </View>

          </>}

        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>₹</Text>
          <Text style={styles.amountDisplay}>{amount}</Text>
        </View>
        {amount && (
          <>
            <View style={styles.dateContainer}>
              <Text style={styles.dateLabel}>New Bill Date</Text>

              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => setShowCalendar(true)}
              >
                <Text style={styles.dateText}>
                  {moment(selectedDate).format("DD MMM YYYY")}
                </Text>
                <Text style={styles.dropdownArrow}>⌄</Text>
              </TouchableOpacity>

              {showCalendar && (
                <DateTimePicker
                  value={selectedDate instanceof Date ? selectedDate : new Date()}
                  mode="date"
                  display="spinner"
                  onChange={(event, date) => {
                    if (date) {
                      setSelectedDate(date);   // ✔ correct: date is a Date object
                    }
                    setShowCalendar(false);
                  }}
                  style={{ width: '100%' }}
                />
              )}

            </View>

            <View style={styles.buttonRow}>

              {transactionType === "you_gave" && transaction_for === "customer" && (
                <TouchableOpacity
                  style={[
                    styles.addImagesButton,
                    styles.addBillButton,
                    { marginHorizontal: 10 }
                  ]}
                  onPress={() => {
                    router.push({
                      pathname: "/billGenaration",
                      params: {
                        Id: id,
                        bill_type: "BILL",
                        mode: "add",
                        bill_date: moment(selectedDate).format("DD MMM YYYY"),
                        transaction_for: transaction_for
                      }
                    });
                  }}
                >
                  <PaperclipIcon size={20} color="#ffffff" />
                  <Text style={[styles.addImagesText, styles.addBillText]}>
                    Create Bill
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.addImagesButton} onPress={showImagePickerOptions}>
                <Camera size={20} color="#4CAF50" />
                <Text style={styles.addImagesText}>Add Bill</Text>
              </TouchableOpacity>
            </View>
            {images.length > 0 && (
              <View style={styles.imagesContainer}>
                <Text style={styles.imagesTitle}>Selected Images</Text>

                <View style={styles.imagesList}>
                  {images.map((img, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      <Image
                        source={{ uri: img.uri }}
                        style={styles.selectedImage}
                      />
                      {/* Delete Button */}
                      <TouchableOpacity
                        onPress={() => deleteImage(index)}
                        style={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          backgroundColor: 'red',
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        <Text style={{ color: 'white', fontSize: 16 }}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}


            <View style={styles.noteContainer}>
              <TextInput
                style={styles.noteInput}
                placeholder="Add Note (Optional)"
                value={note}
                placeholderTextColor={"#aaaaaa"}
                onChangeText={setNote}
                multiline
              />
              <TouchableOpacity style={styles.micButton}>
                <Mic size={20} color="#666" />
              </TouchableOpacity>
            </View>
            {
              transactionType === "you_gave" && <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    paymentType === 'paid' && styles.activeToggle
                  ]}
                  onPress={() => setPaymentType('paid')}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      paymentType === 'paid' && styles.activeToggleText
                    ]}
                  >
                    Paid
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    paymentType === 'credit' && styles.activeToggle
                  ]}
                  onPress={() => setPaymentType('credit')}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      paymentType === 'credit' && styles.activeToggleText
                    ]}
                  >
                    Credit
                  </Text>
                </TouchableOpacity>
              </View>}

            {paymentType === 'credit' && (
              <View style={styles.dueDateContainer}>
                <Text style={styles.dateLabel}>Due Date</Text>

                <TouchableOpacity
                  style={styles.dateSelector}
                  onPress={() => setShowDueDatePicker(true)}
                >
                  <Text style={styles.dateText}>
                    {moment(dueDate).format('DD MMM YYYY')}
                  </Text>
                  <Text style={styles.dropdownArrow}>📅</Text>
                </TouchableOpacity>
                <Text style={[styles.dateText,{marginVertical:10}]}>
                   Upcomming DueData: {moment(upcommigDueDate).format('DD MMM YYYY')}
                  </Text>
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
            {transactionType === 'you_got' && (
              <View style={styles.dueDateContainer}>

                <TouchableOpacity
                  style={styles.dateSelector}
                  onPress={() => setShowChangeDueDatePicker(true)}
                >
                  <Text style={styles.dateText}>
                    {moment(changeUpcommigDueDate).format('DD MMM YYYY')}
                  </Text>
                  <Text style={styles.dropdownArrow}>📅</Text>
                </TouchableOpacity>
                <Text style={[styles.dateText,{marginVertical:10}]}>
                   Upcomming DueData: {moment(upcommigDueDate).format('DD MMM YYYY')}
                  </Text>
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

          </>
        )
        }
        <View style={styles.actionButtons}>
        </View>
      </ScrollView>
      {amount && (

        <ProgressButton
          title="Submit"
          loading={loading}
          progress={uploadProgress}   // 0 → 1
          success={success}
          onPress={addTransaction}
        />
      )}
      <View style={styles.calculator}>
        <View style={styles.calculatorRow}>
          <TouchableOpacity style={styles.calcButton} onPress={() => handleNumberPress('1')}>
            <Text style={styles.calcButtonText}>1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.calcButton} onPress={() => handleNumberPress('2')}>
            <Text style={styles.calcButtonText}>2</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.calcButton} onPress={() => handleNumberPress('3')}>
            <Text style={styles.calcButtonText}>3</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.calcButton, styles.operatorButton]} onPress={() => handleOperationPress('delete')}>
            <Text style={styles.calcButtonText}>⌫</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.calculatorRow}>
          <TouchableOpacity style={styles.calcButton} onPress={() => handleNumberPress('4')}>
            <Text style={styles.calcButtonText}>4</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.calcButton} onPress={() => handleNumberPress('5')}>
            <Text style={styles.calcButtonText}>5</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.calcButton} onPress={() => handleNumberPress('6')}>
            <Text style={styles.calcButtonText}>6</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.calcButton, styles.operatorButton]} onPress={() => handleOperationPress('clear')}>
            <Text style={styles.calcButtonText}>clear</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.calculatorRow}>
          <TouchableOpacity style={styles.calcButton} onPress={() => handleNumberPress('7')}>
            <Text style={styles.calcButtonText}>7</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.calcButton} onPress={() => handleNumberPress('8')}>
            <Text style={styles.calcButtonText}>8</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.calcButton} onPress={() => handleNumberPress('9')}>
            <Text style={styles.calcButtonText}>9</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.calcButton, styles.operatorButton]} onPress={() => handleNumberPress('-')}>
            <Text style={styles.calcButtonText}>—</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.calculatorRow}>
          <TouchableOpacity style={styles.calcButton} onPress={() => handleOperationPress('decimal')}>
            <Text style={styles.calcButtonText}>.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.calcButton} onPress={() => handleNumberPress('0')}>
            <Text style={styles.calcButtonText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.calcButton, styles.equalsButton]} onPress={() => {
            const rrr = eval(amount);
            setAmount(rrr)
          }}>
            <Text style={styles.calcButtonText}>=</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.calcButton, styles.operatorButton]} onPress={() => handleNumberPress('+')}>
            <Text style={styles.calcButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={previewVisible} transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.9)',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Image
            source={{ uri: selectedImage }}
            style={{ width: '90%', height: '70%', resizeMode: 'contain' }}
          />

          <TouchableOpacity
            onPress={() => setPreviewVisible(false)}
            style={{ marginTop: 20 }}
          >
            <Text style={{ color: 'white', fontSize: 18 }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginVertical: 12,
    borderRadius: 8,
    alignSelf: 'center', width: '90%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },

  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  activeToggle: {
    backgroundColor: '#4CAF50',
  },

  toggleText: {
    color: '#4CAF50',
    fontWeight: '600',
  },

  activeToggleText: {
    color: '#fff',
  },

  dueDateContainer: {
    marginTop: 10, width: '90%', alignSelf: 'center'
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#81C784',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  imageWrapper: {
    margin: 5,
  },
  selectedImage: {
    width: 100,
    height: 100,
    resizeMode: 'stretch',
    borderRadius: 8, margin: 10
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  balanceText: {
    fontSize: 12,
    color: '#4CAF50',
  },
  securedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  securedText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '600',
    marginRight: 4,
  },
  lockIcon: {
    fontSize: 10,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  currencySymbol: {
    fontSize: 32,
    color: '#4CAF50',
    marginRight: 8,
  },
  amountDisplay: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  dateContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  dateLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  dropdownArrow: {
    fontSize: 16,
    color: '#666',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'center', width: '90%',
    marginBottom: 20,
  },
  addImagesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 0.48,
  },
  addBillButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  addImagesText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 8,
  },
  addBillText: {
    color: '#ffffff',
  },
  imagesContainer: {
    marginHorizontal: 24,
    marginBottom: 20,
  },
  imagesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  imagesScrollView: {
    paddingVertical: 8,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  noteInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    color: '#333333',
  },
  micButton: {
    padding: 8,
  },
  calculator: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  calculatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calcButton: {
    width: 70,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  operatorButton: {
    backgroundColor: '#E8F5E8',
  },
  equalsButton: {
    backgroundColor: '#4CAF50',
  },
  calcButtonText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  receivedButton: {
    flex: 1,
    backgroundColor: '#E8F5E8',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  givenButton: {
    flex: 1,
    backgroundColor: '#FFEBEE',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  receivedText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
  },
  givenText: {
    fontSize: 16,
    color: '#C62828',
    fontWeight: '600',
  },
});