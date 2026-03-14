// App.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Appbar, Divider, RadioButton, ActivityIndicator } from 'react-native-paper';
import { ArrowLeft, Download, FileText, User, MapPin, Phone, Calendar, Tag, CheckCircle, Award } from 'lucide-react-native';
import { captureRef } from 'react-native-view-shot';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CustomRadioButton from './components/CustomRadioButton';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import billPDF from './components/billPDF';
import ApiService from './components/ApiServices';
import { LinearGradient } from 'expo-linear-gradient';

export default function QuotePreview() {
  const [userDetails, setUserDetails] = useState(null);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { items, totalAmount, bill, customerData } = useLocalSearchParams();
  const parsedItems = items ? JSON.parse(items) : [];

  useEffect(() => {
    if (customerData) {
      setCustomerInfo(JSON.parse(customerData));
    }
  }, [customerData]);

  const saveBill = async () => {
    if (saving) return;

    setSaving(true);
    setLoading(true);

    const pdfFile = await billPDF(userDetails, customerInfo, bill, parsedItems, totalAmount);
   
    if (!pdfFile) {
      Alert.alert('Error', 'Failed to generate PDF');
      setSaving(false);
      setLoading(false);
      return;
    }

    try {

      const uploadData = new FormData();
      uploadData.append('file', {
        uri: pdfFile.uri,
        name: pdfFile.name,
        type: pdfFile.type
      });

      const response = await ApiService.post(`/upload`, uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadJson = await response.data;
      const uploadedPath = `https://aquaservices.esotericprojects.tech/uploads/${uploadJson.file_info.filename}`;
      handleSave(uploadedPath)
    } catch (error) {
      console.log("error ::", error);
      Alert.alert('Error', 'Failed to save quotation');
      setSaving(false);
      setLoading(false);
    }
  }

  const handleSave = async (uploadedPath) => {
    try {

      // 2. upload PDF
      if (!uploadedPath) {
        console.log("no pdf path")
        return;
      }
      const billType = await AsyncStorage.getItem("billType");
      // 3. Call bill API
      const payload = {
        userId: userDetails?.id,
        customer_id: customerInfo?.id, // or wherever you get this in your screen
        transaction_type: "you_gave",
        bill_type: billType,
        transaction_for: "customer",
        items: parsedItems.map(it => ({
          name: it.itemName ?? it.name,
          quantity: Number(it.quantity),
          price: Number(it.price)
        })),
        bill_file: uploadedPath,
        amount: Number(totalAmount),
        bill_id: bill,
        description: "Purchase of goods",
        bill_date: moment().format('YYYY-MM-DD')
      };
      const encodedCustomerData = encodeURIComponent(JSON.stringify(customerInfo)); 
     const response= await ApiService.post(`/bill`, payload);
     const billData=response.data.bill
     
     setSaving(false);
     setLoading(false);
     
     Alert.alert(
      'Success',
      'Quotation saved successfully',
      [
        {
          text: 'View Details',
          onPress: () => {
            router.push({
              pathname: '/quotationDetails',
              params: {
                billId: billData?.id,
                customerInfo: encodedCustomerData,
                bill: bill
              }
            });
          }
        }
      ]
    );
  } catch (error) {
      console.error("handleSave error", error);
      Alert.alert("Error", "An unexpected error occurred");
      setSaving(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchBills = async () => {
      const userData = await AsyncStorage.getItem("userData");
      setUserDetails(JSON.parse(userData));
    }
    fetchBills();
  }, []);

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
              <Text style={styles.headerTitle}>Quote Preview</Text>
              <Text style={styles.headerSubtitle}>
                Review your quotation
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
        {/* Watermark */}
        <View style={styles.watermarkContainer}>
          <Text style={styles.watermarkText}>QUOTATION</Text>
        </View>

        {/* Preview Card */}
        <View style={styles.previewCard}>
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
          {customerInfo && (
            <View style={styles.customerHeader}>
              <View style={styles.customerIconContainer}>
                <User size={24} color="#FFFFFF" />
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{customerInfo?.name}</Text>
                {customerInfo?.address && (
                  <View style={styles.infoRow}>
                    <MapPin size={12} color="#64748B" />
                    <Text style={styles.infoText}>{customerInfo.address}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Phone size={12} color="#64748B" />
                  <Text style={styles.infoText}>{customerInfo?.mobile}</Text>
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
              <Text style={styles.quoteDetailValue}>{bill}</Text>
            </View>
            <View style={styles.quoteDetailItem}>
              <Calendar size={14} color="#0A4D3C" />
              <Text style={styles.quoteDetailLabel}>Date</Text>
              <Text style={styles.quoteDetailValue}>{moment().format('DD MMM YYYY')}</Text>
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

            {parsedItems?.map((item, index) => {
              const itemTotal = Number(item?.quantity) * Number(item?.price);
              return (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>
                    {item?.name || item?.itemName}
                  </Text>
                  <Text style={styles.tableCell}>{item?.quantity}</Text>
                  <Text style={styles.tableCell}>₹{Number(item?.price).toFixed(2)}</Text>
                  <Text style={styles.tableCell}>₹{itemTotal.toFixed(2)}</Text>
                </View>
              );
            })}
          </View>

          {/* Total */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>₹ {Number(totalAmount).toFixed(2)}</Text>
          </View>

          {/* Footer Note */}
          <View style={styles.footerNote}>
            <Text style={styles.noteText}>
              This is a computer generated quotation
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveBill}
          disabled={saving}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#0A4D3C', '#1B6B50']}
            style={styles.saveButtonGradient}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Download size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Quotation</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  watermarkContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    opacity: 0.05,
    transform: [{ rotate: '-30deg' }],
  },
  watermarkText: {
    fontSize: 60,
    fontWeight: '900',
    color: '#0A4D3C',
    letterSpacing: 10,
  },
  previewCard: {
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
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0A4D3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});