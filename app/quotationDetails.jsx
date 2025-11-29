// App.js
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Appbar, RadioButton, Divider } from 'react-native-paper';
import { ArrowLeft, Download, FileText } from 'lucide-react-native';
import { captureRef } from 'react-native-view-shot';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CustomRadioButton from './components/CustomRadioButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';
import billPDF from './components/billPDF';
import moment from 'moment';

export default function QuotationDetails() {
  const [format, setFormat] = useState('pdf');
  const [billDetails, setbillDetails] = useState(null);
  const [loading, setLoading] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [items, setItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const quoteRef = useRef();
  const router = useRouter();
  const { billId, customerInfo, bill } = useLocalSearchParams()
  useEffect(() => {
    if (customerInfo) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(customerInfo));
        setCustomerData(parsedData);
        console.log("Parsed customer info:", parsedData.mobile);
      } catch (error) {
        console.error("Failed to parse customerInfo:", error);
      }
    }
  }, [customerInfo]);
  const handleDownload = async () => {
    try {
      if (format === 'pdf') {
        const htmlContent = await billPDF(userDetails, customerInfo, bill, items, totalPrice);; // get html string
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri);
      } else {
        const uri = await captureRef(quoteRef, {
          format: 'png',
          quality: 1,
        });
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  useEffect(() => {
    const fetchBills = async () => {
      const userData = await AsyncStorage.getItem("userData");
      setUserDetails(JSON.parse(userData));
      try {
        setLoading(true);
        const response = await ApiService.post(`/bill/${billId}`,);
        const result = response.data;
        setbillDetails(result)
        setItems(result?.items)
        const totalAmount = result?.items.reduce(
          (sum, c) => sum + (parseFloat(c.price || 0) * parseFloat(c.quantity || 0)),
          0
        );
        setTotalPrice(totalAmount);
      } catch (error) {
        console.error('Error fetching bills:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  return (
    <SafeAreaView>
      <Appbar.Header style={{ backgroundColor: "#ffffff", borderBottomWidth: 2, borderColor: '#f2f7f6' }}>
        <ArrowLeft size={24} color={'#2E7D32'} style={{ marginStart: 10 }} onPress={() => {
          router.push({ pathname: './bills' })
          // router.back()
        }}
        />
        <Appbar.Content title={billDetails?.bill_id} titleStyle={{ color: '#333333', fontWeight: 'bold', marginLeft: 20 }} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Quotation Section */}
        <View style={styles.quotationBox} ref={quoteRef}>
          <Text style={styles.heading}>{userDetails?.name}</Text>
          {userDetails?.address && <Text style={styles.address}>
            {userDetails?.address}
          </Text>}
          <Text style={styles.mobile}>Mobile Number: {userDetails?.mobile}</Text>
          <Divider style={{ marginVertical: 5 }} />
          {
            customerInfo && (
              <>
                <Text style={styles.heading}>{customerData?.name}</Text>
                {customerData?.address && <Text style={styles.address}>
                  {customerData?.address}
                </Text>}
                <Text style={styles.mobile}>Mobile Number: {customerData?.mobile}</Text>

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

          {items?.map((item, index) => {
            return (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.cell}>{item?.name}</Text>
                <Text style={styles.cell}>{item?.quantity}</Text>
                <Text style={styles.cell}>{item?.price}</Text>
                <Text style={styles.cell}>{Number(item?.quantity || 0) * Number(item?.price || 0)}</Text>
                <Text style={styles.cell}>{Number(item?.quantity || 0) * Number(item?.price || 0)}</Text>
              </View>)
          })}
          <View style={[styles.tableRow, { borderTopWidth: 1 }]}>
            <Text style={[styles.cell, { flex: 4, fontWeight: 'bold' }]}>TOTAL</Text>
            <Text style={[styles.cell, { fontWeight: 'bold' }]}>₹ {totalPrice}</Text>
          </View>
        </View>

        {/* Options */}
        <View style={styles.actionSection}>

          {/* Radio Group */}
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
    fontSize: 18, textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  address: {
    textAlign: 'center',
    marginTop: 4,
    fontSize: 12,
    color: '#555',
  },
  mobile: {
    textAlign: 'center',
    marginVertical: 8,
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
    flexDirection: 'row',
    marginBottom: 20,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  downloadBtn: {
    flexDirection: 'row',
    backgroundColor: '#E6F4F1',
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
