// CustomerStatementScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ScrollView, } from 'react-native';
import { Appbar, DataTable, FAB } from 'react-native-paper';
import {
    ArrowDown, ArrowLeft, ArrowUp, Download, Share2
} from 'lucide-react-native';
import handleCustomerLedgerPDF from './components/customerLedgerPDF';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';
import moment from 'moment';
import LottieView from 'lottie-react-native';

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
    const [totalCraditCount, setTotalCraditCount] = useState(0);
    const [totalCradit, setTotalCradit] = useState(0);
    const [fromDateRange, setFromDateRange] = useState(moment().subtract(1, 'days').format('DD MMM, YYYY'));
    const [toDateRange, setToDateRange] = useState(moment().format('DD MMM, YYYY'));


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
        const userData = await AsyncStorage.getItem("userData");
        const userId = JSON.parse(userData).id;

        const url = roleType === "CUSTOMER" ? `/customers/${personId}` : `/supplier/${personId}`
        try {
            const response = await ApiService.post(url, { userId });

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
            setTotalCradit(totalYouGave)
            setTotalCraditCount(countYouGave)
            setFilteredData(parsedTransactions);
            setAllTransactions(parsedTransactions);
            if (totalYouGot <= totalYouGave) {
                setResult("DUE")
            } else {
                setResult("NO-DUE")
            }
        } catch (error) {
            console.error('Failed to fetch customer data:', error);
        }
    };
    const router = useRouter();
    const renderItem = ({ item }) => (
        <DataTable.Row style={{ backgroundColor: item.type === 'debit' ? '#E8F5E9' : "#f3e6e7", paddingVertical: 15 }}>
            {/* Date */}
            <DataTable.Cell style={{}}>
                <Text style={{ color: 'green', padding: 5, flexDirection: 'row', borderColor: '#007B83', borderWidth: 1 }}> {item.date}</Text>
            </DataTable.Cell>

            {/* Payment (↓ green) */}
            <DataTable.Cell>
                {item.type === 'debit' && (
                    <Text style={{ color: 'green', fontSize: 16, flexDirection: 'row' }}>
                        <ArrowDown size={16} color="green" /> ₹{item.amount}
                    </Text>
                )}
            </DataTable.Cell>

            {/* Credit (↑ red) */}
            <DataTable.Cell>
                {item.type === 'credit' && (
                    <Text style={{ color: 'red', fontSize: 16, flexDirection: 'row' }}>
                        <ArrowUp size={16} color="red" /> ₹{item.amount}
                    </Text>
                )}
            </DataTable.Cell>
        </DataTable.Row>
    );


    const filterThisMonth = () => {
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
        fetchData()
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <Appbar.Header style={{ backgroundColor: "#ffffff", borderBottomWidth: 2, borderColor: '#f2f7f6' }}>
                <ArrowLeft size={24} color={'#2E7D32'} style={{ marginStart: 10 }} onPress={() => router.back()} />
                <Appbar.Content title={`${personName} Statement ${roleType === "CUSTOMER"? "(C)":"(S)"}`} titleStyle={{ color: '#333333', fontWeight: 'bold', marginLeft: 20,textTransform:'capitalize' }} />
            </Appbar.Header>
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                <Text style={[styles.subText, { marginTop: 20 }]}>Current Balance <Text style={{ color: result === "NO-DUE" ? "green" : 'red' }}>₹ {Math.abs(Number(customer?.current_balance))}</Text>{result === "DUE" && <Text style={{ color: 'red' }}>  {`(due)`}</Text>}</Text>

                {/* Filters */}
                <View style={[styles.filterRow]}>
                    <TouchableOpacity onPress={filterOverall}>
                        <Text style={styles.filterSelected}>Overall</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={filterThisMonth}>
                        <Text style={styles.filter}>This Month</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={filterLastMonth}>
                        <Text style={styles.filter}>Last Month</Text>
                    </TouchableOpacity>
                </View>

                {/* Summary */}
                <View style={styles.balanceBlock}>
                    <Text style={[styles.balanceAmount, { color: result === "NO-DUE" ? "green" : 'red' }]}>₹ {Math.abs(Number(customer?.current_balance))}</Text>
                    <Text style={styles.balanceDate}>Balance | {fromDateRange}- {toDateRange}</Text>
                </View>

                {/* Summary Table Header */}
                <DataTable>
                    {/* Header */}
                    <DataTable.Header style={{ paddingVertical: 10, backgroundColor: '#f3f3f3', elevation: 1 }}>
                        <DataTable.Title textStyle={{ fontSize: 18 }}>Date</DataTable.Title>
                        <DataTable.Title>
                            <View>
                                <Text style={{ color: 'green', fontSize: 16 }}>Payment ({totalPaymentCount})</Text>
                                <Text style={{ color: 'green', fontSize: 14 }}>₹ {totalPayment}</Text>
                            </View>
                        </DataTable.Title>
                        <DataTable.Title>
                            <View>
                                <Text style={{ color: 'red', fontSize: 16 }}>Credit ({totalCraditCount})</Text>
                                <Text style={{ color: 'red', fontSize: 14 }}>₹ {totalCradit}</Text>
                            </View>

                        </DataTable.Title>
                    </DataTable.Header>

                    {/* Rows via FlatList */}
                    <FlatList
                        data={filteredData}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        ListEmptyComponent={() => {
                            return (
                                <View style={styles.emptyContainer}>
                                    <LottieView
                                        source={require('../assets/animations/noData.json')} // 👈 local JSON file
                                        autoPlay
                                        loop
                                        style={{ width: 200, height: 150, alignSelf: 'center' }}
                                    />
                                    <Text style={styles.emptyText}>No data found</Text>
        
                                </View>
                            )
                        }}
                    />
                </DataTable>
            </ScrollView>

            {/* Bottom Buttons */}
            <View style={styles.bottomButtons}>
                <FAB
                    icon={({ size, color }) => (
                        <Download size={size} color={color} />
                    )}
                    onPress={() => handleCustomerLedgerPDF(filteredData,personName,personId,roleType)} 
                    style={styles.fab}
                    color="#007B83" // Icon color
                    customSize={60} // optional, for resizing FAB
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#f2f7f6',
        backgroundColor: '#ffffff', elevation: 5
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16
    },
    backArrow: {
        fontSize: 20,
        marginRight: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    subText: {
        marginHorizontal: 16,
        color: '#555',
        fontSize: 14,
        marginBottom: 10,
    },
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginHorizontal: 10,
        marginBottom: 12,
    },
    filter: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#eee',
        fontSize: 13,
    },
    filterSelected: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#e0f2ef',
        color: '#007B83',
        fontSize: 13,
    },
    balanceBlock: {
        alignItems: 'center',
        marginVertical: 8,
    },
    balanceAmount: {
        fontSize: 24,
        color: 'red',
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      image: {
        width: 250, justifyContent: 'center',
        height: 250, alignSelf: 'center'
      },
      emptyText: {
        fontSize: 16, fontWeight: '700',
        color: '#666',
        textAlign: 'center',
      },
    
    balanceDate: {
        fontSize: 12,
        color: '#555',
    },
    tableHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#f0f0f0',
    },
    tableHeaderText: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    transactionItem: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomColor: '#ddd',
        borderBottomWidth: 1,
        alignItems: 'center',
    },
    dateBox: {
        backgroundColor: '#eee',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginRight: 16,
    },
    dateText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    transactionAmount: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    amountText: {
        fontSize: 16,
        marginLeft: 8,
        fontWeight: '600',
    },
    bottomButtons: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: '#007B83',
        borderRadius: 25,
        backgroundColor: '#fff',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 16,
        bottom: 16, // change as needed
        backgroundColor: '#fff', // or any background color
        elevation: 4, // shadow for Android
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007B83',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
    },
    buttonText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '500',
    },
});
