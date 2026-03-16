import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Image, Linking, Animated, Alert, ScrollView, Platform, StatusBar, SectionList } from 'react-native';
import { PhoneCall, Bell, Delete, MessageSquare, Send, MessageCircle, Clock, CheckCircle, ArrowDown, Percent, ArrowUp, ArrowLeft, CheckIcon, File, ChevronRight, Calendar, HelpCircle, DeleteIcon, AlertTriangle, CircleDollarSign, XCircle } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Appbar, Divider } from 'react-native-paper';
import moment from 'moment';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';
import ErrorModal from './components/ErrorModal';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import Modal from 'react-native-modal';
import { AuthContext } from './components/AuthContext';

// Function to format date for section headers (WhatsApp style)
const formatSectionDate = (date) => {
  const inputDate = moment(date);
  const today = moment().startOf('day');
  const yesterday = moment().subtract(1, 'days').startOf('day');
  const lastWeek = moment().subtract(7, 'days').startOf('day');

  if (inputDate.isSame(today, 'd')) {
    return 'Today';
  } else if (inputDate.isSame(yesterday, 'd')) {
    return 'Yesterday';
  } else if (inputDate.isAfter(lastWeek)) {
    return inputDate.format('dddd'); // Returns day name (Monday, Tuesday, etc.)
  } else {
    return inputDate.format('DD MMM YYYY'); // Returns date like 15 Mar 2024
  }
};

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
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          value={discountAmount}
          onChangeText={setDiscountAmount}
          style={styles.input}
        />

        <TextInput
          placeholder="Note (optional)"
          placeholderTextColor="#94A3B8"
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
const TransactionItem = React.memo(({ item, personName, router, customer, userDetails }) => {
  const isReceived = item.transaction_type === 'you_got' || item.transaction_type === 'you_discount';
  const isApproved = item.is_Approved;
  const status = item.status;
  const balanceText = item.balanceText;

  // Format time only (like WhatsApp)
  const formattedTime = item.created_at ? moment(item.created_at).format('hh:mm A') : '';

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
        mobile: customer.mobile,
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

  const parseTransactionImages = (pics) => {
    try {
      if (typeof pics === "string") {
        pics = JSON.parse(pics);
      }

      if (Array.isArray(pics) && typeof pics[0] === "string") {
        pics = JSON.parse(pics[0]);
      }

      return Array.isArray(pics) ? pics : [];
    } catch {
      return [];
    }
  };

  const renderImage = () => {
    const images = parseTransactionImages(item?.transaction_pic);

    const url =
      images.length > 0
        ? images[0]
        : "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg";

    return (
      <Image
        source={{ uri: url }}
        style={styles.transactionImage}
        resizeMode="stretch"
      />
    );
  };

  const getEmployeeStatusIcon = () => {
    switch (status) {
      case "approved":
        return <CheckCircle size={16} color="#4CAF50" />;
      case "rejected":
        return <XCircle size={16} color="#F44336" />;
      case "collected":
        return <CircleDollarSign size={16} color="#B8860B" />;
      case "pending":
      default:
        return <Clock size={16} color="#FF9800" />;
    }
  };

  // Get status icon based on approval
  const getStatusIcon = () => {
    if (isApproved) {
      return <CheckCircle size={16} color="#4CAF50" />;
    } else {
      return <Clock size={16} color="#FF9800" />;
    }
  };

  // Check if transaction has discount message
  const hasDiscountMessage = item.transaction_type === 'you_discount' ||
    (item.description && item.description.toLowerCase().includes('discount'));

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
        <View style={styles.messageHeader}>
          <View style={styles.amountContainer}>
            {isReceived ? (
              <ArrowDown size={16} color="#4CAF50" />
            ) : (
              <ArrowUp size={16} color="#F44336" />
            )}
            <Text style={[
              styles.amountText,
              isReceived ? styles.receivedAmount : styles.sentAmount
            ]}>
              ₹ {parseFloat(item.amount).toFixed(2)}
            </Text>
          </View>

          {/* Time display like WhatsApp */}
          <Text style={styles.timeText}>{formattedTime}</Text>

          {userDetails?.role === "employee" ? (
            <View style={styles.statusContainer}>
              {getEmployeeStatusIcon()}
              <Text style={styles.statusText}>
                {item?.status || ""}
              </Text>
            </View>
          ) : item.transaction_type === "you_gave" ? (
            <View style={styles.statusContainer}>
              {getStatusIcon()}
              <Text style={styles.statusText}>
                {isApproved ? "Approved" : "Pending"}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Discount Message */}
        {hasDiscountMessage && item.description && (
          <View style={styles.discountMessageContainer}>
            <MessageCircle size={12} color="#0A4D3C" />
            <Text style={styles.discountMessageText} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        )}

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
      <Text style={styles.balanceNote}>
        {balanceText ? balanceText : ""}
      </Text>
    </TouchableOpacity>
  );
});

// Section Header Component (WhatsApp style)
const SectionHeader = ({ title }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionHeaderText}>{title}</Text>
  </View>
);

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
  const [userDetails, setUserDetails] = useState(null);

  const { subscription } = useContext(AuthContext);

  const isSubscribed =
    subscription &&
    subscription.is_active &&
    new Date(subscription.end_date) >= new Date();

  const fetchCustomer = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        setError('User data not found');
        return;
      }

      const userId = JSON.parse(userData).id;
      const ownerId = JSON.parse(userData).owner_user_id;
      const response = await ApiService.post(`/customers/${personId}`, { userId, ownerId });
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

  const getUser = async () => {
    const userData = await AsyncStorage.getItem("userData");
    if (userData) {
      setUserDetails(JSON.parse(userData));
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCustomer();
      fetchUserSubscription();
      getUser();
    }, [fetchCustomer, fetchUserSubscription])
  );

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

  const navigateToDefaulter = () => {
    router.push({
      pathname: '/defaulterDetails',
      params: {
        customerId: personId,
        customerName: personName,
      },
    });
  };

  const handleAddTransaction = async (transactionType) => {
    if (!isSubscribe_user) {
      if (transactionType === 'you_got' && payment_got_count_user >= 30) {
        setError('You have reached the limit for received transactions in Basic plan');
        return;
      }
      if (transactionType === 'you_gave' && credit_given_count_user >= 30) {
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
        userAmountStatus: `₹ ${Math.abs(customer?.current_balance || 0)} ${Number(customer?.current_balance) > 0 ? 'Advance' : 'Due'}`,
        transaction_limit: transactionType === 'you_got' ? payment_got_count_user : credit_given_count_user,
      },
    });
  };

  const handleDiscountSubmit = async ({ amount, note }) => {
    setDiscountLoading(true);
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) throw new Error('User data not found');

      const userId = JSON.parse(userData).id;
      const ownerId = JSON.parse(userData).owner_user_id;
      const date = moment().format('YYYY-MM-DD');

      // Create discount message with formatted date
      const formattedDate = formatSectionDate(new Date());
      const discountMessage = note
        ? `Discount of ₹${amount} applied on ${formattedDate}${note ? ` - ${note}` : ''}`
        : `Discount of ₹${amount} applied on ${formattedDate}`;

      const payload = {
        customer_id: customer.id,
        userId,
        ownerId,
        created_user: userId,
        transaction_type: 'you_discount',
        transaction_for: 'customer',
        amount: Number(amount),
        description: discountMessage,
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
        source={require('../assets/images/no.png')}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyText}>
        Customer transactions data is private and secure
      </Text>
    </View>
  );

  // Group transactions by date for section list (WhatsApp style)
  const groupedTransactions = useMemo(() => {
    const groups = {};

    transactions.forEach((item) => {
      const date = item.transaction_date || item.created_at;
      if (!date) return;

      const sectionTitle = formatSectionDate(date);

      if (!groups[sectionTitle]) {
        groups[sectionTitle] = [];
      }

      groups[sectionTitle].push(item);
    });

    // Sort groups by date (most recent first)
    const sortedGroups = Object.keys(groups).sort((a, b) => {
      // Custom sorting for Today, Yesterday, etc.
      const dateA = groups[a][0]?.transaction_date || groups[a][0]?.created_at;
      const dateB = groups[b][0]?.transaction_date || groups[b][0]?.created_at;
      return moment(dateB).diff(moment(dateA));
    });

    return sortedGroups.map(title => ({
      title,
      data: groups[title]
    }));
  }, [transactions]);

  const transactionsWithBalance = useMemo(() => {
    let balance = 0;

    return transactions.map((item) => {
      if (!item.is_Deleted) {
        balance +=
          item.transaction_type === 'you_got' || item.transaction_type === 'you_discount'
            ? Number(item.amount)
            : -Number(item.amount);
      }

      return {
        ...item,
        runningBalance: balance,
        balanceText:
          balance < 0
            ? `${Math.abs(balance)} Due`
            : `${balance} Advance`,
      };
    });
  }, [transactions]);

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
      <StatusBar barStyle="light-content" backgroundColor="#0A4D3C" />

      {/* Premium Header */}
      <View style={styles.headerSolid}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('./dashboard')}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{personName}</Text>
            <Text style={styles.headerSubtitle}>Customer Details</Text>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() =>
              router.push({
                pathname: '/customerProfile',
                params: { ID: personId, profileType: 'customer' },
              })
            }
          >
            <Text style={styles.profileButtonText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      <SectionList
        sections={groupedTransactions}
        style={styles.list}
        renderItem={({ item }) => (
          <TransactionItem
            item={item}
            personName={personName}
            router={router}
            userDetails={userDetails}
            customer={customer}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <SectionHeader title={title} />
        )}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyList}
        stickySectionHeadersEnabled={false}
      />

      {/* Premium Bottom Section */}
      <View style={styles.bottomContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionsScrollContent}
        >
          <View style={styles.actionsRow}>
            {customer?.current_balance < 0 && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowDatePicker(true)}
              >
                <View style={styles.actionIconContainer}>
                  <Calendar size={18} color="#0A4D3C" />
                </View>
                <Text style={styles.actionText}>
                  {dueDate ? moment(dueDate).format('DD/MM/YY') : 'Due Date'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowDiscountModal(true)}
            >
              <View style={styles.actionIconContainer}>
                <Percent size={18} color="#0A4D3C" />
              </View>
              <Text style={styles.actionText}>Discount</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={sendSMS}>
              <View style={styles.actionIconContainer}>
                <MessageCircle size={18} color="#0A4D3C" />
              </View>
              <Text style={styles.actionText}>SMS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={openWhatsAppWithImage}
            >
              <View style={styles.actionIconContainer}>
                <Send size={18} color="#0A4D3C" />
              </View>
              <Text style={styles.actionText}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
              <View style={styles.actionIconContainer}>
                <PhoneCall size={18} color="#0A4D3C" />
              </View>
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={navigateToDefaulter}
            >
              <View style={styles.actionIconContainer}>
                <AlertTriangle size={18} color="#0A4D3C" />
              </View>
              <Text style={styles.actionText}>Defaulter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('./help')}
            >
              <View style={styles.actionIconContainer}>
                <HelpCircle size={18} color="#0A4D3C" />
              </View>
              <Text style={styles.actionText}>Help</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push({
                pathname: '/deleteCustomer',
                params: {
                  transaction_for: 'customer',
                  id: personId,
                },
              })}
            >
              <View style={styles.actionIconContainer}>
                <DeleteIcon size={18} color="#0A4D3C" />
              </View>
              <Text style={styles.actionText}>Delete</Text>
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
              <View style={styles.actionIconContainer}>
                <MessageSquare size={18} color="#0A4D3C" />
              </View>
              <Text style={styles.actionText}>Ledgers</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {isSubscribe_user === false && (
          <>
            <View style={styles.planDivider} />
            <View style={styles.planInfo}>
              <View style={styles.planBadge}>
                <Text style={styles.planName}>Basic Plan</Text>
              </View>
              <View style={styles.planLimits}>
                <Text style={styles.planLimit}>
                  Receive: <Text style={styles.planLimitValue}>{payment_got_count_user}/4</Text>
                </Text>
                <Text style={styles.planLimit}>
                  Give: <Text style={styles.planLimitValue}>{credit_given_count_user}/2</Text>
                </Text>
              </View>
            </View>
            <View style={styles.planDivider} />
          </>
        )}

        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <View style={styles.balanceCard}>
            <Text
              style={[
                styles.balanceAmount,
                customer?.current_balance > 0
                  ? styles.positiveBalance
                  : styles.negativeBalance,
              ]}
            >
              ₹ {Math.abs(customer?.current_balance || 0)}
            </Text>
            <View style={[
              styles.balanceTypeBadge,
              { backgroundColor: customer?.current_balance > 0 ? 'rgba(10,77,60,0.1)' : 'rgba(220,38,38,0.1)' }
            ]}>
              <Text style={[
                styles.balanceTypeText,
                { color: customer?.current_balance > 0 ? '#0A4D3C' : '#DC2626' }
              ]}>
                {Number(customer?.current_balance) > 0 ? 'Advance' : 'Due'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomButtonsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.receivedButton]}
            onPress={() => handleAddTransaction('you_got')}
          >
            <ArrowDown size={18} color="#0A4D3C" />
            <Text style={styles.receivedText}>Received</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.givenButton]}
            onPress={() => handleAddTransaction('you_gave')}
          >
            <ArrowUp size={18} color="#DC2626" />
            <Text style={styles.givenText}>Given</Text>
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
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#0A4D3C',
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
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  profileButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  profileButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 280,
    paddingTop: 10,
    paddingHorizontal: 12,
  },
sectionHeader: {
  backgroundColor: 'rgba(10,77,60,0.08)',
  paddingVertical: 6,
  paddingHorizontal: 16,
  marginTop: 16,
  marginBottom: 8,
  borderRadius: 20,
  alignSelf: 'center',
  borderWidth: 1,
  borderColor: 'rgba(10,77,60,0.2)',
  width: 120, // Fixed width
  alignItems: 'center',
  justifyContent: 'center',
},

sectionHeaderText: {
  fontSize: 13,
  fontWeight: '600',
  color: '#0A4D3C',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  textAlign: 'center',
  width: '100%', // Take full width of parent
},
  transactionWrapper: {
    marginVertical: 4,
  },
  leftContainer: {
    alignItems: 'flex-start',
  },
  rightContainer: {
    alignItems: 'flex-end',
  },
  transactionBox: {
    width: '70%',
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.1)',
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deletedTransaction: {
    opacity: 0.6,
    backgroundColor: '#F8FAFC',
    borderColor: 'rgba(0,0,0,0.1)',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  deletedText: {
    color: '#94A3B8',
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 8,
  },
  discountMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(10,77,60,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 6,
    marginBottom: 4,
    gap: 6,
  },
  discountMessageText: {
    flex: 1,
    fontSize: 11,
    color: '#0A4D3C',
    fontWeight: '500',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  receivedAmount: {
    color: '#0A4D3C',
  },
  sentAmount: {
    color: '#DC2626',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10,77,60,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  divider: {
    marginVertical: 8,
    backgroundColor: 'rgba(10,77,60,0.1)',
    height: 1,
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  billText: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  billAmount: {
    fontWeight: '600',
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  transactionImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  imageAmount: {
    fontWeight: '600',
  },
  balanceNote: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyImage: {
    width: '150',
    height: 300,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 20,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },
  actionsScrollContent: {
    paddingBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10,77,60,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '500',
  },
  planDivider: {
    height: 1,
    backgroundColor: 'rgba(10,77,60,0.1)',
    marginVertical: 10,
  },
  planInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planBadge: {
    backgroundColor: 'rgba(10,77,60,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  planName: {
    color: '#0A4D3C',
    fontWeight: '600',
    fontSize: 12,
  },
  planLimits: {
    flexDirection: 'row',
    gap: 16,
  },
  planLimit: {
    fontSize: 11,
    color: '#64748B',
  },
  planLimitValue: {
    fontWeight: '700',
    color: '#0A4D3C',
  },
  balanceRow: {
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.1)',
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  positiveBalance: {
    color: '#0A4D3C',
  },
  negativeBalance: {
    color: '#DC2626',
  },
  balanceTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  balanceTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  receivedButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,77,60,0.1)',
    paddingVertical: 12,
    borderRadius: 30,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.2)',
  },
  givenButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(220,38,38,0.1)',
    paddingVertical: 12,
    borderRadius: 30,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.2)',
  },
  receivedText: {
    color: '#0A4D3C',
    fontWeight: '600',
    fontSize: 14,
  },
  givenText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 14,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A4D3C',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.2)',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 16,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  submitButton: {
    backgroundColor: '#0A4D3C',
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#64748B',
  },
  submitButtonText: {
    color: '#FFFFFF',
  },
  hiddenView: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  screenshotContent: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  screenshotText: {
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 10,
  },
});