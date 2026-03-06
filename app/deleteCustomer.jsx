import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft, User, ArrowUp, Delete } from 'lucide-react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';
import { Appbar } from 'react-native-paper';

export default function DeleteCustomer() {
  const router = useRouter();
  const { transaction_for, id } = useLocalSearchParams();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCustomer = useCallback(async () => {
    try {
      const userDetails = await AsyncStorage.getItem("userData");
  
      if (!userDetails) {
        Alert.alert("Error", "User data not found");
        return;
      }
  
      const userData = JSON.parse(userDetails);
  
      const userId = userData?.id;
      const ownerId = userData?.owner_user_id;
      const URL = transaction_for === 'customer' ? '/customers' : '/supplier'
      const response = await ApiService.post(`${URL}/${id}`, { userId,ownerId });
      if (transaction_for === 'customer') {
        setCustomer(response.data.customer);
      } else {
        setCustomer(response.data.supplier);
      }
    } catch (err) {
      console.error('Error fetching customer:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchCustomer();
    }, [fetchCustomer])
  );

  if (loading || !customer) return null;

  const balance = Number(customer.current_balance) || 0;
  const isAdvance = balance > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <Appbar.Header style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delete Customer</Text>
        <View style={{ width: 24 }} />
      </Appbar.Header>

      {/* Customer Info */}
      <View style={styles.customerRow}>
        <View style={styles.customerLeft}>
          <User size={22} color="#333" />
          <Text style={styles.customerName}>{customer.name}</Text>
        </View>

        <View style={styles.amountRight}>
          <Text
            style={[
              styles.amount,
              { color: isAdvance ? '#1B873F' : '#D32F2F' },
            ]}
          >
            ₹{Math.abs(balance)}
          </Text>
          <Text style={styles.amountLabel}>
            {isAdvance ? 'Advance' : 'Due'}
          </Text>
        </View>
      </View>

      {/* Add Credit Button (only if balance != 0) */}
      {balance !== 0 ? (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            console.log("rrr:::", {
              transactionType: isAdvance ? 'you_gave' : 'you_got',
              transaction_for,
              id: id,
              mobile: customer.name,
              personName: customer.mobile,
              userAmountStatus: `₹ ${Math.abs(customer?.current_balance || 0)} ${Number(customer?.current_balance) > 0 ? 'Advance' : 'Due'}`,
              transactionAmount: Math.abs(Number(balance))
            })
            router.push({
              pathname: '/transaction',
              params: {
                transactionType: isAdvance ? 'you_gave' : 'you_got',
                transaction_for,
                id: id,
                mobile: customer.name,
                personName: customer.mobile,
                userAmountStatus: `₹ ${Math.abs(customer?.current_balance || 0)} ${Number(customer?.current_balance) > 0 ? 'Advance' : 'Due'}`,
                transactionAmount: Math.abs(Number(balance))
              },
            })
          }
          }
        >
          <ArrowUp size={20} color="#fff" />
          <Text style={styles.addButtonText}>
            Add {isAdvance ? 'Credit' : 'Payment'}, of ₹{Math.abs(balance)}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.addButton}
          onPress={async () => {
            const userData = await AsyncStorage.getItem('userData');
            if (!userData) return;

            const userId = JSON.parse(userData).id;
            const URL = transaction_for === 'customer' ? '/customers' : '/supplier'

            try {
              const response = await ApiService.put(
                `${URL}/delete/${id}`, {
                userId
              },
                {
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );

              if (response) {
                console.log(response.message); // "Customer deleted successfully"
                router.push("./dashboard")
                // You can show a toast / alert / navigate back here
              } else {
                console.error("Delete failed:", data);
              }
            } catch (error) {
              console.error("API error:", error);
            }
          }}
        >
          <Delete size={20} color="#fff" />
          <Text style={[styles.addButtonText, { textTransform: "capitalize" }]}>
            Delete {customer.name} {transaction_for}
          </Text>
        </TouchableOpacity>

      )}

      {/* Info Text */}
      <Text style={styles.infoText}>
        Please make customer balance 0 to delete
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },

  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },

  customerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  customerName: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },

  amountRight: {
    alignItems: 'flex-end',
  },

  amount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B873F',
  },

  amountLabel: {
    fontSize: 13,
    color: '#777',
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B873F',
    paddingVertical: 14,
    borderRadius: 28,
    gap: 8,
    marginTop: 10,
  },

  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  infoText: {
    marginTop: 20,
    fontSize: 14,
    color: '#555',
  },
});
