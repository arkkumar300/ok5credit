// App.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Appbar, Divider, RadioButton } from 'react-native-paper';
import { ArrowLeft, Circle, DotSquare, Download, FileText, Square } from 'lucide-react-native';
import { captureRef } from 'react-native-view-shot';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CustomRadioButton from './components/CustomRadioButton';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import billPDF from './components/billPDF';
import ApiService from './components/ApiServices';
import ProgressButton from './components/ProgressButton';


export default function BillPreview() {
  const [format, setFormat] = useState('unpaid');
  const [userDetails, setUserDetails] = useState(null);
  const [supplierInfo, setCustomerInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const { items, totalAmount, bill, extraCharges, supplierData, transaction_for } = useLocalSearchParams();
  const parsedItems = items ? JSON.parse(items) : [];
  const parsedExtraCharges = extraCharges ? JSON.parse(extraCharges) : [];
  useEffect(() => {
    setCustomerInfo(JSON.parse(supplierData))

  }, [])
  // const saveBill = async () => {
  //   const pdfFile = await billPDF(userDetails, supplierInfo, bill, parsedItems, parsedExtraCharges, totalAmount);
  //   setLoading(true);
  //   setUploadProgress(0);
  //   setSuccess(false);
  //   try {
  //     const uploadData = new FormData();
  //     uploadData.append('file', {
  //       uri: pdfFile.uri,
  //       name: pdfFile.name,
  //       type: pdfFile.type
  //     });
  //     setUploadProgress(0.33); // 33% complete
  //     const response = await ApiService.post(`/upload`, uploadData, {
  //       headers: {
  //         'Content-Type': 'multipart/form-data',
  //       },
  //     });

  //     const uploadJson = await response.data;
  //     const uploadedPath = `https://aquaservices.esotericprojects.tech/uploads/${uploadJson.file_info.filename}`;
  //     handleSave(uploadedPath)
  //   } catch (error) {
  //     console.log("error ::", error)
  //   }
  // }

  const saveBill = async () => {
    setLoading(true);
    setSuccess(false);
    setUploadProgress(0);
  try {
      /** STEP 1 → Generate PDF */
      const pdfFile = await billPDF(
        userDetails, 
        supplierInfo, 
        bill, 
        parsedItems, 
        parsedExtraCharges, 
        totalAmount
      );
  
      if (!pdfFile) throw new Error("PDF generation failed");
  
      /** STEP 2 → Upload PDF */
      const uploadData = new FormData();
      uploadData.append("file", {
        uri: pdfFile.uri,
        name: pdfFile.name,
        type: pdfFile.type,
      });
  
      const uploadRes = await ApiService.post("/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadProgress(0.33); // 33% complete
  const uploadedPath = `https://aquaservices.esotericprojects.tech/uploads/${uploadRes.data.file_info.filename}`;
  
      /** STEP 3 → Save bill */
      const savedBill = await saveBillToServer(uploadedPath);
  
      /** STEP 4 → If bill paid, add transaction */
      if (savedBill.payment_status === "paid") {
        await addTransaction(savedBill);
      }
  
      /** 🎉 ALL SUCCESS */
      setSuccess(true);
      setLoading(false);
  
    } catch (error) {
      console.log("submit error:", error);
      Alert.alert("Error", error.message || "Something went wrong");
      setLoading(false);
      setSuccess(false);
    }
  };
  

  const saveBillToServer = async (uploadedPath) => {
    setUploadProgress(0.66); // 66% complete

    const billType = await AsyncStorage.getItem("billType");
  
    const payload = {
      userId: userDetails?.id,
      transaction_type: "you_gave",
      bill_type: billType,
      payment_status: format,
      transaction_for,
      items: parsedItems.map(it => ({
        name: it.itemName ?? it.name,
        quantity: Number(it.quantity),
        price: Number(it.price),
        cessAmount: Number(it.cessAmount),
        cessPercent: Number(it.cessPercent),
        gstAmount: Number(it.gstAmount),
        gstPercent: Number(it.gstPercent),
      })),
      ExtraCharges: parsedExtraCharges,
      bill_file: uploadedPath,
      amount: Number(totalAmount),
      bill_id: bill,
      description: `i have given ${totalAmount} to ${supplierInfo?.name} on ${moment().format('YYYY-MM-DD')}`,
      bill_date: moment().format("YYYY-MM-DD"),
      ...(transaction_for === "customer"
        ? { customer_id: supplierInfo?.id }
        : { supplier_id: supplierInfo?.id }),
    };
  
    const billResponse = await ApiService.post(`/bill`, payload);
  
    return billResponse.data.bill;
  };
  
  const addTransaction = async (billData) => {
    const date = moment().format("YYYY-MM-DD");
    const userData = await AsyncStorage.getItem("userData");
    const userId = JSON.parse(userData)?.id;
  
    const payload = {
      userId,
      transaction_type: "you_gave",
      transaction_for,
      amount: Number(totalAmount),
      description: "note",
      transaction_date: date,
      bill_id: billData.id,
      ...(transaction_for === "customer"
        ? { customer_id: supplierInfo?.id }
        : { supplier_id: supplierInfo?.id }),
    };
  
    const URL = transaction_for === "customer"
      ? `/transactions/customer`
      : `/transactions/supplier`;
  
    const response = await ApiService.post(URL, payload);
  
    const encodedCustomer = encodeURIComponent(JSON.stringify(supplierInfo));
  
    router.push({
      pathname: "/billDetails",
      params: {
        billId: billData.id,
        supplierInfo: encodedCustomer,
        bill,
        transaction_for
      }
    });
  
    return response.data;
  };
    

  useEffect(() => {
    const fetchBills = async () => {
      const userData = await AsyncStorage.getItem("userData");
      setUserDetails(JSON.parse(userData));
    }
    fetchBills();
  }, []);
  return (
    <SafeAreaView>
      <Appbar.Header style={{ backgroundColor: "#ffffff", borderBottomWidth: 2, borderColor: '#f2f7f6' }}>
        <ArrowLeft size={24} color={'#2E7D32'} style={{ marginStart: 10 }} onPress={() => router.back()} />
        <Appbar.Content title="Bill Preview" titleStyle={{ color: '#333333', fontWeight: 'bold', marginLeft: 20 }} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Quotation Section */}
        <View style={styles.quotationBox}>
          <Text style={styles.heading}>{userDetails?.name}</Text>
          {userDetails?.address && <Text style={styles.address}>
            {userDetails?.address}
          </Text>}
          <Text style={styles.mobile}>Mobile Number: {userDetails?.mobile}</Text>
          <Divider style={{ marginVertical: 5 }} />
          {
            supplierInfo && (
              <>
                <Text style={styles.heading}>{supplierInfo?.name}</Text>
                {supplierInfo?.address && <Text style={styles.address}>
                  {supplierInfo?.address}
                </Text>}
                <Text style={styles.mobile}>Mobile Number: {supplierInfo?.mobile}</Text>

              </>
            )
          }
          <Divider style={{ marginVertical: 5 }} />

          <View style={styles.row}>
            <Text style={styles.label}>BIll No.: <Text style={styles.bold}>{bill}</Text></Text>
            <Text style={styles.label}>Date: <Text style={styles.bold}>{moment().format('DD MMM YYYY')}</Text></Text>
          </View>

          <View style={styles.tableHeader}>
            <Text style={styles.cell}>Item Name</Text>
            <Text style={styles.cell}>Qty</Text>
            <Text style={styles.cell}>MRP(₹)</Text>
            <Text style={styles.cell}>Net Rate(₹)</Text>
            <Text style={styles.cell}>Total(₹)</Text>
          </View>
          {parsedItems?.map((item, index) => {
            return (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.cell}>{item?.itemName}</Text>
                <Text style={styles.cell}>{item?.quantity}</Text>
                <Text style={styles.cell}>{item?.price}</Text>
                <Text style={styles.cell}>{Number(item?.quantity) * Number(item?.price)}</Text>
                <Text style={styles.cell}>{Number(item?.quantity) * Number(item?.price)}</Text>
              </View>)
          })}
          <Text style={{ fontSize: 12, fontWeight: 'bold', marginVertical: 5 }}>Charges/Discounts</Text>
          {parsedExtraCharges?.map((item, index) => {
            return (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.cell}>{item?.type}</Text>
                <Text style={styles.cell}>{item?.name}</Text>
                <Text style={styles.cell}>{item?.discountType === "amount" ? " ₹ " : " % "}  </Text>
                <Text style={styles.cell}> {item?.enteredValue}</Text>
                <Text style={styles.cell}>{item?.type === "charge" ? " + " : " - "} {parseFloat(item?.finalAmount).toFixed(2)}</Text>
              </View>)
          })}
          <View style={[styles.tableRow, { borderTopWidth: 1, marginVertical: 10 }]}>
            <Text style={[styles.cell, { flex: 4, fontWeight: 'bold' }]}>TOTAL</Text>
            <Text style={[styles.cell, { fontWeight: 'bold' }]}>₹ {parseFloat(totalAmount).toFixed(2)}</Text>
          </View>
        </View>

        {/* Options */}
        <View style={styles.actionSection}>

          {/* Radio Group */}
          <RadioButton.Group onValueChange={value => setFormat(value)} value={format}>
            <View style={styles.radioGroup}>
              <CustomRadioButton
                label="Paid"
                value="paid"
                selected={format === 'paid'}
                onPress={setFormat}
              />
              <CustomRadioButton
                label="Unpaid"
                value="unpaid"
                selected={format === 'unpaid'}
                onPress={setFormat}
              />
            </View>
          </RadioButton.Group>
        </View>
        <ProgressButton
          title="Submit"
          loading={loading}
          progress={uploadProgress}   // 0 → 1
          success={success}
          onPress={saveBill}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 100,
  },
  quotationBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    elevation: 2,
  },
  heading: {
    textAlign: 'center',
    fontSize: 18, textTransform: 'capitalize',
    fontWeight: 'bold',
  },
  address: {
    textAlign: 'center',
    marginTop: 4, textTransform: 'capitalize',
    fontSize: 16,
    color: '#555',
  },
  mobile: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  bold: {
    fontWeight: 'bold',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    borderBottomWidth: 1,
    paddingBottom: 6,
    borderTopWidth: 1,
    paddingTop: 6,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  cell: {
    flex: 1,
    fontSize: 12,
    textAlign: 'center',
  },
  actionSection: {
    marginTop: 30, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between'
  },
  convertBtn: {
    flexDirection: 'row',
    backgroundColor: '#0A8F73',
    padding: 12,
    borderRadius: 30,
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  convertText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  radioGroup: {
    padding: 10, flexDirection: 'row',
    gap: 12, justifyContent: 'space-between'
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    marginLeft: 8,
    fontSize: 16,
  },
  downloadBtn: {
    flexDirection: 'row', elevation: 5, shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    backgroundColor: '#E6F4F1', justifyContent: 'center',
    paddingVertical: 20, shadowRadius: 10,
    paddingHorizontal: 20, shadowColor: '#0A8F73',
    borderRadius: 30, marginBottom: 20,
    alignItems: 'center',
  },
  downloadText: {
    marginLeft: 8,
    color: '#000',
    fontWeight: 'bold',
  },
});
