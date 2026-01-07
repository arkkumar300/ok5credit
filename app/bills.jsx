// App.js
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, SafeAreaView } from 'react-native';
import { Provider as PaperProvider, Appbar, FAB, } from 'react-native-paper';
import { ChevronDown, Search,Edit3, FileText, Plus, Check, Clock, ArrowLeft, SearchCheck, } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import ApiService from './components/ApiServices';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { useFocusEffect } from '@react-navigation/native';

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
        router.push({ pathname: './billGenaration', params: { bill_type: activeTab === 'bill' ? 'BILL' : 'QUOTATION',mode:"edit", bill_date: moment().format('DD MMM YYYY') } })
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
        
        <TouchableOpacity style={styles.card} onPress={() => handleBillDetails(item.id)}>
            <View style={styles.leftRow}>
                <FileText size={24} color="#007B83" />
                <View style={{ marginLeft: 8 }}>
                    <Text style={styles.title}>{item.bill_id}</Text>
                    {item.customer && <Text style={styles.customer}>{item?.customer?.name || 'N/A'}</Text>}
                    {item.supplier && <Text style={styles.customer}>{item?.supplier?.name || 'N/A'}</Text>}
                </View>
            </View>
        
            <View style={styles.rightRow}>
                {/* Amount */}
                <Text style={styles.amount}>₹{parseFloat(item.amount).toLocaleString()}</Text>
        
                {/* Date and Status */}
                <View style={styles.rowAlign}>
                    {activeTab === 'bill' ? (
                        <Check size={16} color="green" />
                    ) : (
                        <Clock size={16} color="orange" />
                    )}
                    <Text style={styles.date}>
                        {new Date(item.bill_date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </Text>
                </View>
        
                {/* EDIT ICON */}
                <TouchableOpacity
                    style={{ padding: 5, marginLeft: 10 }}
                    onPress={() =>
                        router.replace({
                            pathname: './billGenaration',
                            params: {
                                mode: "edit",
                                billId: item?.id,   // <-- IMPORTANT
                                bill_type: item?.bill_type,
                                bill_date: moment(item?.bill_date).format('DD MMM YYYY'),
                                bill_prm_id:item.id
                            },
                        })
                    }
                >
                    <Edit3 size={20} color="#007B83" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
            );
    return (
        <PaperProvider>
            <SafeAreaView style={{ flex: 1 }}>
                <Appbar.Header>
                    <Appbar.BackAction onPress={() =>router.push({ pathname: './more'}) }/>
                    <Appbar.Content title={showSearch ? '' : activeTab === 'bill' ? 'Bill' : 'Quote'} />
                    {showSearch ? (
                        <>
                            <FAB
                                size={20}
                                icon={({ size, color }) => (
                                    <ArrowLeft size={20} color={color} />
                                )}
                                onPress={() => { setShowSearch(false) }}
                                style={{
                                    width: 40, height: 40, justifyContent: 'center', alignItems: 'center', margin: 5,
                                    backgroundColor: '#007B83',
                                }}
                                color="white"
                            />
                            <TextInput
                                placeholder="Search..."
                                value={searchText}
                                placeholderTextColor={"#aaaaaa"}
                                onChangeText={setSearchText}
                                style={styles.searchInput}
                                autoFocus
                            />
                        </>
                    ) : (
                        <>
                            <Appbar.Action icon={Search} onPress={() => setShowSearch(true)} />
                            <FAB
                                size={14}
                                icon={({ size, color }) => (
                                    <SearchCheck size={20} color={color} />
                                )}
                                onPress={() => { setShowSearch(true) }}
                                style={{
                                    width: 40, height: 40, justifyContent: 'center', alignItems: 'center', margin: 5,
                                    backgroundColor: '#007B83',
                                }}
                                color="white"
                            />
                        </>
                    )}
                </Appbar.Header>

                {!showSearch && (
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'bill' && styles.activeTab]}
                            onPress={() => setActiveTab('bill')}
                        >
                            <Text style={activeTab === 'bill' ? styles.activeTabText : styles.tabText}>Bill</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'quote' && styles.activeTab]}
                            onPress={() => setActiveTab('quote')}
                        >
                            <Text style={activeTab === 'quote' ? styles.activeTabText : styles.tabText}>Quote</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Total Sales and GST */}
                <TouchableOpacity
                    onPress={() => setShowGstDetails(!showGstDetails)}
                    style={styles.summaryContainer}
                >
                    <Text style={styles.salesText}>₹{totalSales.toLocaleString()} total Sales</Text>
                    <View style={styles.gstContainer}>
                        <Text style={styles.gstText}>₹{totalGST.toFixed(2)} Total GST</Text>
                        <ChevronDown size={16} color="#007B83" />
                    </View>
                </TouchableOpacity>

                {/* GST Details */}
                {showGstDetails && (
                    <View style={styles.gstDetails}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontWeight: '600' }}>CGST</Text>
                            <Text style={{ fontWeight: '600' }}>:</Text>
                            <Text style={{ fontWeight: '600' }}> ₹  {CGST.toFixed(2)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontWeight: '600' }}>SGST</Text>
                            <Text style={{ fontWeight: '600' }}>:</Text>
                            <Text style={{ fontWeight: '600' }}>₹  {SGST.toFixed(2)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontWeight: '600' }}>IGST</Text>
                            <Text style={{ fontWeight: '600' }}> :</Text>
                            <Text style={{ fontWeight: '600' }}>₹  {IGST.toFixed(2)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontWeight: '600' }}>CESS</Text>
                            <Text style={{ fontWeight: '600' }}>:</Text>
                            <Text style={{ fontWeight: '600' }}>₹  {CESS.toFixed(2)}</Text>
                        </View>
                    </View>
                )}
                {loading ? (
                    <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading...</Text>
                ) : (
                    <FlatList
                        data={filteredData}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingBottom: 80 }}
                    />
                )}

                {/* FAB */}
                <FAB
                    icon={({ size, color }) => (
                        <Plus size={size} color={color} />
                    )}
                    label={`Create ${activeTab === 'bill' ? 'Bill' : 'Quote'}`}
                    onPress={addBill}
                    style={styles.fab}
                    color="white"
                />
            </SafeAreaView>
        </PaperProvider>
    );
}

const styles = StyleSheet.create({
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f1f1f1',
    },
    tab: {
        flex: 1,
        padding: 10,
        alignItems: 'center',
    },
    tabText: {
        color: '#666',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#007B83',
    },
    activeTabText: {
        color: '#007B83',
        fontWeight: 'bold',
    },
    searchInput: {
        backgroundColor: 'white',
        flex: 1,
        color:"#333333",
        paddingHorizontal: 10,
        marginRight: 10,
        borderRadius: 5,
    },
    summaryContainer: {
        padding: 16,
        backgroundColor: '#e9fdfd',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    gstContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    salesText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    gstText: {
        marginRight: 6,
        fontSize: 14,
    },
    gstDetails: {
        backgroundColor: '#f5f5f5',
        padding: 16,
        paddingTop: 8,
    },
    card: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderColor: '#eee',
        justifyContent: 'space-between',
    },
    leftRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rightRow: {
        alignItems: 'flex-end',
    },
    title: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    customer: {
        fontSize: 12,
        color: '#666',
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    date: {
        marginLeft: 4,
        fontSize: 12,
        color: '#666',
    },
    rowAlign: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: '#007B83',
    },
});
