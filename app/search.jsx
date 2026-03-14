import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Image, Alert, StatusBar, Dimensions} from "react-native";
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Search as SearchIcon, UserPlus, Phone, CheckCircle } from "lucide-react-native";
import { Appbar, ActivityIndicator, Searchbar } from "react-native-paper";
import * as Contacts from "expo-contacts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ApiService from "./components/ApiServices";
import cleanMobileNumber from "./components/cleanMobileNumber";
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

export default function Search() {
    const [contacts, setContacts] = useState([]);
    const [filteredContacts, setFilteredContacts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [addingContact, setAddingContact] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const {addTo} = useLocalSearchParams();
    /* ---------------- LOAD CONTACTS ---------------- */
    useEffect(() => {
        (async () => {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission denied", "Contacts permission is required");
                return;
            }

            const { data } = await Contacts.getContactsAsync({
                fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
            });

            const validContacts = data.filter(
                c => c.phoneNumbers && c.phoneNumbers.length > 0
            );

            setContacts(validContacts);
            setLoading(false);
        })();
    }, []);

        /* ---------------- SEARCH FUNCTION ---------------- */
        const handleSearch = (query) => {
            setSearchQuery(query);
            if (query.trim() === '') {
                setFilteredContacts(contacts);
            } else {
                const filtered = contacts.filter(contact =>
                    contact.name?.toLowerCase().includes(query.toLowerCase()) ||
                    contact.phoneNumbers?.[0]?.number?.includes(query)
                );
                setFilteredContacts(filtered);
            }
        };
        
    /* ---------------- ADD CUSTOMER ---------------- */
    const handleContactSelect = async (contact) => {
        try {
            setAddingContact(contact.id);

            const userData = await AsyncStorage.getItem("userData");
            const userId = JSON.parse(userData).id;

            const rawNumber = contact.phoneNumbers[0]?.number || "";
            const mobile = cleanMobileNumber(rawNumber);

            if (!mobile) {
                Alert.alert("Invalid number", "Selected contact has no valid number");
                return;
            }
            const url = addTo === 'Customer' ? "/customers" : "/supplier"
            const response = await ApiService.post(url, {
                userId: Number(userId),
                name: contact.name || "Unknown",
                mobile,
            });

            if (response.status === 200 || response.status === 201) {
                Alert.alert(
                    "Success",
                    `${addTo} added successfully`,
                    [{ text: "OK", onPress: () => router.back() }]
                );
            } else {
                Alert.alert("Error", `Failed to add ${addTo}`);
                setAddingContact(null);
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Customer may already exist or server error");
            setAddingContact(null);
        }
    };

        /* ---------------- RENDER CONTACT ITEM ---------------- */
        const renderContactItem = ({ item }) => (
            <TouchableOpacity
                style={styles.contactItem}
                onPress={() => handleContactSelect(item)}
                disabled={addingContact === item.id}
                activeOpacity={0.7}
            >
                <View style={styles.contactItemInner}>
                    <View style={styles.contactLeftSection}>
                        {item.imageAvailable && item.image?.uri ? (
                            <Image
                                source={{ uri: item.image.uri }}
                                style={styles.avatar}
                            />
                        ) : (
                            <LinearGradient
                                colors={['#0A4D3C', '#1B6B50']}
                                style={[styles.avatar, styles.avatarGradient]}
                            >
                                <Text style={styles.initial}>
                                    {item.name?.[0]?.toUpperCase() || "?"}
                                </Text>
                            </LinearGradient>
                        )}
    
                        <View style={styles.contactInfo}>
                            <Text style={styles.name}>{item.name}</Text>
                            <View style={styles.phoneContainer}>
                                <Phone size={12} color="#64748B" />
                                <Text style={styles.number} numberOfLines={1}>
                                    {item.phoneNumbers[0]?.number}
                                </Text>
                            </View>
                        </View>
                    </View>
    
                    {addingContact === item.id ? (
                        <ActivityIndicator size="small" color="#0A4D3C" />
                    ) : (
                        <View style={styles.addButton}>
                            <UserPlus size={18} color="#0A4D3C" />
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    
    /* ---------------- RENDER ---------------- */
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
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <ArrowLeft size={24} color="#FFFFFF" />
                        </TouchableOpacity>

                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>
                                {addTo === 'Customer' ? 'Add Customer' : 'Add Supplier'}
                            </Text>
                            <Text style={styles.headerSubtitle}>
                                Select from contacts
                            </Text>
                        </View>

                        <View style={styles.headerRightPlaceholder} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Search contacts..."
                    onChangeText={handleSearch}
                    value={searchQuery}
                    style={styles.searchBar}
                    inputStyle={styles.searchInput}
                    icon={() => <SearchIcon size={20} color="#64748B" />}
                    clearButtonMode="while-editing"
                />
            </View>

            {/* Contacts List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0A4D3C" />
                    <Text style={styles.loadingText}>Loading contacts...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredContacts}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <Animatable.View
                            animation="fadeIn"
                            duration={500}
                            style={styles.emptyContainer}
                        >
                            <View style={styles.emptyIconContainer}>
                                <SearchIcon size={40} color="#0A4D3C" />
                            </View>
                            <Text style={styles.emptyTitle}>
                                {searchQuery ? 'No contacts found' : 'No contacts available'}
                            </Text>
                            <Text style={styles.emptySubtext}>
                                {searchQuery
                                    ? 'Try searching with a different name or number'
                                    : 'No contacts with phone numbers found on your device'
                                }
                            </Text>
                        </Animatable.View>
                    }
                    renderItem={renderContactItem}
                    initialNumToRender={15}
                    maxToRenderPerBatch={20}
                    windowSize={10}
                />
            )}

            {/* Stats Bar */}
            {!loading && filteredContacts.length > 0 && (
                <View style={styles.statsBar}>
                    <View style={styles.statsContent}>
                        <CheckCircle size={16} color="#0A4D3C" />
                        <Text style={styles.statsText}>
                            {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''} found
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    headerGradient: {
        paddingTop: 20,
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
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
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
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F8FAFC',
    },
    searchBar: {
        elevation: 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        height: 48,
    },
    searchInput: {
        fontSize: 14,
        color: '#1E293B',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 80,
    },
    contactItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    contactItemInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
    },
    contactLeftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#E8F5E9",
    },
    avatarGradient: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    initial: {
        color: "#FFFFFF",
        fontWeight: "bold",
        fontSize: 20,
    },
    contactInfo: {
        marginLeft: 12,
        flex: 1,
    },
    name: {
        fontWeight: "600",
        color: "#0A4D3C",
        fontSize: 16,
        marginBottom: 4,
        textTransform: 'capitalize',
    },
    phoneContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    number: {
        fontSize: 13,
        color: "#64748B",
        flex: 1,
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
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
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 30,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0A4D3C',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
    },
    statsBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingVertical: 12,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 8,
    },
    statsContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    statsText: {
        fontSize: 13,
        color: '#0A4D3C',
        fontWeight: '600',
    },
});