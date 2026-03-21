import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import ApiService from "./ApiServices"; // adjust path

export const useSubscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkSubscription = async () => {
    try {
      setIsLoading(true);

      const userData = await AsyncStorage.getItem("userData");
      if (!userData) return null;

      const parsedUser = JSON.parse(userData);
      const ownerId = parsedUser.owner_user_id;

      const response = await ApiService.get(`/subscriptions/my/${ownerId}`, {
        headers: { "Content-Type": "application/json" },
      });

      const subscriptionData = response?.data || response;

      if (subscriptionData) {
        const isActive =
          subscriptionData.is_active &&
          !subscriptionData.is_cancelled &&
          moment(subscriptionData.end_date).isAfter(moment());

        const formattedSubscription = {
          ...subscriptionData,
          isActive,
          daysRemaining: moment(subscriptionData.end_date).diff(
            moment(),
            "days"
          ),
          hasExpired: moment(subscriptionData.end_date).isBefore(moment()),
        };

        setSubscription(formattedSubscription);
        return formattedSubscription;
      } else {
        setSubscription(null);
        return null;
      }
    } catch (error) {
      console.log("Subscription check error:", error);

      if (error?.response?.status === 404) {
        setSubscription(null);
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, []);

  return { subscription, isLoading, checkSubscription };
};