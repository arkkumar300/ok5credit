import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, ScrollView, BackHandler, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MoreHorizontal, Users, Search, Filter, TrendingUp, Settings, X, Share } from 'lucide-react-native';
import Modal from 'react-native-modal';
import { Appbar, Avatar } from 'react-native-paper';
import ApiService from './components/ApiServices';
import AsyncStorage from '@react-native-async-storage/async-storage';
import exportDataAsPDF from './components/downloadPDF';
import { useFocusEffect } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { useTranslation } from 'react-i18next';
import i18n from './i18n/i18n';

let transactionData = {
  customers: [
    { id: 1, name: 'madhu', amount: 111, type: 'Advance', date: 'Today', initial: 'M', color: '#FFC107' },
    { id: 2, name: 'ravi', amount: 10, type: 'Due', date: 'Yesterday', initial: 'R', color: '#FF5722' },
    { id: 3, name: 'suresh kumar', amount: 1, type: 'Due', date: '15 Jul, 2025', initial: 'S', color: '#2196F3' },
  ],
  suppliers: [
    { id: 1, name: 'Wholesale Mart', amount: 500, type: 'Due', date: 'Today', initial: 'W', color: '#9C27B0' },
    { id: 2, name: 'Supply Co', amount: 250, type: 'Advance', date: 'Yesterday', initial: 'S', color: '#FF9800' },
  ]
};



const FILTER_CATEGORIES = ['Sort By', 'Name'];

const SORT_OPTIONS = [
  'Default',
  'Amount: Low to High',
  'Amount: High to Low',
  'Oldest First',
  'Newest First',
];

const NAME = ['A-Z', 'Z-A'];

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState('Customer');
  const [netBalance, setNetBalance] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [userData, setUserData] = useState(null);
  const [initialsLetter, setInitialsLetter] = useState("");
  const [suppliersList, setSuppliersList] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Sort By');
  const [selectedOption, setSelectedOption] = useState('Default');
  const [isVerified, setIsVerified] = useState(null); // null = loading state
  const [currentLang, setCurrentLang] = useState('hi');
  const { t } = useTranslation();

  useEffect(() => {
    checkEligibility();
  }, [])

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setCurrentLang(code);
  };

  const fetchDashboardData = async () => {
    const userDetails = await AsyncStorage.getItem("userData");
    const userId = JSON.parse(userDetails).id;
    const rrr = JSON.parse(userDetails);
    setUserData(rrr)
    const name = rrr?.name?.trim() || '';
    const initials = name.trim()[0]?.toUpperCase() || '';
    setInitialsLetter(initials);

    try {

      const response = await ApiService.post("/dashboard/businessOwner", { userId });
      if (response.data.success) {
        const fetchedCustomers = response.data.Customers.map((c) => ({
          id: c.id,
          name: c.name,
          amount: parseFloat(c.current_balance),
          type: parseFloat(c.current_balance) <= 0 ? 'Due' : 'Advance',
          date: new Date(c.created_at).toDateString(),
          initial: c.name.charAt(0).toUpperCase(),
          color: '#4CAF50', // Default color
        }));

        const fetchedSuppliers = response.data.Suppliers.map((s) => ({
          id: s.id,
          name: s.name,
          amount: parseFloat(s.current_balance),
          type: parseFloat(s.current_balance) >= 0 ? 'Due' : 'Advance',
          date: new Date(s.created_at).toDateString(),
          initial: s.name.charAt(0).toUpperCase(),
          color: '#2196F3', // Differentiate from customers
        }));

        setCustomers(fetchedCustomers);
        setSuppliers(fetchedSuppliers);
        setCustomersList(response?.data?.Customers);
        setSuppliersList(response?.data?.Suppliers);

        calculateNetBalance(fetchedCustomers, fetchedSuppliers);
      } else {
        Alert.alert('Error', response.data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Dashboard API Error:', error.message);
      Alert.alert('Network Error', 'Failed to load dashboard data.');
    }
  };
  const calculateNetBalance = (customersList, suppliersList) => {
    const totalCustomer = customersList.reduce((sum, c) => sum + c.amount, 0);
    const totalSupplier = suppliersList.reduce((sum, s) => sum + s.amount, 0);
    const balance = totalSupplier - totalCustomer;
    setNetBalance(totalCustomer);
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  )
  const toggleModal = () => setModalVisible(!isModalVisible); const router = useRouter();


  // --- CHECK ELIGIBILITY ---
  const checkEligibility = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      const userId = JSON.parse(userData).id;

      const response = await ApiService.get(`/user/${userId}`);

      if (!response.data) return setIsVerified(false);

      const { is_verified } = response.data;

      setIsVerified(is_verified); // store result in state
    } catch (error) {
      console.log("Error checking eligibility:", error);
      setIsVerified(false);
    }
  };

  const getFilteredData = () => {
    let data = activeTab === 'Customer' ? [...customers] : [...suppliers];

    switch (selectedCategory) {
      case 'Sort By':
        if (selectedOption === 'Amount: High to Low') {
          data.sort((a, b) => b.amount - a.amount);
        } else if (selectedOption === 'Amount: Low to High') {
          data.sort((a, b) => a.amount - b.amount);
        } else if (selectedOption === 'Newest First') {
          data.sort((a, b) => new Date(b.date) - new Date(a.date));
        } else if (selectedOption === 'Oldest First') {
          data.sort((a, b) => new Date(a.date) - new Date(b.date));
        }
        break;

      case 'Payment Status':
        if (selectedOption === 'Due') {
          data = data.filter(person => person.type === 'Due');
        } else if (selectedOption === 'Advance') {
          data = data.filter(person => person.type === 'Advance');
        }
        break;

      case 'Name':
        if (selectedOption === 'A-Z') {
          data.sort((a, b) => a.name.localeCompare(b.name));
        } else if (selectedOption === 'Z-A') {
          data.sort((a, b) => b.name.localeCompare(a.name));
        }
        break;

      default:
        break;
    }

    return data;
  };


  const currentData = getFilteredData();

  const renderOptions = () => {
    switch (selectedCategory) {
      case 'Sort By':
        return SORT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            style={styles.optionRow}
            onPress={() => {
              setSelectedOption(option)
            }}
          >
            <Text style={styles.optionText}>{option}</Text>
            {selectedOption === option && <View style={styles.radioSelected} />}
          </TouchableOpacity>
        ));
      case 'Payment Status':
        return PAYMENT_STATUS.map((option) => (
          <TouchableOpacity
            key={option}
            style={styles.optionRow}
            onPress={() => setSelectedOption(option)}
          >
            <Text style={styles.optionText}>{option}</Text>
            {selectedOption === option && <View style={styles.radioSelected} />}
          </TouchableOpacity>
        ));
      case 'Name':
        return NAME.map((option) => (
          <TouchableOpacity
            key={option}
            style={styles.optionRow}
            onPress={() => setSelectedOption(option)}
          >
            <Text style={styles.optionText}>{option}</Text>
            {selectedOption === option && <View style={styles.radioSelected} />}
          </TouchableOpacity>
        ));
      default:
        return null;
    }
  };
  const handleAddCustomer = () => {
    router.push('/add-customer');
  };

  const handleAddSupplier = () => {
    router.push('/add-supplier');
  };

  const handlePersonClick = (person) => {
    if (activeTab.toLowerCase() === "customer") {
      router.navigate({
        pathname: '/customerDetails',
        params: {
          personName: person.name,
          personType: activeTab.toLowerCase(),
          personId: person.id
        }
      });
    } else {
      router.push({
        pathname: '/supplierDetails',
        params: {
          personName: person.name,
          personType: activeTab.toLowerCase(),
          personId: person.id
        }
      });

    }
  };

  const handleMyPlanPress = () => {
    router.push('/my-plan');
  };

  const handleMorePress = () => {
    router.push('/more');
  };

  // Function to add new transaction (called from transaction success)
  const addTransaction = (personName, personType, amount, transactionType) => {
    const newTransaction = {
      id: Date.now(),
      name: personName,
      amount: parseInt(amount),
      type: transactionType === 'received' ? 'Advance' : 'Due',
      date: 'Today',
      initial: personName.charAt(0).toUpperCase(),
      color: '#4CAF50'
    };

    if (personType === 'customer') {
      const existingCustomer = customers.find(c => c.name.toLowerCase() === personName.toLowerCase());
      if (existingCustomer) {
        // Update existing customer
        setCustomers(prev => prev.map(c =>
          c.id === existingCustomer.id
            ? { ...c, amount: newTransaction.amount, type: newTransaction.type, date: 'Today' }
            : c
        ));
      } else {
        // Add new customer
        setCustomers(prev => [...prev, newTransaction]);
      }
    } else {
      const existingSupplier = suppliers.find(s => s.name.toLowerCase() === personName.toLowerCase());
      if (existingSupplier) {
        // Update existing supplier
        setSuppliers(prev => prev.map(s =>
          s.id === existingSupplier.id
            ? { ...s, amount: newTransaction.amount, type: newTransaction.type, date: 'Today' }
            : s
        ));
      } else {
        // Add new supplier
        setSuppliers(prev => [...prev, newTransaction]);
      }
    }
  };

  // Listen for new transactions (in a real app, this would be through state management)
  useEffect(() => {
    const handleTransactionUpdate = () => {
      // This would be called when returning from transaction success
      // For now, we'll just refresh the data
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert('Exit App', 'Are you sure you want to exit?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', onPress: () => BackHandler.exitApp() },
        ]);
        return true; // Prevent default back behavior
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove(); // Clean up on blur
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>

      <Appbar.Header style={{ elevation: 5 }}>
        <TouchableOpacity onPress={() => {
          router.push('/profile')
        }}>
          <Avatar.Text
            label={initialsLetter}
            size={38}
            color="#ffffff"
            style={{ backgroundColor: '#2E7D32', marginStart: 8, elevation: 3 }}
          />
        </TouchableOpacity>

        <Appbar.Content
          title="Aqua Credit"
          titleStyle={{ textAlign: 'center', fontWeight: 'bold' }}
        />

        <Appbar.Action
          icon={() => <Share size={22} color="#2E7D32" />}
          onPress={() => {
            if (activeTab === 'Customer') {

              exportDataAsPDF(customersList, `${activeTab}`);
            } else {
              exportDataAsPDF(suppliersList, `${activeTab}`);

            }
          }}
          color="#2E7D32"
        />

      </Appbar.Header>

      <View style={styles.verifyBanner}>
        <View
          style={[
            styles.verifyIcon,
            { backgroundColor: isVerified ? "#4CAF50" : "#FF6F00" } // green / red
          ]}
        >
          <Text style={styles.verifyIconText}>
            {isVerified ? "✓" : "✕"}
          </Text>
        </View>


        {/* SHOW STATUS BASED ON isVerified */}
        {isVerified === null ? (
          <Text style={styles.verifyText}>Checking verification...</Text>
        ) : isVerified ? (
          <Text style={styles.verifyText}>Verified Business</Text>
        ) : (
          <Text style={styles.unverifyText}>Bussiness not verified / KYC pending</Text>
        )}

        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Text style={styles.verifyArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ margin: 10, fontWeight: 'bold', fontSize: 18, color: "green", textTransform: 'capitalize', letterSpacing: 1 }}>
        {t('welcome', { name: userData?.name })}
      </Text>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Customer' && styles.activeTab]}
          onPress={() => {
            setActiveTab('Customer');
            setSelectedCategory('Sort By');
            setSelectedOption('Default');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'Customer' && styles.activeTabText]}>
            Customer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Supplier' && styles.activeTab]}
          onPress={() => {
            setActiveTab('Supplier');
            setSelectedCategory('Sort By');
            setSelectedOption('Default');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'Supplier' && styles.activeTabText]}>
            Supplier
          </Text>
        </TouchableOpacity>
        <View style={styles.tabActions}>
          <TouchableOpacity style={styles.iconButton} onPress={toggleModal}>
            <Filter size={20} color="#666" />
          </TouchableOpacity>
          {/* <TouchableOpacity style={styles.iconButton}>
            <Search size={20} color="#666" />
          </TouchableOpacity> */}
        </View>
      </View>

      {activeTab === 'Customer' && <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Net Balance</Text>
        <Text style={selectedOption === 'Advance' ? styles.balanceAmount_advance : styles.balanceAmount_due}>₹ {parseFloat(netBalance).toFixed(2)}</Text>
        <Text style={styles.balanceSubtext}>{currentData.length} Accounts</Text>
        <Text style={styles.balanceType}>You Pay</Text>
      </View>}

      <ScrollView style={styles.listContainer}>
        {Array.isArray(currentData) && currentData.length > 0 ? (
          <>
            {currentData.map((person) => (
              <TouchableOpacity
                key={person.id}
                style={styles.personCard}
                onPress={() => handlePersonClick(person)}
              >
                <View style={[styles.avatar, { backgroundColor: person.color }]}>
                  <Text style={styles.avatarText}>{person.initial}</Text>
                </View>
                <View style={styles.personInfo}>
                  <Text style={styles.personName}>{person.name}</Text>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.checkMark}>✓</Text>
                    <Text style={styles.paymentText}>
                      ₹{person.amount} {person.type === 'Advance' ? 'Payment Added' : 'Credit Added'} {person.date}
                    </Text>
                  </View>
                </View>
                <View style={styles.amountContainer}>
                  <Text style={[styles.amount, person.type === 'Due' ? styles.dueAmount : styles.advanceAmount]}>
                    ₹{person.amount}
                  </Text>
                  <Text style={styles.amountType}>{person.type}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <LottieView
              source={require('../assets/animations/noData.json')} // 👈 local JSON file
              autoPlay
              loop
              style={{ width: 200, height: 150, alignSelf: 'center' }}
            />
            <Text style={styles.emptyText}>No data found</Text>

          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={activeTab === 'Customer' ? handleAddCustomer : handleAddSupplier}
      >
        <Users size={20} color="white" />
        <Text style={styles.addButtonText}>Add {activeTab}</Text>
      </TouchableOpacity>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <TrendingUp size={24} color="#4CAF50" />
          <Text style={styles.navText}>Ledger</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleMyPlanPress}>
          <Settings size={24} color="#666" />
          <Text style={styles.navText}>My Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleMorePress}>
          <MoreHorizontal size={24} color="#666" />
          <Text style={styles.navText}>More</Text>
        </TouchableOpacity>
      </View>
      <Modal
        isVisible={isModalVisible}
        animationIn="slideInLeft"
        animationOut="slideOutLeft"
        style={styles.modal}
        onBackdropPress={toggleModal}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filter Bills</Text>
            <TouchableOpacity onPress={toggleModal}>
              <X size={24} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.body}>
            <View style={styles.sidebar}>
              {FILTER_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  style={[
                    styles.tabButton,
                    selectedCategory === category && styles.tabButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      selectedCategory === category && styles.tabTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.optionsContainer}>{renderOptions()}</View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.footerButton, { backgroundColor: '#E6F0E6' }]}
              onPress={() => {
                setSelectedOption('Default');
                setSelectedCategory('Sort By');
              }}
            >
              <Text style={{ color: '#2F4F2F' }}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.footerButton, { backgroundColor: '#228B22' }]} onPress={toggleModal}>
              <Text style={{ color: '#fff' }}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 250, justifyContent: 'center',
    height: 250, alignSelf: 'center'
  },
  emptyText: {
    fontSize: 16, fontWeight: '700',
    color: '#666',
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  shareButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
  },
  shareText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '500',
  },
  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  verifyIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  verifyIconText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  verifyText: {
    flex: 1,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  unverifyText: {
    flex: 1,
    fontSize: 14,
    color: '#FF6F00',
    fontWeight: '500',
  },
  verifyArrow: {
    fontSize: 18,
    color: '#FF6F00',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    padding: 4,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#F1F8E9',
    borderRadius: 6, elevation: 3,
    shadowColor: '#2E7D32',       // Dark green
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,

  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  tabActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  balanceCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  balanceAmount_advance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  balanceAmount_due: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6F00',
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 12,
    color: '#999',
  },
  balanceType: {
    fontSize: 12,
    color: '#666',
    position: 'absolute',
    right: 16,
    top: 16,
  },
  listContainer: {
    flex: 1,
    marginTop: 26,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkMark: {
    color: '#4CAF50',
    marginRight: 4,
    fontSize: 12,
  },
  paymentText: {
    fontSize: 12,
    color: '#666',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  dueAmount: {
    color: '#F44336',
  },
  advanceAmount: {
    color: '#4CAF50',
  },
  amountType: {
    fontSize: 12,
    color: '#666',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 16,
    borderRadius: 8, elevation: 5
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  filterButton: {
    backgroundColor: '#228B22',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterText: {
    color: '#fff',
    marginLeft: 8,
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-start',
  },
  modalContent: {
    flex: 1,
    backgroundColor: 'white',
    width: '90%',
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  body: {
    flexDirection: 'row',
    flex: 1,
  },
  sidebar: {
    width: '35%',
    backgroundColor: '#F8F8F8',
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: '#DDD',
  },
  tabButton: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  tabButtonActive: {
    borderLeftWidth: 4,
    borderLeftColor: '#228B22',
    backgroundColor: '#E6F0E6',
  },
  tabText: {
    fontSize: 14,
    color: '#555',
  },
  tabTextActive: {
    color: '#228B22',
    fontWeight: 'bold',
  },
  optionsContainer: {
    flex: 1,
    padding: 12,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  radioSelected: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#228B22',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#DDD',
  },
  footerButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  placeholder: {
    paddingVertical: 20,
  },
});
