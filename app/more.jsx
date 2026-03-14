import React, { useState, useCallback, useContext } from 'react';
import {View,Text,StyleSheet,TouchableOpacity,SafeAreaView,ScrollView,StatusBar,Platform,Modal} from 'react-native';
import { useRouter } from 'expo-router';
import {TrendingUp,User,FileText,MoreHorizontal,Package,Settings,CreditCard,Star,CircleHelp as HelpCircle,Share2,Share,LogOut,Award,Home,ChevronRight,CheckCircle,X,RefreshCw} from 'lucide-react-native';
import { Appbar, Avatar } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './components/AuthContext';
import ApiService from './components/ApiServices';
import RazorpayCheckout from 'react-native-razorpay';
import { LinearGradient } from 'expo-linear-gradient';

const YOUR_RAZORPAY_KEY_ID = "rzp_test_RfcfxfJ2sIZdao"; // Move to env variable

export default function MoreScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [initialsLetter, setInitialsLetter] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalLoading, setRenewalLoading] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  
  const {
    user,
    isAuthenticated,
    isSubscribed,
    subscription,
    refreshSubscription
  } = useContext(AuthContext);

  const fetchSubscriptionDetails = async () => {
    try {
      if (subscription?.id) {
        const response = await ApiService.get(`/subscriptions/${subscription.id}`);
        if (response.data) {
          setSubscriptionDetails(response.data.subscription);
        }
      }
    } catch (error) {
      console.error('Error fetching subscription details:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      if (isSubscribed && subscription?.id) {
        fetchSubscriptionDetails();
      }
    }, [isSubscribed, subscription])
  );

  const fetchUserData = async () => {
    const userDetails = await AsyncStorage.getItem("userData");
    const rrr = JSON.parse(userDetails);
    setUserData(rrr);
    const name = rrr?.name?.trim() || '';
    const firstWord = name.split(' ')[0] || '';
    const initials = firstWord.charAt(0).toUpperCase();
    setInitialsLetter(initials);
  };

  const handleRenewalPress = () => {
    setShowRenewalModal(true);
  };

  const handleRenewSubscription = async () => {
    try {
      setRenewalLoading(true);

      const userData = await AsyncStorage.getItem("userData");
      if (!userData) {
        Alert.alert("Error", "User not found");
        return;
      }
      const userDetails = JSON.parse(userData);

      if (!subscription) {
        Alert.alert("Error", "Subscription not found");
        return;
      }

      console.log("Creating renewal order for subscription:", subscription.id);

      // Create renewal order
      const response = await ApiService.post('/payment_rozarpay/renew-subscription', {
        subscription_id: subscription.id,
        user_id: user.id,
        subscriber_name: userDetails.name,
        subscriber_email: userDetails.email,
        subscriber_phone: userDetails.mobile
      });

      const data = response.data;
      if (!data.orderId) {
        Alert.alert("Error", "Unable to create renewal order");
        return;
      }

      // Close the modal
      setShowRenewalModal(false);

      // Razorpay options
      const options = {
        description: `Renew ${data.plan_name} Subscription`,
        image: "../assets/images/icon.png",
        currency: "INR",
        key: YOUR_RAZORPAY_KEY_ID,
        amount: data.amount,
        order_id: data.orderId,
        name: "Aqua Services",
        prefill: {
          name: userDetails.name,
          email: userDetails.email,
          contact: userDetails.mobile
        },
        theme: { color: "#0C8CE9" },
        method: {
          netbanking: true,
          card: true,
          wallet: true,
          emi: true,
          paylater: true,
          upi: true
        }
      };

      RazorpayCheckout.open(options)
        .then(paymentResult => {
          console.log("Renewal Payment Result:", paymentResult);
          verifyRenewalPayment(options, paymentResult);
        })
        .catch(error => {
          console.log("Renewal Payment Error:", error);
          if (error.code === 2) {
            Alert.alert("Payment Cancelled", "You cancelled the renewal payment");
          } else {
            Alert.alert("Payment Failed", error.description || "Something went wrong");
          }
        });

    } catch (error) {
      console.error("Error creating renewal:", error);
      Alert.alert("Error", error.response?.data?.error || "Something went wrong");
    } finally {
      setRenewalLoading(false);
    }
  };

  const verifyRenewalPayment = async (options, paymentResult) => {
    try {
      const verificationData = {
        razorpay_order_id: options.order_id,
        razorpay_payment_id: paymentResult.razorpay_payment_id,
        razorpay_signature: paymentResult.razorpay_signature
      };

      console.log("Verifying renewal payment:", verificationData);

      const response = await ApiService.post('/payment_rozarpay/verify-renewal-payment', verificationData);

      if (response.data.success) {
        Alert.alert(
          "Success", 
          "Subscription renewed successfully!",
          [
            {
              text: "OK",
              onPress: () => {
                refreshSubscription(); // Refresh subscription data
                router.push('/my-plan'); // Navigate to plan details
              }
            }
          ]
        );
      } else {
        Alert.alert("Error", "Payment verification failed");
      }
    } catch (error) {
      console.error("Renewal verification error:", error);
      Alert.alert("Error", error.response?.data?.message || "Payment verification failed");
    }
  };

  const handleMyPlanPress = () => {
    router.push('/my-plan');
  };

  const handleItemPress = (item) => {
    if (item.onPress) {
      item.onPress();
    } else {
      console.log('Navigate to:', item.title);
    }
  };

  const handleEmployeesPress = () => {
    router.push('/subscription-members');
  };

  // Dynamic menu items based on subscription status
  const getBusinessMenuItems = () => {
    const businessItems = [
      { icon: <FileText size={20} color="#666" />, title: 'Bills', subtitle: 'Manage invoices and billing', onPress: () => router.push('/bills') },
      { icon: <Package size={20} color="#666" />, title: 'Stock Management', subtitle: 'Track inventory and stock levels', onPress: () => router.push('/items') },
    ];

    // Show either Plan or Renewal based on subscription status
    if (isSubscribed) {
      businessItems.push({ 
        icon: <RefreshCw size={20} color="#666" />, 
        title: 'Renew Subscription', 
        subtitle: subscriptionDetails ? 
          `Renew plan (Expires: ${new Date(subscriptionDetails.end_date).toLocaleDateString()})` : 
          'Renew your current plan',
        onPress: handleRenewalPress 
      });
    } else {
      businessItems.push({ 
        icon: <CreditCard size={20} color="#666" />, 
        title: 'My Plan', 
        subtitle: 'Subscribe to a plan and manage billing', 
        onPress: handleMyPlanPress 
      });
    }

    return businessItems;
  };

  const menuItems = [
    {
      section: 'Account',
      items: [
        { icon: <User size={20} color="#666" />, title: 'Account', subtitle: 'Profile settings and account details', onPress: () => router.push('/accounts') },
        { icon: <User size={20} color="#666" />, title: 'Profile', subtitle: 'Personal information and business details', onPress: () => router.push('/profile') },
      ]
    },
    {
      section: 'Business',
      items: getBusinessMenuItems()
    },
    {
      section: 'Support',
      items: [
        { icon: <HelpCircle size={20} color="#666" />, title: 'Help', subtitle: 'Get support and help center', onPress: () => router.push('/help') },
        { icon: <Star size={20} color="#666" />, title: 'Rate App', subtitle: 'Rate Aqua Credit on app store' },
        { icon: <Share2 size={20} color="#666" />, title: 'Share App', subtitle: 'Invite friends to use Aqua Credit' },
        { icon: <LogOut size={20} color="#666" />, title: 'LogOut', subtitle: 'Logout from your account', onPress: () => setShowLogoutModal(true) },
      ]
    }
  ];

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
            <View style={styles.avatarContainer}>
              <Avatar.Text
                label={initialsLetter}
                size={40}
                color="#FFFFFF"
                style={styles.avatar}
                theme={{ colors: { primary: '#0A4D3C' } }}
              />
            </View>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Aqua Credit</Text>
              <Text style={styles.headerSubtitle}>Digital Khata</Text>
            </View>

            <View style={styles.headerRight} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeContainer}>
          <View style={styles.welcomeRow}>
            <Text style={styles.welcomeText}>
              Welcome, {userData?.name?.split(' ')[0] || 'User'}!
            </Text>
            <View style={styles.dateBadge}>
              <CheckCircle size={12} color="#0A4D3C" />
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

        {/* Profile Summary Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userData?.name || 'User'}</Text>
            <Text style={styles.profilePhone}>{userData?.mobile || 'Add phone number'}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileEditButton}
            onPress={() => router.push('/profile')}
          >
            <Text style={styles.profileEditText}>Edit Profile</Text>
            <ChevronRight size={16} color="#0A4D3C" />
          </TouchableOpacity>
        </View>

        {menuItems.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.menuItem,
                    itemIndex !== section.items.length - 1 && styles.menuItemBorder
                  ]}
                  onPress={() => handleItemPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuIcon}>
                    {item.icon}
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>
                  <View style={styles.menuArrow}>
                    <ChevronRight size={18} color="#CBD5E1" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.footerText}>© 2025 Aqua Credit. All rights reserved.</Text>
        </View>
      </ScrollView>

      {/* Renewal Confirmation Modal - Normal Modal */}
      <Modal
        visible={showRenewalModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRenewalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.renewalModalContainer}>
            <View style={styles.renewalModalHeader}>
              <Text style={styles.renewalModalTitle}>Renew Subscription</Text>
              <TouchableOpacity onPress={() => setShowRenewalModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.renewalModalContent}>
              <Text style={styles.renewalModalText}>
                Are you sure you want to renew your subscription?
              </Text>
              
              {subscriptionDetails && (
                <View style={styles.renewalDetailsContainer}>
                  <View style={styles.renewalDetailRow}>
                    <Text style={styles.renewalDetailLabel}>Current Plan:</Text>
                    <Text style={styles.renewalDetailValue}>{subscriptionDetails.plan_name}</Text>
                  </View>
                  <View style={styles.renewalDetailRow}>
                    <Text style={styles.renewalDetailLabel}>Expires on:</Text>
                    <Text style={styles.renewalDetailValue}>
                      {new Date(subscriptionDetails.end_date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.renewalDetailRow}>
                    <Text style={styles.renewalDetailLabel}>Amount:</Text>
                    <Text style={styles.renewalDetailValue}>₹{subscriptionDetails.total_price}</Text>
                  </View>
                </View>
              )}

              <View style={styles.renewalButtonRow}>
                <TouchableOpacity
                  style={[styles.renewalButton, styles.renewalCancelButton]}
                  onPress={() => setShowRenewalModal(false)}
                >
                  <Text style={styles.renewalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.renewalButton, styles.renewalConfirmButton]}
                  onPress={handleRenewSubscription}
                  disabled={renewalLoading}
                >
                  {renewalLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.renewalConfirmButtonText}>Renew Now</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Modal - Fixed */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Logout</Text>
              <TouchableOpacity
                onPress={() => setShowLogoutModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalIconContainer}>
              <LogOut size={40} color="#DC2626" />
            </View>

            <Text style={styles.modalMessage}>
              Are you sure you want to logout from your account?
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.logoutButton]}
                onPress={() => {
                  setShowLogoutModal(false);
                  router.replace('/login');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation - Exactly like dashboard */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/dashboard')}>
          <View style={[styles.navIcon, styles.navIconInactive]}>
            <Home size={18} color="#64748B" />
          </View>
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        {isSubscribed && (
        <TouchableOpacity style={styles.navItem} onPress={handleEmployeesPress}>
          <View style={[styles.navIcon, styles.navIconInactive]}>
            <Award size={18} color="#64748B" />
          </View>
          <Text style={styles.navText}>Employees</Text>
        </TouchableOpacity>
        )}
        
        {!isSubscribed && (
        <TouchableOpacity style={styles.navItem} onPress={handleMyPlanPress}>
          <View style={[styles.navIcon, styles.navIconInactive]}>
            <Award size={18} color="#64748B" />
          </View>
          <Text style={styles.navText}>My Plan</Text>
        </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.navItem}>
          <View style={[styles.navIcon, styles.navIconActive]}>
            <MoreHorizontal size={18} color="#FFFFFF" />
          </View>
          <Text style={[styles.navText, styles.navTextActive]}>More</Text>
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
    paddingTop: Platform.OS === 'android' ? 20 : 0,
    paddingBottom: 20,
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
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatar: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
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
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  welcomeContainer: {
    marginBottom: 16,
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 13,
    color: '#64748B',
  },
  profileEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10,77,60,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  profileEditText: {
    fontSize: 12,
    color: '#0A4D3C',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(10,77,60,0.1)',
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(10,77,60,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  menuArrow: {
    padding: 4,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  versionText: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },

  // Fixed Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  logoutButton: {
    backgroundColor: '#DC2626',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  logoutButtonText: {
    fontSize: 15,
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
    borderTopColor: 'rgba(10,77,60,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconActive: {
    backgroundColor: '#0A4D3C',
  },
  navIconInactive: {
    backgroundColor: '#F8FAFC',
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