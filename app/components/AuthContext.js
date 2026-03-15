// contexts/AuthContext.js
import { createContext, useState, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './ApiServices.js'; // Adjust path as needed
import moment from 'moment';

export const AuthContext = createContext();

 const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from storage on app start
  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        // Check subscription after loading user
        await checkSubscription(parsedUser.id);
      }
    } catch (error) {
      console.log('Error loading stored user:', error);
    }
  };

  const login = async (userData) => {
    try {
      setUser(userData);
      setIsAuthenticated(true);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      await checkSubscription(userData.id);
    } catch (error) {
      console.log('Error saving user:', error);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setSubscription(null);
      setIsAuthenticated(false);
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      console.log('Error logging out:', error);
    }
  };

  const checkSubscription = async (userId = user?.id) => {
    if (!userId) return null;
    setIsLoading(true);
    try {
      // Call your subscription endpoint
      const response = await ApiService.get(`/subscriptions/my/${userId}`, {
        headers: { 'Content-Type': 'application/json' } 
      });
      // Handle different response formats
      const subscriptionData = response.data || response;
      
      if (subscriptionData) {
        // Check if subscription is active based on dates and status
        const isActive = subscriptionData.is_active && 
                        !subscriptionData.is_cancelled && 
                        moment(subscriptionData.end_date).isAfter(moment());
        
        setSubscription({
          ...subscriptionData,
          isActive,
          daysRemaining: moment(subscriptionData.end_date).diff(moment(), 'days'),
          hasExpired: moment(subscriptionData.end_date).isBefore(moment())
        });
      } else {
        setSubscription(null);
      }
      
      return subscriptionData;
    } catch (error) {
      console.log('Error checking subscription:', error);
      // If 404, user has no subscription
      if (error.response?.status === 404) {
        setSubscription(null);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSubscription = async () => {
    if (user?.id) {
      await checkSubscription(user.id);
    }
  };

  // Check if user has active subscription
  const hasActiveSubscription = () => {
    return subscription?.isActive === true;
  };

  // Get subscription status with details
  const getSubscriptionStatus = () => {
    if (!subscription) return 'none';
    if (subscription.is_cancelled) return 'cancelled';
    if (subscription.hasExpired) return 'expired';
    if (subscription.isActive) return 'active';
    return 'inactive';
  };

  // Get remaining days
  const getRemainingDays = () => {
    return subscription?.daysRemaining || 0;
  };

  // Check if user can access a feature based on subscription
  const canAccess = (feature) => {
    if (!hasActiveSubscription()) return false;
    
    // Check if feature is in plan's points/features
    if (subscription.plan?.points) {
      return subscription.plan.points.includes(feature);
    }
    
    return true; // If no features specified, allow access
  };

  // Get current plan details
  const getCurrentPlan = () => {
    return subscription?.plan || null;
  };

  // Get purchased user count
  const getPurchasedUserCount = () => {
    return subscription?.purchased_user_count || 1;
  };

  return (
    <AuthContext.Provider value={{
      // User
      user,
      setUser,
      login,
      logout,
      loadStoredUser,
      isLoading,
      isAuthenticated,
      
      // Subscription
      subscription,
      checkSubscription,
      refreshSubscription,
      hasActiveSubscription,
      getSubscriptionStatus,
      getRemainingDays,
      canAccess,
      getCurrentPlan,
      getPurchasedUserCount,
      
      // Convenience booleans
      isSubscribed: hasActiveSubscription(),
      subscriptionStatus: getSubscriptionStatus(),
      subscriptionEndDate: subscription?.end_date,
      subscriptionStartDate: subscription?.start_date,
      planName: subscription?.plan?.name,
      planFeatures: subscription?.plan?.points || []
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;