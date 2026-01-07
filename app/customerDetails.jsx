import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Image, Linking, Animated } from 'react-native';
import { PhoneCall, Delete, MessageSquare, ArrowDown, Percent, ArrowUp, ArrowLeft, CheckIcon, File, ChevronRight, Calendar } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Appbar, Divider, Modal } from 'react-native-paper';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';
import ErrorModal from './components/ErrorModal';
import DateTimePicker from '@react-native-community/datetimepicker';
import DateModal from './components/DateModal';
import { Alert } from 'react-native';

const transactions = [
  {
    id: '1',
    type: 'received',
    amount: 100,
    time: '02:34 PM',
    file: false,
    description: 'Capita amounts',
    note: '₹100 Advance',
  },
  {
    id: '2',
    type: 'given',
    amount: 1000,
    time: '02:44 PM',
    file: true,
    description: '',
    note: '₹900 Due',
  },
];

export default function CustomerDetails() {
  const router = useRouter();
  const { personName, personType, personId } = useLocalSearchParams();
  const [customer, setCustomer] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModelView, setIsModelView] = useState(false);
  const [error, setError] = useState(null);
  const [customerMobile, setCustomerMobile] = useState('');
  const [isSubscribe_user, setIsSubscribe_user] = useState(null);
  const [subscribeEndAt_user, setSubscribeEndAt_user] = useState(null);
  const [credit_given_count_user, setCredit_given_count_user] = useState(0);
  const [payment_got_count_user, setPayment_got_count_user] = useState(0);
  const [subscribePlan, setSubscribePlan_user] = useState("");
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountAmount, setDiscountAmount] = useState("");
  const [amount, setAmount] = useState(0);
  const [discountNote, setDiscountNote] = useState("");
  const [note, setNote] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [discountLoading, setDiscountLoading] = useState(false); // disable button
  const [animateOpacity] = useState(new Animated.Value(0));
  const [animateTranslate] = useState(new Animated.Value(50));


  var rrr = 0
  const [dueDate, setDueDate] = useState(
    customer?.due_date ? new Date(customer?.due_date) : null
  );
  const [showPicker, setShowPicker] = useState(false);

  const fetchCustomer = async () => {
    const userData = await AsyncStorage.getItem("userData");
    const userId = JSON.parse(userData).id;
    try {
      const response = await ApiService.post(`/customers/${personId}`, { userId });
      const data = response.data;

      setCustomer(data.customer);
      const customerPhone = data.customer.mobile;
      const customerDueDate = data.customer.due_date;
      const customer_id = data.customer.id;

      fetchCustomerDueDate(customer_id);
      setCustomerMobile(customerPhone);
      setTransactions(data.transactions);
    } catch (err) {
      console.error(err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, []);

  const fetchCustomerDueDate = async (customer_id) => {
    const userData = await AsyncStorage.getItem("userData");
    const userId = JSON.parse(userData).id;
    try {
      const response = await ApiService.post(`/customers/upcoming/DueDate`, { customer_id, user_id: userId });
      const data = response.data;
      setDueDate(data.upcoming_due_date);
    } catch (err) {
      console.error(err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (!customerMobile) {
      alert("Phone number not available");
      return;
    }
    Linking.openURL(`tel:${customerMobile}`);
  };

  useEffect(() => {
    isEligible()
  }, [])

  const isEligible = async () => {
    const userData = await AsyncStorage.getItem("userData");
    const userId = JSON.parse(userData).id;

    const response = await ApiService.get(`/user/${userId}`);

    if (!response.data) return false;

    const {
      isSubscribe,
      subscribeEndAt,
      credit_given_count,
      subscribePlan,
      payment_got_count
    } = response.data;

    setIsSubscribe_user(isSubscribe)
    setSubscribeEndAt_user(subscribeEndAt)
    setCredit_given_count_user(credit_given_count)
    setPayment_got_count_user(payment_got_count)
    setSubscribePlan_user(subscribePlan)

    console.log("isSubscribe::", isSubscribe);
    console.log("subscribeEndAt::", subscribeEndAt);
    console.log("credit_given_count::", credit_given_count);
    console.log("payment_got_count::", payment_got_count);
    console.log("subscribePlan::", subscribePlan);

    // if (isSubscribe) {
    //   const today = new Date();
    //   const endDate = new Date(subscribeEndAt);

    //   return endDate >= today;
    // }


  };

  const addTransaction = async () => {
    if (loading) return; // Prevent double taps
    const date = moment().format('YYYY-MM-DD');
    setUploadProgress(0);
    setLoading(true);

    try {
      // Get user details
      const userData = await AsyncStorage.getItem("userData");
      const userId = JSON.parse(userData).id;
      const userName = JSON.parse(userData).name;
      // -----------------------
      // 📌 Build Base Payload
      // -----------------------

      const formattedDueDate = undefined;
      // Add image fields only if available
      const payload = {
        customer_id: customer.id,
        userId,
        transaction_type: "you_discount",
        transaction_for: "customer",
        amount: Number(discountAmount),
        description: discountNote,
        paidAmount: Number(discountAmount),
        remainingAmount: Number(discountAmount),
        transaction_date: date,
        due_date: formattedDueDate,
        paymentType: 'paid',
      };
      console.log("payload:::", payload)

      // -----------------------
      // 📌 API Endpoint
      // -----------------------
      const url = "/transactions/customer";

      // -----------------------
      // 📌 Submit Transaction
      // -----------------------
      const response = await ApiService.post(url, payload, {
        headers: { "Content-Type": "application/json" },
      }, {
        onUploadProgress: (e) => {
          if (e.total > 0) {
            setUploadProgress(e.loaded / e.total);
          }
        },
      });
      // -----------------------
      // 🎉 Success animation + navigation
      // -----------------------
      setTimeout(() => {
        setSuccess(true);
        setLoading(false);

      }, 1000);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
      Alert.alert("Error", "Failed to add transaction");
    } finally {
      await fetchCustomer();
    }
  };

  const updateTransactionDueDate = async (newDuedate) => {
    const dueDatePayload = {
      customer_id: customer.id,
      isDuedateChange: true,
      dueDate: newDuedate
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

  const renderItem = ({ item }) => {
    const isReceived = item.transaction_type === "you_got" || item.transaction_type === "you_discount";
    console.log("items::::", item)
    // ⬇️ Compute rrr balance
    if (isReceived) {
      rrr = Number(rrr) + Number(item.amount);
    } else {
      rrr = Number(rrr) - Number(item.amount);
    }

    const aaa = rrr < 0 ? `${Math.abs(rrr)} Due` : `${rrr} Advance`;

    // 🔥 If deleted → show disabled card
    if (item.is_Deleted) {
      return (
        <View style={[styles.transactionWrapper,
        isReceived ? styles.leftContainer : styles.rightContainer,
        ]}>
          <View style={styles.transactionBox}>
            <View style={styles.amountRow}>
              <Delete size={20} color="gray" />
              <Text style={[styles.amountText, { color: "gray" }]}>₹ {item.amount}</Text>
            </View>

            <Text style={[styles.timeText, { color: "gray", marginTop: 5 }]}>
              Deleted on: {moment(item.delete_date).format("DD/MM/YYYY")}
            </Text>
          </View>
        </View>
      );
    }

    // 🔥 Normal (non-deleted) item
    return (
      <TouchableOpacity
        style={[
          styles.transactionWrapper,
          isReceived ? styles.leftContainer : styles.rightContainer,
        ]}
        onPress={() =>
          router.push({
            pathname: "/transactionDetails",
            params: {
              transactionDetails: JSON.stringify(item),
              Name: personName,
            },
          })
        }
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
                {moment(item.transaction_date).format("DD/MM/YYYY")}
              </Text>
              <CheckIcon size={20} color="green" style={{ marginHorizontal: 5 }} />
            </View>

            {/* BILLS */}
            {item?.bill_id && (
              <>
                <Divider style={{ marginVertical: 5 }} />
                <TouchableOpacity
                  style={[
                    styles.amountRow,
                    { marginVertical: 5, justifyContent: "space-between" },
                  ]}
                  onPress={() => {
                    const encoded = encodeURIComponent(JSON.stringify(customer));
                    router.push({
                      pathname: "/billDetails",
                      params: {
                        billId: item.bill_id,
                        customerInfo: encoded,
                        bill: item.bill_id,
                      },
                    });
                  }}
                >
                  <File size={24} color="green" />
                  <Text style={styles.amountText}>{item.bill_id}</Text>
                  <Text style={[styles.amountText, { fontWeight: "600" }]}>
                    ₹ {item.amount}
                  </Text>
                  <ChevronRight size={24} color="green" />
                </TouchableOpacity>
              </>
            )}

            {/* TRANSACTION IMAGES */}
            {item?.transaction_pic?.length > 0 && (
              <>
                <Divider style={{ marginVertical: 5 }} />
                <TouchableOpacity
                  style={[
                    styles.amountRow,
                    { marginVertical: 5, justifyContent: "space-between" },
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: "/transactionDetails",
                      params: {
                        transactionDetails: JSON.stringify(item),
                        Name: personName,
                      },
                    })
                  }
                >
                  {(() => {
                    let pics = item.transaction_pic;
                    if (typeof pics === "string") {
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
                        : "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg";

                    return (
                      <View>
                        <Image
                          source={{ uri:url }}
                          style={{width:80,height:80,borderRadius:3 }}
                          resizeMode="contain"
                        />

                      </View>
                    );
                  })()}

                  <Text style={[styles.amountText, { fontWeight: "600" }]}>
                    ₹ {item.amount}
                  </Text>
                  <ChevronRight size={24} color="green" />
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text style={styles.noteText}>{aaa}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      <Appbar.Header style={{ backgroundColor: "#ffffff", borderBottomWidth: 2, justifyContent: 'space-between', borderColor: '#f2f7f6' }}>
        <ArrowLeft size={24} color={'#2E7D32'} style={{ marginStart: 10 }} onPress={() => router.push('./dashboard')} />
        <Appbar.Content title={personName} titleStyle={{ color: '#333333', fontSize: 18, fontWeight: 'bold', marginStart: 10 }} />
        <Appbar.Content title="Customer Profile" titleStyle={{ color: '#388E3C', fontSize: 13, alignSelf: 'flex-end', marginRight: 30 }} onPress={() => router.push({ pathname: '/customerProfile', params: { ID: personId, profileType: 'customer' } })} />
      </Appbar.Header>

      {/* Transaction List */}
      <FlatList
        data={transactions}
        style={{ marginBottom: 50 }}
        renderItem={renderItem}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => {
          return (
            <View style={styles.emptyContainer}>
              <Image
                source={require('../assets/images/DataCaution.png')}
                style={styles.image}
                resizeMode="contain"
              />
              <Text style={styles.emptyText}>customer transactions data is pravite and secure</Text>
            </View>
          )
        }}
      />
      {/* Bottom Material Block */}
      <View style={styles.bottomContainer}>
        {/* Actions */}
        <View style={styles.actionsRow}>
          {Number(customer?.current_balance) < 0 && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowPicker(true)}
              >
                <Calendar size={24} color="#555" />
                <Text style={styles.actionText}>
                  {dueDate ? new Date(dueDate).toDateString() : "Due Date"}
                </Text>
              </TouchableOpacity>

              {showPicker && (
                <DateTimePicker
                  value={dueDate instanceof Date ? dueDate : new Date()}
                  mode="date"
                  display="spinner"
                  onChange={async (event, date) => {
                    setShowPicker(false); // close picker immediately
                    if (date) {
                      setDueDate(date); // update local state

                      try {
                        const userData = await AsyncStorage.getItem("userData");
                        const userId = JSON.parse(userData)?.id;

                        // Use the selected date (date), NOT dueDate
                        const response = await ApiService.put(
                          `/customers/${customer.id}`,
                          {
                            userId: Number(userId),
                            due_date: date.toISOString(),
                          }
                        );

                        if (response.status === 200) {

                          updateTransactionDueDate(date.toISOString())
                        } else {
                          alert("Failed to update due date");
                        }
                      } catch (error) {
                        console.error(error);
                        alert("Error updating due date");
                      }
                    }
                  }}
                  style={{ width: "100%" }}
                />
              )}
            </>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setShowDiscountModal(true);

              // Start animation
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
                })
              ]).start();
            }}
          >
            <Percent size={24} color="#555" />
            <Text style={styles.actionText}>Discount</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <PhoneCall size={24} color="#555" />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push({
            pathname: '/customerLedger',
            params: {
              personId: personId,
              personName: personName,
              roleType: "CUSTOMER"
            }
          })
          }>
            <MessageSquare size={24} color="#555" />
            <Text style={styles.actionText}>Ledgers</Text>
          </TouchableOpacity>
        </View>
        {isSubscribe_user === false &&
          <>
            <Divider style={{ height: 0.5, width: '100%', marginVertical: 3, backgroundColor: '#388E3C90' }} />

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={[{
                color: '#388E3C90',
                fontWeight: '600',
                fontSize: 12,
                textTransform: 'capitalize', margin: 5
              }]}>{isSubscribe_user === false ? "Basic Plan" : subscribePlan}</Text>
              <Text style={{ fontSize: 12, borderRadius: 5, fontWeight: 'bold', color: '#d3d3d3' }}>Receive :   {payment_got_count_user}  / 4</Text>
              <Text style={{ fontSize: 12, borderRadius: 5, fontWeight: 'bold', color: '#d3d3d3' }}>Give       :    {credit_given_count_user} / 2</Text>
            </View>

            <Divider style={{ height: 0.5, width: '100%', marginVertical: 3, backgroundColor: '#388E3C90' }} />
          </>}
        {/* Balance Row */}
        <View style={styles.balanceRow}>
          <Text style={[styles.balanceLabel, { fontWeight: 'bold' }]}>Balance Due</Text>
          <Text style={[styles.balanceAmount, { color: customer?.current_balance > 0 ? '#388E3C' : "#d32f2f" }]}>₹ {Math.abs(customer?.current_balance || 0)} {Number(customer?.current_balance) > 0 ? 'Advance' : "Due"}</Text>
        </View>

        {/* Received and Given Buttons */}
        <View style={styles.bottomButtonsRow}>
          <TouchableOpacity
            style={styles.receivedButton}
            onPress={async () => {          // MAKE ASYNC
              if (isSubscribe_user) {
                const today = new Date();
                const endDate = new Date(subscribeEndAt_user);
                if (endDate >= today) {
                  router.push({
                    pathname: '/transaction',
                    params: {
                      transactionType: "you_got",
                      transaction_for: "customer",
                      id: personId,
                      mobile: customerMobile,
                      personName: personName,
                      isSubscribe_user,
                      transaction_limit: payment_got_count_user || 0
                    }
                  });
                } else {
                  setError("You are in Basic plan so son't have eligiblity to add recived transaction");
                  // setIsModelView(true)
                }
              } else {
                if (payment_got_count_user < 10) {
                  router.push({
                    pathname: '/transaction',
                    params: {
                      transactionType: "you_got",
                      transaction_for: "customer",
                      id: personId,
                      mobile: customerMobile,
                      personName: personName,
                      isSubscribe_user,
                      transaction_limit: payment_got_count_user || 0
                    }
                  });
                } else {
                  setError("You are in Basic plan and limit has Crossed so you don't have eligiblity to add recived transaction");
                  // setIsModelView(true)
                }
              }
            }}
          >
            <Text style={styles.receivedText}>↓ Received</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.givenButton}
            onPress={async () => {
              if (isSubscribe_user) {
                const today = new Date();
                const endDate = new Date(subscribeEndAt_user);
                if (endDate >= today) {
                  router.push({
                    pathname: '/transaction',
                    params: {
                      transactionType: "you_gave",
                      transaction_for: "customer",
                      id: personId,
                      mobile: customerMobile,
                      personName: personName,
                      isSubscribe_user,
                      transaction_limit: credit_given_count_user || 0

                    }
                  });
                } else {
                  setError("You are in Basic plan so you don't have eligiblity to give amount");
                  // setIsModelView(true)
                }
              } else {
                if (credit_given_count_user < 40) {
                  router.push({
                    pathname: '/transaction',
                    params: {
                      transactionType: "you_gave",
                      transaction_for: "customer",
                      id: personId,
                      mobile: customerMobile,
                      personName: personName,
                      isSubscribe_user,
                      transaction_limit: credit_given_count_user || 0
                    }
                  });
                } else {
                  setError("You are in Basic plan and limit has Crossed so you don't have eligiblity to give amount");
                  // setIsModelView(true)
                }
              }
            }}
          >
            <Text style={styles.givenText}>↑ Given</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ErrorModal
        visible={!!error}
        message={error}
        onClose={() => setError(null)}
      />
      {/* ---------------- DISCOUNT MODAL --------------------- */}
      {/* ---------------- DISCOUNT MODAL --------------------- */}
      <Modal visible={showDiscountModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: animateOpacity,
                transform: [{ translateY: animateTranslate }],
              },
            ]}
          >
            <Text style={styles.title}>Add Discount</Text>

            <TextInput
              placeholder="Enter discount amount"
              placeholderTextColor={"#aaaaaa"}
              keyboardType="numeric"
              value={discountAmount}
              onChangeText={setDiscountAmount}
              style={styles.input}
            />

            <TextInput
              placeholder="Note (optional)"
              placeholderTextColor={"#aaaaaa"}
              value={discountNote}
              onChangeText={setDiscountNote}
              style={[styles.input, { height: 80 }]}
              multiline
            />

            <View style={styles.buttonRow}>

              {/* CANCEL BTN */}
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#ccc" }]}
                onPress={() => {
                  setShowDiscountModal(false);
                  setDiscountAmount("");
                  setDiscountNote("");
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              {/* SUBMIT BTN */}
              <TouchableOpacity
                disabled={discountLoading}
                style={[
                  styles.button,
                  {
                    backgroundColor: discountLoading ? "#9CCC9C" : "#2E7D32",
                    opacity: discountLoading ? 0.6 : 1,
                  },
                ]}
                onPress={async () => {
                  if (!discountAmount || isNaN(discountAmount)) {
                    Alert.alert("Invalid", "Enter a valid discount amount");
                    return;
                  }
                  // setDiscountLoading(true);
                  // set values for your addTransaction function
                  setAmount(discountAmount);
                  setNote(discountNote);

                  // Clear for next use

                  await addTransaction();

                  setDiscountLoading(false);
                  setDiscountAmount("");
                  setDiscountNote("");

                  // Close popup
                  setShowDiscountModal(false);

                  // Wait for animation reset
                  animateOpacity.setValue(0);
                  animateTranslate.setValue(50);

                }}
              >
                <Text style={[styles.buttonText, { color: "#fff" }]}>
                  {discountLoading ? "Saving..." : "Submit"}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

    </SafeAreaView >

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 24,
  },
  header: {
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#222',
  },
  date: {
    fontSize: 14,
    color: 'gray',
    marginTop: 4,
  },
  transactionWrapper: {
    marginVertical: 8,
    flexDirection: 'row',
  },
  leftContainer: {
    justifyContent: 'flex-start',
  },
  rightContainer: {
    justifyContent: 'flex-end',
  },
  transactionBox: {
    maxWidth: '100%',
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
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  deletedItem: {
    opacity: 0.4,
    backgroundColor: "#f5f5f5",
  },
  amountText: {
    fontSize: 18,
    color: '#333',
  },
  timeText: {
    fontSize: 16,
    color: 'gray',
  },
  descriptionText: {
    fontSize: 14,
    marginTop: 2,
    color: '#444',
  },
  noteText: {
    fontSize: 13,
    color: 'gray',
  },

  /*** Bottom Block ***/
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    width: '100%',
    backgroundColor: '#f2f7f6',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingVertical: 16, borderWidth: 2,
    paddingHorizontal: 20, borderColor: '#E8F5E9',
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
  listContent: {
    paddingBottom: 180,
    paddingTop: 30,
    paddingHorizontal: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  image: {
    width: '90%', justifyContent: 'center',
    height: 150, alignSelf: 'center'
  },
  emptyText: {
    fontSize: 14, fontWeight: '700',
    color: '#666',
    textAlign: 'center'
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
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#777',
    marginRight: 6, marginTop: 8
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: 'bold', marginTop: 8,
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
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#bbb",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    padding: 12,
    width: "48%",
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  }
});
