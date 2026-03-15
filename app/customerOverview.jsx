import React, { useState, useEffect } from 'react';
import {View,Text,StyleSheet,FlatList,TouchableOpacity,Platform,Alert,StatusBar,SafeAreaView} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {ArrowDownCircle,ArrowLeft,ArrowUpCircle,Download,Calendar,ChevronRight,Users,TrendingUp,CheckCircle} from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Appbar, FAB } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';
import { LinearGradient } from 'expo-linear-gradient';

export default function CustomerOverview() {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStart, setShowStart] = useState(false);
  const [userDetails, setUserDetails] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [data, setData] = useState([]);
  const [paymentCount, setPaymentCount] = useState(0);
  const [creditCount, setCreditCount] = useState(0);
  const [payment, setPayment] = useState(0);
  const [credit, setCredit] = useState(0);
  const [balance, setBalance] = useState(0);
  const [filteredTransactions, setFilteredTransactions] = useState(false);
  const { transaction_for } = useLocalSearchParams()
  const router = useRouter();

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' }).toUpperCase()}`;
  };

  const formatDisplayDate = (date) => {
    return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
  };

  const mapTransactionType = (type) => {
    return type === 'you_got' ? 'debit' : 'credit'; // Payment = debit, Credit = credit
  };

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const userData = await AsyncStorage.getItem("userData");
        const userId = JSON.parse(userData)?.id;
        const ownerId = JSON.parse(userData)?.owner_user_id;
        const rrr = JSON.parse(userData)
        setUserDetails(rrr)
        if (!userId) {
          return Alert.alert("Error", "User ID not found"); 
        }

        const response = await ApiService.post(`/transactions/userLedger`, { userId,ownerId, transaction_for });
        const json = response.data;

        if (json.transactions && json.summary) {
          // Format the transactions
          const parsedTransactions = json.transactions.map(tx => ({
            id: tx.id.toString(),
            date: formatDate(tx.transaction_date),
            transaction_date: tx.transaction_date,
            type: mapTransactionType(tx.transaction_type),
            amount: parseFloat(tx.amount),
            customerName: tx.customer ? tx.customer?.name : tx.supplier?.name,
            customerId: tx.customer ? tx.customer?.id : tx.supplier?.id,
            customerMobile: tx.customer ? tx.customer?.mobile : tx.supplier?.mobile,
            runningBalance: tx.running_balance
          }));
          // Set states from summary
          setData(parsedTransactions);
          const filtered = parsedTransactions.filter(tx => {
            const txDate = new Date(tx.transaction_date);
            return txDate >= startDate && txDate <= endDate;
          });
          setFilteredTransactions(filtered);
          // Count 'you_got' and 'you_gave' types
          const paymentCount = parsedTransactions.filter(item => item.type === 'debit').length;
          const creditCount = parsedTransactions.filter(item => item.type === 'credit').length;
          setPaymentCount(paymentCount);
          setCreditCount(creditCount);
          setPayment(parseFloat(json.summary.total_you_got).toFixed(2));
          setCredit(parseFloat(json.summary.total_you_gave).toFixed(2));
          setBalance(parseFloat(json.summary.current_balance).toFixed(2));

        } else {
          Alert.alert("Error", json.message || "Unexpected response format");
        }
      } catch (err) {
        console.error("Ledger Fetch Error:", err);
        Alert.alert("Error", err.message || "Failed to load ledger");
      }
    };

    fetchLedger();
  }, []);



  const downloadPDF = async () => {
    const html = `
      <html>
        <head>
          <style>
            body {
              font-family: 'Helvetica', Arial, sans-serif;
              padding: 30px;
              background: #f8fafc;
              margin: 0;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #0A4D3C;
            }
            h1 {
              color: #0A4D3C;
              font-size: 28px;
              margin-bottom: 5px;
            }
            h2 {
              color: #64748B;
              font-size: 14px;
              font-weight: normal;
              margin-bottom: 5px;
            }
            h3 {
              color: #1E293B;
              font-size: 16px;
              margin-top: 10px;
            }
            .summary {
              display: flex;
              justify-content: space-between;
              margin: 30px 0;
              gap: 20px;
            }
            .summary-card {
              flex: 1;
              padding: 20px;
              border-radius: 16px;
              text-align: center;
            }
            .payment-card {
              background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
              border: 1px solid #0A4D3C20;
            }
            .credit-card {
              background: linear-gradient(135deg, #ffebee, #ffcdd2);
              border: 1px solid #DC262620;
            }
            .summary-label {
              font-size: 14px;
              color: #475569;
              margin: 8px 0 4px;
            }
            .summary-amount {
              font-size: 24px;
              font-weight: bold;
            }
            .green { color: #0A4D3C; }
            .red { color: #DC2626; }
            .transactions {
              margin-top: 30px;
            }
            .transaction {
              padding: 16px;
              margin-bottom: 12px;
              border-radius: 16px;
              border: 1px solid #e2e8f0;
              background: white;
              display: flex;
              flex-direction: row;
              justify-content: space-between;
              align-items: center;
            }
            .debit {
              border-left-width: 4px;
              border-left-color: #0A4D3C;
            }
            .credit {
              border-left-width: 4px;
              border-left-color: #DC2626;
            }
            .transaction-name {
              font-size: 16px;
              font-weight: 600;
              color: #1E293B;
            }
            .transaction-amount {
              font-size: 18px;
              font-weight: 700;
            }
            .transaction-date {
              font-size: 12px;
              color: #64748B;
              margin-top: 4px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #94A3B8;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${userDetails?.businessName || "Aqua Credit"}</h1>
            <h2>${userDetails?.address || "Digital Khata for Business"}</h2>
            <h3>Statement: ${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}</h3>
          </div>

          <div class="summary">
            <div class="summary-card payment-card">
              <ArrowDownCircle color="#0A4D3C" size={32} />
              <div class="summary-label">Payments Received</div>
              <div class="summary-amount green">₹${payment}</div>
              <div style="color: #64748B; font-size: 13px; margin-top: 8px;">${paymentCount} transactions</div>
            </div>

            <div class="summary-card credit-card">
              <ArrowUpCircle color="#DC2626" size={32} />
              <div class="summary-label">Credits Given</div>
              <div class="summary-amount red">₹${credit}</div>
              <div style="color: #64748B; font-size: 13px; margin-top: 8px;">${creditCount} transactions</div>
            </div>
          </div>

          <div class="transactions">
            ${filteredTransactions.map(tx => `
              <div class="transaction ${tx.type === 'debit' ? 'debit' : 'credit'}">
                <div>
                  <div class="transaction-name">${tx.customerName}</div>
                  <div class="transaction-date">${tx.date}</div>
                </div>
                <div>
                  <div class="transaction-amount ${tx.type === 'debit' ? 'green' : 'red'}">
                    ${tx.type === 'debit' ? '↓' : '↑'} ₹${tx.amount}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="footer">
            Generated by Aqua Credit • ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      if (uri) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Error', 'PDF generation failed.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  useEffect(() => {
    const filtered = data?.filter(tx => {
      const txDate = new Date(tx.transaction_date);
      return txDate >= startDate && txDate <= endDate;
    });

    setFilteredTransactions(filtered);
  }, [startDate, endDate, data]);

  const renderItem = ({ item }) => {
    const isCredit = item.type === 'credit';
    return (
      <View style={[styles.transactionItem, isCredit ? styles.creditItem : styles.debitItem]}>
        <View style={styles.transactionLeft}>
          <View style={[styles.transactionIcon, { backgroundColor: isCredit ? 'rgba(220,38,38,0.1)' : 'rgba(10,77,60,0.1)' }]}>
            {isCredit ? (
              <ArrowUpCircle size={20} color="#DC2626" />
            ) : (
              <ArrowDownCircle size={20} color="#0A4D3C" />
            )}
          </View>
          <View>
            <Text style={styles.transactionName}>{item.customerName}</Text>
            <Text style={styles.transactionDate}>{item.date}</Text>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[styles.transactionAmount, { color: isCredit ? '#DC2626' : '#0A4D3C' }]}>
            {isCredit ? '↑' : '↓'} ₹{item.amount}
          </Text>
        </View>
      </View>
    );
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
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Account Statement</Text>
              <Text style={styles.headerSubtitle}>
                {transaction_for === 'customer' ? 'Customer Ledger' : 'Supplier Ledger'}
              </Text>
            </View>

            <View style={styles.headerRight} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.content}>
        {/* Date Range Selector */}
        <View style={styles.dateRangeContainer}>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowStart(true)}
            activeOpacity={0.7}
          >
            <Calendar size={16} color="#0A4D3C" />
            <Text style={styles.datePickerText}>From: {formatDisplayDate(startDate)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowEnd(true)}
            activeOpacity={0.7}
          >
            <Calendar size={16} color="#0A4D3C" />
            <Text style={styles.datePickerText}>To: {formatDisplayDate(endDate)}</Text>
          </TouchableOpacity>
        </View>

        {showStart && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowStart(Platform.OS === 'ios');
              if (date) setStartDate(date);
            }}
          />
        )}

        {showEnd && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowEnd(Platform.OS === 'ios');
              if (date) setEndDate(date);
            }}
          />
        )}

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <LinearGradient
            colors={['rgba(10,77,60,0.1)', 'rgba(10,77,60,0.05)']}
            style={[styles.summaryCard, styles.paymentCard]}
          >
            <ArrowDownCircle size={28} color="#0A4D3C" />
            <Text style={styles.summaryLabel}>Payments Received</Text>
            <Text style={[styles.summaryAmount, styles.greenText]}>₹{payment}</Text>
            <View style={styles.transactionCount}>
              <TrendingUp size={12} color="#64748B" />
              <Text style={styles.countText}>{paymentCount} transactions</Text>
            </View>
          </LinearGradient>

          <LinearGradient
            colors={['rgba(220,38,38,0.1)', 'rgba(220,38,38,0.05)']}
            style={[styles.summaryCard, styles.creditCard]}
          >
            <ArrowUpCircle size={28} color="#DC2626" />
            <Text style={styles.summaryLabel}>Credits Given</Text>
            <Text style={[styles.summaryAmount, styles.redText]}>₹{credit}</Text>
            <View style={styles.transactionCount}>
              <TrendingUp size={12} color="#64748B" />
              <Text style={styles.countText}>{creditCount} transactions</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Balance Indicator */}
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <View style={styles.balanceValueContainer}>
            <Text style={[styles.balanceValue, { color: balance >= 0 ? '#0A4D3C' : '#DC2626' }]}>
              ₹{Math.abs(balance)}
            </Text>
            <View style={[styles.balanceBadge, { backgroundColor: balance >= 0 ? 'rgba(10,77,60,0.1)' : 'rgba(220,38,38,0.1)' }]}>
              <Text style={[styles.balanceBadgeText, { color: balance >= 0 ? '#0A4D3C' : '#DC2626' }]}>
                {balance >= 0 ? 'Advance' : 'Due'}
              </Text>
            </View>
          </View>
        </View>

        {/* Transactions List */}
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No transactions found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your date range</Text>
            </View>
          }
        />
      </View>

      {/* Premium Download FAB */}
      <TouchableOpacity
        style={styles.downloadFab}
        onPress={downloadPDF}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#0A4D3C', '#1B6B50']}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
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
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.1)',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  datePickerText: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '500',
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.1)',
    backgroundColor: '#FFFFFF',
  },
  paymentCard: {
    borderColor: 'rgba(10,77,60,0.2)',
  },
  creditCard: {
    borderColor: 'rgba(220,38,38,0.2)',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  greenText: {
    color: '#0A4D3C',
  },
  redText: {
    color: '#DC2626',
  },
  transactionCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countText: {
    fontSize: 10,
    color: '#64748B',
  },
  balanceContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  balanceValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  balanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  balanceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 100,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  debitItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#0A4D3C',
  },
  creditItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: '#64748B',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#64748B',
  },
  downloadFab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#0A4D3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});