import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Appbar, Avatar, Card, Title, Paragraph, Badge } from 'react-native-paper';
import {
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  User,
  Phone,
  ArrowLeft,
  CheckCircle,
  Clock,
  Award,
  UserCheck,
  Briefcase,
  Wallet,
  PieChart
} from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

export default function EmployeeDashboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const {
    userId,
    userName,
    userEmail,
    customers: customersStr,
    suppliers: suppliersStr
  } = params;

  const customers = customersStr ? JSON.parse(customersStr) : [];
  const suppliers = suppliersStr ? JSON.parse(suppliersStr) : [];

  const [activeTab, setActiveTab] = useState('Customers');

  const calculateTotals = () => {
    const customerTotal = customers.reduce((sum, c) => sum + parseFloat(c.current_balance || 0), 0);
    const supplierTotal = suppliers.reduce((sum, s) => sum + parseFloat(s.current_balance || 0), 0);
    return { customerTotal, supplierTotal };
  };

  const { customerTotal, supplierTotal } = calculateTotals();

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderCustomerItem = ({ item, index }) => (
    <Animatable.View
      animation="fadeInUp"
      duration={500}
      delay={index * 100}
    >
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => router.push({
          pathname: '/customerDetails',
          params: {
            personId: item.id,
            personName: item.name,
            personType: 'customer',
            createdBy: item.created_by
          }
        })}
        activeOpacity={0.7}
      >
        <View style={styles.itemCardInner}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.avatarText, { color: '#0A4D3C' }]}>
                {getInitials(item.name)}
              </Text>
            </View>
          </View>

          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.phoneContainer}>
              <Phone size={12} color="#64748B" />
              <Text style={styles.itemPhone}>{item.phone || 'No phone'}</Text>
            </View>
          </View>

          <View style={styles.amountContainer}>
            <Text style={[
              styles.amountText,
              { color: parseFloat(item.current_balance) <= 0 ? '#EF4444' : '#0A4D3C' }
            ]}>
              ₹{parseFloat(item.current_balance || 0).toFixed(2)}
            </Text>
            <View style={[
              styles.typeBadge,
              { backgroundColor: parseFloat(item.current_balance) <= 0 ? '#FEE2E2' : '#E8F5E9' }
            ]}>
              <Text style={[
                styles.typeText,
                { color: parseFloat(item.current_balance) <= 0 ? '#EF4444' : '#0A4D3C' }
              ]}>
                {parseFloat(item.current_balance) <= 0 ? 'Due' : 'Advance'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );

  const renderSupplierItem = ({ item, index }) => (
    <Animatable.View
      animation="fadeInUp"
      duration={500}
      delay={index * 100}
    >
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => router.push({
          pathname: '/supplierDetails',
          params: {
            personId: item.id,
            personName: item.name,
            personType: 'supplier',
            createdBy: item.created_by
          }
        })}
        activeOpacity={0.7}
      >
        <View style={styles.itemCardInner}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: '#FFF3E0' }]}>
              <Text style={[styles.avatarText, { color: '#F97316' }]}>
                {getInitials(item.name)}
              </Text>
            </View>
          </View>

          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.phoneContainer}>
              <Phone size={12} color="#64748B" />
              <Text style={styles.itemPhone}>{item.phone || 'No phone'}</Text>
            </View>
          </View>

          <View style={styles.amountContainer}>
            <Text style={[
              styles.amountText,
              { color: parseFloat(item.current_balance) >= 0 ? '#EF4444' : '#0A4D3C' }
            ]}>
              ₹{parseFloat(item.current_balance || 0).toFixed(2)}
            </Text>
            <View style={[
              styles.typeBadge,
              { backgroundColor: parseFloat(item.current_balance) >= 0 ? '#FEE2E2' : '#E8F5E9' }
            ]}>
              <Text style={[
                styles.typeText,
                { color: parseFloat(item.current_balance) >= 0 ? '#EF4444' : '#0A4D3C' }
              ]}>
                {parseFloat(item.current_balance) >= 0 ? 'Due' : 'Advance'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4D3C" />

      {/* Premium Header */}
      <View style={styles.headerSolid}>
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ArrowLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Employee Dashboard</Text>
              <Text style={styles.headerSubtitle}>Performance overview</Text>
            </View>

            <View style={styles.headerRight}>
              <View style={styles.headerBadge} />
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Employee Profile Card */}
        <Animatable.View animation="fadeInDown" duration={600} style={styles.profileCard}>
          <View style={styles.profileCardInner}>
            <View style={styles.profileLeft}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>
                  {getInitials(userName)}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{userName}</Text>
                <View style={styles.profileEmailContainer}>
                  <UserCheck size={12} color="#64748B" />
                  <Text style={styles.profileEmail}>{userEmail}</Text>
                </View>
              </View>
            </View>
            <View style={styles.profileBadge}>
              <Briefcase size={14} color="#0A4D3C" />
              <Text style={styles.profileBadgeText}>Employee</Text>
            </View>
          </View>
        </Animatable.View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <Animatable.View animation="fadeInUp" delay={100} style={styles.statCardWrapper}>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Users size={20} color="#0A4D3C" />
              </View>
              <Text style={styles.statValue}>{customers.length}</Text>
              <Text style={styles.statLabel}>Customers</Text>
            </View>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={200} style={styles.statCardWrapper}>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#E8F5E9' }]}>
                <TrendingUp size={20} color="#0A4D3C" />
              </View>
              <Text style={styles.statValue}>{suppliers.length}</Text>
              <Text style={styles.statLabel}>Suppliers</Text>
            </View>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={300} style={styles.statCardWrapper}>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Wallet size={20} color="#0A4D3C" />
              </View>
              <Text style={styles.statValue}>₹{Math.abs(customerTotal).toFixed(2)}</Text>
              <Text style={styles.statLabel}>Customer Bal.</Text>
            </View>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={400} style={styles.statCardWrapper}>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FFF3E0' }]}>
                <PieChart size={20} color="#F97316" />
              </View>
              <Text style={styles.statValue}>₹{Math.abs(supplierTotal).toFixed(2)}</Text>
              <Text style={styles.statLabel}>Supplier Bal.</Text>
            </View>
          </Animatable.View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsWrapper}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'Customers' && styles.activeTab]}
              onPress={() => setActiveTab('Customers')}
              activeOpacity={0.7}
            >
              <Users size={16} color={activeTab === 'Customers' ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.tabText, activeTab === 'Customers' && styles.activeTabText]}>
                Customers ({customers.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'Suppliers' && styles.activeTab]}
              onPress={() => setActiveTab('Suppliers')}
              activeOpacity={0.7}
            >
              <TrendingUp size={16} color={activeTab === 'Suppliers' ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.tabText, activeTab === 'Suppliers' && styles.activeTabText]}>
                Suppliers ({suppliers.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lists */}
        <View style={styles.listContainer}>
          {activeTab === 'Customers' ? (
            customers.length > 0 ? (
              customers.map((item, index) => renderCustomerItem({ item, index }))
            ) : (
              <Animatable.View animation="fadeIn" style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <Users size={40} color="#0A4D3C" />
                </View>
                <Text style={styles.emptyTitle}>No Customers Found</Text>
                <Text style={styles.emptySubtext}>
                  This employee hasn't added any customers yet
                </Text>
              </Animatable.View>
            )
          ) : (
            suppliers.length > 0 ? (
              suppliers.map((item, index) => renderSupplierItem({ item, index }))
            ) : (
              <Animatable.View animation="fadeIn" style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <TrendingUp size={40} color="#0A4D3C" />
                </View>
                <Text style={styles.emptyTitle}>No Suppliers Found</Text>
                <Text style={styles.emptySubtext}>
                  This employee hasn't added any suppliers yet
                </Text>
              </Animatable.View>
            )
          )}
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryContent}>
          <View style={styles.summaryItem}>
            <CheckCircle size={14} color="#0A4D3C" />
            <Text style={styles.summaryText}>
              Total Accounts: {customers.length + suppliers.length}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Clock size={14} color="#0A4D3C" />
            <Text style={styles.summaryText}>
              {new Date().toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerSolid: {
    backgroundColor: '#0A4D3C',
    paddingTop: 20,
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerRight: {
    width: 44,
  },
  headerBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileCard: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
  },
  profileCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0A4D3C',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A4D3C',
    marginBottom: 4,
  },
  profileEmailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileEmail: {
    fontSize: 12,
    color: '#64748B',
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  profileBadgeText: {
    fontSize: 11,
    color: '#0A4D3C',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  statCardWrapper: {
    width: '50%',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A4D3C',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
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
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    borderRadius: 25,
  },
  activeTab: {
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
  listContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0A4D3C',
    marginBottom: 3,
    textTransform: 'capitalize',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemPhone: {
    fontSize: 11,
    color: '#64748B',
  },
  amountContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
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
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A4D3C',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  bottomPadding: {
    height: 80,
  },
  summaryBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryText: {
    fontSize: 12,
    color: '#0A4D3C',
    fontWeight: '500',
  },
  summaryDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
  },
});