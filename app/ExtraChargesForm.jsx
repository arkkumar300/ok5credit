import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Dimensions
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function ExtraChargesForm({ setItem, setNewItem, totalAmount }) {

    // Each item has its own mode
    const createItem = () => ({
        type: "charge",          // charge | discount
        name: "",
        discountType: "amount",  // amount | percent (only for discount)
        value: ""                // amount or %
    });

    const [items, setItems] = useState([createItem()]);

    const updateItem = (index, key, value) => {
        const updated = [...items];
        updated[index][key] = value;
        setItems(updated);
    };

    const addMore = () => setItems([...items, createItem()]);

    const deleteItem = (index) => {
        const updated = [...items];
        updated.splice(index, 1);
        setItems(updated);
    };

    const calculateDiscount = (item) => {
        if (item.type !== "discount") return 0;

        if (item.discountType === "amount") return Number(item.value);

        return (Number(item.value) / 100) * totalAmount;
    };

    const save = () => {
        const processed = items.map((item) => ({
            type: item.type,
            name: item.name,
            enteredValue: Number(item.value),
            discountType: item.discountType,
            finalAmount: item.type === "discount" ? calculateDiscount(item) : Number(item.value)
        }));

        setNewItem(processed);
        setItem(false);
    };

    const renderItem = ({ item, index }) => (
        <View style={styles.card}>

            {/* Row Toggle: Charge / Discount */}
            <View style={styles.rowToggle}>
                <TouchableOpacity
                    style={[styles.toggleBtn, item.type === "charge" && styles.activeToggle]}
                    onPress={() => updateItem(index, "type", "charge")}
                >
                    <Text style={item.type === "charge" ? styles.activeToggleTxt : styles.toggleTxt}>
                        Charges(+)
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.toggleBtn, item.type === "discount" && styles.activeToggle]}
                    onPress={() => updateItem(index, "type", "discount")}
                >
                    <Text style={item.type === "discount" ? styles.activeToggleTxt : styles.toggleTxt}>
                        Discounts(-)
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => deleteItem(index)}>
                    <Icon name="delete" size={24} color="red" />
                </TouchableOpacity>
            </View>

            {/* Common Name Input */}
            <TextInput
                placeholder={item.type === "charge" ? "Charge Name" : "Discount Name"}
                style={styles.input}
                value={item.name}
                onChangeText={(v) => updateItem(index, "name", v)}
            />

            {/* Discount Inner Toggle */}
            {item.type === "discount" && (
                <View style={styles.innerToggleRow}>
                    <TouchableOpacity
                        style={[styles.innerToggle, item.discountType === "percent" && styles.innerToggleActive]}
                        onPress={() => updateItem(index, "discountType", "percent")}
                    >
                        <Text style={item.discountType === "percent" ? styles.innerToggleTxtActive : styles.innerToggleTxt}>
                            Percentage (%)
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.innerToggle, item.discountType === "amount" && styles.innerToggleActive]}
                        onPress={() => updateItem(index, "discountType", "amount")}
                    >
                        <Text style={item.discountType === "amount" ? styles.innerToggleTxtActive : styles.innerToggleTxt}>
                            Amount (₹)
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Value Input */}
            <TextInput
                placeholder={
                    item.type === "charge"
                        ? "Enter Amount"
                        : item.discountType === "percent"
                        ? "Enter % value"
                        : "Enter discount amount"
                }
                style={styles.input}
                keyboardType="numeric"
                value={item.value}
                onChangeText={(v) => updateItem(index, "value", v)}
            />

            {/* Live calculation preview */}
            {item.type === "discount" && item.discountType === "percent" && item.value !== "" && (
                <Text style={styles.preview}>
                    Calculated Discount: ₹{calculateDiscount(item).toFixed(2)}
                </Text>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Charges & Discounts</Text>

            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={(_, i) => i.toString()}
            />

            <TouchableOpacity style={styles.addMoreBtn} onPress={addMore}>
                <Text style={styles.addMoreTxt}>+ Add More</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={save}>
                <Text style={styles.saveTxt}>Save</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { height: Dimensions.get("screen").height, padding: 15,backgroundColor:"#f3f3f3" },
    header: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },

    card: {
        padding: 15,
        backgroundColor: "#fff",
        borderRadius: 10,
        marginVertical: 8,
        elevation: 2,
    },

    rowToggle: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },

    toggleBtn: {
        flex: 1,
        padding: 8,
        marginRight: 5,
        backgroundColor: "#EAEAEA",
        borderRadius: 20,
        alignItems: "center",
    },

    activeToggle: { backgroundColor: "#C8FFD5" },

    toggleTxt: { color: "#555" },
    activeToggleTxt: { color: "#00A050", fontWeight: "bold" },

    input: {
        backgroundColor: "#F2FFF2",
        padding: 10,
        borderRadius: 8,
        marginTop: 8,
    },

    innerToggleRow: {
        flexDirection: "row",
        marginTop: 10,
    },

    innerToggle: {
        flex: 1,
        backgroundColor: "#EEE",
        padding: 8,
        marginRight: 5,
        borderRadius: 15,
        alignItems: "center",
    },

    innerToggleActive: { backgroundColor: "#D0FFE9" },

    innerToggleTxt: { color: "#444" },
    innerToggleTxtActive: { color: "#00A050", fontWeight: "bold" },

    preview: {
        marginTop: 8,
        fontWeight: "bold",
        color: "#00A050",
    },

    addMoreBtn: {
        marginTop: 15,
        padding: 12,
        backgroundColor: "#E0FBE5",
        borderRadius: 15,
        alignItems: "center",
    },
    addMoreTxt: { color: "#00A050", fontWeight: "bold" },

    saveBtn: {
        marginTop: 15,
        backgroundColor: "#00B050",
        padding: 15,
        borderRadius: 25,
        alignItems: "center",
    },
    saveTxt: { color: "#fff", fontWeight: "bold", fontSize: 18 },
});
