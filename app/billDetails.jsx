// App.js
import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, SafeAreaView } from 'react-native';
import { Appbar, RadioButton, Divider } from 'react-native-paper';
import { ArrowLeft, Download } from 'lucide-react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CustomRadioButton from './components/CustomRadioButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';
import billPDF from './components/billPDF';
import moment from 'moment';

export default function BillDetails() {
  const [format, setFormat] = useState('pdf');
  const [billDetails, setbillDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [supplierData, setSupplierData] = useState(null);
  const [items, setItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [taxableAmount, setTaxableAmount] = useState(0);
  const [chargesAmount, setChargesAmount] = useState(0);
  const [itemsAmount, setItemsAmount] = useState(0);
  const [extraCharges, setExtraCharges] = useState([]);

  const quoteRef = useRef();
  const router = useRouter();
  const { billId, supplierInfo, bill,transaction_for } = useLocalSearchParams();

  // ---------- Parse supplier data ----------
  useEffect(() => {
    if (supplierInfo) {
      console.log("supplierInfo::",supplierInfo)
      try {
        const parsedData = JSON.parse(decodeURIComponent(supplierInfo));
        setSupplierData(parsedData);
      } catch (error) {
        console.error("Failed to parse supplierInfo:", error);
      }
    }
  }, [supplierInfo]);

  // ---------- SHARE OR DOWNLOAD PDF / IMAGE ----------
  const handleDownload = async () => {
    try {
      if (format === 'pdf') {
        const pdf = await billPDF(userDetails, supplierData, bill, items, extraCharges, totalPrice);

        if (!pdf || !pdf.uri) {
          Alert.alert("Error", "Could not generate PDF");
          return;
        }

        // 🔥 CORRECT WAY: share PDF
        await Sharing.shareAsync(pdf.uri, {
          mimeType: "application/pdf",
          dialogTitle: "Share PDF"
        });
        return;
      }

      // ---------- SHARE IMAGE ----------
      const imageUri = await captureRef(quoteRef, { format: 'png', quality: 1 });
      await Sharing.shareAsync(imageUri);

    } catch (error) {
      console.log("Share error", error);
      Alert.alert('Error', error.message || 'Something went wrong');
    }
  };

  // ---------- FETCH BILL ----------
  useEffect(() => {
    const fetchBills = async () => {
      const userData = await AsyncStorage.getItem("userData");
      setUserDetails(JSON.parse(userData));
    
      try {
        setLoading(true);
    
        const response = await ApiService.post(`/bill/${billId}`);
        const result = response.data;
    
        // Parse items and charges safely
        const parsedItems = Array.isArray(result.items) ? result.items : JSON.parse(result.items);
        const parsedCharges = Array.isArray(result.ExtraCharges) ? result.ExtraCharges : JSON.parse(result.ExtraCharges);
    
        setItems(parsedItems);
        setExtraCharges(parsedCharges);
        setbillDetails(result);
    
        // 🔥 Compute totals NOW using parsed arrays
        const totalItemAmount =
          parsedItems.reduce((sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 0), 0);
    
        const totalExtra =
          parsedCharges.reduce((sum, c) => sum + Number(c.finalAmount || 0), 0);
    
        const taxable = Number(result.amount) - (totalItemAmount + totalExtra);
    
        // Update states with computed values
        setItemsAmount(totalItemAmount);
        setChargesAmount(totalExtra);
        setTaxableAmount(taxable);
        setTotalPrice(result.amount);
    
      } catch (err) {
        console.error("Error fetching bill:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBills();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Appbar.Header style={{ backgroundColor: "#fff", borderBottomWidth: 2, borderColor: '#f2f7f6' }}>
        <ArrowLeft
          size={24}
          color={'#2E7D32'}
          style={{ marginStart: 10 }}
          onPress={() => {
            if (transaction_for==="supplier") {
              router.push({
                pathname: './supplierDetails', 
                params: {
                  personName: supplierData?.name,
                  personType: "supplier",
                  personId: supplierData?.id
                }
              })
            } else {
              router.push({
                pathname: './customerDetails',
                params: {
                  personName: supplierData?.name,
                  personType: "customer",
                  personId: supplierData?.id
                }
              })
            }
          }
          }
        />
        <Appbar.Content title={billDetails?.bill_id || "Bill"} titleStyle={{ marginLeft: 20 }} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.container}>
        {/* QUOTE VIEW */}
        <View style={styles.quotationBox} ref={quoteRef}>
          <Text style={styles.heading}>{userDetails?.name}</Text>
          {userDetails?.address && <Text style={styles.address}>{userDetails.address}</Text>}
          <Text style={styles.mobile}>Mobile: {userDetails?.mobile}</Text>

          <Divider style={{ marginVertical: 5 }} />

          {supplierData && (
            <>
              <Text style={styles.heading}>{supplierData?.name}</Text>
              {supplierData?.address && <Text style={styles.address}>{supplierData.address}</Text>}
              <Text style={styles.mobile}>Mobile: {supplierData?.mobile}</Text>
            </>
          )}

          <Divider style={{ marginVertical: 5 }} />

          <View style={styles.row}>
            <Text>Quotation No.: <Text style={styles.bold}>{bill}</Text></Text>
            <Text>Date: <Text style={styles.bold}>{moment().format('DD MMM YYYY')}</Text></Text>
          </View>

          {/* ITEMS TABLE */}
          <View style={styles.tableHeader}>
            <Text style={styles.cell}>Item</Text>
            <Text style={styles.cell}>Qty</Text>
            <Text style={styles.cell}>Rate</Text>
            <Text style={styles.cell}>Total</Text>
          </View>

          {items?.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.cell}>{item.name}</Text>
              <Text style={styles.cell}>{item.quantity}</Text>
              <Text style={styles.cell}>{item.price}</Text>
              <Text style={styles.cell}>
                {Number(item.quantity) * Number(item.price)}
              </Text>
            </View>
          ))}

          {/* SUMMARY */}
          <View style={[styles.tableRow, { borderTopWidth: 1 }]}>
            <Text style={[styles.cell, { flex: 3 }]}>Items Total</Text>
            <Text style={styles.cell}>₹ {parseFloat(itemsAmount).toFixed(2)}</Text>
          </View>

          <View style={[styles.tableRow, { borderTopWidth: 1 }]}>
            <Text style={[styles.cell, { flex: 3 }]}>Taxable Amount</Text>
            <Text style={styles.cell}>₹ {parseFloat(taxableAmount).toFixed(2)}</Text>
          </View>

          <View style={[styles.tableRow, { borderTopWidth: 1 }]}>
            <Text style={[styles.cell, { flex: 3 }]}>Charges</Text>
            <Text style={styles.cell}>₹ {parseFloat(chargesAmount).toFixed(2)}</Text>
          </View>

          <View style={[styles.tableRow, { borderTopWidth: 1 }]}>
            <Text style={[styles.cell, { flex: 3, fontWeight: 'bold' }]}>TOTAL</Text>
            <Text style={[styles.cell, { fontWeight: 'bold' }]}>₹ {parseFloat(totalPrice).toFixed(2)}</Text>
          </View>
        </View>

        {/* ACTION SECTION */}
        <View style={styles.actionSection}>
          <RadioButton.Group onValueChange={setFormat} value={format}>
            <View style={styles.radioGroup}>
              <CustomRadioButton label="PDF" value="pdf" selected={format === 'pdf'} onPress={setFormat} />
              <CustomRadioButton label="Photo" value="photo" selected={format === 'photo'} onPress={setFormat} />
            </View>
          </RadioButton.Group>

          <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
            <Download size={18} color="#000" />
            <Text style={styles.downloadText}>Download</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 100 },
  quotationBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    elevation: 2,
  },
  heading: { textAlign: 'center', fontSize: 18, fontWeight: 'bold',textTransform:'capitalize' },
  address: { textAlign: 'center', fontSize: 12, marginTop: 4 },
  mobile: { textAlign: 'center', marginVertical: 6, fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingVertical: 6,
    marginTop: 16,
  },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  cell: { flex: 1, textAlign: 'center', fontSize: 12 },
  actionSection: { marginTop: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  radioGroup: { flexDirection: 'row' },
  downloadBtn: {
    flexDirection: 'row',
    backgroundColor: '#E6F4F1',
    padding: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
  },
  downloadText: { marginLeft: 8, fontWeight: 'bold' }
});
