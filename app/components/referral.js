import * as AppLinks from 'expo-applinks';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const captureReferralCode = async () => {
  try {
    // Only run once per install
    const hasCaptured = await AsyncStorage.getItem('referral_captured');
    if (hasCaptured) return null;

    // For Android: get install referrer
    const referrer = await AppLinks.getInstallReferrer();
    if (referrer && referrer.referrer) {
      // URL format: https://play.google.com/...&referrer=CODE
      const params = new URLSearchParams(referrer.referrer);
      const code = params.get('referrer');
      if (code) {
        await AsyncStorage.setItem('referral_code', code);
        await AsyncStorage.setItem('referral_captured', 'true');
        await AsyncStorage.setItem('isReferral', 'false');
        return code;
      }
    }
    // Fallback: read from deep link if app opened via link (but first install is main)
    return null;
  } catch (error) {
    console.log('Error capturing referral:', error);
    return null;
  }
};