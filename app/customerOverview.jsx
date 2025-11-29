import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ArrowDownCircle, ArrowLeft, ArrowUpCircle, Download } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Appbar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';

const transactions = [
  { id: '1', type: 'credit', amount: 1000, name: 'Amma', date: '26 Aug 2025, 07:37 PM' },
  { id: '2', type: 'credit', amount: 100, name: 'Amma', date: '26 Aug 2025, 07:36 PM' },
  { id: '3', type: 'debit', amount: 1000, name: 'Amma', date: '25 Aug 2025, 02:44 PM' },
  { id: '4', type: 'credit', amount: 100, name: 'Amma', date: '25 Aug 2025, 02:34 PM' },
  { id: '5', type: 'debit', amount: 10000, name: 'Amma', date: '28 Aug 2025, 04:49 PM' },
];

export default function CustomerOverview() {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [data, setData] = useState([]);
  const [paymentCount, setPaymentCount] = useState(0);
  const [creditCount, setCreditCount] = useState(0);
  const [payment, setPayment] = useState(0);
  const [credit, setCredit] = useState(0);
  const [balance, setBalance] = useState(0);
  const [filteredTransactions, setFilteredTransactions] = useState(false);
const {transaction_for}=useLocalSearchParams()
  const router = useRouter();
  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' }).toUpperCase()}`;
  };
  const mapTransactionType = (type) => {
    return type === 'you_got' ? 'debit' : 'credit'; // Payment = debit, Credit = credit
  };

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const userData = await AsyncStorage.getItem("userData");
        const userId = JSON.parse(userData)?.id;

        if (!userId) {
          return Alert.alert("Error", "User ID not found");
        }

        const response = await ApiService.post(`/transactions/userLedger`, { userId,transaction_for });
        const json = response.data;

        if (json.transactions && json.summary) {
          // Format the transactions
          const parsedTransactions = json.transactions.map(tx => ({
            id: tx.id.toString(),
            date: formatDate(tx.transaction_date),
            transaction_date:tx.transaction_date,
            type: mapTransactionType(tx.transaction_type),
            amount: parseFloat(tx.amount),
            customerName:tx.customer? tx.customer?.name : tx.supplier?.name,
            customerId: tx.customer ? tx.customer?.id : tx.supplier?.id,
            customerMobile: tx.customer ? tx.customer?.mobile : tx.supplier?.mobile,
            runningBalance: tx.running_balance
          }));
          // Set states from summary
          setData(parsedTransactions);
          const filtered = parsedTransactions.filter(tx => {
            const txDate = new Date(tx.transaction_date);
            console.log("aaa ::",txDate)
            return txDate >= startDate && txDate <= endDate;
          });
          console.log("rrr ::",filtered)
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
            body { font-family: Arial; padding: 20px; }
            h1, h2, h3 { text-align: center; }
            .summary {
              display: flex;
              justify-content: space-between;
              margin: 20px 0;
              padding: 10px;
              border: 1px solid #ccc;
              border-radius: 10px;
            }
.box {
  padding: 10px;
  margin: 10px 0;
  border-radius: 10px;
  width: 65%;
}

.debit {
  background-color: #e0fbe0;
  color: green;
  margin-left: 0; /* Left aligned */
}

.credit {
  background-color: #fde0e0;
  color: red;
  margin-left: auto; /* Right aligned */
}
          </style>
        </head>
        <body>
          <h1>My Company Name</h1>
          <h2>123 Main Street, City, Country</h2>
          <h3>Statement: ${startDate.toDateString()} to ${endDate.toDateString()}</h3>

          <div class="summary">
            <div>${paymentCount} payments<br><b style="color:green;">₹ ${payment}</b></div>
            <div>${creditCount} credits<br><b style="color:red;">₹ ${credit}</b></div>
          </div>

          ${filteredTransactions.map(tx => `
            <div class="box ${tx.type}">
              <b>${tx.customerName}</b><br/>
              ₹${tx.amount}<br/>
              <small>${tx.date}</small>
            </div>
          `).join('')}
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
      <View
        style={[
          styles.transactionBox,
          isCredit ? styles.debitBox : styles.creditBox,
          isCredit ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' },
        ]}
      >
        <Text style={styles.name}>{item.customerName}</Text>
        <Text style={isCredit ? styles.red : styles.green}>₹{item.amount}</Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} icon={() => <ArrowLeft size={22} />} />
        <Appbar.Content title="Account Statement" />
      </Appbar.Header>
      <View style={{ padding: 16 }}>

        <View style={styles.dateRow}>
          <TouchableOpacity onPress={() => setShowStart(true)} style={styles.datePicker}>
            <Text>From: {startDate.toDateString()}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowEnd(true)} style={styles.datePicker}>
            <Text>To: {endDate.toDateString()}</Text>
          </TouchableOpacity>
        </View>

        {showStart && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
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
            display="default"
            onChange={(event, date) => {
              setShowEnd(Platform.OS === 'ios');
              if (date) setEndDate(date);
            }}
          />
        )}

        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <ArrowDownCircle color="green" />
            <Text style={styles.green}>{paymentCount} payments</Text>
            <Text style={styles.green}>₹ {payment}</Text>
          </View>
          <View style={styles.summaryItem}>
            <ArrowUpCircle color="red" />
            <Text style={styles.red}>{creditCount} credits</Text>
            <Text style={styles.red}>₹ {credit}</Text>
          </View>
        </View>

        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />

        <TouchableOpacity style={styles.downloadButton} onPress={downloadPDF}>
          <Download color="white" />
        </TouchableOpacity>
      </View>
    </View>

  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: 'bold', elevation: 5 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  datePicker: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
  },
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  summaryItem: { alignItems: 'center' },
  green: { color: 'green', fontWeight: 'bold' },
  red: { color: 'red', fontWeight: 'bold' },
  transactionBox: {
    padding: 12,
    borderRadius: 10,
    marginVertical: 6,
    width: '70%',
  },
  creditBox: { backgroundColor: '#e0fbe0' },
  debitBox: { backgroundColor: '#fde0e0' },
  name: { fontWeight: 'bold' },
  date: { fontSize: 12, color: '#555', marginTop: 4 },
  downloadButton: {
    flexDirection: 'row',
    backgroundColor: '#2196f3',
    paddingVertical: 14,position:'absolute',
    borderRadius: 10,bottom:10,right:5,
    justifyContent: 'center',elevation:10,
    marginTop: 12,zIndex:99,width:50
  },
  downloadText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
});
