import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Alert } from 'react-native';
import { ArrowLeft, User, ArrowUp, Delete, AlertTriangle, IndianRupee, Info } from 'lucide-react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';
import { Appbar, ActivityIndicator, Card } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

export default function DeleteCustomer() {
  const router = useRouter();
  const { transaction_for, id } = useLocalSearchParams();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete ${customer?.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const userData = await AsyncStorage.getItem('userData');
              if (!userData) return;

              const userId = JSON.parse(userData).id;
              const URL = transaction_for === 'customer' ? '/customers' : '/supplier';

              const response = await ApiService.put(
                `${URL}/delete/${id}`,
                { userId },
                {
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );

              if (response) {
                Alert.alert(
                  'Success',
                  `${transaction_for === 'customer' ? 'Customer' : 'Supplier'} deleted successfully`,
                  [{ text: 'OK', onPress: () => router.push("./dashboard") }]
                );
              }
            } catch (error) {
              console.error("API error:", error);
              Alert.alert('Error', 'Failed to delete. Please try again.');
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  if (loading || !customer) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0A4D3C" />
        <Text style={styles.loadingText}>Loading details...</Text>
      </View>
    );
  }


  const balance = Number(customer.current_balance) || 0;
  const isAdvance = balance > 0;
  const canDelete = balance === 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4D3C" />

      {/* Premium Header with Gradient */}
      <LinearGradient
        colors={['#0A4D3C', '#1B6B50']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>
              Delete {transaction_for === 'customer' ? 'Customer' : 'Supplier'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {canDelete ? 'Ready to delete' : 'Clear balance first'}
            </Text>
          </View>

          <View style={styles.headerRightPlaceholder} />
        </View>
      </LinearGradient>

      {/* Warning Banner */}
      {!canDelete && (
        <View style={styles.warningBanner}>
          <AlertTriangle size={20} color="#F97316" />
          <Text style={styles.warningText}>
            Balance must be zero to delete
          </Text>
        </View>
      )}

      {/* Customer Info Card */}
      <Card style={styles.customerCard}>
        <View style={styles.customerHeader}>
          <View style={styles.avatarContainer}>
            <User size={32} color="#0A4D3C" />
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{customer.name}</Text>
            <Text style={styles.customerMobile}>{customer.mobile}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <View style={styles.balanceRow}>
            <IndianRupee size={20} color={isAdvance ? '#0A4D3C' : '#EF4444'} />
            <Text style={[
              styles.balanceAmount,
              { color: isAdvance ? '#0A4D3C' : '#EF4444' }
            ]}>
              {Math.abs(balance).toFixed(2)}
            </Text>
            <View style={[
              styles.balanceBadge,
              { backgroundColor: isAdvance ? '#E8F5E9' : '#FEE2E2' }
            ]}>
              <Text style={[
                styles.balanceBadgeText,
                { color: isAdvance ? '#0A4D3C' : '#EF4444' }
              ]}>
                {isAdvance ? 'Advance' : 'Due'}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Action Button */}
      {!canDelete ? (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            router.push({
              pathname: '/transaction',
              params: {
                transactionType: isAdvance ? 'you_gave' : 'you_got',
                transaction_for,
                id: id,
                mobile: customer.mobile,
                personName: customer.name,
                userAmountStatus: `₹ ${Math.abs(balance)} ${isAdvance ? 'Advance' : 'Due'}`,
                transactionAmount: Math.abs(balance)
              },
            });
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#0A4D3C', '#1B6B50']}
            style={styles.buttonGradient}
          >
            <ArrowUp size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>
              Add {isAdvance ? 'Credit' : 'Payment'} of ₹{Math.abs(balance)}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleDelete}
          disabled={deleting}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#DC2626', '#B91C1C']}
            style={styles.buttonGradient}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Delete size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>
                  Delete {customer.name}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Info Note */}
      <View style={styles.infoContainer}>
        <Info size={16} color="#64748B" />
        <Text style={styles.infoText}>
          {canDelete
            ? "This action is permanent and cannot be undone."
            : "Please settle the balance before deleting this customer."}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'capitalize',
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerRightPlaceholder: {
    width: 40,
    height: 40,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#F97316',
    fontWeight: '500',
  },
  customerCard: {
    margin: 16,
    borderRadius: 16,
    elevation: 3,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A4D3C',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  customerMobile: {
    fontSize: 14,
    color: '#64748B',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 20,
  },
  balanceContainer: {
    padding: 20,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '800',
  },
  balanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  balanceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionButton: {
    marginHorizontal: 16,
    marginTop: 8,
    height: 54,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
});