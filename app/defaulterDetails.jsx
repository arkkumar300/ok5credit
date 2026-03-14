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
  StatusBar,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Appbar, Divider, Card } from 'react-native-paper';
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar, Clock,
  AlertTriangle, CheckCircle, XCircle, User, IndianRupee,
  TrendingUp, AlertOctagon, SkipForward, Shield, Award,
  CreditCard, DollarSign, Percent, BarChart
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';
import ErrorModal from './components/ErrorModal';
import moment from 'moment';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

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
    if (!stage) return '#64748B';
    switch(stage) {
      case 'stage1': return '#F97316'; // Orange
      case 'stage2': return '#EA580C'; // Dark Orange
      case 'stage3': return '#DC2626'; // Red
      case 'stage4': return '#991B1B'; // Dark Red
      default: return '#64748B';
    }
  };

  const getStageBgColor = (stage) => {
    if (!stage) return '#F1F5F9';
    switch(stage) {
      case 'stage1': return '#FFF7ED';
      case 'stage2': return '#FFEDD5';
      case 'stage3': return '#FEE2E2';
      case 'stage4': return '#FEE2E2';
      default: return '#F1F5F9';
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

  const getStageIcon = (stage) => {
    switch(stage) {
      case 'stage1': return <Clock size={20} color="#F97316" />;
      case 'stage2': return <AlertTriangle size={20} color="#EA580C" />;
      case 'stage3': return <AlertOctagon size={20} color="#DC2626" />;
      case 'stage4': return <Shield size={20} color="#991B1B" />;
      default: return <CheckCircle size={20} color="#0A4D3C" />;
    }
  };

  const renderInfoCard = (icon, label, value, color = '#1E293B') => (
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
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0A4D3C" />
        <LinearGradient
          colors={['#0A4D3C', '#1B6B50']}
          style={styles.headerGradient}
        >
          <SafeAreaView>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ArrowLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Defaulter Details</Text>
                <Text style={styles.headerSubtitle}>Loading information...</Text>
              </View>
              <View style={styles.headerRightPlaceholder} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0A4D3C" />
          <Text style={styles.loadingText}>Loading defaulter details...</Text>
        </View>
      </View>
    );
  }

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
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {customerName || 'Defaulter Details'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {customerDetails?.defaulter_stage ? 'Active Defaulter' : 'Regular Customer'}
              </Text>
            </View>

            <View style={styles.headerRightPlaceholder}>
              {customerDetails?.defaulter_stage ? (
                <AlertTriangle size={20} color="rgba(255,255,255,0.8)" />
              ) : (
                <CheckCircle size={20} color="rgba(255,255,255,0.8)" />
              )}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0A4D3C']}
            tintColor="#0A4D3C"
          />
        }
      >
        {customerDetails && (
          <>
            {/* Status Banner */}
            <View style={[
              styles.statusBanner,
              { backgroundColor: customerDetails.defaulter_stage ? '#FEF2F2' : '#F0FDF4' }
            ]}>
              <View style={[
                styles.statusIconContainer,
                { backgroundColor: customerDetails.defaulter_stage ? '#FEE2E2' : '#DCFCE7' }
              ]}>
                {customerDetails.defaulter_stage ? (
                  <AlertTriangle size={32} color="#DC2626" />
                ) : (
                  <CheckCircle size={32} color="#0A4D3C" />
                )}
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={[
                  styles.statusTitle,
                  { color: customerDetails.defaulter_stage ? '#DC2626' : '#0A4D3C' }
                ]}>
                  {customerDetails.defaulter_stage ? 'Defaulter Customer' : 'Regular Customer'}
                </Text>
                <Text style={styles.statusSubtitle}>
                  {customerDetails.defaulter_stage
                    ? getStageText(customerDetails.defaulter_stage)
                    : 'No default issues found'}
                </Text>
              </View>
            </View>

            {/* Customer Information Card */}
            <Card style={styles.sectionCard}>
              <Card.Content>
                <View style={styles.sectionHeader}>
                  <User size={20} color="#0A4D3C" />
                  <Text style={styles.sectionTitle}>Customer Information</Text>
                </View>

                {renderInfoCard(
                  <Phone size={18} color="#0A4D3C" />,
                  'Mobile Number',
                  customerDetails.mobile
                )}

                {renderInfoCard(
                  <Mail size={18} color="#0A4D3C" />,
                  'Email Address',
                  customerDetails.email || 'Not provided'
                )}

                {renderInfoCard(
                  <MapPin size={18} color="#0A4D3C" />,
                  'Address',
                  customerDetails.address || 'Not provided'
                )}

                {renderInfoCard(
                  <Calendar size={18} color="#0A4D3C" />,
                  'Due Date',
                  customerDetails.due_date ? moment(customerDetails.due_date).format('DD MMM YYYY') : 'No due date',
                  customerDetails.due_date ? '#DC2626' : '#64748B'
                )}
              </Card.Content>
            </Card>

            {/* Defaulter Summary Card - 2x2 Grid */}
            <Card style={styles.sectionCard}>
              <Card.Content>
                <View style={styles.sectionHeader}>
                  <AlertTriangle size={20} color="#0A4D3C" />
                  <Text style={styles.sectionTitle}>Defaulter Summary</Text>
                </View>

                <View style={styles.summaryGrid}>
                  {/* Total Overdue */}
                  <View style={styles.summaryCard}>
                    <View style={[styles.summaryIcon, { backgroundColor: '#FEE2E2' }]}>
                      <IndianRupee size={22} color="#DC2626" />
                    </View>
                    <View style={styles.summaryContent}>
                      <Text style={styles.summaryLabel}>Total Overdue</Text>
                      <Text style={[styles.summaryValue, styles.negativeBalance]}>
                        ₹ {defaulterSummary?.total_overdue?.toFixed(2) || '0.00'}
                      </Text>
                    </View>
                  </View>

                  {/* Overdue Count */}
                  <View style={styles.summaryCard}>
                    <View style={[styles.summaryIcon, { backgroundColor: '#E8F5E9' }]}>
                      <BarChart size={22} color="#0A4D3C" />
                    </View>
                    <View style={styles.summaryContent}>
                      <Text style={styles.summaryLabel}>Overdue Count</Text>
                      <Text style={styles.summaryValue}>
                        {defaulterSummary?.overdue_count || 0}
                      </Text>
                    </View>
                  </View>

                  {/* Max Delay Days */}
                  <View style={styles.summaryCard}>
                    <View style={[styles.summaryIcon, { backgroundColor: '#FFF3E0' }]}>
                      <Clock size={22} color="#F97316" />
                    </View>
                    <View style={styles.summaryContent}>
                      <Text style={styles.summaryLabel}>Max Delay</Text>
                      <Text style={styles.summaryValue}>
                        {defaulterSummary?.max_delay_days || 0} days
                      </Text>
                    </View>
                  </View>

                  {/* Current Stage */}
                  <View style={styles.summaryCard}>
                    <View style={[styles.summaryIcon, { backgroundColor: getStageBgColor(defaulterSummary?.final_stage) }]}>
                      {getStageIcon(defaulterSummary?.final_stage)}
                    </View>
                    <View style={styles.summaryContent}>
                      <Text style={styles.summaryLabel}>Current Stage</Text>
                      <Text style={[styles.summaryValue, { color: getStageColor(defaulterSummary?.final_stage) }]}>
                        {defaulterSummary?.final_stage?.toUpperCase() || 'None'}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Stage Breakdown Card */}
            <Card style={styles.sectionCard}>
              <Card.Content>
                <View style={styles.sectionHeader}>
                  <Award size={20} color="#0A4D3C" />
                  <Text style={styles.sectionTitle}>Stage Breakdown</Text>
                </View>

                <View style={styles.stageContainer}>
                  <View style={styles.stageItem}>
                    <View style={styles.stageInfo}>
                      <View style={[styles.stageDot, { backgroundColor: '#F97316' }]} />
                      <Text style={styles.stageName}>Stage 1</Text>
                    </View>
                    <View style={styles.stageBar}>
                      <View
                        style={[
                          styles.stageBarFill,
                          {
                            width: `${Math.min((defaulterSummary?.stage_breakdown?.stage1_count || 0) * 25, 100)}%`,
                            backgroundColor: '#F97316'
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.stageCount}>
                      {defaulterSummary?.stage_breakdown?.stage1_count || 0}
                    </Text>
                  </View>

                  <View style={styles.stageItem}>
                    <View style={styles.stageInfo}>
                      <View style={[styles.stageDot, { backgroundColor: '#EA580C' }]} />
                      <Text style={styles.stageName}>Stage 2</Text>
                    </View>
                    <View style={styles.stageBar}>
                      <View
                        style={[
                          styles.stageBarFill,
                          {
                            width: `${Math.min((defaulterSummary?.stage_breakdown?.stage2_count || 0) * 25, 100)}%`,
                            backgroundColor: '#EA580C'
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.stageCount}>
                      {defaulterSummary?.stage_breakdown?.stage2_count || 0}
                    </Text>
                  </View>

                  <View style={styles.stageItem}>
                    <View style={styles.stageInfo}>
                      <View style={[styles.stageDot, { backgroundColor: '#DC2626' }]} />
                      <Text style={styles.stageName}>Stage 3</Text>
                    </View>
                    <View style={styles.stageBar}>
                      <View
                        style={[
                          styles.stageBarFill,
                          {
                            width: `${Math.min((defaulterSummary?.stage_breakdown?.stage3_count || 0) * 25, 100)}%`,
                            backgroundColor: '#DC2626'
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.stageCount}>
                      {defaulterSummary?.stage_breakdown?.stage3_count || 0}
                    </Text>
                  </View>

                  <View style={styles.stageItem}>
                    <View style={styles.stageInfo}>
                      <View style={[styles.stageDot, { backgroundColor: '#991B1B' }]} />
                      <Text style={styles.stageName}>Stage 4</Text>
                    </View>
                    <View style={styles.stageBar}>
                      <View
                        style={[
                          styles.stageBarFill,
                          {
                            width: `${Math.min((defaulterSummary?.stage_breakdown?.stage4_count || 0) * 25, 100)}%`,
                            backgroundColor: '#991B1B'
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.stageCount}>
                      {defaulterSummary?.stage_breakdown?.stage4_count || 0}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Skipped Transactions Card */}
            {skippedTransactions.length > 0 && (
              <Card style={styles.sectionCard}>
                <Card.Content>
                  <View style={styles.sectionHeader}>
                    <SkipForward size={20} color="#0A4D3C" />
                    <Text style={styles.sectionTitle}>Skipped Transactions</Text>
                  </View>

                  {skippedTransactions.map((transaction, index) => (
                    <View key={index} style={styles.transactionCard}>
                      <View style={styles.transactionHeader}>
                        <View style={styles.transactionDateContainer}>
                          <Calendar size={14} color="#64748B" />
                          <Text style={styles.transactionDate}>
                            {moment(transaction.transaction_date).format('DD MMM YYYY')}
                          </Text>
                        </View>
                        <Text style={[
                          styles.transactionAmount,
                          transaction.transaction_type === 'you_got'
                            ? styles.positiveBalance
                            : styles.negativeBalance
                        ]}>
                          ₹ {transaction.amount?.toFixed(2)}
                        </Text>
                      </View>
                      {transaction.description && (
                        <Text style={styles.transactionDesc}>
                          {transaction.description}
                        </Text>
                      )}
                    </View>
                  ))}
                </Card.Content>
              </Card>
            )}
          </>
        )}
      </ScrollView>

      <ErrorModal
        visible={!!error}
        message={error}
        onClose={() => setError(null)}
      />
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
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerRightPlaceholder: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0A4D3C',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
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
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryCard: {
    width: (width - 56) / 2, // 2 cards per row with proper spacing
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  positiveBalance: {
    color: '#0A4D3C',
  },
  negativeBalance: {
    color: '#DC2626',
  },
  stageContainer: {
    marginTop: 8,
  },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  stageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
    gap: 6,
  },
  stageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stageName: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
  },
  stageBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
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
    color: '#1E293B',
    textAlign: 'right',
  },
  transactionCard: {
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  transactionDate: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  transactionDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
  },
});