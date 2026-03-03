import React, { useState } from 'react';
import {View,Text,StyleSheet,FlatList,TouchableOpacity,SafeAreaView,ScrollView} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Appbar, Avatar } from 'react-native-paper';
import { Users, DollarSign, TrendingUp, Calendar } from 'lucide-react-native';

export default function EmployeeDashboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const {
    userId,
    userName,
    userEmail,
    customers: customersStr,
    suppliers: suppliersStr
  } = params;

  const customers = customersStr ? JSON.parse(customersStr) : [];
  const suppliers = suppliersStr ? JSON.parse(suppliersStr) : [];

  const [activeTab, setActiveTab] = useState('Customers');

  const calculateTotals = () => {
    const customerTotal = customers.reduce((sum, c) => sum + parseFloat(c.current_balance || 0), 0);
    const supplierTotal = suppliers.reduce((sum, s) => sum + parseFloat(s.current_balance || 0), 0);
    return { customerTotal, supplierTotal };
  };

  const { customerTotal, supplierTotal } = calculateTotals();

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderCustomerItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.itemCard}
      onPress={() => router.push({
        pathname: '/customerDetails',
        params: {
          personId: item.id,
          personName: item.name,
          personType: 'customer',
          createdBy: item.created_by
        }
      })}
    >
      <Avatar.Text
        size={40}
        label={getInitials(item.name)}
        color="#fff"
        style={{ backgroundColor: '#4CAF50' }}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPhone}>{item.phone || 'No phone'}</Text>
      </View>
      <View style={styles.itemAmount}>
        <Text style={[
          styles.amountText,
          { color: parseFloat(item.current_balance) <= 0 ? '#F44336' : '#4CAF50' }
        ]}>
          ₹{parseFloat(item.current_balance || 0).toFixed(2)}
        </Text>
        <Text style={styles.amountType}>
          {parseFloat(item.current_balance) <= 0 ? 'Due' : 'Advance'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderSupplierItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.itemCard}
      onPress={() => router.push({
        pathname: '/supplierDetails',
        params: {
          personId: item.id,
          personName: item.name,
          personType: 'supplier',
          createdBy: item.created_by
        }
      })}
    >
      <Avatar.Text
        size={40}
        label={getInitials(item.name)}
        color="#fff"
        style={{ backgroundColor: '#FF9800' }}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPhone}>{item.phone || 'No phone'}</Text>
      </View>
      <View style={styles.itemAmount}>
        <Text style={[
          styles.amountText,
          { color: parseFloat(item.current_balance) >= 0 ? '#F44336' : '#4CAF50' }
        ]}>
          ₹{parseFloat(item.current_balance || 0).toFixed(2)}
        </Text>
        <Text style={styles.amountType}>
          {parseFloat(item.current_balance) >= 0 ? 'Due' : 'Advance'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={`${userName}'s Dashboard`} />
      </Appbar.Header>

      {/* Employee Info */}
      <View style={styles.employeeCard}>
        <Avatar.Text
          size={60}
          label={getInitials(userName)}
          color="#fff"
          style={{ backgroundColor: '#2196F3' }}
        />
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>{userName}</Text>
          <Text style={styles.employeeEmail}>{userEmail}</Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Users size={24} color="#4CAF50" />
          <Text style={styles.statValue}>{customers.length}</Text>
          <Text style={styles.statLabel}>Customers</Text>
        </View>
        <View style={styles.statCard}>
          <DollarSign size={24} color="#FF9800" />
          <Text style={styles.statValue}>₹{customerTotal.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Customer Balance</Text>
        </View>
        <View style={styles.statCard}>
          <TrendingUp size={24} color="#F44336" />
          <Text style={styles.statValue}>₹{supplierTotal.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Supplier Balance</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Customers' && styles.activeTab]}
          onPress={() => setActiveTab('Customers')}
        >
          <Text style={[styles.tabText, activeTab === 'Customers' && styles.activeTabText]}>
            Customers ({customers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Suppliers' && styles.activeTab]}
          onPress={() => setActiveTab('Suppliers')}
        >
          <Text style={[styles.tabText, activeTab === 'Suppliers' && styles.activeTabText]}>
            Suppliers ({suppliers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lists */}
      {activeTab === 'Customers' ? (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCustomerItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No customers found</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <FlatList
          data={suppliers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSupplierItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No suppliers found</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  employeeInfo: {
    marginLeft: 16,
    flex: 1,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  employeeEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#E8F5E9',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  itemPhone: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  amountType: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});