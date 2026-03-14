// components/BillDetailScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, SafeAreaView, StyleSheet, TouchableOpacity, Image, ScrollView, StatusBar, Platform, Modal as RNModal, TextInput, Alert } from 'react-native';
import { ArrowLeft, Trash2, Edit3, ChevronDown, ChevronUp, Plus, FileText, User, Phone, Calendar, Tag, Percent, IndianRupee, X, Search } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Appbar, Avatar, Modal as PaperModal, Portal, Provider } from 'react-native-paper';
import ItemForm from './itemForm';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';
import { useFocusEffect } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import ExtraChargesForm from './ExtraChargesForm';
import { LinearGradient } from 'expo-linear-gradient';

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
    const [searchText, setSearchText] = useState('');

    const { Id = "", bill_type = "", billId = "", mode = "", bill_date = "", billNo = "", transaction_for, ownerId = "" } = useLocalSearchParams();
    console.log("transaction_for::::",transaction_for)
    const router = useRouter();
    const totalAmount = Array.isArray(items)
        ? items.reduce((acc, item) => acc + Number(item?.total || 0), 0)
        : 0;

    useFocusEffect(

        useCallback(() => {

            const customeData = async () => {
                try {
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
            };
            billUpdates();
        }, [Id, mode, billId]))

    const normalizeItem = (item) => {
        const tot = Number(item.price || 0) * Number(item.quantity || 0)
        const gstAmount = tot * (Number(item.gstPercent || 0) / 100);
        const cessAmount = tot * (Number(item.cessPercent || 0) / 100);
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
        const URL = transaction_for === 'supplier' ? `/supplier/${Id}` : `/customers/${Id}`
        try {
            const response = await ApiService.post(URL, { userId, ownerId });
            const data = response.data;
            if (transaction_for === 'supplier') {
                setSupplier(data.supplier);
            } else {
                setSupplier(data.customer);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load data');
        }
    };

    const getSupplier = async () => {
        const userData = await AsyncStorage.getItem("userData");
        const userId = JSON.parse(userData).id;
        const URL = transaction_for === 'supplier' ? `/supplier/getAllSuppliers/ByUserId` : `/customers/getAllCustomers/ByUserId`

        try {
            const response = await ApiService.post(URL, { userId });
            const data = response.data;
            if (transaction_for === 'supplier') {
                setSuppliersList(data.suppliers);
            } else {
                setSuppliersList(data.customers);
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
        if (!supplier) {
            Alert.alert('Error', 'Please select a customer/supplier first');
            return;
        }

        if (items.length === 0) {
            Alert.alert('Error', 'Please add at least one item');
            return;
        }

        await AsyncStorage.setItem("billType", bill_type)
        const extraChargesPreview = flattenExtraCharges(extraCharges);
        if (bill_type === "BILL") {
            router.push({ pathname: './billPreview', params: { items: JSON.stringify(items), extraCharges: JSON.stringify(extraChargesPreview || []), totalAmount: finalTotalAmount, supplierData: JSON.stringify(supplier), bill: billID, transaction_for, mode, bill_prm_id: billId } })
        } else {
            router.push({ pathname: './quotePreview', params: { items: JSON.stringify(items), extraCharges: JSON.stringify(extraCharges || []), totalAmount: finalTotalAmount, supplierData: JSON.stringify(supplier), bill: billID, transaction_for, mode: mode || 'add', } })
        }
    }
    const handleDeleteItem = (index) => {
        Alert.alert(
            'Delete Item',
            'Are you sure you want to delete this item?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        const updated = items.filter((_, i) => i !== index);
                        setItems(updated);
                    }
                }
            ]
        );
    };

    useEffect(() => {
        getSupplier();
    }, []);

    const filteredSuppliers = suppliersList.filter(item =>
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (item.mobile && item.mobile.includes(searchText))
    );

    const renderItem = ({ item, index }) => {
        return (
            <View style={styles.itemCard}>
                <View style={styles.itemHeader}>
                    <View style={styles.itemLeft}>
                        <View style={[styles.itemIcon, { backgroundColor: 'rgba(10,77,60,0.1)' }]}>
                            <Tag size={16} color="#0A4D3C" />
                        </View>
                        <View style={styles.itemDetails}>
                            <Text style={styles.itemTitle}>{item.itemName}</Text>
                            {item.description ? <Text style={styles.itemDescription}>{item.description}</Text> : null}
                            <Text style={styles.itemCalc}>
                                {item.quantity} × ₹{item.price}
                                {item.gstPercent > 0 ? ` + ${item.gstPercent}% GST` : ''}
                                {item.cessPercent > 0 ? ` + ${item.cessPercent}% CESS` : ''}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.itemRight}>
                        <Text style={styles.itemPrice}>₹{parseFloat(item.total).toFixed(2)}</Text>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteItem(index)}
                        >
                            <Trash2 size={18} color="#DC2626" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    const flattenExtraCharges = (nestedArray) => {
        if (!Array.isArray(nestedArray)) return [];
        const flatArray = nestedArray.flat();
        return flatArray;
    };

    const renderChargesDetails = () =>
        Array.isArray(extraCharges) && extraCharges.length > 0
            ? extraCharges.map((group, groupIndex) => {
                if (!Array.isArray(group) || group.length === 0) return null;
                let groupTotal = 0;

                return (
                    <View key={groupIndex} style={styles.chargesCard}>
                        <View style={styles.chargesHeader}>
                            <Percent size={14} color="#0A4D3C" />
                            <Text style={styles.chargesTitle}>Group {groupIndex + 1}</Text>
                        </View>
                        {group.map((item, index) => {
                            const amount = Number(item?.finalAmount || 0);
                            groupTotal += item?.type === "charge" ? amount : -amount;

                            return (
                                <View key={index} style={styles.chargeRow}>
                                    <Text style={styles.chargeLabel}>
                                        {item?.type === "charge" ? "➕" : "➖"} {item?.name}
                                    </Text>
                                    <Text style={[
                                        styles.chargeAmount,
                                        { color: item?.type === "charge" ? '#0A4D3C' : '#DC2626' }
                                    ]}>
                                        ₹{amount.toFixed(2)}
                                    </Text>
                                </View>
                            );
                        })}
                        <View style={styles.chargeDivider} />
                        <View style={styles.chargeTotalRow}>
                            <Text style={styles.chargeTotalLabel}>Group Total</Text>
                            <Text style={styles.chargeTotalAmount}>₹{groupTotal.toFixed(2)}</Text>
                        </View>
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
            <View key={item.itemName || index} style={styles.taxCard}>
              <Text style={styles.taxTitle}>Item {index + 1}: {item.itemName}</Text>
              <View style={styles.taxRow}>
                <Text style={styles.taxLabel}>Taxable Amount</Text>
                <Text style={styles.taxValue}>₹{taxable.toFixed(2)}</Text>
              </View>
              <View style={styles.taxRow}>
                <Text style={styles.taxLabel}>CGST ({(item.gstPercent / 2).toFixed(2)}%)</Text>
                <Text style={styles.taxValue}>₹{(gst / 2).toFixed(2)}</Text>
              </View>
              <View style={styles.taxRow}>
                <Text style={styles.taxLabel}>SGST ({(item.gstPercent / 2).toFixed(2)}%)</Text>
                <Text style={styles.taxValue}>₹{(gst / 2).toFixed(2)}</Text>
              </View>
              {cess > 0 && (
                <View style={styles.taxRow}>
                  <Text style={styles.taxLabel}>CESS ({item.cessPercent}%)</Text>
                  <Text style={styles.taxValue}>₹{cess.toFixed(2)}</Text>
                </View>
              )}
              <View style={styles.taxDivider} />
              <View style={styles.taxTotalRow}>
                <Text style={styles.taxTotalLabel}>Sub Total</Text>
                <Text style={styles.taxTotalValue}>₹{total.toFixed(2)}</Text>
              </View>
            </View>
          );
        });
    
    return (
        <Provider>
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
                  <Text style={styles.headerTitle}>
                    {bill_type === "BILL" ? "Create Bill" : "Create Quotation"}
                  </Text>
                  <Text style={styles.headerSubtitle}>
                    {bill_type === "BILL" ? "New invoice" : "New quote"}
                  </Text>
                </View>
  
                {supplier && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                      router.replace({
                        pathname: '/otherDetails',
                        params: {
                          Id: supplier?.id || null,
                          supplierName: supplier?.name || "",
                          supplierMobile: supplier?.mobile || "",
                          billNo: billID || "",
                          billDate: bill_date
                        }
                      });
                    }}
                  >
                    <Edit3 size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            </SafeAreaView>
          </LinearGradient>
  
          {/* Customer/Supplier Card */}
          <View style={styles.customerCard}>
            <View style={styles.customerLeft}>
              <View style={[styles.customerIcon, { backgroundColor: 'rgba(10,77,60,0.1)' }]}>
                <User size={20} color="#0A4D3C" />
              </View>
              {supplier ? (
                <View>
                  <Text style={styles.customerName}>{supplier.name}</Text>
                  <View style={styles.customerPhone}>
                    <Phone size={12} color="#64748B" />
                    <Text style={styles.customerPhoneText}>{supplier.mobile || 'No phone'}</Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setSupplierListVisible(true)}>
                  <Text style={styles.selectCustomerText}>Select {transaction_for === 'supplier' ? 'Supplier' : 'Customer'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
  
          {/* Bill Info Card */}
          <View style={styles.billInfoCard}>
            <View style={styles.billInfoRow}>
              <View style={styles.billInfoItem}>
                <Tag size={14} color="#64748B" />
                <Text style={styles.billInfoLabel}>Number</Text>
                <Text style={styles.billInfoValue}>{billID || 'Generating...'}</Text>
              </View>
              <View style={styles.billInfoDivider} />
              <View style={styles.billInfoItem}>
                <Calendar size={14} color="#64748B" />
                <Text style={styles.billInfoLabel}>Date</Text>
                <Text style={styles.billInfoValue}>{bill_date}</Text>
              </View>
            </View>
          </View>
  
          {/* Items List */}
          <FlatList
            data={Array.isArray(items) ? items : []}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            ListHeaderComponent={
              items.length > 0 ? (
                <View style={styles.listHeader}>
                  <Text style={styles.listHeaderTitle}>Items</Text>
                  <Text style={styles.listHeaderCount}>{items.length} item(s)</Text>
                </View>
              ) : null
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <LottieView
                  source={require('../assets/animations/noData.json')}
                  autoPlay
                  loop
                  style={styles.lottieAnimation}
                />
                <Text style={styles.emptyText}>No items added</Text>
                <Text style={styles.emptySubtext}>Tap the button below to add items</Text>
              </View>
            )}
          />
  
          {/* Add Item Button */}
          <TouchableOpacity
            style={styles.addItemButton}
            onPress={() => setIsAdditem(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(10,77,60,0.1)', 'rgba(10,77,60,0.05)']}
              style={styles.addItemGradient}
            >
              <Plus size={18} color="#0A4D3C" />
              <Text style={styles.addItemText}>Add Item</Text>
            </LinearGradient>
          </TouchableOpacity>
  
          {/* Toggle Details */}
          {items.length > 0 && (
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowDetails(!showDetails)}
            >
              <Text style={styles.toggleText}>
                {showDetails ? 'Hide Details' : 'Show Tax & Charges'}
              </Text>
              {showDetails ? (
                <ChevronUp size={16} color="#0A4D3C" />
              ) : (
                <ChevronDown size={16} color="#0A4D3C" />
              )}
            </TouchableOpacity>
          )}
  
          {/* Tax Details */}
          {showDetails && items.length > 0 && (
            <ScrollView
              style={styles.detailsScroll}
              showsVerticalScrollIndicator={false}
            >
              {renderTaxDetails()}
              {renderChargesDetails()}
  
              {/* Add Charges Button */}
              <TouchableOpacity
                style={styles.addChargesButton}
                onPress={() => setIsAddExtraCharges(true)}
              >
                <Percent size={16} color="#0A4D3C" />
                <Text style={styles.addChargesText}>Add Discount / Extra Charges</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
  
          {/* Total Footer */}
          <View style={styles.totalFooter}>
            <View>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalItems}>{items.length} item(s)</Text>
            </View>
            <Text style={styles.totalAmount}>₹{parseFloat(finalTotalAmount).toFixed(2)}</Text>
          </View>
  
          {/* Preview Button */}
          <TouchableOpacity
            style={styles.previewButton}
            onPress={gotoBill}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#0A4D3C', '#1B6B50']}
              style={styles.previewGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <FileText size={20} color="#FFFFFF" />
              <Text style={styles.previewText}>
                {bill_type === "BILL" ? 'Preview Bill' : 'Preview Quote'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
  
          {/* Add Item Modal - Fixed */}
          <Portal>
            <PaperModal
              visible={isAdditem}
              onDismiss={() => setIsAdditem(false)}
              contentContainerStyle={styles.modalContentContainer}
            >
              <ItemForm
                setItem={setIsAdditem}
                setNewItem={(newItem) => {
                  setItems(prev =>
                    Array.isArray(prev)
                      ? [...prev, newItem]
                      : [newItem]
                  );
                }}
              />
            </PaperModal>
          </Portal>
  
          {/* Add Charges Modal - Fixed */}
          <Portal>
            <PaperModal
              visible={isAddExtraCharges}
              onDismiss={() => setIsAddExtraCharges(false)}
              contentContainerStyle={styles.modalContentContainer}
            >
              <ExtraChargesForm
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
            </PaperModal>
          </Portal>
  
          {/* Supplier Selection Modal */}
          <RNModal
            animationType="slide"
            transparent={true}
            visible={supplierListVisible}
            onRequestClose={() => setSupplierListVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    Select {transaction_for === 'supplier' ? 'Supplier' : 'Customer'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSupplierListVisible(false)}
                    style={styles.modalCloseButton}
                  >
                    <X size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>
  
                {/* Search Bar */}
                <View style={styles.modalSearchContainer}>
                  <Search size={18} color="#64748B" />
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder={`Search ${transaction_for === 'supplier' ? 'suppliers' : 'customers'}...`}
                    placeholderTextColor="#94A3B8"
                    value={searchText}
                    onChangeText={setSearchText}
                  />
                  {searchText.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchText('')}>
                      <X size={16} color="#64748B" />
                    </TouchableOpacity>
                  )}
                </View>
  
                {filteredSuppliers.length === 0 ? (
                  <View style={styles.modalEmptyContainer}>
                    <User size={50} color="#E2E8F0" />
                    <Text style={styles.modalEmptyText}>No {transaction_for === 'supplier' ? 'suppliers' : 'customers'} found</Text>
                    <Text style={styles.modalEmptySubtext}>
                      Add a {transaction_for === 'supplier' ? 'supplier' : 'customer'} first
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={filteredSuppliers}
                    keyExtractor={(item) => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.modalList}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.modalContactItem}
                        onPress={() => {
                          setSupplierListVisible(false);
                          setSupplier(item);
                          billStorage(item);
                          setSearchText('');
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.modalContactRow}>
                          {item.photo ? (
                            <Image source={{ uri: item.photo }} style={styles.modalContactImage} />
                          ) : (
                            <LinearGradient
                              colors={['#0A4D3C', '#1B6B50']}
                              style={[styles.modalContactImage, styles.modalPlaceholderImage]}
                            >
                              <Text style={styles.modalInitialText}>
                                {item.name?.[0]?.toUpperCase() || '?'}
                              </Text>
                            </LinearGradient>
                          )}
                          <View style={styles.modalContactInfo}>
                            <Text style={styles.modalContactName}>{item.name}</Text>
                            {item.mobile && (
                              <View style={styles.modalContactPhone}>
                                <Phone size={12} color="#64748B" />
                                <Text style={styles.modalContactNumber}>{item.mobile}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                )}
  
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setSupplierListVisible(false);
                    setSearchText('');
                  }}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </RNModal>
        </View>
      </Provider>
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
    editButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    customerCard: {
      backgroundColor: '#FFFFFF',
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 12,
      padding: 16,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: 'rgba(10,77,60,0.1)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    customerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    customerIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    customerName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1E293B',
      marginBottom: 4,
      textTransform: 'capitalize',
    },
    customerPhone: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    customerPhoneText: {
      fontSize: 12,
      color: '#64748B',
    },
    selectCustomerText: {
      fontSize: 15,
      color: '#0A4D3C',
      fontWeight: '600',
    },
    billInfoCard: {
      backgroundColor: '#FFFFFF',
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(10,77,60,0.1)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    billInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
    },
    billInfoItem: {
      alignItems: 'center',
      gap: 4,
    },
    billInfoLabel: {
      fontSize: 10,
      color: '#64748B',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    billInfoValue: {
      fontSize: 13,
      fontWeight: '600',
      color: '#1E293B',
    },
    billInfoDivider: {
      width: 1,
      height: 30,
      backgroundColor: 'rgba(10,77,60,0.1)',
    },
    listContainer: {
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      marginTop: 8,
    },
    listHeaderTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1E293B',
    },
    listHeaderCount: {
      fontSize: 13,
      color: '#64748B',
    },
    itemCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: 'rgba(10,77,60,0.1)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    itemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    itemIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemDetails: {
      flex: 1,
    },
    itemTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#1E293B',
      marginBottom: 2,
      textTransform: 'capitalize',
    },
    itemDescription: {
      fontSize: 12,
      color: '#64748B',
      marginBottom: 2,
    },
    itemCalc: {
      fontSize: 11,
      color: '#94A3B8',
    },
    itemRight: {
      alignItems: 'flex-end',
      gap: 8,
    },
    itemPrice: {
      fontSize: 16,
      fontWeight: '700',
      color: '#0A4D3C',
    },
    deleteButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(220,38,38,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    lottieAnimation: {
      width: 150,
      height: 120,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1E293B',
      marginTop: 12,
    },
    emptySubtext: {
      fontSize: 13,
      color: '#64748B',
      marginTop: 4,
    },
    addItemButton: {
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 16,
      overflow: 'hidden',
    },
    addItemGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      gap: 8,
      borderWidth: 1,
      borderColor: 'rgba(10,77,60,0.2)',
      borderRadius: 16,
    },
    addItemText: {
      fontSize: 14,
      color: '#0A4D3C',
      fontWeight: '600',
    },
    toggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      gap: 6,
      backgroundColor: '#FFFFFF',
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(10,77,60,0.1)',
    },
    toggleText: {
      fontSize: 13,
      color: '#0A4D3C',
      fontWeight: '600',
    },
    detailsScroll: {
      maxHeight: 200,
      marginHorizontal: 16,
      marginBottom: 12,
    },
    taxCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: 'rgba(10,77,60,0.1)',
    },
    taxTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#0A4D3C',
      marginBottom: 10,
      textTransform: 'capitalize',
    },
    taxRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    taxLabel: {
      fontSize: 12,
      color: '#64748B',
    },
    taxValue: {
      fontSize: 12,
      fontWeight: '500',
      color: '#1E293B',
    },
    taxDivider: {
      height: 1,
      backgroundColor: 'rgba(10,77,60,0.1)',
      marginVertical: 8,
    },
    taxTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    taxTotalLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: '#1E293B',
    },
    taxTotalValue: {
      fontSize: 14,
      fontWeight: '700',
      color: '#0A4D3C',
    },
    chargesCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: 'rgba(10,77,60,0.1)',
    },
    chargesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 10,
    },
    chargesTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#0A4D3C',
    },
    chargeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    chargeLabel: {
      fontSize: 12,
      color: '#64748B',
    },
    chargeAmount: {
      fontSize: 12,
      fontWeight: '500',
    },
    chargeDivider: {
      height: 1,
      backgroundColor: 'rgba(10,77,60,0.1)',
      marginVertical: 8,
    },
    chargeTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    chargeTotalLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: '#1E293B',
    },
    chargeTotalAmount: {
      fontSize: 14,
      fontWeight: '700',
      color: '#0A4D3C',
    },
    addChargesButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      paddingVertical: 14,
      borderRadius: 16,
      gap: 8,
      borderWidth: 1,
      borderColor: 'rgba(10,77,60,0.1)',
      marginBottom: 8,
    },
    addChargesText: {
      fontSize: 13,
      color: '#0A4D3C',
      fontWeight: '600',
    },
    totalFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: 'rgba(10,77,60,0.1)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    totalLabel: {
      fontSize: 14,
      color: '#64748B',
      marginBottom: 2,
    },
    totalItems: {
      fontSize: 11,
      color: '#94A3B8',
    },
    totalAmount: {
      fontSize: 22,
      fontWeight: '700',
      color: '#0A4D3C',
    },
    previewButton: {
      margin: 16,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#0A4D3C',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    previewGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      gap: 8,
    },
    previewText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    modalContentContainer: {
      backgroundColor: 'transparent',
      margin: 0,
      flex: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      paddingTop: 20,
      paddingBottom: 30,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(10,77,60,0.1)',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#0A4D3C',
    },
    modalCloseButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#F8FAFC',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalSearchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F8FAFC',
      marginHorizontal: 20,
      marginVertical: 16,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === 'ios' ? 12 : 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(10,77,60,0.1)',
      gap: 8,
    },
    modalSearchInput: {
      flex: 1,
      fontSize: 14,
      color: '#1E293B',
      padding: 0,
    },
    modalEmptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    modalEmptyText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1E293B',
      marginTop: 12,
      marginBottom: 4,
    },
    modalEmptySubtext: {
      fontSize: 13,
      color: '#64748B',
      textAlign: 'center',
    },
    modalList: {
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    modalContactItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(10,77,60,0.1)',
    },
    modalContactRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    modalContactImage: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#E2E8F0',
    },
    modalPlaceholderImage: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalInitialText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 18,
    },
    modalContactInfo: {
      marginLeft: 16,
      flex: 1,
    },
    modalContactName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1E293B',
      marginBottom: 4,
      textTransform: 'capitalize',
    },
    modalContactPhone: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    modalContactNumber: {
      fontSize: 13,
      color: '#64748B',
    },
    modalCancelButton: {
      marginTop: 20,
      marginHorizontal: 20,
      paddingVertical: 14,
      backgroundColor: '#F8FAFC',
      borderRadius: 16,
      alignItems: 'center',
    },
    modalCancelButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#64748B',
    },
  });