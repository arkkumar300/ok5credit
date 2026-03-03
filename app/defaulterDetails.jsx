import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Appbar, Divider } from 'react-native-paper';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';
import ErrorModal from './components/ErrorModal';
import moment from 'moment';

export default function DefaulterDetails() {
  const router = useRouter();
  const { customerId, customerName } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [defaulterData, setDefaulterData] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [defaulterSummary, setDefaulterSummary] = useState(null);
  const [skippedTransactions, setSkippedTransactions] = useState([]);

  const fetchDefaulterData = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        setError('User data not found');
        return;
      }

      const userId = JSON.parse(userData).id;
      const ownerId = JSON.parse(userData).owner_user_id;
      
      const response = await ApiService.get(`/transactions/defaulters/customer/${customerId}`, {
        params: { userId, ownerId }
      });
      
      if (response.data.success) {
        const data = response.data.data;
        setDefaulterData(data);
        setCustomerDetails(data.customer_details);
        setDefaulterSummary(data.defaulter_summary);
        setSkippedTransactions(data.skipped_transactions || []);
      } else {
        setError('Failed to fetch defaulter data');
      }
    } catch (err) {
      console.error('Error fetching defaulter data:', err);
      setError('Failed to load defaulter information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [customerId]);

  useFocusEffect(
    useCallback(() => {
      fetchDefaulterData();
    }, [fetchDefaulterData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDefaulterData();
  }, [fetchDefaulterData]);

  const getStageColor = (stage) => {
    if (!stage) return '#999';
    switch(stage) {
      case 'stage1': return '#FFA500';
      case 'stage2': return '#FF8C00';
      case 'stage3': return '#FF4500';
      case 'stage4': return '#DC143C';
      default: return '#999';
    }
  };

  const getStageText = (stage) => {
    if (!stage) return 'No Stage';
    switch(stage) {
      case 'stage1': return 'Stage 1 - Initial Reminder';
      case 'stage2': return 'Stage 2 - Follow Up';
      case 'stage3': return 'Stage 3 - Final Notice';
      case 'stage4': return 'Stage 4 - Legal Action';
      default: return stage;
    }
  };

  const renderInfoCard = (icon, label, value, color = '#333') => (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>{icon}</View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, { color }]}>{value || 'N/A'}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading defaulter details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#2E7D32" />
        </TouchableOpacity>
        <Appbar.Content
          title={`Defaulter: ${customerName || 'Details'}`}
          titleStyle={styles.headerTitle}
        />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {customerDetails && (
          <>
            {/* Defaulter Status Banner */}
            <View style={[
              styles.statusBanner,
              { backgroundColor: customerDetails.defaulter_stage ? '#FFE4E1' : '#E8F5E9' }
            ]}>
              <AlertTriangle size={40} color={customerDetails.defaulter_stage ? '#FF6B6B' : '#4CAF50'} />
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>
                  {customerDetails.defaulter_stage ? 'Defaulter' : 'Regular Customer'}
                </Text>
                <Text style={styles.statusSubtitle}>
                  {customerDetails.defaulter_stage 
                    ? `Stage: ${customerDetails.defaulter_stage.toUpperCase()}`
                    : 'No default issues'}
                </Text>
              </View>
            </View>

            {/* Customer Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customer Information</Text>
              <Divider style={styles.divider} />
              
              {renderInfoCard(
                <Phone size={20} color="#2E7D32" />,
                'Mobile',
                customerDetails.mobile
              )}
              
              {renderInfoCard(
                <Mail size={20} color="#2E7D32" />,
                'Email',
                customerDetails.email
              )}
              
              {renderInfoCard(
                <MapPin size={20} color="#2E7D32" />,
                'Address',
                customerDetails.address
              )}
              
              {renderInfoCard(
                <Calendar size={20} color="#2E7D32" />,
                'Due Date',
                customerDetails.due_date ? moment(customerDetails.due_date).format('DD/MM/YYYY') : 'No due date'
              )}
            </View>

            {/* Defaulter Summary Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Defaulter Summary</Text>
              <Divider style={styles.divider} />

              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Total Overdue</Text>
                  <Text style={[styles.summaryValue, styles.negativeBalance]}>
                    ₹ {defaulterSummary?.total_overdue || 0}
                  </Text>
                </View>

                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Overdue Count</Text>
                  <Text style={styles.summaryValue}>
                    {defaulterSummary?.overdue_count || 0}
                  </Text>
                </View>

                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Max Delay Days</Text>
                  <Text style={styles.summaryValue}>
                    {defaulterSummary?.max_delay_days || 0} days
                  </Text>
                </View>

                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Final Stage</Text>
                  <Text style={[
                    styles.summaryValue,
                    { color: getStageColor(defaulterSummary?.final_stage) }
                  ]}>
                    {defaulterSummary?.final_stage?.toUpperCase() || 'None'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Stage Breakdown Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Stage Breakdown</Text>
              <Divider style={styles.divider} />

              <View style={styles.stageContainer}>
                <View style={styles.stageItem}>
                  <Text style={styles.stageName}>Stage 1</Text>
                  <View style={styles.stageBar}>
                    <View 
                      style={[
                        styles.stageBarFill, 
                        { 
                          width: `${Math.min((defaulterSummary?.stage_breakdown?.stage1_count || 0) * 25, 100)}%`,
                          backgroundColor: '#FFA500'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.stageCount}>
                    {defaulterSummary?.stage_breakdown?.stage1_count || 0}
                  </Text>
                </View>

                <View style={styles.stageItem}>
                  <Text style={styles.stageName}>Stage 2</Text>
                  <View style={styles.stageBar}>
                    <View 
                      style={[
                        styles.stageBarFill, 
                        { 
                          width: `${Math.min((defaulterSummary?.stage_breakdown?.stage2_count || 0) * 25, 100)}%`,
                          backgroundColor: '#FF8C00'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.stageCount}>
                    {defaulterSummary?.stage_breakdown?.stage2_count || 0}
                  </Text>
                </View>

                <View style={styles.stageItem}>
                  <Text style={styles.stageName}>Stage 3</Text>
                  <View style={styles.stageBar}>
                    <View 
                      style={[
                        styles.stageBarFill, 
                        { 
                          width: `${Math.min((defaulterSummary?.stage_breakdown?.stage3_count || 0) * 25, 100)}%`,
                          backgroundColor: '#FF4500'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.stageCount}>
                    {defaulterSummary?.stage_breakdown?.stage3_count || 0}
                  </Text>
                </View>

                <View style={styles.stageItem}>
                  <Text style={styles.stageName}>Stage 4</Text>
                  <View style={styles.stageBar}>
                    <View 
                      style={[
                        styles.stageBarFill, 
                        { 
                          width: `${Math.min((defaulterSummary?.stage_breakdown?.stage4_count || 0) * 25, 100)}%`,
                          backgroundColor: '#DC143C'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.stageCount}>
                    {defaulterSummary?.stage_breakdown?.stage4_count || 0}
                  </Text>
                </View>
              </View>
            </View>

            {/* Skipped Transactions Section */}
            {skippedTransactions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Skipped Transactions</Text>
                <Divider style={styles.divider} />

                {skippedTransactions.map((transaction, index) => (
                  <View key={index} style={styles.transactionCard}>
                    <View style={styles.transactionHeader}>
                      <Text style={styles.transactionDate}>
                        {moment(transaction.transaction_date).format('DD/MM/YYYY')}
                      </Text>
                      <Text style={[
                        styles.transactionAmount,
                        transaction.transaction_type === 'you_got' 
                          ? styles.positiveBalance 
                          : styles.negativeBalance
                      ]}>
                        ₹ {transaction.amount}
                      </Text>
                    </View>
                    <Text style={styles.transactionDesc}>
                      {transaction.description || 'No description'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <ErrorModal
        visible={!!error}
        message={error}
        onClose={() => setError(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 2,
    borderColor: '#f2f7f6',
    elevation: 0,
  },
  headerTitle: {
    color: '#333333',
    fontSize: 18,
    fontWeight: 'bold',
    marginStart: 10,
  },
  scrollView: {
    flex: 1,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  statusTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '48%',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  positiveBalance: {
    color: '#388E3C',
  },
  negativeBalance: {
    color: '#d32f2f',
  },
  stageContainer: {
    marginTop: 8,
  },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stageName: {
    width: 60,
    fontSize: 13,
    color: '#555',
  },
  stageBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  stageBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  stageCount: {
    width: 30,
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
  },
  transactionCard: {
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    marginBottom: 8,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    color: '#666',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  transactionDesc: {
    fontSize: 13,
    color: '#777',
  },
});