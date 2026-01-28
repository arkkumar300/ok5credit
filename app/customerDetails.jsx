import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Linking,
  Animated,
  Alert,
  ScrollView,
  Platform
} from 'react-native';
import {
  PhoneCall,
  Delete,
  MessageSquare,
  Send,
  MessageCircle,
  ArrowDown,
  Percent,
  ArrowUp,
  ArrowLeft,
  CheckIcon,
  File,
  ChevronRight,
  Calendar
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Appbar, Divider } from 'react-native-paper';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';
import ErrorModal from './components/ErrorModal';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import Modal from 'react-native-modal';

// Modal component for discount
const DiscountModal = ({ visible, onClose, onSubmit, loading }) => {
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountNote, setDiscountNote] = useState('');
  const [animateOpacity] = useState(new Animated.Value(0));
  const [animateTranslate] = useState(new Animated.Value(50));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(animateOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(animateTranslate, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      animateOpacity.setValue(0);
      animateTranslate.setValue(50);
    }
  }, [visible]);

  const handleSubmit = () => {
    if (!discountAmount || isNaN(discountAmount) || parseFloat(discountAmount) <= 0) {
      Alert.alert('Invalid', 'Enter a valid discount amount');
      return;
    }
    
    onSubmit({
      amount: parseFloat(discountAmount),
      note: discountNote,
    });
    
    setDiscountAmount('');
    setDiscountNote('');
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      animationIn="fadeIn"
      animationOut="fadeOut"
      backdropOpacity={0.5}
    >
      <Animated.View
        style={[
          styles.modalContainer,
          {
            opacity: animateOpacity,
            transform: [{ translateY: animateTranslate }],
          },
        ]}
      >
        <Text style={styles.modalTitle}>Add Discount</Text>

        <TextInput
          placeholder="Enter discount amount"
          placeholderTextColor="#aaaaaa"
          keyboardType="numeric"
          value={discountAmount}
          onChangeText={setDiscountAmount}
          style={styles.input}
        />

        <TextInput
          placeholder="Note (optional)"
          placeholderTextColor="#aaaaaa"
          value={discountNote}
          onChangeText={setDiscountNote}
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <View style={styles.modalButtonRow}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={[styles.modalButtonText, styles.cancelButtonText]}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modalButton,
              styles.submitButton,
              loading && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={[styles.modalButtonText, styles.submitButtonText]}>
              {loading ? 'Saving...' : 'Submit'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

// Transaction Item Component
const TransactionItem = React.memo(({ item, personName, router, customer }) => {
  const isReceived = item.transaction_type === 'you_got' || item.transaction_type === 'you_discount';

  if (item.is_Deleted) {
    return (
      <View
        style={[
          styles.transactionWrapper,
          isReceived ? styles.leftContainer : styles.rightContainer,
        ]}
      >
        <View style={[styles.transactionBox, styles.deletedTransaction]}>
          <View style={styles.amountRow}>
            <Delete size={20} color="gray" />
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
    const encoded = encodeURIComponent(JSON.stringify(customer));
    router.push({
      pathname: '/billDetails',
      params: {
        billId: item.bill_id,
        customerInfo: encoded,
        bill: item.bill_id,
      },
    });
  };

  const renderImage = () => {
    let pics = item.transaction_pic;
    if (typeof pics === 'string') {
      try {
        pics = JSON.parse(pics);
      } catch {
        pics = [];
      }
    }
    if (!Array.isArray(pics)) pics = [];

    const url =
      pics?.length > 0
        ? pics[0]
        : 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg';

    return (
      <Image
        source={{ uri: url }}
        style={styles.transactionImage}
        resizeMode="contain"
      />
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.transactionWrapper,
        isReceived ? styles.leftContainer : styles.rightContainer,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
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

        {item?.bill_id && (
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

        {item?.transaction_pic?.length > 0 && (
          <>
            <Divider style={styles.divider} />
            <TouchableOpacity
              style={styles.imageRow}
              onPress={handlePress}
              activeOpacity={0.7}
            >
              {renderImage()}
              <Text style={[styles.amountText, styles.imageAmount]}>
                ₹ {item.amount}
              </Text>
              <ChevronRight size={24} color="green" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
});

export default function CustomerDetails() {
  const router = useRouter();
  const { personName, personType, personId } = useLocalSearchParams();
  
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customerMobile, setCustomerMobile] = useState('');
  const [isSubscribe_user, setIsSubscribe_user] = useState(null);
  const [subscribeEndAt_user, setSubscribeEndAt_user] = useState(null);
  const [credit_given_count_user, setCredit_given_count_user] = useState(0);
  const [payment_got_count_user, setPayment_got_count_user] = useState(0);
  const [subscribePlan, setSubscribePlan_user] = useState('');
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [dueDate, setDueDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const viewShotRef = useRef(null);

  const fetchCustomer = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        setError('User data not found');
        return;
      }
      
      const userId = JSON.parse(userData).id;
      const response = await ApiService.post(`/customers/${personId}`, { userId });
      const data = response.data;

      setCustomer(data.customer);
      setCustomerMobile(data.customer.mobile);
      setTransactions(data.transactions || []);
      
      // Fetch due date if exists
      if (data.customer.due_date) {
        setDueDate(new Date(data.customer.due_date));
      }
    } catch (err) {
      console.error('Error fetching customer:', err);
      setError('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  }, [personId]);

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
    fetchCustomer();
    fetchUserSubscription();
  }, [fetchCustomer, fetchUserSubscription]);

  const handleCall = () => {
    if (!customerMobile) {
      Alert.alert('Error', 'Phone number not available');
      return;
    }
    Linking.openURL(`tel:${customerMobile}`).catch(() => {
      Alert.alert('Error', 'Unable to make a call');
    });
  };

  const sendSMS = () => {
    if (!customerMobile) {
      Alert.alert('Error', 'Phone number not available');
      return;
    }

    const balance = Math.abs(customer?.current_balance || 0);
    const balanceType = Number(customer?.current_balance) > 0 ? 'Advance' : 'Due';
    
    const message = `Hi ${personName},
Your current balance is ₹${balance} ${balanceType}`;

    const smsUrl = `sms:${customerMobile}?body=${encodeURIComponent(message)}`;

    Linking.openURL(smsUrl).catch(() => {
      Alert.alert('Error', 'Unable to open SMS app');
    });
  };

  const openWhatsAppWithImage = async () => {
    if (!customerMobile) {
      Alert.alert('Error', 'Phone number not available');
      return;
    }

    try {
      const phone = `91${customerMobile}`;
      const message = `Hi ${personName}, please find your account details below.`;
      const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;

      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Error', 'WhatsApp not installed');
        return;
      }

      // Capture screenshot if ref exists
      if (viewShotRef.current) {
        await viewShotRef.current.capture();
      }

      Linking.openURL(url);
    } catch (error) {
      console.error('WhatsApp error:', error);
      Alert.alert('Error', 'Failed to open WhatsApp');
    }
  };

  const handleAddTransaction = async (transactionType) => {
    if (!isSubscribe_user) {
      if (transactionType === 'you_got' && payment_got_count_user >= 4) {
        setError('You have reached the limit for received transactions in Basic plan');
        return;
      }
      if (transactionType === 'you_gave' && credit_given_count_user >= 2) {
        setError('You have reached the limit for given transactions in Basic plan');
        return;
      }
    } else {
      const today = new Date();
      const endDate = new Date(subscribeEndAt_user);
      if (endDate < today) {
        setError('Your subscription has expired');
        return;
      }
    }

    router.push({
      pathname: '/transaction',
      params: {
        transactionType,
        transaction_for: 'customer',
        id: personId,
        mobile: customerMobile,
        personName: personName,
        isSubscribe_user,
        transaction_limit:
          transactionType === 'you_got' ? payment_got_count_user : credit_given_count_user,
      },
    });
  };

  const handleDiscountSubmit = async ({ amount, note }) => {
    setDiscountLoading(true);
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) throw new Error('User data not found');
      
      const userId = JSON.parse(userData).id;
      const date = moment().format('YYYY-MM-DD');

      const payload = {
        customer_id: customer.id,
        userId,
        transaction_type: 'you_discount',
        transaction_for: 'customer',
        amount: Number(amount),
        description: note,
        paidAmount: Number(amount),
        remainingAmount: Number(amount),
        transaction_date: date,
        paymentType: 'paid',
      };

      await ApiService.post('/transactions/customer', payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      Alert.alert('Success', 'Discount added successfully');
      await fetchCustomer();
      setShowDiscountModal(false);
    } catch (error) {
      console.error('Error adding discount:', error);
      Alert.alert('Error', 'Failed to add discount');
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleDateChange = async (event, selectedDate) => {
    setShowDatePicker(false);
    
    if (selectedDate) {
      setDueDate(selectedDate);
      
      try {
        const userData = await AsyncStorage.getItem('userData');
        const userId = JSON.parse(userData)?.id;

        const response = await ApiService.put(`/customers/${customer.id}`, {
          userId: Number(userId),
          due_date: selectedDate.toISOString(),
        });

        if (response.status === 200) {
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

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require('../assets/images/DataCaution.png')}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyText}>
        Customer transactions data is private and secure
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
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
        <Appbar.Content
          title={personName}
          titleStyle={styles.headerTitle}
        />
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/customerProfile',
              params: { ID: personId, profileType: 'customer' },
            })
          }
        >
          <Text style={styles.profileLink}>Customer Profile</Text>
        </TouchableOpacity>
      </Appbar.Header>

      <FlatList
        data={transactions}
        style={styles.list}
        renderItem={({ item }) => (
          <TransactionItem
            item={item}
            personName={personName}
            router={router}
            customer={customer}
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
          {customer?.current_balance < 0 && (
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
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowDiscountModal(true)}
          >
            <Percent size={24} color="#555" />
            <Text style={styles.actionText}>Discount</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={sendSMS}>
            <MessageCircle size={24} color="#555" />
            <Text style={styles.actionText}>SMS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={openWhatsAppWithImage}
          >
            <Send size={24} color="#25D366" />
            <Text style={styles.actionText}>WhatsApp</Text>
          </TouchableOpacity>
          
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
                  roleType: 'CUSTOMER',
                },
              })
            }
          >
            <MessageSquare size={24} color="#555" />
            <Text style={styles.actionText}>Ledgers</Text>
          </TouchableOpacity>
        </View>

        {isSubscribe_user === false && (
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
        )}

        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Balance Due</Text>
          <Text
            style={[
              styles.balanceAmount,
              customer?.current_balance > 0
                ? styles.positiveBalance
                : styles.negativeBalance,
            ]}
          >
            ₹ {Math.abs(customer?.current_balance || 0)}{' '}
            {Number(customer?.current_balance) > 0 ? 'Advance' : 'Due'}
          </Text>
        </View>

        <View style={styles.bottomButtonsRow}>
          <TouchableOpacity
            style={styles.receivedButton}
            onPress={() => handleAddTransaction('you_got')}
          >
            <Text style={styles.receivedText}>↓ Received</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.givenButton}
            onPress={() => handleAddTransaction('you_gave')}
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

      <DiscountModal
        visible={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onSubmit={handleDiscountSubmit}
        loading={discountLoading}
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
          {/* Add content you want to capture in screenshot */}
          <Text style={styles.screenshotText}>Customer: {personName}</Text>
          <Text style={styles.screenshotText}>
            Balance: ₹{Math.abs(customer?.current_balance || 0)}{' '}
            {customer?.current_balance > 0 ? 'Advance' : 'Due'}
          </Text>
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
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 2,
    borderColor: '#f2f7f6',
    justifyContent: 'space-between',
    elevation: 0,
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
    marginRight: 20,
  },
  list: {
    marginBottom: 50,
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
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    marginHorizontal: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    padding: 12,
    width: '48%',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  submitButton: {
    backgroundColor: '#2E7D32',
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#333',
  },
  submitButtonText: {
    color: '#fff',
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