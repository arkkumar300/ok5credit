import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    FlatList,
    TouchableOpacity,
    Image,
    Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from "lucide-react-native";
import { Appbar } from "react-native-paper";
import * as Contacts from "expo-contacts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ApiService from "./components/ApiServices";
import cleanMobileNumber from "./components/cleanMobileNumber";

export default function Search() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const {addTo} = useLocalSearchParams();
    console.log("rrr:::",addTo)
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

    /* ---------------- ADD CUSTOMER ---------------- */
    const handleContactSelect = async (contact) => {
        try {
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
                Alert.alert("Success", "Customer added successfully");
                router.back(); // ⬅️ go back after success
            } else {
                Alert.alert("Error", "Failed to add customer");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Customer may already exist or server error");
        }
    };

    /* ---------------- RENDER ---------------- */
    return (
        <SafeAreaView style={styles.container}>
            <Appbar.Header style={{ elevation: 5 }}>
                <ArrowLeft
                    size={24}
                    color="#2E7D32"
                    style={{ marginStart: 10 }}
                    onPress={() => router.back()}
                />
                <Appbar.Content
                    title="Select Contact"
                    titleStyle={{ textAlign: "center", fontWeight: "bold" }}
                />
            </Appbar.Header>

            <FlatList
                data={contacts}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={
                    !loading && (
                        <Text style={styles.emptyText}>No contacts found</Text>
                    )
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.contactItem}
                        onPress={() => handleContactSelect(item)}
                    >
                        {item.imageAvailable && item.image?.uri ? (
                            <Image
                                source={{ uri: item.image.uri }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={[styles.avatar, styles.placeholder]}>
                                <Text style={styles.initial}>
                                    {item.name?.[0]?.toUpperCase() || "?"}
                                </Text>
                            </View>
                        )}

                        <View style={{ marginLeft: 12 }}>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.number}>
                                {item.phoneNumbers[0]?.number}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </SafeAreaView>
    );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    contactItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#ccc",
    },
    placeholder: {
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#999",
    },
    initial: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 18,
    },
    name: {
        fontWeight: "600",
        color: "#333",
    },
    number: {
        fontSize: 12,
        color: "#666",
    },
    emptyText: {
        textAlign: "center",
        marginTop: 50,
        color: "#777",
    },
});
