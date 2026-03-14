import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, ScrollView, BackHandler, Alert, Dimensions, StatusBar} from 'react-native';
import { useRouter } from 'expo-router';
import { MoreHorizontal, Users, Search, Filter, TrendingUp, Settings, X, Share, UserPlus, ChevronRight, CheckCircle, Award, Clock, Download, Plus, Home, BarChart3, User, LogOut} from 'lucide-react-native';
import Modal from 'react-native-modal';
import { Appbar, Avatar } from 'react-native-paper';
import ApiService from './components/ApiServices';
import AsyncStorage from '@react-native-async-storage/async-storage';
import exportDataAsPDF from './components/downloadPDF';
import { useFocusEffect } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { useTranslation } from 'react-i18next';
import i18n from './i18n/i18n';
import { AuthContext } from './components/AuthContext';
import getStageColor from './components/defaulterColor';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

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
  const {
    user,
    isAuthenticated,
    isSubscribed,
    subscription,
    logout,
    refreshSubscription,
    getPurchasedUserCount,
    getCurrentPlan
  } = useContext(AuthContext);

  useEffect(() => {
    checkEligibility();
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const userDetails = await AsyncStorage.getItem("userData");
    if (userDetails) {
      const parsed = JSON.parse(userDetails);
      setUserData(parsed);
      const name = parsed?.name?.trim() || '';
      const initials = name.trim()[0]?.toUpperCase() || '';
      setInitialsLetter(initials);
    }
  };

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setCurrentLang(code);
  };

  const fetchDashboardData = async () => {
    try {
      const userDetails = await AsyncStorage.getItem("userData");

      if (!userDetails) {
        Alert.alert("Error", "User data not found");
        return;
      }

      const userData = JSON.parse(userDetails);

      const userId = userData?.id;
      const ownerId = userData?.owner_user_id;

      const response = await ApiService.post("/dashboard/businessOwner", {
        userId: userId,
        ownerId: ownerId,
      });

      if (response?.data?.success) {
        const fetchedCustomers = (response.data.Customers || []).map((c) => ({
          id: c.id,
          name: c.name,
          amount: parseFloat(c.current_balance),
          type: parseFloat(c.current_balance) <= 0 ? "Due" : "Advance",
          date: new Date(c.created_at).toDateString(),
          initial: c.name?.charAt(0).toUpperCase(),
          color: "#4CAF50",
          created_by: c.created_user,
          defaulter_stage:c.defaulter_stage
        }));

        const fetchedSuppliers = (response.data.Suppliers || []).map((s) => ({
          id: s.id,
          name: s.name,
          amount: parseFloat(s.current_balance),
          type: parseFloat(s.current_balance) >= 0 ? "Due" : "Advance",
          date: new Date(s.created_at).toDateString(),
          initial: s.name?.charAt(0).toUpperCase(),
          color: "#2196F3",
          created_by: s.created_user,
          defaulter_stage:s.defaulter_stage
        }));

        setCustomers(fetchedCustomers);
        setSuppliers(fetchedSuppliers);
        setCustomersList(response?.data?.Customers || []);
        setSuppliersList(response?.data?.Suppliers || []);

        calculateNetBalance(fetchedCustomers, fetchedSuppliers);
      } else {
        Alert.alert("Error", response?.data?.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Dashboard API Error:", error);
      Alert.alert("Network Error", "Failed to load dashboard data.");
    }
  };
  const calculateNetBalance = (customersList, suppliersList) => {
    const totalCustomer = customersList.reduce((sum, c) => sum + c.amount, 0);
    const totalSupplier = suppliersList.reduce((sum, s) => sum + s.amount, 0);
    setNetBalance(totalCustomer);
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
      refreshSubscription();
    }, [])
  );

  const toggleModal = () => setModalVisible(!isModalVisible);
  const router = useRouter();

  const checkEligibility = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      const userId = JSON.parse(userData).id;
      const response = await ApiService.get(`/user/${userId}`);
      if (!response.data) return setIsVerified(false);
      const { is_verified } = response.data;
      setIsVerified(is_verified);
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
          personId: person.id,
          created_by: person.created_user,
          defaulter_stage:person.defaulter_stage
        }
      });
    } else {
      router.push({
        pathname: '/supplierDetails',
        params: {
          personName: person.name,
          personType: activeTab.toLowerCase(),
          personId: person.id,
          created_by: person.created_user,
          defaulter_stage:person.defaulter_stage
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

  const handleEmployeesPress = () => {
    router.push('/subscription-members');
  };

  const handleProfilePress = () => {
    router.push('/profile');
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert('Exit App', 'Are you sure you want to exit?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4D3C" />

      {/* Premium Header with Gradient */}
      <LinearGradient
        colors={['#0A4D3C', '#1B6B50']}
        style={styles.headerGradient}
      >
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleProfilePress} style={styles.profileButton}>
              <View style={styles.avatarSolid}>
                <Text style={styles.avatarText}>{initialsLetter || 'U'}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Aqua Credit</Text>
              <Text style={styles.headerSubtitle}>Digital Khata</Text>
            </View>

            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => {
                if (activeTab === 'Customer') {
                  exportDataAsPDF(customersList, `${activeTab}`);
                } else {
                  exportDataAsPDF(suppliersList, `${activeTab}`);
                }
              }}
            >
              <Download size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeContainer}>
          <View style={styles.welcomeRow}>
            <Text style={styles.welcomeText}>
              Welcome, {userData?.name?.split(' ')[0] || 'User'}!
            </Text>
            <View style={styles.dateBadge}>
              <Clock size={14} color="#0A4D3C" />
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Verification Banner - Orange for Pending, Green for Verified */}
        <View style={styles.bannerContainer}>
          <View style={[styles.verifyBanner, isVerified ? styles.verifiedBanner : styles.pendingBanner]}>
            <View style={styles.verifyIcon}>
              <CheckCircle size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.verifyText}>
              {isVerified === null
                ? 'Checking verification...'
                : isVerified
                  ? 'Verified Business Account'
                  : 'KYC Pending - Complete verification'}
            </Text>
            <ChevronRight size={18} color="#FFFFFF" />
          </View>
        </View>

        {/* Subscription Banner - Single Color */}
        {isSubscribed && subscription && (
          <View style={styles.subscriptionContainer}>
            <View style={styles.subscriptionBanner}>
              <View style={styles.subscriptionInfo}>
                <Award size={20} color="#0A4D3C" />
                <View style={styles.subscriptionTextContainer}>
                  <Text style={styles.subscriptionPlan}>
                    {subscription?.plan?.name || 'Premium'} Plan
                  </Text>
                  <Text style={styles.subscriptionUsers}>
                    {subscription?.members?.length || 1}/{subscription?.purchased_user_count} Users
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.manageButton}
                onPress={handleEmployeesPress}
              >
                <UserPlus size={14} color="#FFFFFF" />
                <Text style={styles.manageButtonText}>Manage</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tabs Section */}
        <View style={styles.tabsWrapper}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'Customer' && styles.activeTabCustomer]}
              onPress={() => {
                setActiveTab('Customer');
                setSelectedCategory('Sort By');
                setSelectedOption('Default');
              }}
            >
              <Users size={16} color={activeTab === 'Customer' ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.tabText, activeTab === 'Customer' && styles.activeTabText]}>
                Customers
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'Supplier' && styles.activeTabSupplier]}
              onPress={() => {
                setActiveTab('Supplier');
                setSelectedCategory('Sort By');
                setSelectedOption('Default');
              }}
            >
              <TrendingUp size={16} color={activeTab === 'Supplier' ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.tabText, activeTab === 'Supplier' && styles.activeTabText]}>
                Suppliers
              </Text>
            </TouchableOpacity>

            <View style={styles.tabActions}>
              <TouchableOpacity style={styles.iconButton} onPress={toggleModal}>
                <Filter size={18} color="#0A4D3C" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.navigate({
                  pathname: '/search',
                  params: { addTo: activeTab }
                })}
              >
                <Search size={18} color="#0A4D3C" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Balance Card - Only for Customers */}
        {activeTab === 'Customer' && (
          <View style={styles.balanceCardWrapper}>
            <View style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>Net Balance</Text>
                <View style={styles.balanceBadge}>
                  <Text style={styles.balanceCount}>{currentData.length} Accounts</Text>
                </View>
              </View>

              <Text style={[
                styles.balanceAmount,
                netBalance >= 0 ? styles.balancePositive : styles.balanceNegative
              ]}>
                ₹ {parseFloat(netBalance).toFixed(2)}
              </Text>

              <View style={styles.balanceFooter}>
                <Text style={styles.balanceType}>You Pay</Text>
                <TrendingUp size={16} color={netBalance >= 0 ? '#0A4D3C' : '#EF4444'} />
              </View>
            </View>
          </View>
        )}

        {/* List Container */}
        <View style={styles.listContainer}>
          {Array.isArray(currentData) && currentData.length > 0 ? (
            currentData.map((person, index) => (
              <TouchableOpacity
                key={person.id}
                style={styles.personCard}
                onPress={() => handlePersonClick(person)}
                activeOpacity={0.7}
              >
                <View style={[styles.personAvatar, { backgroundColor: getStageColor(person.defaulter_stage) + '30' }]}>
                  <Text style={[styles.personAvatarText, { color: person.color }]}>
                    {person.initial}
                  </Text>
                </View>

                <View style={styles.personInfo}>
                  <Text style={styles.personName}>{person.name}</Text>
                  <View style={styles.paymentInfo}>
                    <CheckCircle size={10} color="#0A4D3C" />
                    <Text style={styles.paymentText}>
                      {person.type === 'Advance' ? 'Payment Added' : 'Credit Added'} • {person.date}
                    </Text>
                  </View>
                </View>

                <View style={styles.amountContainer}>
                  <Text style={[
                    styles.amount,
                    person.type === 'Due' ? styles.dueAmount : styles.advanceAmount
                  ]}>
                    ₹{person.amount}
                  </Text>
                  <View style={[
                    styles.typeBadge,
                    { backgroundColor: person.type === 'Due' ? '#FEE2E2' : '#D1FAE5' }
                  ]}>
                    <Text style={[
                      styles.typeText,
                      { color: person.type === 'Due' ? '#EF4444' : '#0A4D3C' }
                    ]}>
                      {person.type}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <LottieView
                source={require('../assets/animations/noData.json')}
                autoPlay
                loop
                style={styles.lottieAnimation}
              />
              <Text style={styles.emptyText}>No {activeTab.toLowerCase()}s found</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to add your first {activeTab.toLowerCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Extra bottom padding for floating button */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: '#0A4D3C' }]}
        onPress={activeTab === 'Customer' ? handleAddCustomer : handleAddSupplier}
        activeOpacity={0.8}
      >
        <Plus size={20} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Add {activeTab}</Text>
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        isVisible={isModalVisible}
        animationIn="slideInLeft"
        animationOut="slideOutLeft"
        style={styles.modal}
        onBackdropPress={toggleModal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalSolid}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter & Sort</Text>
              <TouchableOpacity onPress={toggleModal} style={styles.modalCloseButton}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.filterSidebar}>
                {FILTER_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category}
                    onPress={() => setSelectedCategory(category)}
                    style={[
                      styles.filterTab,
                      selectedCategory === category && styles.filterTabActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        selectedCategory === category && styles.filterTabTextActive,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.filterOptions}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  {renderOptions()}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.footerButton, styles.clearButton]}
                onPress={() => {
                  setSelectedOption('Default');
                  setSelectedCategory('Sort By');
                }}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.footerButton, styles.applyButton]}
                onPress={toggleModal}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <View style={[styles.navIcon, activeTab === 'Home' && styles.navIconActive]}>
            <Home size={18} color={activeTab === 'Home' ? '#FFFFFF' : '#64748B'} />
          </View>
          <Text style={[styles.navText, activeTab === 'Home' && styles.navTextActive]}>Home</Text>
        </TouchableOpacity>

        {isSubscribed && (
          <TouchableOpacity style={styles.navItem} onPress={handleEmployeesPress}>
            <View style={styles.navIcon}>
              <UserPlus size={18} color="#64748B" />
            </View>
            <Text style={styles.navText}>Employees</Text>
          </TouchableOpacity>
        )}

        {!isSubscribed && (
          <TouchableOpacity style={styles.navItem} onPress={handleMyPlanPress}>
            <View style={styles.navIcon}>
              <Award size={18} color="#64748B" />
            </View>
            <Text style={styles.navText}>My Plan</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.navItem} onPress={handleMorePress}>
          <View style={styles.navIcon}>
            <MoreHorizontal size={18} color="#64748B" />
          </View>
          <Text style={styles.navText}>More</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatarSolid: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A4D3C',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  welcomeContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0A4D3C',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#0A4D3C',
    fontWeight: '600',
  },
  bannerContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  verifiedBanner: {
    backgroundColor: '#0A4D3C', // Green for verified
  },
  pendingBanner: {
    backgroundColor: '#F97316', // Orange for pending
  },
  verifyIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyText: {
    flex: 1,
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  subscriptionContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  subscriptionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0A4D3C',
    backgroundColor: '#FFFFFF',
  },
  subscriptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subscriptionTextContainer: {
    gap: 2,
  },
  subscriptionPlan: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0A4D3C',
  },
  subscriptionUsers: {
    fontSize: 11,
    color: '#64748B',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A4D3C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  manageButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  tabsWrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
    borderRadius: 25,
    backgroundColor: 'transparent',
  },
  activeTabCustomer: {
    backgroundColor: '#0A4D3C',
  },
  activeTabSupplier: {
    backgroundColor: '#0A4D3C',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 4,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCardWrapper: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  balanceCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  balanceBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  balanceCount: {
    fontSize: 11,
    color: '#0A4D3C',
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  balancePositive: {
    color: '#0A4D3C',
  },
  balanceNegative: {
    color: '#EF4444',
  },
  balanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceType: {
    fontSize: 12,
    color: '#64748B',
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 10,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  personAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  personAvatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0A4D3C',
    marginBottom: 3,
    textTransform: 'capitalize',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentText: {
    fontSize: 11,
    color: '#64748B',
  },
  amountContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
  },
  dueAmount: {
    color: '#EF4444',
  },
  advanceAmount: {
    color: '#0A4D3C',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 9,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginTop: 10,
  },
  lottieAnimation: {
    width: 150,
    height: 120,

  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A4D3C',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 30,
  },
  bottomPadding: {
    height: 80,
  },
  addButton: {
    position: 'absolute',
    bottom: 70,
    right: 16,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
    shadowColor: '#0A4D3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modal: {
    margin: 0,
  },
  modalContent: {
    flex: 1,
    width: '85%',
    backgroundColor: 'transparent',
  },
  modalSolid: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0A4D3C',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  filterSidebar: {
    width: '35%',
    gap: 6,
  },
  filterTab: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 4,
    backgroundColor: '#F8FAFC',
  },
  filterTabActive: {
    backgroundColor: '#0A4D3C',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filterOptions: {
    flex: 1,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  optionText: {
    fontSize: 14,
    color: '#64748B',
  },
  optionTextSelected: {
    color: '#0A4D3C',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerButton: {
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  clearButton: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  applyButton: {
    backgroundColor: '#0A4D3C',
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  navIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconActive: {
    backgroundColor: '#0A4D3C',
  },
  navText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  navTextActive: {
    color: '#0A4D3C',
    fontWeight: '600',
  },
});