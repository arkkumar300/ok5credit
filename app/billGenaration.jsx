// components/BillDetailScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ScrollView, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Trash2, Edit3, ChevronDown, ChevronUp, } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Appbar, Avatar, Modal } from 'react-native-paper';
import ItemForm from './itemForm';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';


export default function BillGenaration() {
    const [showDetails, setShowDetails] = useState(false);
    const [isAdditem, setIsAdditem] = useState(false);
    const [items, setItems] = useState([]); // ✅ holds all items
    const [customer, setCustomer] = useState(null);
    const [customersList, setCustomersList] = useState([]);
    const [customerListVisible, setCustomerListVisible] = useState(false);
    const [billID, setBillID] = useState(null);
    const { customerId, bill_type } = useLocalSearchParams();
    const router = useRouter();
    const totalAmount = items.reduce((acc, item) => acc + item.total, 0);

    const fetchCustomer = async () => {
        const userData = await AsyncStorage.getItem("userData");
        const userId = JSON.parse(userData).id;
        try {
            const response = await ApiService.post(`/customers/${customerId}`, { userId });
            const data = response.data;
            setCustomer(data.customer);
        } catch (err) {
            console.error(err);
            setError('Failed to load data');
        }
    };

    const getCustomer = async () => {
        const userData = await AsyncStorage.getItem("userData");
        const userId = JSON.parse(userData).id;
        try {
            const response = await ApiService.post(`/customers/getAllByUserId`, { userId });
            const data = response.data;
            setCustomersList(data.customers);
        } catch (err) {
            console.error(err);
            setError('Failed to load data');
        } 
    };

    const getBillCount = async () => {
        const userData = await AsyncStorage.getItem("userData");
        const userId = JSON.parse(userData)?.id;
        try {
            const response = await ApiService.post(`/bill/getUser`, { userId });
            const result = response.data;
            const count = result.filter((item) => String(item.bill_type) === String(bill_type)).length
            const bill = bill_type === "BILL" ? `BILL-${Number(count || 0) + 1}` : `QUOTE-${Number(count || 0) + 1}`

            setBillID(bill);
        } catch (error) {
            console.error('Error fetching bills:', error);
        }
    }
const gotoBill=async ()=>{
    await AsyncStorage.setItem("billType",bill_type)
    if (bill_type==="BILL") {
        router.push({ pathname: './billPreview', params: { items: JSON.stringify(items), totalAmount: totalAmount, customerData: JSON.stringify(customer), bill: billID }})
    } else {
        router.push({ pathname: './quotePreview', params: { items: JSON.stringify(items), totalAmount: totalAmount, customerData: JSON.stringify(customer), bill: billID }})
    }
}
    useEffect(() => {
        if (customerId) {
            fetchCustomer();
        }
        if (bill_type) {
            getBillCount();
        }

    }, []);

    useEffect(() => {

        getCustomer();

    }, []);
    const renderItem = ({ item }) => {
        return (
            <View style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{item.itemName}</Text>
                        <Text style={styles.itemSubtitle}>{item.gstValue}</Text>
                        <Text style={styles.itemDescription}>{item.description}</Text>
                        <Text style={styles.itemCalc}>
                            {item.quantity} x (₹ {item.price} + ₹ {item.gstAmount} GST + ₹{' '}
                            {item.cessAmount} CESS)
                        </Text>
                    </View>
                    <Text style={styles.itemPrice}>₹ {item.total}</Text>
                    <TouchableOpacity style={styles.trashIcon}>
                        <Trash2 size={20} color="gray" />
                    </TouchableOpacity>
                </View>
            </View>
        )
    };

    const renderTaxDetails = () =>
        items.map((item, index) => {
            const taxable = item?.taxableAmount || 0;
            const gst = parseFloat(item?.gstAmount || 0);
            const cess = parseFloat(item?.cessAmount || 0);
            const total = parseFloat(item?.total || 0);

            return (
                <View key={item.itemName || index} style={styles.taxContainer}>
                    <Text style={styles.taxTitle}>Item Total ({index + 1})</Text>
                    <Text style={styles.taxText}>Taxable Amount: ₹ {taxable.toFixed(2)}</Text>
                    <Text style={styles.taxText}>CGST: ₹ {(gst / 2).toFixed(2)}</Text>
                    <Text style={styles.taxText}>SGST: ₹ {(gst / 2).toFixed(2)}</Text>
                    {cess > 0 && (
                        <Text style={styles.taxText}>CESS: ₹ {cess.toFixed(2)}</Text>
                    )}
                    <Text style={styles.taxTotal}>Sub Total: ₹ {total.toFixed(2)}</Text>
                </View>
            );
        });

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <Appbar.Header style={styles.header}>
                <ArrowLeft size={24} onPress={() => router.back()} />
                <View style={styles.userInfo}>
                    <Avatar.Image
                        source={{ uri: customer?.photo ? customer?.photo : 'https://via.placeholder.com/40' }}
                        style={styles.profileImage}
                    />
                    {customer ?
                        <>
                            <Text style={{ fontWeight: '200', fontSize: 14 }}>{bill_type === "BILL" ? "Bill" : "Quote"} to {`\n`}<Text style={styles.userName}>{customer.name}</Text></Text>

                        </>
                        :
                        <>
                            <TouchableOpacity onPress={() => setCustomerListVisible(true)}>
                                <Text style={{ fontWeight: '200', fontSize: 14 }}>{bill_type === "BILL" ? "Bill" : "Quote"} to {`\n`}<Text style={[styles.userName]}>Add customer</Text></Text>
                            </TouchableOpacity>
                        </>}
                </View>
                <TouchableOpacity onPress={() => router.push('./otherDetails')}>
                    <Edit3 size={20} color="gray" />
                </TouchableOpacity>
            </Appbar.Header>

            {/* Bill Info */}
            <View style={styles.billInfo}>
                <Text style={styles.billLabel}>{bill_type === "BILL" ? "Bill Number" : "Quotation Number"}</Text>
                <Text style={styles.billValue}>{billID}</Text>

                <Text style={styles.billLabel}>Bill Date</Text>
                <Text style={styles.billValue}>{moment().format('DD MMM YYYY')}</Text>
            </View>

            <FlatList
                data={items}  // ✅ show current item list
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderItem}
                style={{ marginHorizontal: 16 }}
            />
            <TouchableOpacity style={[styles.previewButton]} onPress={() => {
                setIsAdditem(true)
            }
            }>
                <Text style={styles.calcButtonText}>Add Items</Text>
            </TouchableOpacity>

            {/* Toggle Show/Hide Tax */}
            <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setShowDetails(!showDetails)}
            >
                <Text style={styles.toggleText}>
                    {showDetails ? 'Show Less Details' : 'Show More Details'}
                </Text>
                {showDetails ? (
                    <ChevronUp size={18} color="#333" />
                ) : (
                    <ChevronDown size={18} color="#333" />
                )}
            </TouchableOpacity>

            {/* Tax Details */}
            {showDetails && (
                <ScrollView style={{ marginHorizontal: 16 }}>{renderTaxDetails()}</ScrollView>
            )}

            {/* Total and Actions */}
            <View style={styles.totalFooter}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>₹ {totalAmount}</Text>
            </View>

            <TouchableOpacity style={styles.previewButton} onPress={()=>{
                if (customer) {
                    gotoBill()
                } else {
                    setCustomerListVisible(true)
                }
                }}>
                <Text style={styles.previewText}>Preview</Text>
            </TouchableOpacity>
            <Modal visible={isAdditem}>
                <ItemForm
                    setItem={setIsAdditem}
                    setNewItem={(newItem) => {
                        setItems([...items, newItem]);  // ✅ append new item
                    }}
                />
            </Modal>
            <Modal
                animationType="slide"
                transparent={true}
                visible={customerListVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.bottomSheet}>
                        <Text style={styles.modalTitle}>Please Select added Customers</Text>
                        <FlatList
                            data={customersList}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.contactItem} onPress={() => {
                                    setCustomerListVisible(false)
                                    setCustomer(item)}}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        {item.imageAvailable && item.image?.uri ? (
                                            <Image source={{ uri: item.photo }} style={styles.contactImage} />
                                        ) : (
                                            <View style={[styles.contactImage, styles.placeholderImage]}>
                                                <Text style={styles.initialText}>
                                                    {item.name?.[0]?.toUpperCase() || '?'}
                                                </Text>
                                            </View>
                                        )}
                                        <View style={{ marginLeft: 10 }}>
                                            <Text style={styles.contactName}>{item.name}</Text>
                                            <Text style={styles.contactNumber}>
                                                {item.mobile || 'No number'}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity style={styles.modalCloseButton} onPress={() => setCustomerListVisible(false)}>
                            <Text style={styles.modalCloseButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row', elevation: 3,
        paddingHorizontal: 16,
        justifyContent: 'space-between',
    },
    userInfo: {
        flexDirection: 'row',
    },
    profileImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginHorizontal: 8,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        textTransform: 'capitalize'
    },
    billInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 16,
        paddingVertical: 8,
    },
    billLabel: { fontSize: 12, color: '#999' },
    billValue: { fontSize: 14, fontWeight: 'bold', color: '#000' },
    itemContainer: {
        borderBottomWidth: 1,
        borderColor: '#eee',
        paddingVertical: 12,
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    itemTitle: { fontWeight: 'bold', fontSize: 14 },
    itemSubtitle: { fontSize: 12, color: '#777' },
    itemDescription: { fontSize: 12, color: '#999' },
    itemCalc: { fontSize: 12, color: '#555' },
    itemPrice: { fontWeight: 'bold', fontSize: 14 },
    trashIcon: { marginLeft: 8 },
    toggleButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
    },
    toggleText: { color: '#007b73', fontWeight: '600', marginRight: 6 },
    taxContainer: {
        backgroundColor: '#f5f5f5',
        padding: 10,
        marginVertical: 4,
        borderRadius: 6,
    },
    taxTitle: { fontWeight: 'bold', fontSize: 14 },
    taxText: { fontSize: 12, color: '#444', paddingTop: 2 },
    taxTotal: { fontWeight: 'bold', fontSize: 13, paddingTop: 4 },
    totalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderTopWidth: 1,
        borderColor: '#ddd',
    },
    totalLabel: { fontSize: 16, fontWeight: '600' },
    totalAmount: { fontSize: 16, fontWeight: '700' },
    previewButton: {
        backgroundColor: '#00B050',
        padding: 14,
        margin: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    previewText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    modalOverlay: {
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    contactItem: {
        paddingVertical: 10,
        borderBottomColor: '#eee',
        borderBottomWidth: 1,
    },
    contactName: {
        fontWeight: '600',
    },
    contactImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ccc',
    },
    placeholderImage: {
        backgroundColor: '#999',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactNumber: {
        color: '#666',
        fontSize: 12,
    },
    modalCloseButton: {
        marginTop: 15,
        alignItems: 'center',
    },
    modalCloseButtonText: {
        color: '#2E7D32',
        fontWeight: 'bold',
    },
    bottomSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 40,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },

});
