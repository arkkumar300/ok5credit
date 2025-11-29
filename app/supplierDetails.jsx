import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  PhoneCall,
  MessageSquare,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  CheckIcon,
  File,
  ChevronRight,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Appbar, Divider } from 'react-native-paper';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';

const transactions = [
  {
    id: '1',
    type: 'received',
    amount: 100,
    time: '02:34 PM',
    file: false,
    description: 'Capita amounts',
    note: '₹100 Advance',
  },
  {
    id: '2',
    type: 'given',
    amount: 1000,
    time: '02:44 PM',
    file: true,
    description: '',
    note: '₹900 Due',
  },
];

export default function SupplierDetails() {
  const router = useRouter();
  const { personName, personType, personId } = useLocalSearchParams();
  const [supplier, setSupplier] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
var rrr=0
  useEffect(() => {
    const fetchSupplier = async () => {
      const userData = await AsyncStorage.getItem("userData");
      const userId = JSON.parse(userData).id;
      try {
        const response = await ApiService.post(`/supplier/${personId}`, { userId });
        const data = response.data;
        setSupplier(data.supplier);
        setTransactions(data.transactions);
      } catch (err) {
        console.error(err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchSupplier();
  }, []);

  const renderItem = ({ item }) => {
    const isReceived = item.transaction_type === 'you_got';
    let aaa='';
    if (isReceived) {
      rrr=Number(rrr)+Number(item.amount)

    } else {
      rrr=Number(rrr)-Number(item.amount)
    }

    if (rrr<0) {
      aaa= `${Math.abs(rrr)} Advance`
    } else {
      aaa= `${rrr} Due`
    }

    return (
      <TouchableOpacity
        style={[
          styles.transactionWrapper,
          isReceived ? styles.leftContainer : styles.rightContainer,
        ]} onPress={() => router.push({
          pathname: '/transactionDetails',params:{transactionDetails:JSON.stringify(item),Name:personName}
        })}
      >
        <View style={{}}>

        <View style={styles.transactionBox} >
          <View style={styles.amountRow}>
            {isReceived ? (
              <ArrowDown size={24} color="green" />
            ) : (
              <ArrowUp size={24} color="red" />
            )}
            <Text style={styles.amountText}> ₹{item.amount}</Text>
            <Text style={styles.timeText}> {moment(item.transaction_date).format('DD/MM/YYYY')}</Text>
            <CheckIcon size={24} color="green" style={{ marginHorizontal: 5 }} />

          </View>
          {item.bill_id &&
            <>
              <Divider style={{ marginVertical: 5 }} />
              <TouchableOpacity style={[styles.amountRow, { marginVertical: 5, justifyContent: 'space-between' }]} onPress={() => router.push('./billDetails')}>
                <File size={24} color="green" />
                <Text style={styles.amountText}>{item.bill_id} ₹ {item.amount}</Text>
                <ChevronRight size={24} color="green" />
              </TouchableOpacity>
            </>}
          {item.transaction_pic &&
            <>
              <Divider style={{ marginVertical: 5 }} />
              <TouchableOpacity style={[styles.amountRow, { marginVertical: 5, justifyContent: 'space-between' }]} 
              onPress={() => router.push({
                pathname: '/transactionDetails', params: { transactionDetails: JSON.stringify(item), Name: personName }
              })}>
                <Image
                  source={{ uri: item.transaction_pic }}
                  resizeMode="center"
                  style={{ width: 100, height: 100 }}
                />
                <Text style={styles.amountText}>{item.bill_id} ₹ {item.amount}</Text>
                <ChevronRight size={24} color="green" />
              </TouchableOpacity>
            </>}
        </View>
        <Text style={styles.noteText}>{aaa}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      <Appbar.Header style={{ backgroundColor: "#ffffff", borderBottomWidth: 2, justifyContent: 'space-between', borderColor: '#f2f7f6' }}>
        <ArrowLeft size={24} color={'#2E7D32'} style={{ marginStart: 10 }} onPress={() => router.push('./dashboard')} />
        <Appbar.Content title={personName} titleStyle={{ color: '#333333', fontSize: 18, fontWeight: 'bold', marginStart: 10 }} />
        <Appbar.Content title="Supplier Profile"  titleStyle={{ color: '#388E3C', fontSize: 13, alignSelf: 'flex-end',marginRight:30 }} onPress={() => router.push({pathname:'/customerProfile',params:{ID:personId,profileType:'supplier'}})} />
      </Appbar.Header>

      {/* Transaction List */}
      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 180, paddingTop: 30, paddingHorizontal: 10 }}
      />

      {/* Bottom Material Block */}
      <View style={styles.bottomContainer}>
        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton}>
            <PhoneCall size={24} color="#555" />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/customerLedger')
          }>
            <MessageSquare size={24} color="#555" />
            <Text style={styles.actionText}>Ledgers</Text>
          </TouchableOpacity>
        </View>

        {/* Balance Row */}
        <View style={[styles.balanceRow]}>
          <Text style={[styles.balanceLabel,{fontSize:16,fontWeight:'bold'}]}>Balance Due</Text>
          <Text style={[styles.balanceAmount,{color:supplier?.current_balance>0 ? '#388E3C' : "#d32f2f"}]}>₹ {Math.abs(supplier?.current_balance || 0)} {Number(supplier?.current_balance)>0 ? 'Advance' : "Due"}</Text>
        </View>

        {/* Received and Given Buttons */}
        <View style={styles.bottomButtonsRow}>
          <TouchableOpacity style={styles.receivedButton} onPress={() => {
            router.push({
              pathname: '/transaction',params:{transactionType:"you_got",transaction_for:"supplier",id:personId,personName:personName}
            })
          }}>
            <Text style={styles.receivedText}>↓ Received</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.givenButton} onPress={() => {
            router.push({
              pathname: '/transaction',params:{transactionType:"you_gave",transaction_for:"supplier",id:personId,personName:personName}
            })
          }}>
            <Text style={styles.givenText}>↑ Given</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 24,
  },
  header: {
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#222',
  },
  date: {
    fontSize: 14,
    color: 'gray',
    marginTop: 4,
  },
  transactionWrapper: {
    marginVertical: 8,
    flexDirection: 'row',
  },
  leftContainer: {
    justifyContent: 'flex-start',
  },
  rightContainer: {
    justifyContent: 'flex-end',
  },
  transactionBox: {
    maxWidth: '100%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#fff',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  amountText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  timeText: {
    fontSize: 16,
    color: 'gray',
  },
  descriptionText: {
    fontSize: 14,
    marginTop: 2,
    color: '#444',
  },
  noteText: {
    fontSize: 13,
    color: 'gray',
  },

  /*** Bottom Block ***/
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    width: '100%',
    backgroundColor: '#f2f7f6',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingVertical: 16, borderWidth: 2,
    paddingHorizontal: 20, borderColor: '#E8F5E9',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionText: {
    marginTop: 6,
    fontSize: 13,
    color: '#444',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#777',
    marginRight: 6,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receivedButton: {
    backgroundColor: '#E8F5E9',
    borderColor: '#388E3C',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 26,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  givenButton: {
    backgroundColor: '#FFEBEE',
    borderColor: '#D32F2F',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 26,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  receivedText: {
    color: '#388E3C',
    fontWeight: '600',
    fontSize: 14,
  },
  givenText: {
    color: '#D32F2F',
    fontWeight: '600',
    fontSize: 14,
  },
});
