// KhataScreen.js

import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from "@react-navigation/native";
import {View,Text,FlatList,SafeAreaView,TouchableOpacity,StyleSheet,StatusBar,Platform,ActivityIndicator} from 'react-native';
import { Appbar, FAB } from 'react-native-paper';
import { BookOpenText, Truck, User2, Download, ArrowLeft, Users, TrendingUp, CheckCircle, ChevronRight } from 'lucide-react-native';
import handleDownloadPDF from './components/ledgerPDF';
import { useRouter } from 'expo-router';
import ApiService from './components/ApiServices';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const Account = () => {
    const [khataData, setKhataData] = useState([]);
    const [businessName, setBusinessName] = useState("");
    const [customers, setCustomers] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const fetchDashboard = async () => {
        try {
            const userDetails = await AsyncStorage.getItem("userData");

            if (!userDetails) return;

            const userData = JSON.parse(userDetails);

            const userId = userData?.id;
            const ownerId = userData?.owner_user_id;
            const businessName = userData?.businessName;

            setBusinessName(businessName);

            const response = await ApiService.post("/dashboard/businessOwner", {
                userId,
                ownerId,
            });

            const json = response?.data;
            console.log("Dashboard response:", json);

            if (json?.success) {
                const customers = json?.Customers || [];
                const suppliers = json?.Suppliers || [];

                const custBalance = customers.reduce(
                    (sum, c) => sum + parseFloat(c?.current_balance || "0"),
                    0
                );

                const supBalance = suppliers.reduce(
                    (sum, s) => sum + parseFloat(s?.current_balance || "0"),
                    0
                );

                setCustomers(customers);
                setSuppliers(suppliers);

                setKhataData([
                    {
                        id: "customer",
                        title: "Customer Khata",
                        balance: `₹${custBalance.toFixed(2)}`,
                        info: `${customers.length} Customers`,
                        subtitle: "You Get",
                        icon: BookOpenText,
                        iconColor: "#007B83",
                        balanceColor: "#E53935",
                    },
                    {
                        id: "supplier",
                        title: "Supplier Khata",
                        balance: `₹${supBalance.toFixed(2)}`,
                        info: `${suppliers.length} Suppliers`,
                        subtitle: "You Give",
                        icon: Truck,
                        iconColor: "#4CAF50",
                        balanceColor: "#E53935",
                    },
                ]);
            } else {
                console.log("API returned success false");
            }
        } catch (error) {
            console.error("Error fetching dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchDashboard();
        }, [])
    );

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({
                pathname: '/customerOverview',
                params: { transaction_for: item.id }
            })}
            activeOpacity={0.7}
        >
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(10,77,60,0.1)' }]}>
                        <item.icon size={22} color={item.iconColor} />
                    </View>

                    <View style={styles.netBalanceContainer}>
                        <Text style={styles.netBalanceLabel}>Net Balance</Text>
                        <CheckCircle size={14} color="#0A4D3C" />
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={[styles.balance, { color: item.balanceColor }]}>{item.balance}</Text>
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.statsContainer}>
                        <Users size={16} color="#64748B" />
                        <Text style={styles.info}>{item.info}</Text>
                    </View>

                    <View style={styles.rightFooter}>
                        <View style={styles.subtitleBadge}>
                            <TrendingUp size={12} color="#64748B" />
                            <Text style={styles.subtitle}>{item.subtitle}</Text>
                        </View>
                        <ChevronRight size={18} color="#CBD5E1" />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={['#0A4D3C', '#1B6B50']}
                    style={styles.headerGradient}
                >
                    <SafeAreaView>
                        <View style={styles.header}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => router.back()}
                                activeOpacity={0.7}
                            >
                                <ArrowLeft size={20} color="#FFFFFF" />
                            </TouchableOpacity>

                            <View style={styles.headerTitleContainer}>
                                <Text style={styles.headerTitle}>Khata Overview</Text>
                                <Text style={styles.headerSubtitle}>{businessName || 'Your Business'}</Text>
                            </View>

                            <View style={styles.headerRight} />
                        </View>
                    </SafeAreaView>
                </LinearGradient>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0A4D3C" />
                    <Text style={styles.loadingText}>Loading Khata...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0A4D3C" />

            {/* Premium Header with Gradient */}
            <LinearGradient
                colors={['#0A4D3C', '#1B6B50']}
                style={styles.headerGradient}
            >
                <SafeAreaView>
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                            activeOpacity={0.7}
                        >
                            <ArrowLeft size={20} color="#FFFFFF" />
                        </TouchableOpacity>

                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>Khata Overview</Text>
                            <Text style={styles.headerSubtitle}>{businessName || 'Your Business'}</Text>
                        </View>

                        <View style={styles.headerRight} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {khataData.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <BookOpenText size={70} color="#E2E8F0" />
                    <Text style={styles.emptyText}>No Khata Data Available</Text>
                    <Text style={styles.emptySubtext}>Add customers and suppliers to see your khata</Text>
                </View>
            ) : (
                <FlatList
                    data={khataData}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Premium Download FAB */}
            {(customers.length > 0 || suppliers.length > 0) && (
                <TouchableOpacity
                    style={styles.downloadFab}
                    onPress={() =>
                        handleDownloadPDF({
                            businessName,
                            customers,
                            suppliers,
                        })
                    }
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#0A4D3C', '#1B6B50']}
                        style={styles.fabGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Download size={24} color="#FFFFFF" />
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    headerGradient: {
        paddingTop: Platform.OS === 'android' ? 20 : 0,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#0A4D3C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
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
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },
    headerRight: {
        width: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748B',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        marginBottom: 16,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(10,77,60,0.08)',
    },
    cardContent: {
        padding: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    netBalanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(10,77,60,0.1)',
    },
    netBalanceLabel: {
        fontSize: 11,
        color: '#475569',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    cardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },
    balance: {
        fontSize: 24,
        fontWeight: '700',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(10,77,60,0.1)',
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    info: {
        fontSize: 14,
        color: '#475569',
        fontWeight: '500',
    },
    rightFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    subtitleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(10,77,60,0.08)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 16,
    },
    subtitle: {
        fontSize: 12,
        color: '#0A4D3C',
        fontWeight: '600',
    },
    downloadFab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 64,
        height: 64,
        borderRadius: 32,
        overflow: 'hidden',
        shadowColor: '#0A4D3C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    fabGradient: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default Account;
