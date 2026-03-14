// CustomerStatementScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ScrollView, StatusBar, Dimensions } from 'react-native';
import { Appbar, DataTable, FAB, ActivityIndicator, Divider } from 'react-native-paper';
import { ArrowDown, ArrowLeft, ArrowUp, Download, Share2, Calendar, Filter, User, IndianRupee, TrendingUp, TrendingDown} from 'lucide-react-native';
import handleCustomerLedgerPDF from './components/customerLedgerPDF';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';
import moment from 'moment';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const transactions = [
    {
        id: '1',
        date: '25 AUG',
        type: 'credit',
        amount: 1000,
    },
    {
        id: '2',
        date: '25 AUG',
        type: 'debit',
        amount: 100,
    },
];

export default function CustomerLedger() {
    const [filteredData, setFilteredData] = useState([]);
    const [allTransactions, setAllTransactions] = useState([]);
    const [customer, setCustomer] = useState(null);
    const [result, setResult] = useState("NO-DUE");
    const [totalPayment, setTotalPayment] = useState(0);
    const [totalPaymentCount, setTotalPaymentCount] = useState(0);
    const [totalCreditCount, setTotalCreditCount] = useState(0);
    const [totalCredit, setTotalCredit] = useState(0);
    const [fromDateRange, setFromDateRange] = useState(moment().subtract(1, 'days').format('DD MMM, YYYY'));
    const [toDateRange, setToDateRange] = useState(moment().format('DD MMM, YYYY'));
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('overall');

    const { personId, personName, roleType } = useLocalSearchParams();

    useEffect(() => {
        fetchData();
    }, []);

    const formatDate = (isoDate) => {
        const date = new Date(isoDate);
        return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' }).toUpperCase()}`;
    };

    const mapTransactionType = (type) => {
        return type === 'you_got' ? 'debit' : 'credit'; // Payment = debit, Credit = credit
    };

    const fetchData = async () => {
        const userDetails = await AsyncStorage.getItem("userData");
        setLoading(true);

        if (!userDetails) {
          Alert.alert("Error", "User data not found");
          setLoading(false);
          return;
        }
    
        const userData = JSON.parse(userDetails);
    
        const userId = userData?.id;
        const ownerId = userData?.owner_user_id;
  
        const url = roleType === "CUSTOMER" ? `/customers/${personId}` : `/supplier/${personId}`
        try {
            const response = await ApiService.post(url, { userId,ownerId });

            const json = JSON.stringify(response.data);
            const parsedTransactions = JSON.parse(json).transactions.map(tx => ({
                id: tx.id.toString(),
                date: formatDate(tx.transaction_date),
                type: mapTransactionType(tx.transaction_type),
                amount: parseFloat(tx.amount),
            }));
            const totalYouGave = JSON.parse(json).transactions
                .filter(tx => tx.transaction_type === 'you_gave')
                .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

            const totalYouGot = JSON.parse(json).transactions
                .filter(tx => tx.transaction_type === 'you_got')
                .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
            const countYouGave = JSON.parse(json).transactions.filter(tx => tx.transaction_type === 'you_gave').length;
            const countYouGot = JSON.parse(json).transactions.filter(tx => tx.transaction_type === 'you_got').length;
            const Details = roleType === "CUSTOMER" ? JSON.parse(json).customer : JSON.parse(json).supplier

            setCustomer(Details);
            setTotalPayment(totalYouGot)
            setTotalPaymentCount(countYouGot)
            setTotalCredit(totalYouGave);
            setTotalCreditCount(countYouGave);
            setFilteredData(parsedTransactions);
            setAllTransactions(parsedTransactions);
            if (totalYouGot <= totalYouGave) {
                setResult("DUE")
            } else {
                setResult("NO-DUE")
            }
        } catch (error) {
            console.error('Failed to fetch customer data:', error);
        }finally{
            setLoading(false);
        }
    };
    const router = useRouter();
    const renderItem = ({ item }) => (
        <View style={styles.transactionRow}>
            <View style={styles.dateCell}>
                <View style={styles.dateBadge}>
                    <Text style={styles.dateText}>{item.date}</Text>
                </View>
            </View>

            <View style={styles.amountCell}>
                {item.type === 'debit' && (
                    <View style={styles.paymentContainer}>
                        <View style={[styles.iconBadge, { backgroundColor: '#E8F5E9' }]}>
                            <ArrowDown size={14} color="#0A4D3C" />
                        </View>
                        <Text style={styles.paymentAmount}>₹{item.amount}</Text>
                    </View>
                )}
            </View>

            <View style={styles.amountCell}>
                {item.type === 'credit' && (
                    <View style={styles.creditContainer}>
                        <View style={[styles.iconBadge, { backgroundColor: '#FEE2E2' }]}>
                            <ArrowUp size={14} color="#EF4444" />
                        </View>
                        <Text style={styles.creditAmount}>₹{item.amount}</Text>
                    </View>
                )}
            </View>
        </View>
    );


    const filterThisMonth = () => {
        setActiveFilter('thismonth');

        const startOfMonth = moment().startOf('month');
        const endOfMonth = moment();

        const results = allTransactions.filter(tx => {
            const txDate = moment(tx.date, 'DD MMM');
            return txDate.isSameOrAfter(startOfMonth, 'day') && txDate.isSameOrBefore(endOfMonth, 'day');
        });

        setFilteredData(results);
        setFromDateRange(startOfMonth.format('DD MMM, YYYY'));
        setToDateRange(endOfMonth.format('DD MMM, YYYY'));
    };

    const filterLastMonth = () => {
        setActiveFilter('lastmonth');

        const startOfLastMonth = moment().subtract(1, 'month').startOf('month');
        const endOfLastMonth = moment().subtract(1, 'month').endOf('month');

        const results = allTransactions.filter(tx => {
            const txDate = moment(tx.date, 'DD MMM');
            return txDate.isSameOrAfter(startOfLastMonth, 'day') && txDate.isSameOrBefore(endOfLastMonth, 'day');
        });

        setFilteredData(results);
        setFromDateRange(startOfLastMonth.format('DD MMM, YYYY'));
        setToDateRange(endOfLastMonth.format('DD MMM, YYYY'));
    };

    const filterOverall = () => {
        setActiveFilter('overall');
        fetchData()
    };

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
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <ArrowLeft size={24} color="#FFFFFF" />
                        </TouchableOpacity>

                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle} numberOfLines={1}>
                                {personName}
                            </Text>
                            <Text style={styles.headerSubtitle}>
                                {roleType === "CUSTOMER" ? 'Customer Statement' : 'Supplier Statement'}
                            </Text>
                        </View>

                        <View style={styles.headerRightPlaceholder}>
                            <User size={20} color="rgba(255,255,255,0.8)" />
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Balance Card */}
            <View style={styles.balanceCard}>
                <View style={styles.balanceHeader}>
                    <Text style={styles.balanceLabel}>Current Balance</Text>
                    <View style={[styles.statusBadge, { backgroundColor: result === "NO-DUE" ? '#E8F5E9' : '#FEE2E2' }]}>
                        <Text style={[styles.statusText, { color: result === "NO-DUE" ? '#0A4D3C' : '#EF4444' }]}>
                            {result === "NO-DUE" ? 'NO DUE' : 'DUE'}
                        </Text>
                    </View>
                </View>

                <Text style={[styles.balanceAmount, { color: result === "NO-DUE" ? '#0A4D3C' : '#EF4444' }]}>
                    ₹ {Math.abs(Number(customer?.current_balance || 0)).toFixed(2)}
                </Text>

                <View style={styles.dateRangeContainer}>
                    <Calendar size={14} color="#64748B" />
                    <Text style={styles.dateRangeText}>
                        {fromDateRange} - {toDateRange}
                    </Text>
                </View>
            </View>

            {/* Filters */}
            <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Filter by Period</Text>
                <View style={styles.filterRow}>
                    <TouchableOpacity
                        onPress={filterOverall}
                        style={[
                            styles.filterChip,
                            activeFilter === 'overall' && styles.filterChipActive
                        ]}
                    >
                        <Text style={[
                            styles.filterChipText,
                            activeFilter === 'overall' && styles.filterChipTextActive
                        ]}>Overall</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={filterThisMonth}
                        style={[
                            styles.filterChip,
                            activeFilter === 'thismonth' && styles.filterChipActive
                        ]}
                    >
                        <Text style={[
                            styles.filterChipText,
                            activeFilter === 'thismonth' && styles.filterChipTextActive
                        ]}>This Month</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={filterLastMonth}
                        style={[
                            styles.filterChip,
                            activeFilter === 'lastmonth' && styles.filterChipActive
                        ]}
                    >
                        <Text style={[
                            styles.filterChipText,
                            activeFilter === 'lastmonth' && styles.filterChipTextActive
                        ]}>Last Month</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Summary Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
                        <TrendingDown size={20} color="#0A4D3C" />
                    </View>
                    <View>
                        <Text style={styles.statLabel}>Payment</Text>
                        <Text style={styles.statValue}>₹ {totalPayment}</Text>
                        <Text style={styles.statCount}>{totalPaymentCount} transactions</Text>
                    </View>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
                        <TrendingUp size={20} color="#EF4444" />
                    </View>
                    <View>
                        <Text style={styles.statLabel}>Credit</Text>
                        <Text style={[styles.statValue, { color: '#EF4444' }]}>₹ {totalCredit}</Text>
                        <Text style={styles.statCount}>{totalCreditCount} transactions</Text>
                    </View>
                </View>
            </View>

            {/* Transactions Header */}
            <View style={styles.transactionsHeader}>
                <Text style={styles.transactionsTitle}>Transaction History</Text>
            </View>

            {/* Table Header */}
            <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.dateHeader]}>Date</Text>
                <Text style={[styles.tableHeaderCell, styles.amountHeader]}>Payment (↓)</Text>
                <Text style={[styles.tableHeaderCell, styles.amountHeader]}>Credit (↑)</Text>
            </View>

            <Divider style={styles.tableDivider} />

            {/* Transactions List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0A4D3C" />
                    <Text style={styles.loadingText}>Loading transactions...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredData}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <LottieView
                                source={require('../assets/animations/noData.json')}
                                autoPlay
                                loop
                                style={styles.lottieAnimation}
                            />
                            <Text style={styles.emptyTitle}>No Transactions Found</Text>
                            <Text style={styles.emptySubtext}>
                                No transactions recorded for this period
                            </Text>
                        </View>
                    )}
                />
            )}

            {/* Download FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => handleCustomerLedgerPDF(filteredData, personName, personId, roleType)}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={['#0A4D3C', '#1B6B50']}
                    style={styles.fabGradient}
                >
                    <Download size={24} color="#FFFFFF" />
                </LinearGradient>
            </TouchableOpacity>
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
        textTransform: 'capitalize',
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
    balanceCard: {
        backgroundColor: '#FFFFFF',
        margin: 16,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
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
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    balanceAmount: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 8,
    },
    dateRangeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateRangeText: {
        fontSize: 12,
        color: '#64748B',
    },
    filterSection: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    filterTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0A4D3C',
        marginBottom: 10,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    filterChipActive: {
        backgroundColor: '#0A4D3C',
        borderColor: '#0A4D3C',
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748B',
    },
    filterChipTextActive: {
        color: '#FFFFFF',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginBottom: 20,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    statCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: '#64748B',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0A4D3C',
    },
    statCount: {
        fontSize: 10,
        color: '#94A3B8',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 16,
    },
    transactionsHeader: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    transactionsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0A4D3C',
    },
    tableHeader: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#F8FAFC',
    },
    tableHeaderCell: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    dateHeader: {
        width: 80,
    },
    amountHeader: {
        flex: 1,
        textAlign: 'right',
    },
    tableDivider: {
        backgroundColor: '#E2E8F0',
        height: 1,
        marginHorizontal: 16,
    },
    transactionRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        alignItems: 'center',
    },
    dateCell: {
        width: 80,
    },
    dateBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    dateText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#0A4D3C',
    },
    amountCell: {
        flex: 1,
        alignItems: 'flex-end',
    },
    paymentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    creditContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    iconBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    paymentAmount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0A4D3C',
    },
    creditAmount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#EF4444',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    listContent: {
        paddingBottom: 100,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 30,
    },
    lottieAnimation: {
        width: 200,
        height: 150,
        alignSelf: 'center',
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0A4D3C',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 4,
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
        shadowColor: '#0A4D3C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    fabGradient: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
});