import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {View,Text,StyleSheet,FlatList,SafeAreaView,TouchableOpacity,Image,Linking,Alert,Platform,ActivityIndicator,StatusBar,ScrollView} from 'react-native';
import {PhoneCall,MessageSquare,ArrowDown,Send,MessageCircle,ArrowUp,ArrowLeft,CheckCircle,File,ChevronRight,Calendar,DeleteIcon,Clock,Percent,HelpCircle,AlertTriangle} from 'lucide-react-native';
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
  ({ item, personName, router, supplier }) => {
    const isReceived = item.transaction_type === 'you_got';
    const balanceText = item.balanceText
    const isApproved = item.is_Approved;
   
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
              <CheckCircle size={20} color="#94A3B8" />
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
          resizeMode="cover"
        />
      );
    };

    const getStatusIcon = () => {
      if (isApproved) {
        return <CheckCircle size={14} color="#0A4D3C" />;
      } else {
        return <Clock size={14} color="#F59E0B" />;
      }
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
          <View style={styles.messageHeader}>
            <View style={styles.amountContainer}>
              {isReceived ? (
                <ArrowDown size={16} color="#0A4D3C" />
              ) : (
                <ArrowUp size={16} color="#DC2626" />
              )}
              <Text style={[
                styles.amountText,
                isReceived ? styles.receivedAmount : styles.sentAmount
              ]}>
                ₹ {parseFloat(item.amount).toFixed(2)}
              </Text>
            </View>
            {item.transaction_type === 'you_gave' && (
              <View style={styles.statusContainer}>
                {getStatusIcon()}
                <Text style={styles.statusText}>
                  {isApproved ? 'Approved' : 'Pending'}
                </Text>
              </View>
            )}
          </View>

          {item?.bill_id && (
            <>
              <Divider style={styles.divider} />
              <TouchableOpacity
                style={styles.billRow}
                onPress={handleBillPress}
                activeOpacity={0.7}
              >
                <File size={20} color="#0A4D3C" />
                <Text style={styles.billText} numberOfLines={1}>{item.bill_id}</Text>
                <Text style={[styles.amountText, styles.billAmount]}>
                  ₹ {item.amount}
                </Text>
                <ChevronRight size={18} color="#0A4D3C" />
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
                <ChevronRight size={18} color="#0A4D3C" />
              </TouchableOpacity>
            </>
          )}
        </View>
        <Text style={styles.balanceNote}>{balanceText}</Text>
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
  // const [runningBalance, setRunningBalance] = useState(0);

  const viewShotRef = useRef(null);

  const fetchSupplier = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        setError('User data not found');
        return;
      }

      const userId = JSON.parse(userData).id;
      const ownerId = JSON.parse(userData).owner_user_id;

      const response = await ApiService.post(`/supplier/${personId}`, { userId, ownerId });
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

  const transactionsWithBalance = useMemo(() => {
    let balance = 0;

    return transactions.map((item) => {
      if (!item.is_Deleted) {
        balance +=
          item.transaction_type === 'you_got'
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
  }, [personId]);

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
    }
  };

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
        if (transactionType === 'you_got' && payment_got_count_user >= 6) {
          setError('You have reached the limit for received transactions in Basic plan');
          return false;
        }
        if (transactionType === 'you_gave' && credit_given_count_user >= 4) {
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
          userAmountStatus: `₹ ${Math.abs(supplier?.current_balance || 0)} ${Number(supplier?.current_balance) > 0 ? 'Advance' : 'Due'}`,
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

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require('../assets/images/NoTransaction.png')}
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
            <Text style={styles.headerSubtitle}>Supplier Details</Text>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() =>
              router.push({
                pathname: '/customerProfile',
                params: { ID: personId, profileType: 'supplier' },
              })
            }
          >
            <Text style={styles.profileButtonText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={transactionsWithBalance}
        style={styles.list}
        renderItem={({ item }) => (
          <TransactionItem
            item={item}
            personName={personName}
            router={router}
            supplier={supplier}
          />
        )}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyList}
      />

      {/* Premium Bottom Section */}
      <View style={styles.bottomContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionsScrollContent}
        >
          <View style={styles.actionsRow}>
            {supplier?.current_balance < 0 && (
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

            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
              <View style={styles.actionIconContainer}>
                <PhoneCall size={18} color="#0A4D3C" />
              </View>
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
              <View style={styles.actionIconContainer}>
                <MessageSquare size={18} color="#0A4D3C" />
              </View>
              <Text style={styles.actionText}>Ledgers</Text>
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
              disabled={isCapturing}
            >
              <View style={styles.actionIconContainer}>
                {isCapturing ? (
                  <ActivityIndicator size="small" color="#0A4D3C" />
                ) : (
                  <Send size={18} color="#0A4D3C" />
                )}
              </View>
              <Text style={styles.actionText}>
                {isCapturing ? 'Preparing...' : 'WhatsApp'}
              </Text>
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
                  transaction_for: 'supplier',
                  id: personId,
                },
              })}
            >
              <View style={styles.actionIconContainer}>
                <DeleteIcon size={18} color="#0A4D3C" />
              </View>
              <Text style={styles.actionText}>Delete</Text>
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
                supplier?.current_balance > 0
                  ? styles.positiveBalance
                  : styles.negativeBalance,
              ]}
            >
              ₹ {Math.abs(supplier?.current_balance || 0)}
            </Text>
            <View style={[
              styles.balanceTypeBadge,
              { backgroundColor: supplier?.current_balance > 0 ? 'rgba(10,77,60,0.1)' : 'rgba(220,38,38,0.1)' }
            ]}>
              <Text style={[
                styles.balanceTypeText,
                { color: supplier?.current_balance > 0 ? '#0A4D3C' : '#DC2626' }
              ]}>
                {Number(supplier?.current_balance) > 0 ? 'Advance' : 'Due'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomButtonsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.receivedButton]}
            onPress={() => navigateToTransaction('you_got')}
          >
            <ArrowDown size={18} color="#0A4D3C" />
            <Text style={styles.receivedText}>Received</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.givenButton]}
            onPress={() => navigateToTransaction('you_gave')}
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
              <Text style={styles.infoValue}>{moment(dueDate).format('DD/MM/YYYY')}</Text>
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
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 14,
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
    paddingBottom: 220,
    paddingTop: 20,
    paddingHorizontal: 12,
  },
  transactionWrapper: {
    marginVertical: 6,
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
  deletedText: {
    color: '#94A3B8',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  timeText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A4D3C',
  },
});