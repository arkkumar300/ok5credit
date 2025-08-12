import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, X, Smartphone, FileText, Headphones, Monitor, Image, Package } from 'lucide-react-native';

export default function MyPlanScreen() {
  const [selectedPlan, setSelectedPlan] = useState('ads-free');
  const router = useRouter();

  const plans = [
    {
      id: 'basic',
      name: 'Basic Plan',
      price: 'Free',
      duration: '',
      isActive: false,
      badge: 'Active Plan',
      features: [
        { icon: <Smartphone size={20} color="#666" />, text: 'Send transaction SMS from your phone (SIM)' },
        { icon: <X size={20} color="#666" />, text: 'Contain Ads' }
      ]
    },
    {
      id: 'ads-free',
      name: 'Ads Free++',
      price: '₹75',
      duration: 'for 30 days',
      isRecommended: true,
      features: [
        { icon: <X size={20} color="#666" />, text: 'No Ads' },
        { icon: <FileText size={20} color="#666" />, text: 'Create Bills (Normal Bills, GST Bills)' },
        { icon: <Headphones size={20} color="#666" />, text: 'Priority customer support' },
        { icon: <Monitor size={20} color="#666" />, text: 'Multi device enabled. Sign with same OkCredit number on multiple devices' },
        { icon: <Image size={20} color="#666" />, text: 'Lifetime access to all transaction bills' },
        { icon: <Monitor size={20} color="#666" />, text: 'Access on computer/desktop' },
        { icon: <Package size={20} color="#666" />, text: 'Manage Stocks (Add items with transactions)' }
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '₹99',
      duration: 'for 30 days',
      features: [
        { icon: <Check size={20} color="#666" />, text: 'All benefits for Ads Free++' },
        { icon: <Smartphone size={20} color="#666" />, text: 'Unlimited transaction SMS from OkCredit' }
      ]
    }
  ];

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
  };

  const handleContinue = () => {
    // Handle plan selection
    console.log('Selected plan:', selectedPlan);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My plans</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {plans.map((plan) => (
          <View key={plan.id} style={styles.planCard}>
            <View style={styles.planHeader}>
              <View style={styles.planTitleContainer}>
                <Text style={styles.planName}>{plan.name}</Text>
                {plan.isRecommended && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>Recommended Plan</Text>
                  </View>
                )}
                {plan.badge && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeText}>{plan.badge}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => handlePlanSelect(plan.id)}
              >
                <View style={[
                  styles.radioOuter,
                  selectedPlan === plan.id && styles.radioSelected
                ]}>
                  {selectedPlan === plan.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.price}>{plan.price}</Text>
              {plan.duration && (
                <Text style={styles.duration}> {plan.duration}</Text>
              )}
            </View>

            <View style={styles.featuresContainer}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    {feature.icon}
                  </View>
                  <Text style={styles.featureText}>{feature.text}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  planTitleContainer: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  recommendedBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  recommendedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  activeBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  activeText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  radioButton: {
    padding: 4,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#4CAF50',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  duration: {
    fontSize: 14,
    color: '#666',
  },
  featuresContainer: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  bottomContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});