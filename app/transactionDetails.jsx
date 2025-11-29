// components/BillSummaryScreen.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet,SafeAreaView, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Calendar, Check, MessageSquare, FileText, HelpCircle, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as SMS from 'expo-sms';
import { Linking, Alert } from 'react-native';
import { Appbar, Avatar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import moment from 'moment';


export default function TransactionDetails() {
  const navigation = useNavigation();
  const router = useRouter();
  const { transactionDetails, Name } = useLocalSearchParams();
  const [transaction, setTransaction] = useState(null)
  const handleSendSMS = async () => {
    try {
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        const { result } = await SMS.sendSMSAsync(
          ['+919494130830'],
          'Bill Number: BILL-2\nAmount: ₹10,000\nBilled On: 28 Aug 2025'
        );
        console.log('SMS Result:', result);
      } else {
        Alert.alert('SMS not supported on this device.');
      }
    } catch (error) {
      console.error('SMS sending failed:', error);
      Alert.alert('Failed to send SMS');
    }
  };

  const formateDate = (date) => {
    const formattedDate = date
      ? moment(date).format('DD MMM YYYY')
      : '';
    return formattedDate
  }

  useEffect(() => {
    setTransaction(JSON.parse(transactionDetails))
  }, [])

  const handleWhatsApp = () => {
    const message = encodeURIComponent('Bill Number: BILL-2\nAmount: ₹10,000\nBilled On: 28 Aug 2025');
    const phoneNumber = '9194949130830'; // No '+' for WhatsApp deep link
    const url = `whatsapp://send?phone=${phoneNumber}&text=${message}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('WhatsApp not installed');
        }
      })
      .catch((err) => {
        console.error('An error occurred', err);
        Alert.alert('Failed to open WhatsApp');
      });
  };


  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Appbar.Header style={[styles.header, { borderColor: '#f3f3f3', borderBottomWidth: 3 }]}>
        <ArrowLeft size={24} onPress={() => navigation.goBack()} style={{ marginHorizontal: 10 }} />
        <View style={styles.userInfo}>
          <Avatar.Text size={30} label={Name?.charAt(0).toUpperCase()} style={{ marginLeft: 10 }} />
          <Text style={[styles.userName, { marginLeft: 10, textTransform: 'capitalize' }]}>{Name}</Text>
        </View>
        <HelpCircle color="#555" size={24} />
      </Appbar.Header >

      {/* Amount */}
      <View style={styles.amountContainer}>
        <Text style={styles.amount}>₹ {transaction?.amount || 0}</Text>
      </View>

      {/* Bill Details */}
      <ScrollView style={styles.detailsContainer}>
        <View style={styles.row}>
          <FileText size={18} color="#555" />
          <Text style={styles.rowText}>Bill Number:{transaction?.bill_id || "N/A"}</Text>
        </View>

        <View style={styles.row}>
          <Check size={18} color="#4CAF50" />
          <Text style={styles.rowText}>Sync Successful</Text>
        </View>

        {/* <View style={styles.row}>
          <MessageSquare size={18} color="#4CAF50" />
          <Text style={styles.rowText}>SMS Delivered</Text>
        </View> */}

        <View style={styles.row}>
          <Calendar size={18} color="#555" />
          <Text style={styles.rowText}>Added On {formateDate(transaction?.transaction_date)}</Text>
        </View>

        <View style={styles.row}>
          <Calendar size={18} color="#555" />
          <Text style={styles.rowText}>Billed On {formateDate(transaction?.transaction_date)}</Text>
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.smsButton} onPress={() => handleSendSMS}>
          <Text style={styles.buttonText}>SMS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.whatsappButton} onPress={() => handleWhatsApp}>
          <Text style={styles.buttonText}>WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backArrow: {
    fontSize: 20,
    paddingRight: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  amountContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  currency: {
    fontSize: 24,
    color: '#000',
  },
  amount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#000',
  },
  detailsContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  rowText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopColor: '#eee',
    borderTopWidth: 1,
  },
  smsButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  buttonText: {
    color: '#000',
    fontWeight: '600',
  },
});
