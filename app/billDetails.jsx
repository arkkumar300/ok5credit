// App.js
import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, SafeAreaView, StatusBar, Dimensions } from 'react-native';
import { Appbar, RadioButton, Divider, ActivityIndicator } from 'react-native-paper';
import { ArrowLeft, Download, CheckCircle, FileText, Image as ImageIcon, User, MapPin, Phone, Calendar, Tag, IndianRuque, Percent, Home } from 'lucide-react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CustomRadioButton from './components/CustomRadioButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './components/ApiServices';
import billPDF from './components/billPDF';
import moment from 'moment';
import { LinearGradient } from 'expo-linear-gradient';

export default function BillDetails() {
  const [format, setFormat] = useState('pdf');
  const [billDetails, setbillDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [supplierData, setSupplierData] = useState(null);
  const [items, setItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [taxableAmount, setTaxableAmount] = useState(0);
  const [chargesAmount, setChargesAmount] = useState(0);
  const [itemsAmount, setItemsAmount] = useState(0);
  const [extraCharges, setExtraCharges] = useState([]);
  const [generating, setGenerating] = useState(false);
  const quoteRef = useRef();
  const router = useRouter();
  const { billId, supplierInfo, bill, transaction_for } = useLocalSearchParams();
  // ---------- Parse supplier data ----------
  useEffect(() => {
    if (supplierInfo) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(supplierInfo));
        setSupplierData(parsedData);
      } catch (error) {
        console.error("Failed to parse supplierInfo:", error);
      }
    }
  }, [supplierInfo]);

  // ---------- SHARE OR DOWNLOAD PDF / IMAGE ----------
  const handleDownload = async () => {
    try {
      setGenerating(true);

      if (format === 'pdf') {
        const pdf = await billPDF(userDetails, supplierData, bill, items, extraCharges, totalPrice);

        if (!pdf || !pdf.uri) {
          Alert.alert("Error", "Could not generate PDF");
          setGenerating(false);
          return;
        }

        // 🔥 CORRECT WAY: share PDF
        await Sharing.shareAsync(pdf.uri, {
          mimeType: "application/pdf",
          dialogTitle: "Share PDF"
        });
        setGenerating(false);
        return;
      }

      // ---------- SHARE IMAGE ----------
      const imageUri = await captureRef(quoteRef, { format: 'png', quality: 1 });
      await Sharing.shareAsync(imageUri);
      setGenerating(false);

    } catch (error) {
      console.log("Share error", error);
      Alert.alert('Error', error.message || 'Something went wrong');
      setGenerating(false);
    }
  };

  const fetchUserDetails = async () => {
    const userData = await AsyncStorage.getItem("userData");
    const ownerId = JSON.parse(userData).owner_user_id;
    try {
      setLoading(true);

      const response = await ApiService.get(`/user/${ownerId}`);

      if (!response) { 
        throw new Error("Failed to fetch user data");
      }
      setUserDetails(response.data);

    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setLoading(false);
    }
  };


  // ---------- FETCH BILL ----------
  useEffect(() => {
    const fetchBills = async () => {
      const userData = await AsyncStorage.getItem("userData");
     await fetchUserDetails();

      try {
        setLoading(true);

        const response = await ApiService.get(`/bill/${billId}`);
        const result = response.data;

        // Parse items and charges safely
        const parsedItems = Array.isArray(result.items) ? result.items : JSON.parse(result.items);
        const parsedCharges = Array.isArray(result.ExtraCharges) ? result.ExtraCharges : JSON.parse(result.ExtraCharges);

        setItems(parsedItems);
        setExtraCharges(parsedCharges);
        setbillDetails(result);

        // 🔥 Compute totals NOW using parsed arrays
        const totalItemAmount =
          parsedItems.reduce((sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 0), 0);

        const totalExtra =
          parsedCharges.reduce((sum, c) => sum + Number(c.finalAmount || 0), 0);

        const taxable = Number(result.amount) - (totalItemAmount + totalExtra);

        // Update states with computed values
        setItemsAmount(totalItemAmount);
        setChargesAmount(totalExtra);
        setTaxableAmount(taxable);
        setTotalPrice(result.amount);

      } catch (err) {
        console.error("Error fetching bill:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  const handleDonePress = async () => {
    const personInfo = await JSON.parse(supplierInfo);
      router.navigate({
        pathname: '/customerDetails',
        params: {
          personName: personInfo.name,
          personType: "customer",
          personId: personInfo.id,
        },
      });
    
  };

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
              onPress={() => {
                router.push({
                  pathname: './bills',
                });
              }}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Bill Details</Text>
              <Text style={styles.headerSubtitle}>
                {billDetails?.bill_id || bill || 'Bill'}
              </Text>
            </View>

            <View style={styles.headerRightPlaceholder} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0A4D3C" />
          <Text style={styles.loadingText}>Loading bill details...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Bill Preview Card */}
          <View style={styles.previewCard} ref={quoteRef} collapsable={false}>
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

            {/* Customer/Supplier Info */}
            {supplierData && (
              <View style={styles.customerHeader}>
                <View style={styles.customerIconContainer}>
                  <User size={24} color="#FFFFFF" />
                </View>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{supplierData?.name}</Text>
                  {supplierData?.address && (
                    <View style={styles.infoRow}>
                      <MapPin size={12} color="#64748B" />
                      <Text style={styles.infoText}>{supplierData.address}</Text>
                    </View>
                  )}
                  <View style={styles.infoRow}>
                    <Phone size={12} color="#64748B" />
                    <Text style={styles.infoText}>{supplierData?.mobile}</Text>
                  </View>
                </View>
              </View>
            )}

            <Divider style={styles.divider} />

            {/* Bill Details */}
            <View style={styles.billDetailsRow}>
              <View style={styles.billDetailItem}>
                <Tag size={14} color="#0A4D3C" />
                <Text style={styles.billDetailLabel}>Bill No.</Text>
                <Text style={styles.billDetailValue}>{bill}</Text>
              </View>
              <View style={styles.billDetailItem}>
                <Calendar size={14} color="#0A4D3C" />
                <Text style={styles.billDetailLabel}>Date</Text>
                <Text style={styles.billDetailValue}>{moment().format('DD MMM YYYY')}</Text>
              </View>
            </View>

            {/* Items Table */}
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Item</Text>
                <Text style={styles.tableHeaderCell}>Qty</Text>
                <Text style={styles.tableHeaderCell}>Rate</Text>
                <Text style={styles.tableHeaderCell}>Total</Text>
              </View>

              {items?.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.tableCell}>{item.quantity}</Text>
                  <Text style={styles.tableCell}>₹{item.price}</Text>
                  <Text style={styles.tableCell}>
                    ₹{Number(item.quantity) * Number(item.price)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Summary */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Items Total</Text>
                <Text style={styles.summaryValue}>₹ {parseFloat(itemsAmount).toFixed(2)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Taxable Amount</Text>
                <Text style={styles.summaryValue}>₹ {parseFloat(taxableAmount).toFixed(2)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Charges</Text>
                <Text style={styles.summaryValue}>₹ {parseFloat(chargesAmount).toFixed(2)}</Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TOTAL</Text>
                <Text style={styles.totalAmount}>₹ {parseFloat(totalPrice).toFixed(2)}</Text>
              </View>
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
                <FileText size={20} color={format === 'pdf' ? '#FFFFFF' : '#64748B'} />
                <Text style={[
                  styles.formatOptionText,
                  format === 'pdf' && styles.formatOptionTextActive
                ]}>PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.formatOption,
                  format === 'photo' && styles.formatOptionActive
                ]}
                onPress={() => setFormat('photo')}
              >
                <ImageIcon size={20} color={format === 'photo' ? '#FFFFFF' : '#64748B'} />
                <Text style={[
                  styles.formatOptionText,
                  format === 'photo' && styles.formatOptionTextActive
                ]}>Photo</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.downloadButton}
              onPress={handleDownload}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Download size={20} color="#FFFFFF" />
                  <Text style={styles.downloadButtonText}>Download & Share</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Done Button */}
          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleDonePress}
          >
            <CheckCircle size={20} color="#0A4D3C" />
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
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
  previewCard: {
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
    marginBottom: 16,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  businessIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0A4D3C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
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
  billDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  billDetailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  billDetailLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  billDetailValue: {
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
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
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
    paddingVertical: 8,
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
  summaryContainer: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1E293B',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginTop: 6,
    borderTopWidth: 2,
    borderTopColor: '#0A4D3C',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A4D3C',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A4D3C',
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
    marginBottom: 16,
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
    gap: 8,
    paddingVertical: 14,
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
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  formatOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A4D3C',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#0A4D3C',
    marginBottom: 20,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A4D3C',
  },
});