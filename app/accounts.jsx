// KhataScreen.js

import React,{useState,useEffect} from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet
} from 'react-native';
import { Appbar, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import {BookOpenText, Truck, User2, Download, ArrowLeft} from 'lucide-react-native';
import handleDownloadPDF from './components/ledgerPDF';
import { useRouter } from 'expo-router';
import ApiService from './components/ApiServices';
import AsyncStorage from '@react-native-async-storage/async-storage';

const khataData = [
    {
        id: '1',
        title: 'Customer Khata',
        balance: '₹900',
        info: '1 Customer',
        subtitle: 'You Get',
        icon: BookOpenText,
        iconColor: '#007B83',
        balanceColor: '#E53935'
    },
    {
        id: '2',
        title: 'Supplier Khata',
        balance: '₹100',
        info: '1 Supplier',
        subtitle: 'You Give',
        icon: Truck,
        iconColor: '#4CAF50',
        balanceColor: '#E53935'
    }
];

const Account = () => {
    const [khataData, setKhataData] = useState([]);
    const router = useRouter();
  
    useEffect(() => {
      const fetchDashboard = async () => {
        const userData = await AsyncStorage.getItem("userData");
        const userId = JSON.parse(userData).id;

        try {
            const response = await ApiService.post(`/dashboard/businessOwner`, { userId });
          const json = await response.data;

          if (json.success) {
            const custBalance = json.Customers.reduce(
              (sum, c) => sum + parseFloat(c.current_balance || '0'),
              0
            );
            const supBalance = json.Suppliers.reduce(
              (sum, s) => sum + parseFloat(s.current_balance || '0'),
              0
            );
  
            setKhataData([
              {
                id: 'customer',
                title: 'Customer Khata',
                balance: `₹${custBalance.toFixed(2)}`,
                info: `${json.Customers.length} Customers`,
                subtitle: 'You Get',
                icon: BookOpenText,
                iconColor: '#007B83',
                balanceColor: '#E53935',
              },
              {
                id: 'supplier',
                title: 'Supplier Khata',
                balance: `₹${supBalance.toFixed(2)}`,
                info: `${json.Suppliers.length} Suppliers`,
                subtitle: 'You Give',
                icon: Truck,
                iconColor: '#4CAF50',
                balanceColor: '#E53935',
              },
            ]);
          } else {
            console.error('API returned false success');
          }
        } catch (err) {
          console.error('Error fetching dashboard data:', err);
        } finally {
          setLoading(false);
        }
      };
  
      fetchDashboard();
    }, []);
    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => router.push({
            pathname: '/customerOverview',params:{transaction_for:item.id}
        })}>
            <View style={styles.cardHeader}>
                <item.icon size={20} color={item.iconColor} />
                <Text style={styles.netBalanceText}> Net Balance</Text>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={[styles.balance, { color: item.balanceColor }]}>{item.balance}</Text>
            </View>
            <View style={styles.cardFooter}>
                <View style={styles.row}>
                    <User2 size={16} color="#555" />
                    <Text style={styles.info}>{item.info}</Text>
                </View>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Appbar.Header style={styles.header}>
                <Appbar.BackAction onPress={() => router.back()} icon={() => <ArrowLeft size={22} />} />
                <Appbar.Content title="ARK STORES" />
            </Appbar.Header>

            <FlatList
                data={khataData}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
            />

            {/* Download Backup */}
            <FAB
                icon={({ size, color }) => (
                    <Download size={size} color={color} />
                )}
                onPress={handleDownloadPDF}
                style={styles.fab}
                color="#007B83" // Icon color
                customSize={60} // optional, for resizing FAB
            />
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#eef6f7',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 16,
        bottom: 16, // change as needed
        backgroundColor: '#fff', // or any background color
        elevation: 4, // shadow for Android
    },
    header: {
        fontSize: 18,
        fontWeight: 'bold',
        elevation:3,
        color: '#000',
    },
    listContainer: {
        padding: 12,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 14,
        marginBottom: 12,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    netBalanceText: {
        fontSize: 12,
        color: '#555',
        marginLeft: 6,
    },
    cardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#222',
    },
    balance: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    info: {
        fontSize: 13,
        marginLeft: 5,
        color: '#555',
    },
    subtitle: {
        fontSize: 13,
        color: '#888',
    },
    downloadCard: {
        marginTop: 8,
        marginHorizontal: 12,
        marginBottom: 16,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
    },
    downloadText: {
        fontSize: 15,
        marginLeft: 10,
        color: '#007B83',
        fontWeight: '500',
    },
});
export default Account;
