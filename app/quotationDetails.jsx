// App.js
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Appbar, Divider, ActivityIndicator } from 'react-native-paper';
import { ArrowLeft, Download, FileText, User, MapPin, Phone, Calendar, Tag, Award, Eye } from 'lucide-react-native';
import { captureRef } from 'react-native-view-shot';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CustomRadioButton from './components/CustomRadioButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';
import billPDF from './components/billPDF';
import moment from 'moment';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function QuotationDetails() {
  const [format, setFormat] = useState('pdf');
  const [billDetails, setbillDetails] = useState(null);
  const [loading, setLoading] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [items, setItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const quoteRef = useRef();
  const router = useRouter();
  const { billId, customerInfo, bill } = useLocalSearchParams()
  useEffect(() => {
    if (customerInfo) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(customerInfo));
        setCustomerData(parsedData);
        console.log("Parsed customer info:", parsedData.mobile);
      } catch (error) {
        console.error("Failed to parse customerInfo:", error);
      }
    }
  }, [customerInfo]);

  const handleDownload = async () => {
    try {
      setDownloading(true);

      if (format === 'pdf') {
        // Generate PDF
        const pdf = await billPDF(userDetails, customerData, bill, items, [], totalPrice);

        if (!pdf || !pdf.uri) {
          Alert.alert("Error", "Could not generate PDF");
          setDownloading(false);
          return;
        }

        // Share PDF
        await Sharing.shareAsync(pdf.uri, {
          mimeType: "application/pdf",
          dialogTitle: "Share Quotation"
        });
        setDownloading(false);
      } else {
        // Capture and share image
        const uri = await captureRef(quoteRef, {
          format: 'png',
          quality: 1,
        });
        await Sharing.shareAsync(uri);
        setDownloading(false);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Something went wrong');
      setDownloading(false);
    }
  };

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const userData = await AsyncStorage.getItem("userData");
        if (userData) {
          setUserDetails(JSON.parse(userData));
        }

        setLoading(true);

        // Fix: Use GET instead of POST for fetching bill details
        const response = await ApiService.get(`/bill/${billId}`);

        if (response.data) {
          const result = response.data;
          setBillDetails(result);

          // Parse items if they're stored as JSON string
          let parsedItems = [];
          if (result?.items) {
            if (Array.isArray(result.items)) {
              parsedItems = result.items;
            } else if (typeof result.items === 'string') {
              try {
                parsedItems = JSON.parse(result.items);
              } catch (e) {
                console.error('Error parsing items:', e);
                parsedItems = [];
              }
            }
          }

          setItems(parsedItems);

          const totalAmount = parsedItems.reduce(
            (sum, item) => sum + (parseFloat(item.price || 0) * parseFloat(item.quantity || 0)),
            0
          );
          setTotalPrice(totalAmount);
        }
      } catch (error) {
        console.error('Error fetching bills:', error);
        Alert.alert(
          'Error',
          'Failed to load quotation details. Please try again.',
          [
            { text: 'OK', onPress: () => router.back() }
          ]
        );
      } finally {
        setLoading(false);
      }
    };

    if (billId) {
      fetchBills();
    } else {
      setLoading(false);
      Alert.alert('Error', 'Bill ID not found');
    }
  }, [billId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0A4D3C" />
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
                <Text style={styles.headerTitle}>Quotation Details</Text>
                <Text style={styles.headerSubtitle}>Loading...</Text>
              </View>

              <View style={styles.headerRightPlaceholder}>
                <Award size={20} color="rgba(255,255,255,0.8)" />
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0A4D3C" />
          <Text style={styles.loadingText}>Loading quotation details...</Text>
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
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Quotation Details</Text>
              <Text style={styles.headerSubtitle}>
                {billDetails?.bill_id || bill || 'Quotation'}
              </Text>
            </View>

            <View style={styles.headerRightPlaceholder}>
              <Award size={20} color="rgba(255,255,255,0.8)" />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quotation Card */}
        <View style={styles.quotationCard} ref={quoteRef} collapsable={false}>
          {/* Business Info */}
          <View style={styles.businessHeader}>
            <View style={styles.businessIconContainer}>
              <FileText size={24} color="#0A4D3C" />
            </View>
            <View style={styles.businessInfo}>
              <Text style={styles.businessName}>{userDetails?.name || 'Business Name'}</Text>
              {userDetails?.address && (
                <View style={styles.infoRow}>
                  <MapPin size={12} color="#64748B" />
                  <Text style={styles.infoText}>{userDetails.address}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Phone size={12} color="#64748B" />
                <Text style={styles.infoText}>{userDetails?.mobile}</Text>
              </View>
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Customer Info */}
          {customerData && (
            <View style={styles.customerHeader}>
              <View style={styles.customerIconContainer}>
                <User size={24} color="#FFFFFF" />
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{customerData?.name}</Text>
                {customerData?.address && (
                  <View style={styles.infoRow}>
                    <MapPin size={12} color="#64748B" />
                    <Text style={styles.infoText}>{customerData.address}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Phone size={12} color="#64748B" />
                  <Text style={styles.infoText}>{customerData?.mobile}</Text>
                </View>
              </View>
            </View>
          )}

          <Divider style={styles.divider} />

          {/* Quote Details */}
          <View style={styles.quoteDetailsRow}>
            <View style={styles.quoteDetailItem}>
              <Tag size={14} color="#0A4D3C" />
              <Text style={styles.quoteDetailLabel}>Quote No.</Text>
              <Text style={styles.quoteDetailValue}>{bill || billDetails?.bill_id}</Text>
            </View>
            <View style={styles.quoteDetailItem}>
              <Calendar size={14} color="#0A4D3C" />
              <Text style={styles.quoteDetailLabel}>Date</Text>
              <Text style={styles.quoteDetailValue}>
                {billDetails?.bill_date ? moment(billDetails.bill_date).format('DD MMM YYYY') : moment().format('DD MMM YYYY')}
              </Text>
            </View>
          </View>

          {/* Items Table */}
          {items.length > 0 ? (
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Item</Text>
                <Text style={styles.tableHeaderCell}>Qty</Text>
                <Text style={styles.tableHeaderCell}>Rate</Text>
                <Text style={styles.tableHeaderCell}>Total</Text>
              </View>

              {items.map((item, index) => {
                const itemTotal = Number(item?.quantity || 0) * Number(item?.price || 0);
                return (
                  <View key={index} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>
                      {item?.name || item?.itemName || 'Item'}
                    </Text>
                    <Text style={styles.tableCell}>{item?.quantity || 0}</Text>
                    <Text style={styles.tableCell}>₹{Number(item?.price || 0).toFixed(2)}</Text>
                    <Text style={styles.tableCell}>₹{itemTotal.toFixed(2)}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.noItemsContainer}>
              <Text style={styles.noItemsText}>No items in this quotation</Text>
            </View>
          )}

          {/* Total */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>₹ {Number(totalPrice).toFixed(2)}</Text>
          </View>

          {/* Footer Note */}
          <View style={styles.footerNote}>
            <Text style={styles.noteText}>
              This is a computer generated quotation
            </Text>
          </View>
        </View>

        {/* Action Section */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>Download Format</Text>

          <View style={styles.formatOptions}>
            <TouchableOpacity
              style={[
                styles.formatOption,
                format === 'pdf' && styles.formatOptionActive
              ]}
              onPress={() => setFormat('pdf')}
            >
              <FileText size={18} color={format === 'pdf' ? '#FFFFFF' : '#64748B'} />
              <Text style={[
                styles.formatOptionText,
                format === 'pdf' && styles.formatOptionTextActive
              ]}>PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.formatOption,
                format === 'image' && styles.formatOptionActive
              ]}
              onPress={() => setFormat('image')}
            >
              <Eye size={18} color={format === 'image' ? '#FFFFFF' : '#64748B'} />
              <Text style={[
                styles.formatOptionText,
                format === 'image' && styles.formatOptionTextActive
              ]}>Image</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.downloadButton}
            onPress={handleDownload}
            disabled={downloading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#0A4D3C', '#1B6B50']}
              style={styles.downloadButtonGradient}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Download size={20} color="#FFFFFF" />
                  <Text style={styles.downloadButtonText}>Download & Share</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    fontSize: 18,
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
    alignItems: 'center',
    justifyContent: 'center',
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
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  quotationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.1)',
    marginBottom: 16,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  businessIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A4D3C',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#0A4D3C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 12,
    color: '#64748B',
  },
  divider: {
    backgroundColor: '#E2E8F0',
    height: 1,
    marginVertical: 16,
  },
  quoteDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quoteDetailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quoteDetailLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  quoteDetailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0A4D3C',
    marginLeft: 'auto',
  },
  tableContainer: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
    color: '#1E293B',
    textAlign: 'center',
  },
  noItemsContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  noItemsText: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#0A4D3C',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A4D3C',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A4D3C',
  },
  footerNote: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  noteText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  actionSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A4D3C',
    marginBottom: 16,
  },
  formatOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  formatOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  formatOptionActive: {
    backgroundColor: '#0A4D3C',
    borderColor: '#0A4D3C',
  },
  formatOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  formatOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  downloadButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#0A4D3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  downloadButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  downloadButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});