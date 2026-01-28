import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  PhoneCall,
  MessageSquare,
  ArrowDown,
  Send,
  MessageCircle,
  ArrowUp,
  ArrowLeft,
  CheckIcon,
  File,
  ChevronRight,
  Calendar,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Appbar, Divider } from 'react-native-paper';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';
import ErrorModal from './components/ErrorModal';
import DateTimePicker from '@react-native-community/datetimepicker';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

// Transaction Item Component
const TransactionItem = React.memo(
  ({ item, personName, router, supplier, calculateBalance }) => {
    const isReceived = item.transaction_type === 'you_got';
    const balanceText = calculateBalance(item, isReceived);

    const handlePress = () => {
      router.push({
        pathname: '/transactionDetails',
        params: {
          transactionDetails: JSON.stringify(item),
          Name: personName,
        },
      });
    };

    const handleBillPress = () => {
      const encodedSupplierData = encodeURIComponent(JSON.stringify(supplier));
      router.push({
        pathname: '/billDetails',
        params: {
          billId: item.bill_id,
          supplierInfo: encodedSupplierData,
          bill: item.bill_id,
        },
      });
    };

    const renderTransactionImage = () => {
      let pics = item?.transaction_pic;
      try {
        if (typeof pics === 'string') {
          pics = JSON.parse(pics);
        }
      } catch (err) {
        console.log('Failed to parse transaction_pic:', err);
      }

      if (!Array.isArray(pics)) {
        pics = [];
      }

      const url =
        pics.length > 0
          ? pics[0]
          : 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg';

      return (
        <Image
          source={{ uri: url }}
          style={styles.transactionImage}
          resizeMode="cover"
        />
      );
    };

    if (item.is_Deleted) {
      return (
        <View
          style={[
            styles.transactionWrapper,
            isReceived ? styles.leftContainer : styles.rightContainer,
            styles.deletedTransaction,
          ]}
        >
          <View style={[styles.transactionBox, styles.deletedBox]}>
            <View style={styles.amountRow}>
              <CheckIcon size={20} color="gray" />
              <Text style={[styles.amountText, styles.deletedText]}>
                ₹ {item.amount}
              </Text>
            </View>
            <Text style={[styles.timeText, styles.deletedText]}>
              Deleted on: {moment(item.delete_date).format('DD/MM/YYYY')}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[
          styles.transactionWrapper,
          isReceived ? styles.leftContainer : styles.rightContainer,
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View>
          <View style={styles.transactionBox}>
            <View style={styles.amountRow}>
              {isReceived ? (
                <ArrowDown size={20} color="green" />
              ) : (
                <ArrowUp size={20} color="red" />
              )}
              <Text style={styles.amountText}>₹ {item.amount}</Text>
              <Text style={styles.timeText}>
                {moment(item.transaction_date).format('DD/MM/YYYY')}
              </Text>
              <CheckIcon size={20} color="green" style={styles.checkIcon} />
            </View>

            {item.bill_id && (
              <>
                <Divider style={styles.divider} />
                <TouchableOpacity
                  style={styles.billRow}
                  onPress={handleBillPress}
                  activeOpacity={0.7}
                >
                  <File size={24} color="green" />
                  <Text style={styles.billText}>{item.bill_id}</Text>
                  <Text style={[styles.amountText, styles.billAmount]}>
                    ₹ {item.amount}
                  </Text>
                  <ChevronRight size={24} color="green" />
                </TouchableOpacity>
              </>
            )}

            {item.transaction_pic && (
              <>
                <Divider style={styles.divider} />
                <TouchableOpacity
                  style={styles.imageRow}
                  onPress={handlePress}
                  activeOpacity={0.7}
                >
                  {renderTransactionImage()}
                  <Text style={[styles.amountText, styles.imageAmount]}>
                    ₹ {item.amount}
                  </Text>
                  <ChevronRight size={24} color="green" />
                </TouchableOpacity>
              </>
            )}
          </View>
          <Text style={styles.balanceNote}>{balanceText}</Text>
        </View>
      </TouchableOpacity>
    );
  }
);

export default function SupplierDetails() {
  const router = useRouter();
  const { personName, personType, personId } = useLocalSearchParams();
  const [isCapturing, setIsCapturing] = useState(false);
    const [supplier, setSupplier] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [supplierMobile, setSupplierMobile] = useState('');
  const [isSubscribe_user, setIsSubscribe_user] = useState(null);
  const [subscribeEndAt_user, setSubscribeEndAt_user] = useState(null);
  const [credit_given_count_user, setCredit_given_count_user] = useState(0);
  const [payment_got_count_user, setPayment_got_count_user] = useState(0);
  const [subscribePlan, setSubscribePlan_user] = useState('');
  const [dueDate, setDueDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [runningBalance, setRunningBalance] = useState(0);
  
  const viewShotRef = useRef(null);

  const fetchSupplier = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        setError('User data not found');
        return;
      }
      
      const userId = JSON.parse(userData).id;
      const response = await ApiService.post(`/supplier/${personId}`, { userId });
      const data = response.data;

      setSupplier(data.supplier);
      setSupplierMobile(data.supplier.mobile);
      setTransactions(data.transactions || []);
      
      if (data.supplier.due_date) {
        setDueDate(new Date(data.supplier.due_date));
      }
      
      if (data.supplier.id) {
        fetchSupplierDueDate(data.supplier.id);
      }
    } catch (err) {
      console.error('Error fetching supplier:', err);
      setError('Failed to load supplier data');
    } finally {
      setLoading(false);
    }
  }, [personId]);

  const fetchSupplierDueDate = async (supplierId) => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) return;
      
      const userId = JSON.parse(userData).id;
      const response = await ApiService.post(`/supplier/upcoming/DueDate`, {
        supplier_id: supplierId,
        user_id: userId,
      });
      
      if (response.data?.upcoming_due_date) {
        setDueDate(new Date(response.data.upcoming_due_date));
      }
    } catch (err) {
      console.error('Error fetching due date:', err);
    }
  };

  const fetchUserSubscription = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) return;

      const userId = JSON.parse(userData).id;
      const response = await ApiService.get(`/user/${userId}`);

      if (response.data) {
        const {
          isSubscribe,
          subscribeEndAt,
          credit_given_count,
          subscribePlan,
          payment_got_count,
        } = response.data;

        setIsSubscribe_user(isSubscribe);
        setSubscribeEndAt_user(subscribeEndAt);
        setCredit_given_count_user(credit_given_count || 0);
        setPayment_got_count_user(payment_got_count || 0);
        setSubscribePlan_user(subscribePlan || '');
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    }
  }, []);

  useEffect(() => {
    fetchSupplier();
    fetchUserSubscription();
  }, [fetchSupplier, fetchUserSubscription]);

  const handleCall = () => {
    if (!supplierMobile) {
      Alert.alert('Error', 'Phone number not available');
      return;
    }
    
    Linking.openURL(`tel:${supplierMobile}`).catch(() => {
      Alert.alert('Error', 'Unable to make a call');
    });
  };

  const sendSMS = useCallback(() => {
    if (!supplierMobile) {
      Alert.alert('Error', 'Phone number not available');
      return;
    }

    const balance = Math.abs(supplier?.current_balance || 0);
    const balanceType = Number(supplier?.current_balance) > 0 ? 'Advance' : 'Due';
    
    const message = `Hi ${personName},
Your current balance is ₹${balance} ${balanceType}`;

    const smsUrl = `sms:${supplierMobile}?body=${encodeURIComponent(message)}`;

    Linking.openURL(smsUrl).catch(() => {
      Alert.alert('Error', 'Unable to open SMS app');
    });
  }, [supplierMobile, supplier?.current_balance, personName]);

  const openWhatsAppWithImage = async () => {
    if (!supplierMobile) {
      Alert.alert('Error', 'Phone number not available');
      return;
    }

    try {
      setIsCapturing(true);
      
      // Wait a bit for UI to render properly
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Capture the screenshot
      if (!viewShotRef.current) {
        Alert.alert('Error', 'Cannot capture screenshot');
        return;
      }
      
      const uri = await viewShotRef.current.capture();
      
      if (!uri) {
        Alert.alert('Error', 'Failed to capture screenshot');
        return;
      }

      // Check if sharing is available
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      // Prepare the phone number
      let phone = supplierMobile;
      // Remove any non-digit characters
      phone = phone.replace(/\D/g, '');
      // Remove leading 0 if present
      if (phone.startsWith('0')) {
        phone = phone.substring(1);
      }
      // Ensure it starts with country code
      if (!phone.startsWith('91')) {
        phone = '91' + phone;
      }

      // Create a shareable message
      const balance = Math.abs(supplier?.current_balance || 0);
      const balanceType = Number(supplier?.current_balance) > 0 ? 'Advance' : 'Due';
      const message = `Hi ${personName}, please find your balance details attached.\n\nCurrent Balance: ₹${balance} ${balanceType}`;

      if (Platform.OS === 'android') {
        // **For Android: Use WhatsApp-specific sharing**
        try {
          // First, share the image
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share to WhatsApp',
            UTI: 'image/png',
          });
          
          // Then send the text separately if user wants
          const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
          const supported = await Linking.canOpenURL(whatsappUrl);
          if (supported) {
            // You could optionally open WhatsApp with the message
            // await Linking.openURL(whatsappUrl);
          }
        } catch (androidError) {
          console.error('Android share error:', androidError);
          // Fallback to direct WhatsApp link
          const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
          Linking.openURL(whatsappUrl);
        }
      } else {
        // **For iOS: Use direct WhatsApp link**
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        const supported = await Linking.canOpenURL(whatsappUrl);
        if (supported) {
          await Linking.openURL(whatsappUrl);
        } else {
          Alert.alert('Error', 'WhatsApp is not installed');
        }
      }
      
    } catch (error) {
      console.error('WhatsApp sharing error:', error);
      Alert.alert('Error', 'Failed to share: ' + error.message);
    } finally {
      setIsCapturing(false);
    }  };

  const checkTransactionEligibility = useCallback(
    (transactionType) => {
      if (isSubscribe_user) {
        const today = new Date();
        const endDate = new Date(subscribeEndAt_user);
        if (endDate < today) {
          setError('Your subscription has expired');
          return false;
        }
        return true;
      } else {
        if (transactionType === 'you_got' && payment_got_count_user >= 4) {
          setError('You have reached the limit for received transactions in Basic plan');
          return false;
        }
        if (transactionType === 'you_gave' && credit_given_count_user >= 2) {
          setError('You have reached the limit for given transactions in Basic plan');
          return false;
        }
        return true;
      }
    },
    [isSubscribe_user, subscribeEndAt_user, payment_got_count_user, credit_given_count_user]
  );

  const navigateToTransaction = useCallback(
    (transactionType) => {
      if (!checkTransactionEligibility(transactionType)) {
        return;
      }

      router.push({
        pathname: '/transaction',
        params: {
          transactionType,
          transaction_for: 'supplier',
          id: personId,
          mobile: supplierMobile,
          personName: personName,
          isSubscribe_user,
          transaction_limit:
            transactionType === 'you_got'
              ? payment_got_count_user
              : credit_given_count_user,
        },
      });
    },
    [
      checkTransactionEligibility,
      router,
      personId,
      supplierMobile,
      personName,
      isSubscribe_user,
      payment_got_count_user,
      credit_given_count_user,
    ]
  );

  const handleDateChange = async (event, selectedDate) => {
    setShowDatePicker(false);
    
    if (selectedDate && supplier) {
      setDueDate(selectedDate);
      
      try {
        const userData = await AsyncStorage.getItem('userData');
        const userId = JSON.parse(userData)?.id;

        const response = await ApiService.put(`/supplier/${supplier.id}`, {
          userId: Number(userId),
          due_date: selectedDate.toISOString(),
        });

        if (response.status === 200) {
          // Update transactions due dates
          const dueDatePayload = {
            supplier_id: supplier.id,
            isDuedateChange: true,
            dueDate: selectedDate.toISOString(),
          };

          await ApiService.put(
            `transactions/updateTransactions/DueDate`,
            dueDatePayload
          );

          Alert.alert('Success', 'Due date updated successfully');
        } else {
          Alert.alert('Error', 'Failed to update due date');
        }
      } catch (error) {
        console.error('Error updating date:', error);
        Alert.alert('Error', 'Failed to update due date');
      }
    }
  };

  const calculateBalance = useCallback(
    (item, isReceived) => {
      let balance = runningBalance;
      
      if (item.is_Deleted) {
        // Don't update balance for deleted transactions
        return balance < 0
          ? `${Math.abs(balance)} Due`
          : `${balance} Advance`;
      }

      if (isReceived) {
        balance += Number(item.amount);
      } else {
        balance -= Number(item.amount);
      }

      setRunningBalance(balance);
      
      return balance < 0
        ? `${Math.abs(balance)} Due`
        : `${balance} Advance`;
    },
    [runningBalance]
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require('../assets/images/DataCaution.png')}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyText}>
        Supplier transactions data is private and secure
      </Text>
    </View>
  );

  const renderPlanInfo = () => {
    if (isSubscribe_user === false) {
      return (
        <>
          <Divider style={styles.planDivider} />
          <View style={styles.planInfo}>
            <Text style={styles.planName}>
              {isSubscribe_user === false ? 'Basic Plan' : subscribePlan}
            </Text>
            <Text style={styles.planLimit}>
              Receive: {payment_got_count_user} / 4
            </Text>
            <Text style={styles.planLimit}>
              Give: {credit_given_count_user} / 2
            </Text>
          </View>
          <Divider style={styles.planDivider} />
        </>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading supplier details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <TouchableOpacity onPress={() => router.push('./dashboard')}>
          <ArrowLeft size={24} color="#2E7D32" />
        </TouchableOpacity>
        <Appbar.Content title={personName} titleStyle={styles.headerTitle} />
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/customerProfile',
              params: { ID: personId, profileType: 'supplier' },
            })
          }
        >
          <Text style={styles.profileLink}>Supplier Profile</Text>
        </TouchableOpacity>
      </Appbar.Header>

      <FlatList
        data={transactions}
        renderItem={({ item }) => (
          <TransactionItem
            item={item}
            personName={personName}
            router={router}
            supplier={supplier}
            calculateBalance={calculateBalance}
          />
        )}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyList}
      />

      {/* Bottom Section */}
      <View style={styles.bottomContainer}>
        <View style={styles.actionsRow}>
          {supplier?.current_balance < 0 && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={24} color="#555" />
              <Text style={styles.actionText}>
                {dueDate ? dueDate.toLocaleDateString() : 'Due Date'}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <PhoneCall size={24} color="#555" />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              router.push({
                pathname: '/customerLedger',
                params: {
                  personId: personId,
                  personName: personName,
                  roleType: 'SUPPLIER',
                },
              })
            }
          >
            <MessageSquare size={24} color="#555" />
            <Text style={styles.actionText}>Ledgers</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={sendSMS}>
            <MessageCircle size={24} color="#555" />
            <Text style={styles.actionText}>SMS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={openWhatsAppWithImage} // Most reliable option
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator size="small" color="#25D366" />
            ) : (
              <Send size={24} color="#25D366" />
            )}
            <Text style={styles.actionText}>
              {isCapturing ? 'Preparing...' : 'WhatsApp'}
            </Text>
          </TouchableOpacity>
        </View>

        {renderPlanInfo()}

        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Balance Due</Text>
          <Text
            style={[
              styles.balanceAmount,
              supplier?.current_balance > 0
                ? styles.positiveBalance
                : styles.negativeBalance,
            ]}
          >
            ₹ {Math.abs(supplier?.current_balance || 0)}{' '}
            {Number(supplier?.current_balance) > 0 ? 'Advance' : 'Due'}
          </Text>
        </View>

        <View style={styles.bottomButtonsRow}>
          <TouchableOpacity
            style={styles.receivedButton}
            onPress={() => navigateToTransaction('you_got')}
          >
            <Text style={styles.receivedText}>↓ Received</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.givenButton}
            onPress={() => navigateToTransaction('you_gave')}
          >
            <Text style={styles.givenText}>↑ Given</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      <ErrorModal
        visible={!!error}
        message={error}
        onClose={() => setError(null)}
      />

      <ViewShot
        ref={viewShotRef}
        options={{
          format: 'png',
          quality: 0.9,
        }}
        style={styles.hiddenView}
      >
        <View style={styles.screenshotContent}>
          <Text style={styles.screenshotText}>Supplier: {personName}</Text>
          <Text style={styles.screenshotText}>
            Balance: ₹{Math.abs(supplier?.current_balance || 0)}{' '}
            {supplier?.current_balance > 0 ? 'Advance' : 'Due'}
          </Text>
          {dueDate && supplier?.current_balance < 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Due Date:</Text>
                <Text style={styles.infoValue}>{dueDate.toLocaleDateString()}</Text>
              </View>
          )}
        </View>
      </ViewShot>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 2,
    borderColor: '#f2f7f6',
    justifyContent: 'space-between',
    elevation: 0,
    paddingHorizontal: 10,
  },
  headerTitle: {
    color: '#333333',
    fontSize: 18,
    fontWeight: 'bold',
    marginStart: 10,
  },
  profileLink: {
    color: '#388E3C',
    fontSize: 13,
    fontWeight: '500',
    marginRight: 10,
  },
  listContent: {
    paddingBottom: 180,
    paddingTop: 20,
    paddingHorizontal: 10,
  },
  transactionWrapper: {
    marginVertical: 8,
  },
  leftContainer: {
    alignItems: 'flex-start',
  },
  rightContainer: {
    alignItems: 'flex-end',
  },
  transactionBox: {
    width: '90%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#fff',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  deletedTransaction: {
    opacity: 0.6,
  },
  deletedBox: {
    backgroundColor: '#f5f5f5',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkIcon: {
    marginHorizontal: 5,
  },
  amountText: {
    fontSize: 18,
    color: '#333',
    marginLeft: 8,
  },
  deletedText: {
    color: 'gray',
  },
  timeText: {
    fontSize: 16,
    color: 'gray',
    marginLeft: 8,
  },
  balanceNote: {
    fontSize: 13,
    color: 'gray',
    marginTop: 4,
  },
  divider: {
    marginVertical: 5,
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  billText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  billAmount: {
    fontWeight: '600',
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  transactionImage: {
    width: 80,
    height: 80,
    borderRadius: 3,
  },
  imageAmount: {
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyImage: {
    width: '90%',
    height: 150,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f2f7f6',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#E8F5E9',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionText: {
    marginTop: 6,
    fontSize: 13,
    color: '#444',
  },
  planDivider: {
    height: 0.5,
    width: '100%',
    marginVertical: 3,
    backgroundColor: '#388E3C90',
  },
  planInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    color: '#388E3C90',
    fontWeight: '600',
    fontSize: 12,
    textTransform: 'capitalize',
    margin: 5,
  },
  planLimit: {
    fontSize: 12,
    borderRadius: 5,
    fontWeight: 'bold',
    color: '#888',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#777',
    marginRight: 6,
    marginTop: 8,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  positiveBalance: {
    color: '#388E3C',
  },
  negativeBalance: {
    color: '#d32f2f',
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receivedButton: {
    backgroundColor: '#E8F5E9',
    borderColor: '#388E3C',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 26,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  givenButton: {
    backgroundColor: '#FFEBEE',
    borderColor: '#D32F2F',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 26,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  receivedText: {
    color: '#388E3C',
    fontWeight: '600',
    fontSize: 14,
  },
  givenText: {
    color: '#D32F2F',
    fontWeight: '600',
    fontSize: 14,
  },
  hiddenView: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  screenshotContent: {
    padding: 20,
    backgroundColor: '#fff',
  },
  screenshotText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
});