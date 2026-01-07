// components/BillDetailScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, SafeAreaView, StyleSheet, TouchableOpacity, Image, ScrollView, } from 'react-native';
import { ArrowLeft, Trash2, Edit3, ChevronDown, ChevronUp, } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Appbar, Avatar, Modal } from 'react-native-paper';
import ItemForm from './itemForm';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';
import { useFocusEffect } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import ExtraChargesForm from './ExtraChargesForm';

export default function BillGenaration() {
    const [showDetails, setShowDetails] = useState(false);
    const [isAdditem, setIsAdditem] = useState(false);
    const [items, setItems] = useState([]); // ✅ holds all items
    const [extraCharges, setExtraCharges] = useState([]); // ✅ holds all items
    const [isAddExtraCharges, setIsAddExtraCharges] = useState(false);
    const [supplier, setSupplier] = useState(null);
    const [suppliersList, setSuppliersList] = useState([]);
    const [supplierListVisible, setSupplierListVisible] = useState(false);
    const [billID, setBillID] = useState(null);
    const [billTypes, setBillTypes] = useState("");
    const [billDates, setBillDates] = useState("");
    const [billNote, setBillNote] = useState("");
    const [billStore, setBillStore] = useState(null);
    const { Id = "", bill_type = "", billId = "", mode = "", bill_date = "", billNo = "", transaction_for } = useLocalSearchParams();
    const router = useRouter();
    const totalAmount = Array.isArray(items)
        ? items.reduce((acc, item) => acc + Number(item?.total || 0), 0)
        : 0;

    useFocusEffect(

        useCallback(() => {

            const customeData = async () => {
                try {
                    // const billSupplierStr = await AsyncStorage.getItem("billSupplier");
                    // const billSupplier = billSupplierStr ? JSON.parse(billSupplierStr) : null;
                    // setSupplier(billSupplier); // Assuming you want to store it as an object

                    const billNo = await AsyncStorage.getItem("billNo") || "";
                    setBillID(billNo);

                    const billType = await AsyncStorage.getItem("billType") || "";
                    setBillTypes(billType);

                    const billDate = await AsyncStorage.getItem("billDate") || "";
                    setBillDates(billDate);

                    const billNotes = await AsyncStorage.getItem("billNote") || "";
                    setBillNote(billNotes);

                    const billStoresStr = await AsyncStorage.getItem("billStore");
                    const billStores = billStoresStr ? JSON.parse(billStoresStr) : {};

                    setBillStore(billStores);

                } catch (error) {
                    console.error("Error fetching bill data:", error);
                }
            };

            customeData();
        }, []) // reactively update when props change
    )
    const normalizeExtraCharges = (list) =>
        list
            .filter(Boolean) // remove null/undefined
            .map(group => Array.isArray(group) ? group : [group])
            .map(group => group.filter(Boolean)); // remove empty items

    useFocusEffect(
        useCallback(() => {
            const billUpdates = async () => {

                if (Id) {
                    fetchClientData();
                }
                if (mode === "edit" && billId) {
                    loadExistingBill(billId);
                } else {

                    const billNo = await AsyncStorage.getItem("billNo") || "";
                    if (!billNo) {
                        await getBillCount();
                    } else {
                        setBillID(billNo)
                    }
                }
            }
            billUpdates();
        }, [Id, mode]))

    const normalizeItem = (item) => {
        const tot = Number(item.price || 0) * Number(item.quantity || 0)
        console.log("Item:::", Number(item.price || 0) ,"* ",Number(item.quantity || 0,"=",tot))
        const gstAmount = tot * (Number(item.gstPercent || 0) / 100);
        console.log("Item:::",gstAmount)

        const cessAmount = tot * (Number(item.cessPercent || 0) / 100);
        console.log("Item:::",cessAmount)
        return {
            itemName: item.itemName || item.name || "",   // unify name
            description: item.description || "",
            price: Number(item.price || 0),
            quantity: Number(item.quantity || 0),
            total: Number(item.total ?? (item.price * item.quantity)),
            gstAmount: gstAmount || 0,
            gstPercent: Number(item.gstPercent || 0),
            cessAmount: cessAmount || 0,
            cessPercent: Number(item.cessPercent || 0),
            barcode: item.barcode || "",
            mrp: Number(item.mrp || 0),
            taxType: item.taxType || "inclusive",
            unit: item.unit || "Nos",
        };
    };
    useEffect(() => {
        console.log("ITEMS TYPE:", Array.isArray(items), items);
    }, [items]);

    /* -------------------------------------------------------------------------- */
    /*                            3️⃣ LOAD EXISTING BILL                          */
    /* -------------------------------------------------------------------------- */
    const loadExistingBill = async (id) => {

        try {
            const res = await ApiService.get(`/bill/${id}`);
            const data = res.data;

            setBillID(data.bill_id);
            setBillTypes(data.bill_type);
            setBillDates(data.bill_date);
            setBillNote(data.description || "");

            setItems(data.items || []);
            const rawCharges = data.ExtraCharges;

            let normalizedCharges = [];

            if (Array.isArray(rawCharges)) {
                normalizedCharges = normalizeExtraCharges(rawCharges);
            } else if (typeof rawCharges === "string") {
                try {
                    normalizedCharges = normalizeExtraCharges(JSON.parse(rawCharges));
                } catch {
                    normalizedCharges = [];
                }
            }

            setExtraCharges(normalizedCharges);
            setSupplier(data.customer || data.supplier || null);
            normalizeItem(data);

            // 🔥 Normalize items
            const rawItems = data.items;

            let normalizedItems = [];

            if (Array.isArray(rawItems)) {
                normalizedItems = rawItems.map(normalizeItem);
            } else if (typeof rawItems === 'string') {
                try {
                    normalizedItems = JSON.parse(rawItems).map(normalizeItem);
                } catch {
                    normalizedItems = [];
                }
            }

            setItems(normalizedItems);

            // 🔥 Normalize extra charges
            // const normalizedCharges = normalizeExtraCharges(data.ExtraCharges || []);
            // setExtraCharges(normalizedCharges);

            // 🔥 Keep supplier/customer
            setSupplier(data.customer || data.supplier || null);

        } catch (err) {
            console.log("Load Edit Error:", err);
        }
    };

    useEffect(() => {
        if (!Array.isArray(extraCharges)) {
            setExtraCharges([]);
        }
    }, [extraCharges]);

    const fetchClientData = async () => {
        const userData = await AsyncStorage.getItem("userData");
        const userId = JSON.parse(userData).id;
        const URL = transaction_for === 'customer' ? `/customers/${Id}` : `/supplier/${Id}`

        try {
            const response = await ApiService.post(URL, { userId });
            const data = response.data;
            if (transaction_for === 'customer') {
                setSupplier(data.customer);
            } else {
                setSupplier(data.supplier);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load data');
        }
    };

    const getSupplier = async () => {
        const userData = await AsyncStorage.getItem("userData");
        const userId = JSON.parse(userData).id;
        const URL = transaction_for === 'customer' ? `/customers/getAllCustomers/ByUserId` : `/supplier/getAllSuppliers/ByUserId`

        try {
            const response = await ApiService.post(URL, { userId });
            const data = response.data;
            if (transaction_for === 'customer') {
                setSuppliersList(data.customers);
            } else {
                setSuppliersList(data.suppliers);
            }

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
            await AsyncStorage.setItem("billNo", bill);
            await AsyncStorage.setItem("billType", bill_type);
            await AsyncStorage.setItem("billDate", bill_date);

        } catch (error) {
            console.error('Error fetching bills:', error);
        }
    }
    const billStorage = async (supplier) => {
        await AsyncStorage.setItem("billSupplier", JSON.stringify(supplier));
        await AsyncStorage.setItem("billNo", billID);
        await AsyncStorage.setItem("billType", bill_type);
        await AsyncStorage.setItem("billDate", bill_date);
    }

    const gotoBill = async () => {
        await AsyncStorage.setItem("billType", bill_type)
        const extraChargesPreview = flattenExtraCharges(extraCharges);
        if (bill_type === "BILL") {
            router.push({ pathname: './billPreview', params: { items: JSON.stringify(items), extraCharges: JSON.stringify(extraChargesPreview || []), totalAmount: finalTotalAmount, supplierData: JSON.stringify(supplier), bill: billID, transaction_for, mode, bill_prm_id: billId } })
        } else {
            router.push({ pathname: './quotePreview', params: { items: JSON.stringify(items), extraCharges: JSON.stringify(extraCharges || []), totalAmount: finalTotalAmount, supplierData: JSON.stringify(supplier), bill: billID, transaction_for } })
        }
    }
    const handleDeleteItem = (index) => {
        const updated = items.filter((_, i) => i !== index);
        setItems(updated);
    };

    useEffect(() => {

        getSupplier();

    }, []);

    const renderItem = ({ item, index }) => {
        return (
            <View style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{item.itemName}</Text>
                        <Text style={styles.itemDescription}>{item.description}</Text>
                        <Text style={styles.itemCalc}>
                            ({item.quantity} x ₹ {item.price}) + ₹ {item.gstAmount} GST + ₹ {item.cessAmount} CESS;
                        </Text>
                    </View>

                    <Text style={styles.itemPrice}>₹ {parseFloat(item.total).toFixed(2)}</Text>

                    {/* EDIT ICON */}
                    {/* <TouchableOpacity
                        style={{ marginRight: 8 }}
                        onPress={() => {
                            setEditItemIndex(index);
                            setEditItemData(item);
                            setIsAdditem(true);
                        }}
                    >
                        <Edit3 size={20} color="blue" />
                    </TouchableOpacity> */}

                    {/* DELETE ICON */}
                    <TouchableOpacity style={{ marginLeft: 10 }}
                        onPress={() => handleDeleteItem(index)}
                    >
                        <Trash2 size={20} color="red" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const flattenExtraCharges = (nestedArray) => {
        const flatArray = nestedArray.flat(); // merges nested groups into single array

        return flatArray;
    };
    const renderChargesDetails = () =>
        Array.isArray(extraCharges)
            ? extraCharges.map((group, groupIndex) => {
                if (!Array.isArray(group)) return null; let groupTotal = 0;

                return (
                    <View key={groupIndex} style={styles.taxContainer}>
                        {group.map((item, index) => {
                            const amount = Number(item?.finalAmount || 0);

                            groupTotal += item?.type === "charge" ? amount : -amount;

                            return (
                                <Text key={index} style={styles.taxText}>
                                    {item?.type === "charge" ? "Charge" : "Discount"} ({item?.name}) : ₹ {amount.toFixed(2)}
                                </Text>
                            );
                        })}

                        <Text style={styles.taxTotal}>
                            Sub Total: ₹ {groupTotal.toFixed(2)}
                        </Text>
                    </View>
                );
            }) : null;
    // Calculate extra charges grand total
    const extraChargesTotal = Array.isArray(extraCharges)
        ? extraCharges.reduce((acc, group) => {
            if (!Array.isArray(group)) return acc;

            const groupTotal = group.reduce((sum, item) => {
                const amount = Number(item?.finalAmount || 0);
                return item?.type === "charge" ? sum + amount : sum - amount;
            }, 0);

            return acc + groupTotal;
        }, 0)
        : 0;

    // FINAL AMOUNT (items + charges - discounts)
    const finalTotalAmount = totalAmount + extraChargesTotal;

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
                    <Avatar.Image size={36}
                        source={{ uri: supplier?.photo ? supplier?.photo : 'https://via.placeholder.com/40' }}
                        style={styles.profileImage}
                    />
                    {supplier ?
                        <>
                            <Text style={{ fontWeight: '200', fontSize: 14 }}>{bill_type === "BILL" ? "Bill" : "Quote"} to {`\n`}<Text style={styles.userName}>{supplier.name}</Text></Text>
                        </>
                        :
                        <>
                            <TouchableOpacity onPress={() => setSupplierListVisible(true)}>
                                <Text style={{ fontWeight: '200', fontSize: 14 }}>{bill_type === "BILL" ? "Bill" : "Quote"} to {`\n`}<Text style={[styles.userName]}>Add supplier</Text></Text>
                            </TouchableOpacity>
                        </>}
                </View>
                <TouchableOpacity onPress={() => {
                    router.replace({ pathname: '/otherDetails', params: { Id: supplier?.id || null, supplierName: supplier?.name || "", supplierMobile: supplier?.mobile || "", billNo: billID || "", billDate: bill_date } })
                }
                }>
                    <Edit3 size={20} color="gray" />
                </TouchableOpacity>
            </Appbar.Header>

            {/* Bill Info */}
            <View style={styles.billInfo}>
                <Text style={styles.billLabel}>{bill_type === "BILL" ? "Bill Number" : "Quotation Number"}</Text>
                <Text style={styles.billValue}>{billID}</Text>

                <Text style={styles.billLabel}>Bill Date</Text>
                <Text style={styles.billValue}>{bill_date}</Text>
            </View>

            <FlatList
                data={Array.isArray(items) ? items : []}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderItem}
                style={{ marginHorizontal: 16 }}
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
            <TouchableOpacity style={[styles.previewButton]} onPress={() => {
                setIsAdditem(true)
            }
            }>
                <Text style={{ color: '#f3f3f3', fontWeight: 'bold' }}>Add Items</Text>
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
                <>
                    <ScrollView style={{ marginHorizontal: 16, marginBottom: 10 }}>
                        {renderTaxDetails()}
                        {renderChargesDetails()}
                    </ScrollView>
                    <Text style={[styles.taxTitle, { marginBottom: 5, marginHorizontal: 16, }]}>Extra Charges / Discount </Text>

                    {/* <ScrollView style={{ marginHorizontal: 16, }}></ScrollView> */}
                </>
            )}

            {/* Total and Actions */}
            <TouchableOpacity style={styles.totalFooter} onPress={() => { setIsAddExtraCharges(true) }}>
                <Text style={[styles.totalLabel, { fontSize: 12, color: "#00B050" }]}>(-) Add Discount / (+) Extra Charges </Text>
            </TouchableOpacity>
            <View style={styles.totalFooter}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>₹ {parseFloat(finalTotalAmount).toFixed(2)}</Text>
            </View>

            <TouchableOpacity style={styles.previewButton} onPress={() => {
                if (supplier) {
                    gotoBill()
                } else {
                    setSupplierListVisible(true)
                }
            }}>
                <Text style={styles.previewText}>Preview</Text>
            </TouchableOpacity>
            <Modal visible={isAdditem}
                style={{ flex: 1 }}
                animationType="slide"
                presentationStyle="fullScreen"
            >
                <ItemForm
                    setItem={setIsAdditem}
                    setNewItem={(newItem) => {
                        console.log("item::",newItem)
                        setItems(prev =>
                            Array.isArray(prev)
                                ? [...prev, newItem]
                                : [newItem]
                        );
                    }}
                />
            </Modal>
            <Modal visible={isAddExtraCharges}>
                <ExtraChargesForm
                    animationType="slide"
                    presentationStyle="fullScreen"
                    setItem={setIsAddExtraCharges}
                    totalAmount={totalAmount}
                    setNewItem={(item) =>
                        setExtraCharges(prev =>
                            Array.isArray(prev)
                                ? [...prev, Array.isArray(item) ? item : [item]]
                                : [Array.isArray(item) ? item : [item]]
                        )
                    }
                />
            </Modal>
            <Modal
                animationType="slide"
                transparent={true}
                visible={supplierListVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.bottomSheet}>
                        <Text style={styles.modalTitle}>Please Select added Suppliers</Text>
                        <FlatList
                            data={suppliersList}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.contactItem} onPress={() => {
                                    setSupplierListVisible(false)
                                    setSupplier(item)
                                    billStorage(item)
                                }}>
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
                        <TouchableOpacity style={styles.modalCloseButton} onPress={() => setSupplierListVisible(false)}>
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
        width: 30,
        height: 30,
        borderRadius: 18,
        marginHorizontal: 15,
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
        paddingBottom: 40, height: 300,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },

});
