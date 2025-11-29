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


export default function QuotePreview() {
  const [userDetails, setUserDetails] = useState(null);
  const [customerInfo, setCustomerInfo] = useState(null);
  const router = useRouter();
  const { items, totalAmount, bill, customerData } = useLocalSearchParams();
  const parsedItems = items ? JSON.parse(items) : [];

  useEffect(() => {
    setCustomerInfo(JSON.parse(customerData))

  }, [])
  const saveBill = async () => {
    const pdfFile = await billPDF(userDetails, customerInfo, bill, parsedItems, totalAmount);
    try {

      const uploadData = new FormData();
      uploadData.append('file', {
        uri: pdfFile.uri,
        name: pdfFile.name,
        type: pdfFile.type
      });
      console.log("uploadData ::", uploadData)
      const response = await ApiService.post(`/upload`, uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadJson = await response.data;
      const uploadedPath = `http://localhost:3000/uploads/${uploadJson.file_info.filename}`;
      handleSave(uploadedPath)
    } catch (error) {
      console.log("error ::", error)
    }
  }

  const handleSave = async (uploadedPath) => {
    console.log("uploadedPath :", uploadedPath)
    try {

      // 2. upload PDF
      if (!uploadedPath) {
        console.log("no pdf path")
        return;
      }
      const billType = await AsyncStorage.getItem("billType");
      // 3. Call bill API
      const payload = {
        userId: userDetails?.id,
        customer_id: customerInfo?.id, // or wherever you get this in your screen
        transaction_type: "you_gave",
        bill_type: billType,
        transaction_for: "customer",
        items: parsedItems.map(it => ({
          name: it.itemName ?? it.name,
          quantity: Number(it.quantity),
          price: Number(it.price)
        })),
        bill_file: uploadedPath,
        amount: Number(totalAmount),
        bill_id: bill,
        description: "Purchase of goods",
        bill_date: moment().format('YYYY-MM-DD')
      };
      const encodedCustomerData = encodeURIComponent(JSON.stringify(customerInfo)); 
     const response= await ApiService.post(`/bill`, payload);
     const billData=response.data.bill
console.log("rrr:",billData)
      router.push({
        pathname: '/quotationDetails',
        params: {
          billId: billData?.id,
          customerInfo: encodedCustomerData,
          bill: bill
        }
      });
    } catch (error) {
      console.error("handleSave error", error);
      ToastAndroid.show("An unexpected error occurred", ToastAndroid.LONG);
    }
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
        <Appbar.Content title="Quote Preview" titleStyle={{ color: '#333333', fontWeight: 'bold', marginLeft: 20 }} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Quotation Section */}
        <View style={{position:'absolute',backgroundColor:'#33333310',zIndex:99,width:"100%",height:'100%',alignSelf:'center'}}>
        <Text style={{fontSize:50,direction:'ltr',justifyContent:'center',color:'#aaaaaa70',textAlign:'center',fontWeight:'bold'}}>Quotation</Text>
      </View>

        <View style={styles.quotationBox}>
          <Text style={styles.heading}>{userDetails?.name}</Text>
          {userDetails?.address && <Text style={styles.address}>
            {userDetails?.address}
          </Text>}
          <Text style={styles.mobile}>Mobile Number: {userDetails?.mobile}</Text>
          <Divider style={{ marginVertical: 5 }} />
          {
            customerInfo && (
              <>
                <Text style={styles.heading}>{customerInfo?.name}</Text>
                {customerInfo?.address && <Text style={styles.address}>
                  {customerInfo?.address}
                </Text>}
                <Text style={styles.mobile}>Mobile Number: {customerInfo?.mobile}</Text>

              </>
            )
          }
          <Divider style={{ marginVertical: 5 }} />

          <View style={styles.row}>
            <Text style={styles.label}>Quotation No.: <Text style={styles.bold}>{bill}</Text></Text>
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
                <Text style={styles.cell}>{item?.name}</Text>
                <Text style={styles.cell}>{item?.quantity}</Text>
                <Text style={styles.cell}>{item?.price}</Text>
                <Text style={styles.cell}>{Number(item?.quantity) * Number(item?.price)}</Text>
                <Text style={styles.cell}>{Number(item?.quantity) * Number(item?.price)}</Text>
              </View>)
          })}
          <View style={[styles.tableRow, { borderTopWidth: 1 }]}>
            <Text style={[styles.cell, { flex: 4, fontWeight: 'bold' }]}>TOTAL</Text>
            <Text style={[styles.cell, { fontWeight: 'bold' }]}>₹ {totalAmount}</Text>
          </View>
        </View>

        {/* Options */}
        <View style={styles.actionSection}>

          {/* Radio Group */}
        </View>
      </ScrollView>
        <TouchableOpacity style={styles.downloadBtn} onPress={saveBill}>
          <Download size={18} color="#000" />
          <Text style={styles.downloadText}>Save</Text>
        </TouchableOpacity>
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
  label: {
    fontSize: 13,
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
    shadowRadius: 4,width:"50%",alignSelf:'center',
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
