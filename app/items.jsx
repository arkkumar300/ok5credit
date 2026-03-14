import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, Alert, StatusBar, Dimensions, SafeAreaView, ScrollView } from 'react-native';
import { Appbar, ActivityIndicator, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ArrowLeft, Eye, Pencil, Plus, Trash2, Package, Tag, IndianRupee, FileText, Percent, Barcode, X, Box, Scale } from 'lucide-react-native';
import ApiService from './components/ApiServices';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function Items() {
    const router = useRouter();
    const [items, setItems] = useState([]);
    const [editItem, setEditItem] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
   
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
        setLoading(true);
        try {
            const response = await ApiService.get('/item');
            const data = response.data;
            setItems(data)
        } catch (err) {
            console.error("Error fetching items:", err);
            throw err;
        }finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchItems();
    }, [])

    const renderItem = ({ item, index }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => {
                setSelectedItem(item);
                setModalVisible(true);
            }}
            activeOpacity={0.7}
        >
            <LinearGradient
                colors={['#0A4D3C', '#1B6B50']}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={styles.titleContainer}>
                            <Package size={16} color="#FFFFFF" />
                            <Text style={styles.itemTitle} numberOfLines={1}>{item.itemName}</Text>
                        </View>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>#{index + 1}</Text>
                        </View>
                    </View>

                    <Divider style={styles.cardDivider} />

                    <View style={styles.cardDetails}>
                        <View style={styles.detailRow}>
                            <View style={styles.detailItem}>
                                <Scale size={12} color="rgba(255,255,255,0.7)" />
                                <Text style={styles.detailLabel}>Qty</Text>
                                <Text style={styles.detailValue}>
                                    {item.quantity} {item.unitValue}
                                </Text>
                            </View>
                            <View style={styles.detailItem}>
                                <IndianRupee size={12} color="rgba(255,255,255,0.7)" />
                                <Text style={styles.detailLabel}>Price</Text>
                                <Text style={styles.detailValue}>₹{item.price}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.cardFooter}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => {
                                setSelectedItem(item);
                                setModalVisible(true);
                            }}
                        >
                            <Eye size={14} color="#FFFFFF" />
                            <Text style={styles.actionButtonText}>View</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

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
                            <Text style={styles.headerTitle}>Items</Text>
                            <Text style={styles.headerSubtitle}>
                                {items.length} {items.length === 1 ? 'Item' : 'Items'} Total
                            </Text>
                        </View>

                        <View style={styles.headerRightPlaceholder} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0A4D3C" />
                    <Text style={styles.loadingText}>Loading items...</Text>
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <LottieView
                                source={require('../assets/animations/noData.json')}
                                autoPlay
                                loop
                                style={styles.lottieAnimation}
                            />
                            <Text style={styles.emptyTitle}>No Items Found</Text>
                            <Text style={styles.emptySubtext}>
                                Tap the + button to add your first item
                            </Text>
                        </View>
                    )}
                />
            )}

            {/* Item Details Modal - Redesigned */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        {/* Modal Header */}
                        <LinearGradient
                            colors={['#0A4D3C', '#1B6B50']}
                            style={styles.modalHeader}
                        >
                            <View style={styles.modalHeaderContent}>
                                <View style={styles.modalHeaderLeft}>
                                    <Box size={20} color="#FFFFFF" />
                                    <Text style={styles.modalTitle}>Item Details</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setModalVisible(false)}
                                    style={styles.modalCloseButton}
                                >
                                    <X size={18} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>

                        {/* Modal Body - Scrollable */}
                        <ScrollView
                            style={styles.modalBody}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.modalBodyContent}
                        >
                            {selectedItem && (
                                <>
                                    {/* Item Name Section */}
                                    <View style={styles.modalItemNameSection}>
                                        <View style={styles.modalIconContainer}>
                                            <Package size={24} color="#0A4D3C" />
                                        </View>
                                        <View style={styles.modalNameContainer}>
                                            <Text style={styles.modalItemName}>
                                                {selectedItem.itemName}
                                            </Text>
                                            {selectedItem.barcode ? (
                                                <View style={styles.barcodeContainer}>
                                                    <Barcode size={12} color="#64748B" />
                                                    <Text style={styles.barcodeText}>
                                                        {selectedItem.barcode}
                                                    </Text>
                                                </View>
                                            ) : null}
                                        </View>
                                    </View>

                                    <Divider style={styles.modalDivider} />

                                    {/* Details Grid - Compact */}
                                    <View style={styles.detailsCompactGrid}>
                                        <View style={styles.compactDetailItem}>
                                            <View style={[styles.compactIcon, { backgroundColor: '#E8F5E9' }]}>
                                                <Scale size={16} color="#0A4D3C" />
                                            </View>
                                            <View style={styles.compactTextContainer}>
                                                <Text style={styles.compactLabel}>Quantity</Text>
                                                <Text style={styles.compactValue}>
                                                    {selectedItem.quantity} {selectedItem.unitValue}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.compactDetailItem}>
                                            <View style={[styles.compactIcon, { backgroundColor: '#E8F5E9' }]}>
                                                <IndianRupee size={16} color="#0A4D3C" />
                                            </View>
                                            <View style={styles.compactTextContainer}>
                                                <Text style={styles.compactLabel}>Price</Text>
                                                <Text style={styles.compactValue}>₹{selectedItem.price}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.compactDetailItem}>
                                            <View style={[styles.compactIcon, { backgroundColor: '#E8F5E9' }]}>
                                                <Tag size={16} color="#0A4D3C" />
                                            </View>
                                            <View style={styles.compactTextContainer}>
                                                <Text style={styles.compactLabel}>MRP</Text>
                                                <Text style={styles.compactValue}>₹{selectedItem.mrp}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.compactDetailItem}>
                                            <View style={[styles.compactIcon, { backgroundColor: '#E8F5E9' }]}>
                                                <Percent size={16} color="#0A4D3C" />
                                            </View>
                                            <View style={styles.compactTextContainer}>
                                                <Text style={styles.compactLabel}>GST</Text>
                                                <Text style={styles.compactValue}>{selectedItem.gstValue}%</Text>
                                            </View>
                                        </View>

                                        <View style={styles.compactDetailItem}>
                                            <View style={[styles.compactIcon, { backgroundColor: '#E8F5E9' }]}>
                                                <Percent size={16} color="#0A4D3C" />
                                            </View>
                                            <View style={styles.compactTextContainer}>
                                                <Text style={styles.compactLabel}>CESS</Text>
                                                <Text style={styles.compactValue}>{selectedItem.cess}%</Text>
                                            </View>
                                        </View>

                                        {selectedItem.description ? (
                                            <View style={[styles.compactDetailItem, styles.fullWidthCompact]}>
                                                <View style={[styles.compactIcon, { backgroundColor: '#E8F5E9' }]}>
                                                    <FileText size={16} color="#0A4D3C" />
                                                </View>
                                                <View style={styles.compactTextContainer}>
                                                    <Text style={styles.compactLabel}>Description</Text>
                                                    <Text style={styles.compactValue} numberOfLines={2}>
                                                        {selectedItem.description}
                                                    </Text>
                                                </View>
                                            </View>
                                        ) : null}
                                    </View>
                                </>
                            )}
                        </ScrollView>

                        {/* Modal Footer - Action Buttons */}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.modalActionButton, styles.editButton]}
                                onPress={() => {
                                    router.push({
                                        pathname: '/addItem',
                                        params: {
                                            item: encodeURIComponent(JSON.stringify(selectedItem))
                                        }
                                    });
                                    setModalVisible(false);
                                }}
                            >
                                <Pencil size={16} color="#0A4D3C" />
                                <Text style={styles.editButtonText}>Edit</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalActionButton, styles.deleteButton]}
                                onPress={() => handleDelete(selectedItem?.id)}
                                disabled={deletingId === selectedItem?.id}
                            >
                                {deletingId === selectedItem?.id ? (
                                    <ActivityIndicator size="small" color="#EF4444" />
                                ) : (
                                    <>
                                        <Trash2 size={16} color="#EF4444" />
                                        <Text style={styles.deleteButtonText}>Delete</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* FAB Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('./addItem')}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={['#0A4D3C', '#1B6B50']}
                    style={styles.fabGradient}
                >
                    <Plus size={24} color="#FFFFFF" />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
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
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    listContent: {
        padding: 12,
        paddingBottom: 80,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    card: {
        width: (width - 36) / 2,
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardGradient: {
        padding: 12,
    },
    cardContent: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        flex: 1,
    },
    badge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 10,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    cardDivider: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        height: 1,
        marginVertical: 8,
    },
    cardDetails: {
        marginBottom: 8,
    },
    detailRow: {
        gap: 8,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.7)',
        marginRight: 4,
    },
    detailValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
        flex: 1,
        textAlign: 'right',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    actionButtonText: {
        fontSize: 10,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 30,
    },
    lottieAnimation: {
        width: 200,
        height: 150,
        alignSelf: 'center',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0A4D3C',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 8,
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
        shadowColor: '#0A4D3C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    fabGradient: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Modal Styles - Redesigned
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: width - 40,
        maxHeight: height * 0.8,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    modalHeaderContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    modalCloseButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBody: {
        maxHeight: height * 0.5,
    },
    modalBodyContent: {
        padding: 16,
    },
    modalItemNameSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    modalNameContainer: {
        flex: 1,
    },
    modalItemName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0A4D3C',
        marginBottom: 2,
    },
    barcodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    barcodeText: {
        fontSize: 11,
        color: '#64748B',
    },
    modalDivider: {
        backgroundColor: '#E2E8F0',
        height: 1,
        marginVertical: 12,
    },
    // Compact Details Grid
    detailsCompactGrid: {
        gap: 8,
    },
    compactDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    fullWidthCompact: {
        width: '100%',
    },
    compactIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    compactTextContainer: {
        flex: 1,
    },
    compactLabel: {
        fontSize: 10,
        color: '#64748B',
        marginBottom: 2,
    },
    compactValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        gap: 12,
        backgroundColor: '#FFFFFF',
    },
    modalActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        gap: 6,
    },
    editButton: {
        backgroundColor: '#E8F5E9',
        borderWidth: 1,
        borderColor: '#0A4D3C',
    },
    editButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0A4D3C',
    },
    deleteButton: {
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: '#EF4444',
    },
    deleteButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#EF4444',
    },
});