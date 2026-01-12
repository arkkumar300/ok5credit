import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { Appbar, FAB } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Delete, Eye, Pencil, Plus, Trash2 } from 'lucide-react-native';
import ApiService from './components/ApiServices';
import LottieView from 'lottie-react-native';

export default function Items() {
    const router = useRouter();
    const [items, setItems] = useState([]);

    const [editItem, setEditItem] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const openEditModal = (item) => {
        setEditItem({ ...item });
        setModalVisible(true);
    };

    const handleSave = () => {
        setItems((prev) =>
            prev.map((item) => (item.id === editItem.id ? editItem : item))
        );
        setModalVisible(false);
    };

    const deleteItem = async (id) => {
        console.log("delete item id", id)
        try {
            const response = await ApiService.delete(`/item/${id}`);
            if (response?.data?.success === false) {
                throw new Error(response.data.message || "Delete failed");
            }

            console.log("Item deleted successfully:", response.data);

        } catch (err) {
            console.error("Error deleting item:", err.message);
            throw err;
        } finally {
            fetchItems()
            setModalVisible(false)
        }
    };

    const handleDelete = (id) => {
        Alert.alert('Confirm Delete', 'Are you sure you want to delete this item?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    deleteItem(id)
                },
            },
        ]);
    };



    const fetchItems = async () => {
        try {
            const response = await ApiService.get('/item');
            const data = response.data;
            setItems(data)
        } catch (err) {
            console.error("Error fetching items:", err);
            throw err;
        }
    }

    useEffect(() => {
        fetchItems();
    }, [])

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            {/* Header Row: Name + View Button */}
            <View style={[styles.cardHeader, { flexDirection: 'row', justifyContent: 'space-between' }]}>
                <Text style={styles.itemTitle}>{item.itemName}</Text>
                <TouchableOpacity
                    onPress={() => {
                        setSelectedItem(item);
                        openEditModal(item);
                    }}
                    style={styles.iconButton}
                >
                    <Eye size={20} color="#1e88e5" />
                </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Info Rows */}
            <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Qty:</Text>
                <Text style={styles.cardValue}>{item.quantity} {item.unitValue}</Text>
            </View>

            <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Price:</Text>
                <Text style={styles.cardValue}>₹{item.price}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} icon={() => <ArrowLeft size={22} />} />
                <Appbar.Content title="Items" />
            </Appbar.Header>

            <Text style={styles.header}></Text>

            <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 50 }}
                ListEmptyComponent={() => {
                    return (
                        <View style={styles.emptyContainer}>
                            <LottieView
                                source={require('../assets/animations/noData.json')} // 👈 local JSON file
                                autoPlay
                                loop
                                style={{ width: 200, height: 150, alignSelf: 'center' }}
                            />
                            <Text style={styles.emptyText}>No data found</Text>

                        </View>
                    )
                }}
            />

            {/* Edit Modal */}
            <Modal visible={modalVisible} animationType="slide">
                <View style={styles.modalBackground}>
                    <View style={styles.bottomSheet}>
                        <Text style={styles.closeButton} onPress={() => setModalVisible(false)}>X</Text>
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.itemTitle}>{selectedItem?.itemName}</Text>

                                <View style={styles.divider} />

                                <View style={styles.gridContainer}>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.cardLabel}>Qty</Text>
                                        <Text style={styles.cardValue}>{selectedItem?.quantity} {selectedItem?.unitValue}</Text>
                                    </View>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.cardLabel}>Price</Text>
                                        <Text style={styles.cardValue}>₹{selectedItem?.price}</Text>
                                    </View>

                                    <View style={styles.gridItem}>
                                        <Text style={styles.cardLabel}>MRP</Text>
                                        <Text style={styles.cardValue}>₹{selectedItem?.mrp}</Text>
                                    </View>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.cardLabel}>GST</Text>
                                        <Text style={styles.cardValue}>{selectedItem?.gstValue}%</Text>
                                    </View>

                                    <View style={styles.gridItem}>
                                        <Text style={styles.cardLabel}>CESS</Text>
                                        <Text style={styles.cardValue}>{selectedItem?.cess}%</Text>
                                    </View>
                                    <View style={styles.gridItem}>
                                        <Text style={styles.cardLabel}>Barcode</Text>
                                        <Text style={styles.cardValue}>{selectedItem?.barcode}</Text>
                                    </View>

                                    <View style={[styles.gridItem, { width: '100%' }]}>
                                        <Text style={styles.cardLabel}>Description</Text>
                                        <Text style={styles.cardValue}>{selectedItem?.description}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => {
                                            router.push({
                                                pathname: '/addItem',
                                                params: {
                                                    item: encodeURIComponent(JSON.stringify(selectedItem)) // For edit
                                                }
                                            })
                                            setModalVisible(false);
                                        }}

                                        style={styles.iconButton}
                                    >
                                        <Pencil size={20} color="#1e88e5" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleDelete(selectedItem.id)}
                                        style={styles.iconButton}
                                    >
                                        <Delete size={20} color="#1e88e5" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
            <FAB
                icon={({ size, color }) => <Plus size={size} color={color} />}
                onPress={() => {
                    console.log("rrr");
                    router.push('./addItem')
                }}
                style={[styles.fab, { backgroundColor: '#007B83', zIndex: 99 }]} // FAB background
                color="#fff" // icon color
                size="medium" // or "small", "large"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#fff' },
    header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
    name: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    actions: {
        flexDirection: 'row',
        marginTop: 10,
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        elevation: 4, // Android shadow
    },
    modalContent: {
        backgroundColor: '#fff',
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 20,
    },
    closeButton: {
        marginTop: 20, fontSize: 20,
        top: -10, position: 'absolute',
        alignSelf: 'flex-end', right: 20, zIndex: 99,
        borderRadius: 8, justifyContent: 'center',
        textAlign: 'center', fontWeight: 'bold'
    },
    bottomButtons: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    bottomSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 40,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    emptyText: {
        fontSize: 16, fontWeight: '700',
        color: '#666',
        textAlign: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#f2f2f2',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    saveButton: {
        backgroundColor: 'green',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    saveText: { color: 'white', fontWeight: 'bold' },
    cancelButton: {
        backgroundColor: '#ccc',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    cancelText: { fontWeight: 'bold' },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        margin: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3, // For Android
    },

    cardHeader: {
        // flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    itemTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },

    iconButton: {
        backgroundColor: '#e3f2fd',
        padding: 6,
        borderRadius: 20,
    },

    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 10,
    },

    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 2,
    },

    cardLabel: {
        fontWeight: '600',
        color: '#666',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },

    gridItem: {
        width: '48%', // Two items per row
        marginBottom: 16,
    },

    cardLabel: {
        fontSize: 14,
        color: '#888',
        marginBottom: 4,
    },

    cardValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },


});
