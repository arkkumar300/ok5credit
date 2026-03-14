// App.js
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {View,Text,FlatList,TouchableOpacity,TextInput,StyleSheet,SafeAreaView,StatusBar,Platform} from 'react-native';
import { Provider as PaperProvider, Appbar, FAB } from 'react-native-paper';
import {ChevronDown,Search,Edit3,FileText,Plus,Check,Clock,ArrowLeft,SearchCheck,X,Filter,TrendingUp,Users} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import ApiService from './components/ApiServices';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const bills = [
    { id: '1', title: 'BILL-1', amount: 1005, date: '25 Aug 2025', customer: 'Amma' },
    { id: '2', title: 'BILL-2', amount: 10000, date: '28 Aug 2025', customer: 'Amma' },
    { id: '3', title: 'BILL-3', amount: 3000, date: '28 Aug 2025', customer: 'Amma' },
];

const quotes = [
    { id: '4', title: 'QUOTE-1', amount: 5000, date: '26 Aug 2025', customer: 'Raju' },
    { id: '5', title: 'QUOTE-2', amount: 2000, date: '29 Aug 2025', customer: 'Raju' },
];

export default function Bills() {
    const [activeTab, setActiveTab] = useState('bill');
    const [showSearch, setShowSearch] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [showGstDetails, setShowGstDetails] = useState(false);
    const router = useRouter();

    const [allBills, setAllBills] = useState([]);
    const [loading, setLoading] = useState(false);

    const addBill = async () => {
        await AsyncStorage.setItem("billType", activeTab === 'bill' ? 'BILL' : 'QUOTATION')
        router.push({ pathname: './billGenaration', params: { bill_type: activeTab === 'bill' ? 'BILL' : 'QUOTATION',mode:"add",transaction_for:"customer", bill_date: moment().format('DD MMM YYYY') } })
    }

    useFocusEffect(
        useCallback(() => {
            const removeBillData = async () => {

                await AsyncStorage.multiRemove(["billCustomer", "billNo", "billType", "billDate", "billNote", "billStore"]);
            }
            removeBillData();
        }, [])
    )
    // You can hardcode or get from user context
    useFocusEffect(
        useCallback(() => {
            const fetchBills = async () => {
                await AsyncStorage.removeItem("billType");
                const userData = await AsyncStorage.getItem("userData");
                const userId = JSON.parse(userData)?.id;

                try {
                    setLoading(true);
                    const response = await ApiService.post(`/bill/getUser`, { userId });

                    const result = response.data;
                    setAllBills(result || []);
                } catch (error) {
                    console.error('Error fetching bills:', error);
                } finally {
                    setLoading(false);
                }
            };

            fetchBills();
        }, [])
    )

    const data = useMemo(() => {
        return allBills.filter((bill) => bill.bill_type === (activeTab === 'bill' ? 'BILL' : 'QUOTATION'));
    }, [activeTab, allBills]);

    const filteredData = useMemo(() => {
        return data.filter(
            (item) =>
                item.bill_id.toLowerCase().includes(searchText.toLowerCase()) ||
                item.customer?.name.toLowerCase().includes(searchText.toLowerCase())
        );
    }, [searchText, data]);

    const totalSales = filteredData.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalGST = totalSales * 0.02764; // 2.764%
    const CGST = totalGST * 0.4157;
    const SGST = totalGST * 0.4157;
    const IGST = 0;
    const CESS = totalGST * 0.1686;

    const handleBillDetails = (ID) => {
        if (activeTab === 'bill') {
            router.push({ pathname: '/billDetails', params: { billId: ID } })
        } else {
            router.push({ pathname: '/quotationDetails', params: { billId: ID } })
        }
    }

    const renderItem = ({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleBillDetails(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.cardLeft}>
            <LinearGradient
              colors={['rgba(10,77,60,0.1)', 'rgba(10,77,60,0.05)']}
              style={styles.iconContainer}
            >
              <FileText size={22} color="#0A4D3C" />
            </LinearGradient>
            <View style={styles.cardInfo}>
              <Text style={styles.billTitle}>{item.bill_id}</Text>
              {item.customer && (
                <View style={styles.customerContainer}>
                  <Users size={12} color="#64748B" />
                  <Text style={styles.customerName}>{item?.customer?.name || 'N/A'}</Text>
                </View>
              )}
              {item.supplier && (
                <View style={styles.customerContainer}>
                  <Users size={12} color="#64748B" />
                  <Text style={styles.customerName}>{item?.supplier?.name || 'N/A'}</Text>
                </View>
              )}
            </View>
          </View>
    
          <View style={styles.cardRight}>
            <Text style={styles.amount}>₹{parseFloat(item.amount).toLocaleString()}</Text>
    
            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, { backgroundColor: activeTab === 'bill' ? 'rgba(10,77,60,0.1)' : 'rgba(245,158,11,0.1)' }]}>
                {activeTab === 'bill' ? (
                  <Check size={12} color="#0A4D3C" />
                ) : (
                  <Clock size={12} color="#F59E0B" />
                )}
                <Text style={[styles.dateText, { color: activeTab === 'bill' ? '#0A4D3C' : '#F59E0B' }]}>
                  {new Date(item.bill_date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
    
              <TouchableOpacity
                style={styles.editButton}
                onPress={() =>
                  router.replace({
                    pathname: './billGenaration',
                    params: {
                      mode: "edit",
                      billId: item?.id,
                      bill_type: item?.bill_type,
                      bill_date: moment(item?.bill_date).format('DD MMM YYYY'),
                      bill_prm_id: item.id
                    },
                  })
                }
              >
                <Edit3 size={16} color="#0A4D3C" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );

      return (
        <PaperProvider>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#0A4D3C" />
  
          {/* Premium Header with Gradient */}
          <LinearGradient
            colors={['#0A4D3C', '#1B6B50']}
            style={styles.headerGradient}
          >
            <SafeAreaView>
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.push({ pathname: './more' })}
                  activeOpacity={0.7}
                >
                  <ArrowLeft size={20} color="#FFFFFF" />
                </TouchableOpacity>
  
                <View style={styles.headerTitleContainer}>
                  <Text style={styles.headerTitle}>
                    {showSearch ? 'Search' : (activeTab === 'bill' ? 'Bills' : 'Quotations')}
                  </Text>
                  <Text style={styles.headerSubtitle}>
                    {activeTab === 'bill' ? 'Manage your invoices' : 'Track your quotes'}
                  </Text>
                </View>
  
                {!showSearch && (
                  <TouchableOpacity
                    style={styles.searchButton}
                    onPress={() => setShowSearch(true)}
                  >
                    <Search size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            </SafeAreaView>
          </LinearGradient>
  
          {/* Search Bar */}
          {showSearch && (
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Search size={18} color="#64748B" />
                <TextInput
                  placeholder="Search by bill no. or customer..."
                  value={searchText}
                  placeholderTextColor="#94A3B8"
                  onChangeText={setSearchText}
                  style={styles.searchInput}
                  autoFocus
                />
                {searchText.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchText('')}>
                    <X size={16} color="#64748B" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={styles.searchCloseButton}
                onPress={() => {
                  setShowSearch(false);
                  setSearchText('');
                }}
              >
                <Text style={styles.searchCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
  
          {/* Tabs */}
          {!showSearch && (
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'bill' && styles.activeTab]}
                onPress={() => setActiveTab('bill')}
              >
                <Text style={[styles.tabText, activeTab === 'bill' && styles.activeTabText]}>
                  Bills
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'quote' && styles.activeTab]}
                onPress={() => setActiveTab('quote')}
              >
                <Text style={[styles.tabText, activeTab === 'quote' && styles.activeTabText]}>
                  Quotations
                </Text>
              </TouchableOpacity>
            </View>
          )}
  
          {/* Summary Card */}
          <TouchableOpacity
            onPress={() => setShowGstDetails(!showGstDetails)}
            style={styles.summaryCard}
            activeOpacity={0.7}
          >
            <View style={styles.summaryLeft}>
              <TrendingUp size={18} color="#0A4D3C" />
              <Text style={styles.salesText}>Total Sales: ₹{totalSales.toLocaleString()}</Text>
            </View>
            <View style={styles.gstToggle}>
              <Text style={styles.gstText}>GST: ₹{totalGST.toFixed(2)}</Text>
              <ChevronDown size={16} color="#0A4D3C" />
            </View>
          </TouchableOpacity>
  
          {/* GST Details */}
          {showGstDetails && (
            <LinearGradient
              colors={['rgba(10,77,60,0.05)', 'rgba(10,77,60,0.02)']}
              style={styles.gstDetails}
            >
              <View style={styles.gstRow}>
                <Text style={styles.gstLabel}>CGST (41.57%)</Text>
                <Text style={styles.gstValue}>₹{CGST.toFixed(2)}</Text>
              </View>
              <View style={styles.gstRow}>
                <Text style={styles.gstLabel}>SGST (41.57%)</Text>
                <Text style={styles.gstValue}>₹{SGST.toFixed(2)}</Text>
              </View>
              <View style={styles.gstRow}>
                <Text style={styles.gstLabel}>IGST (0%)</Text>
                <Text style={styles.gstValue}>₹{IGST.toFixed(2)}</Text>
              </View>
              <View style={styles.gstRow}>
                <Text style={styles.gstLabel}>CESS (16.86%)</Text>
                <Text style={styles.gstValue}>₹{CESS.toFixed(2)}</Text>
              </View>
            </LinearGradient>
          )}
  
          {/* List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading {activeTab === 'bill' ? 'bills' : 'quotations'}...</Text>
            </View>
          ) : filteredData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FileText size={60} color="#E2E8F0" />
              <Text style={styles.emptyText}>No {activeTab === 'bill' ? 'bills' : 'quotations'} found</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to create a new {activeTab === 'bill' ? 'bill' : 'quote'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredData}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          )}
  
          {/* FAB */}
          <TouchableOpacity
            style={styles.fab}
            onPress={addBill}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#0A4D3C', '#1B6B50']}
              style={styles.fabGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Plus size={24} color="#FFFFFF" />
              <Text style={styles.fabText}>
                Create {activeTab === 'bill' ? 'Bill' : 'Quote'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </PaperProvider>
      );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F8FAFC',
    },
    headerGradient: {
      paddingTop: Platform.OS === 'android' ? 20 : 0,
      paddingBottom: 16,
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
    searchButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(10,77,60,0.1)',
    },
    searchInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F8FAFC',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: 'rgba(10,77,60,0.1)',
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: '#1E293B',
      paddingVertical: 8,
    },
    searchCloseButton: {
      marginLeft: 12,
    },
    searchCloseText: {
      fontSize: 14,
      color: '#0A4D3C',
      fontWeight: '600',
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(10,77,60,0.1)',
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 8,
      marginHorizontal: 4,
    },
    activeTab: {
      backgroundColor: 'rgba(10,77,60,0.1)',
    },
    tabText: {
      fontSize: 14,
      color: '#64748B',
      fontWeight: '500',
    },
    activeTabText: {
      color: '#0A4D3C',
      fontWeight: '600',
    },
    summaryCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(10,77,60,0.1)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    summaryLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    salesText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#1E293B',
    },
    gstToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(10,77,60,0.08)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 16,
    },
    gstText: {
      fontSize: 12,
      color: '#0A4D3C',
      fontWeight: '600',
    },
    gstDetails: {
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(10,77,60,0.1)',
    },
    gstRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    gstLabel: {
      fontSize: 13,
      color: '#475569',
    },
    gstValue: {
      fontSize: 13,
      fontWeight: '600',
      color: '#0A4D3C',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 14,
      color: '#64748B',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#1E293B',
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: '#64748B',
      textAlign: 'center',
    },
    listContainer: {
      padding: 16,
      paddingBottom: 100,
    },
    card: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: '#FFFFFF',
      padding: 16,
      borderRadius: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(10,77,60,0.1)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    cardLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardInfo: {
      gap: 4,
    },
    billTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1E293B',
    },
    customerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    customerName: {
      fontSize: 13,
      color: '#64748B',
    },
    cardRight: {
      alignItems: 'flex-end',
      gap: 8,
    },
    amount: {
      fontSize: 18,
      fontWeight: '700',
      color: '#0A4D3C',
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    dateText: {
      fontSize: 11,
      fontWeight: '500',
    },
    editButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(10,77,60,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    fab: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      borderRadius: 30,
      overflow: 'hidden',
      shadowColor: '#0A4D3C',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    fabGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 20,
      gap: 8,
    },
    fabText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });