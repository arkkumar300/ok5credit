import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Users, Search, Filter, TrendingUp, Settings, X } from 'lucide-react-native';

// Mock data storage
let transactionData = {
  customers: [
    { id: 1, name: 'madhu', amount: 111, type: 'Advance', date: 'Today', initial: 'M', color: '#FFC107' },
    { id: 2, name: 'ravi', amount: 10, type: 'Due', date: 'Yesterday', initial: 'R', color: '#FF5722' },
    { id: 3, name: 'suresh kumar', amount: 1, type: 'Due', date: '15 Jul, 2025', initial: 'S', color: '#2196F3' },
  ],
  suppliers: [
    { id: 1, name: 'Wholesale Mart', amount: 500, type: 'Due', date: 'Today', initial: 'W', color: '#9C27B0' },
    { id: 2, name: 'Supply Co', amount: 250, type: 'Advance', date: 'Yesterday', initial: 'S', color: '#FF9800' },
  ]
};

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState('Customer');
  const [customers, setCustomers] = useState(transactionData.customers);
  const [suppliers, setSuppliers] = useState(transactionData.suppliers);
  const router = useRouter();

  const currentData = activeTab === 'Customer' ? customers : suppliers;

  const handleAddCustomer = () => {
    router.push('/add-customer');
  };

  const handleAddSupplier = () => {
    router.push('/add-supplier');
  };

  const handlePersonClick = (person) => {
    router.push({
      pathname: '/transaction',
      params: {
        personName: person.name,
        personType: activeTab.toLowerCase(),
        personId: person.id
      }
    });
  };

  const handleMyPlanPress = () => {
    router.push('/my-plan');
  };

  const handleMorePress = () => {
    router.push('/more');
  };

  // Function to add new transaction (called from transaction success)
  const addTransaction = (personName, personType, amount, transactionType) => {
    const newTransaction = {
      id: Date.now(),
      name: personName,
      amount: parseInt(amount),
      type: transactionType === 'received' ? 'Advance' : 'Due',
      date: 'Today',
      initial: personName.charAt(0).toUpperCase(),
      color: '#4CAF50'
    };

    if (personType === 'customer') {
      const existingCustomer = customers.find(c => c.name.toLowerCase() === personName.toLowerCase());
      if (existingCustomer) {
        // Update existing customer
        setCustomers(prev => prev.map(c => 
          c.id === existingCustomer.id 
            ? { ...c, amount: newTransaction.amount, type: newTransaction.type, date: 'Today' }
            : c
        ));
      } else {
        // Add new customer
        setCustomers(prev => [...prev, newTransaction]);
      }
    } else {
      const existingSupplier = suppliers.find(s => s.name.toLowerCase() === personName.toLowerCase());
      if (existingSupplier) {
        // Update existing supplier
        setSuppliers(prev => prev.map(s => 
          s.id === existingSupplier.id 
            ? { ...s, amount: newTransaction.amount, type: newTransaction.type, date: 'Today' }
            : s
        ));
      } else {
        // Add new supplier
        setSuppliers(prev => [...prev, newTransaction]);
      }
    }
  };

  // Listen for new transactions (in a real app, this would be through state management)
  useEffect(() => {
    const handleTransactionUpdate = () => {
      // This would be called when returning from transaction success
      // For now, we'll just refresh the data
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>OK Credit</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.verifyBanner}>
        <View style={styles.verifyIcon}>
          <Text style={styles.verifyIconText}>✓</Text>
        </View>
        <Text style={styles.verifyText}>Verify Your Business</Text>
        <TouchableOpacity>
          <Text style={styles.verifyArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Customer' && styles.activeTab]}
          onPress={() => setActiveTab('Customer')}
        >
          <Text style={[styles.tabText, activeTab === 'Customer' && styles.activeTabText]}>
            Customer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Supplier' && styles.activeTab]}
          onPress={() => setActiveTab('Supplier')}
        >
          <Text style={[styles.tabText, activeTab === 'Supplier' && styles.activeTabText]}>
            Supplier
          </Text>
        </TouchableOpacity>
        <View style={styles.tabActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Filter size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Search size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Net Balance</Text>
        <Text style={styles.balanceAmount}>₹100</Text>
        <Text style={styles.balanceSubtext}>{currentData.length} Accounts</Text>
        <Text style={styles.balanceType}>You Pay</Text>
      </View>

      <ScrollView style={styles.listContainer}>
        {currentData.map((person) => (
          <TouchableOpacity
            key={person.id}
            style={styles.personCard}
            onPress={() => handlePersonClick(person)}
          >
            <View style={[styles.avatar, { backgroundColor: person.color }]}>
              <Text style={styles.avatarText}>{person.initial}</Text>
            </View>
            <View style={styles.personInfo}>
              <Text style={styles.personName}>{person.name}</Text>
              <View style={styles.paymentInfo}>
                <Text style={styles.checkMark}>✓</Text>
                <Text style={styles.paymentText}>
                  ₹{person.amount} {person.type === 'Advance' ? 'Payment Added' : 'Credit Added'} {person.date}
                </Text>
              </View>
            </View>
            <View style={styles.amountContainer}>
              <Text style={[styles.amount, person.type === 'Due' ? styles.dueAmount : styles.advanceAmount]}>
                ₹{person.amount}
              </Text>
              <Text style={styles.amountType}>{person.type}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={activeTab === 'Customer' ? handleAddCustomer : handleAddSupplier}
      >
        <Users size={20} color="white" />
        <Text style={styles.addButtonText}>Add {activeTab}</Text>
      </TouchableOpacity>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <TrendingUp size={24} color="#4CAF50" />
          <Text style={styles.navText}>Ledger</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleMyPlanPress}>
          <Settings size={24} color="#666" />
          <Text style={styles.navText}>My Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleMorePress}>
          <Text style={[styles.navText, { fontSize: 24, marginTop: -4 }]}>⋯</Text>
          <Text style={styles.navText}>More</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  shareButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
  },
  shareText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '500',
  },
  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  verifyIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  verifyIconText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  verifyText: {
    flex: 1,
    fontSize: 14,
    color: '#FF6F00',
    fontWeight: '500',
  },
  verifyArrow: {
    fontSize: 18,
    color: '#FF6F00',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    padding: 4,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#F1F8E9',
    borderRadius: 6,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  tabActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  balanceCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 12,
    color: '#999',
  },
  balanceType: {
    fontSize: 12,
    color: '#666',
    position: 'absolute',
    right: 16,
    top: 16,
  },
  listContainer: {
    flex: 1,
    marginTop: 16,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkMark: {
    color: '#4CAF50',
    marginRight: 4,
    fontSize: 12,
  },
  paymentText: {
    fontSize: 12,
    color: '#666',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  dueAmount: {
    color: '#F44336',
  },
  advanceAmount: {
    color: '#4CAF50',
  },
  amountType: {
    fontSize: 12,
    color: '#666',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});