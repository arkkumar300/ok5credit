import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, Alert, ScrollView, Image, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Camera, Paperclip as PaperclipIcon, Mic, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';

export default function TransactionScreen() {
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState(moment().format('DD MMM YYYY'));
  const [activeType, setActiveType] = useState(null);
  const [images, setImages] = useState("");
  const [imageUri, setImageUri] = useState("");
  const [billID, setBillID] = useState("");
  const router = useRouter();
  const { transactionType, transaction_for, id, personName } = useLocalSearchParams();

  const handleNumberPress = (num) => {
    if (amount === '0') {
      setAmount(num);
    } else {
      setAmount(amount + num);
    }
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
      console.log('Upload success:', rrr);
      return rrr;
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Upload Failed', 'Could not upload image');
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

  const addTransaction = async () => {
    const date = moment().format('YYYY-MM-DD'); // Today's date
    const userData = await AsyncStorage.getItem("userData");
    const userId = JSON.parse(userData).id;
    const transactionFor = transaction_for === 'customer' ? 'customer' : 'supplier';

    const commonPayload = {
      userId: userId,
      transaction_type: transactionType,
      transaction_for: transactionFor,
      amount: Number(amount),
      description: note,
      transaction_date: date,
      ...(imageUri ? { transaction_pic: imageUri } : {}),
      ...(billID ? { bill_id: billID } : {}),
    };

    const payload =
      transactionFor === 'customer'
        ? { ...commonPayload, customer_id: id } // Replace with actual customer_id
        : { ...commonPayload, supplier_id: id }; // Replace with actual supplier_id

    const url =
      transactionFor === 'customer'
        ? '/transactions/customer'
        : '/transactions/supplier';

    try {
      console.log("transactionType ::", transaction_for);
      const response = await ApiService.post(url, payload);
      Alert.alert('Success', 'Transaction added successfully!');
      if (transactionFor === 'customer') {
        router.push({
          pathname: '/customerDetails',
          params: {
            personName: personName,
            personType: transaction_for,
            personId: id
          }
        });
      } else if (transactionFor === 'supplier') {
        router.push({
          pathname: '/supplierDetails',
          params: {
            personName: personName,
            personType: transaction_for,
            personId: id
          }
        });
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to add transaction');
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
        { text: 'Camera', onPress: openCamera },
        { text: 'Gallery', onPress: openGallery },
        { text: 'Cancel', style: 'cancel' }
      ],
      { cancelable: true }
    );
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
        cameraType: ImagePicker.CameraType.back,
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
      } else {
        console.log('Camera cancelled or no image captured');
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
      } else {
        console.log('Gallery cancelled or no image selected');
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
  };

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

        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>₹</Text>
          <Text style={styles.amountDisplay}>{amount}</Text>
        </View>

        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Date</Text>
          <View style={styles.dateSelector}>
            <Text style={styles.dateText}>{selectedDate}</Text>
            <Text style={styles.dropdownArrow}>⌄</Text>
          </View>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.addImagesButton} onPress={showImagePickerOptions}>
            <Camera size={20} color="#4CAF50" />
            <Text style={styles.addImagesText}>Add Images</Text>
          </TouchableOpacity>
          {transactionType === 'you_gave' && transaction_for === 'customer'&&
            <TouchableOpacity
              style={[styles.addImagesButton, styles.addBillButton, { marginLeft: 20 }]}
              onPress={() => {
                router.push({
                  pathname: '/billGenaration',params:{customerId:id,bill_type:"BILL"}
                });
              }}
            >
              <PaperclipIcon size={20} color="#ffffff" />
              <Text style={[styles.addImagesText, styles.addBillText]}>Add Bill</Text>
            </TouchableOpacity>}
        </View>

        {images && (
          <View style={styles.imagesContainer}>
            <Text style={styles.imagesTitle}>Selected Images </Text>
            <View style={styles.imageWrapper}>
              <Image source={{ uri: imageUri }} style={styles.selectedImage} />
            </View>
          </View>
        )}

        <View style={styles.noteContainer}>
          <TextInput
            style={styles.noteInput}
            placeholder="Add Note (Optional)"
            value={note}
            onChangeText={setNote}
            multiline
          />
          <TouchableOpacity style={styles.micButton}>
            <Mic size={20} color="#666" />
          </TouchableOpacity>
        </View>

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
              <Text style={styles.calcButtonText}>×</Text>
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
            <TouchableOpacity style={[styles.calcButton, styles.operatorButton]}>
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
            <TouchableOpacity style={[styles.calcButton, styles.equalsButton]}>
              <Text style={styles.calcButtonText}>=</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.calcButton, styles.operatorButton]}>
              <Text style={styles.calcButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.receivedButton}
            onPress={() => addTransaction()}
          >
            <Text style={styles.receivedText}>Submit</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
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
    marginHorizontal: 30, alignSelf: 'center',
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
  selectedImage: {
    width: '90%',
    height: 200, resizeMode: 'stretch',
    borderRadius: 8, margin: 10,
    backgroundColor: '#f0f0f0',
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
    color: '#333',
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