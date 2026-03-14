// App.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert, StatusBar, Dimensions } from 'react-native';
import { Appbar, Divider, RadioButton, ActivityIndicator } from 'react-native-paper';
import { ArrowLeft, Download, FileText, Calendar, CheckCircle, Clock, IndianRupee, User, MapPin, Phone, Receipt, Tag, Percent } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CustomRadioButton from './components/CustomRadioButton';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import billPDF from './components/billPDF';
import ApiService from './components/ApiServices';
import ProgressButton from './components/ProgressButton';
import { sendTransaction } from '../hooks/sendSMS';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function BillPreview() {
  const [format, setFormat] = useState('unpaid');
  const [userDetails, setUserDetails] = useState(null);
  const [supplierInfo, setCustomerInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [dueDate, setDueDate] = useState(new Date());
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const router = useRouter();
  const { items = [], totalAmount = 0, bill = "", mode = "", extraCharges = [], supplierData = "", transaction_for = "", bill_prm_id = "" } = useLocalSearchParams();
console.log("transaction_for::",transaction_for)
  const parsedItems = items ? JSON.parse(items) : [];
  const parsedExtraCharges = extraCharges ? JSON.parse(extraCharges) : [];
  
  useEffect(() => {
    if (supplierData) {
      setCustomerInfo(JSON.parse(supplierData));
    }
  }, [supplierData]);

  const saveBill = async () => {
    setLoading(true);
    setSuccess(false);
    setUploadProgress(0);
    setIsGeneratingPDF(true);

    try {
      /** STEP 1 → Generate PDF */
      const pdfFile = await billPDF(
        userDetails,
        supplierInfo,
        bill,
        parsedItems,
        parsedExtraCharges,
        totalAmount
      );

      if (!pdfFile) throw new Error("PDF generation failed");
      setIsGeneratingPDF(false);
      setUploadProgress(0.33); // 33% complete

      /** STEP 2 → Upload PDF */
      const uploadData = new FormData();
      uploadData.append("file", {
        uri: pdfFile.uri,
        name: pdfFile.name,
        type: pdfFile.type,
      });

      const uploadRes = await ApiService.post("/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(0.33 + (percentCompleted / 100 * 0.33));
        },
      });

      const uploadedPath = `https://aquaservices.esotericprojects.tech/uploads/${uploadRes.data.file_info.filename}`;
      setUploadProgress(0.66); // 66% complete

      if (mode === "add") {
        /** STEP 3 → Save bill */
        const savedBill = await saveBillToServer(uploadedPath);
        await addTransaction(savedBill);
      } else {
        /** STEP 3 → Update bill */
        const updateBill = await updateBillToServer(uploadedPath);
        await sendTransaction(supplierInfo?.mobile, supplierInfo?.name, totalAmount, userDetails.name, uploadedPath);
      }
      /** 🎉 ALL SUCCESS */
      setSuccess(true);
      setLoading(false);
      setUploadProgress(1);
    } catch (error) {
      console.log("submit error:", error);
      Alert.alert("Error", error.message || "Something went wrong");
      setLoading(false);
      setSuccess(false);
      setIsGeneratingPDF(false);
    }
  };


  const saveBillToServer = async (uploadedPath) => {
    setUploadProgress(0.66); // 66% complete
    const billType = await AsyncStorage.getItem("billType");

    const payload = {
      userId: userDetails?.id,
      transaction_type: "you_gave",
      bill_type: billType,
      payment_status: format,
      transaction_for,
      items: parsedItems.map(it => ({
        name: it.itemName ?? it.name,
        quantity: Number(it.quantity),
        total: Number(it.total),
        price: Number(it.price),
        cessAmount: Number(it.cessAmount),
        cessPercent: Number(it.cessPercent),
        gstAmount: Number(it.gstAmount),
        gstPercent: Number(it.gstPercent),
      })),
      ExtraCharges: parsedExtraCharges,
      bill_file: uploadedPath,
      amount: Number(totalAmount),
      bill_id: bill,
      description: `i have given ${totalAmount} to ${supplierInfo?.name} on ${moment().format('YYYY-MM-DD')}`,
      bill_date: moment().format("YYYY-MM-DD"),
      ...(transaction_for === "supplier"
        ? { supplier_id: supplierInfo?.id }
        : { customer_id: supplierInfo?.id }),
    };
    const billResponse = await ApiService.post(`/bill`, payload);
    return billResponse.data.bill;
  };

  const addTransaction = async (billData) => {
    const date = moment().format("YYYY-MM-DD");
    const userData = await AsyncStorage.getItem("userData");
    const userId = JSON.parse(userData)?.id;
    const ownerId = JSON.parse(userData).owner_user_id;
    const userName = JSON.parse(userData)?.name;
    const formattedDueDate = format === 'unpaid'
      ? moment(dueDate).format('YYYY-MM-DD')
      : undefined;
    const payload = {
      userId,
      ownerId,
      created_user: userId,
      transaction_type: "you_gave",
      transaction_for: transaction_for,
      amount: Number(totalAmount),
      paidAmount: format === 'unpaid' ? 0 : Number(totalAmount),
      remainingAmount: format === 'unpaid' ? Number(totalAmount) : 0,
      paymentType: format === 'paid' ? "paid" : "credit",
      description: "note",
      transaction_date: date,
      bill_id: billData.id,
      ...(format === 'unpaid' && formattedDueDate
        ? { due_date: formattedDueDate }
        : {}),
      ...(transaction_for === "supplier"
        ? { supplier_id: supplierInfo?.id }
        : { customer_id: supplierInfo?.id }),
    };
    const URL = transaction_for === "supplier"
      ? `/transactions/supplier`
      : `/transactions/customer`;
    const response = await ApiService.post(URL, payload);

    const invoice = response.data.transaction.id
    await sendTransaction(supplierInfo.mobile, supplierInfo.name, totalAmount, userName, invoice)
    const encodedCustomer = encodeURIComponent(JSON.stringify(supplierInfo));
    router.push({
      pathname: "/billDetails", 
      params: {
        billId: billData.id,
        supplierInfo: encodedCustomer,
        bill,
        transaction_for
      }
    });

    return response.data;
  };

  // update Bill
  const updateBillToServer = async (uploadedPath) => {
    setUploadProgress(0.66); // 66% complete

    const formattedDueDate = format === 'unpaid'
      ? moment(dueDate).format('YYYY-MM-DD')
      : undefined;
      const userData = await AsyncStorage.getItem("userData");
      const userId = JSON.parse(userData).id;
      const payload = {
      payment_status: format,
      items: parsedItems.map(it => ({
        name: it.itemName ?? it.name,
        quantity: Number(it.quantity),
        total: Number(it.total),
        price: Number(it.price),
        cessAmount: Number(it.cessAmount),
        cessPercent: Number(it.cessPercent),
        gstAmount: Number(it.gstAmount),
        gstPercent: Number(it.gstPercent),
      })),
      ExtraCharges: parsedExtraCharges,
      bill_file: uploadedPath,
      amount: Number(totalAmount),
      bill_id: bill,
      userId:userId,
      description: `i have given ${totalAmount} to ${supplierInfo?.name} on ${moment().format('YYYY-MM-DD')}`,
      bill_date: moment().format("YYYY-MM-DD"),
      paymentType: format === 'paid' ? "paid" : "credit",
      ...(format === 'unpaid' && formattedDueDate
        ? { due_date: formattedDueDate }
        : {}),
    };

    const billResponse = await ApiService.put(`/bill/${bill_prm_id}`, payload);
    const encodedCustomer = encodeURIComponent(JSON.stringify(supplierInfo));

    router.push({
      pathname: "/billDetails",
      params: {
        billId: bill_prm_id,
        supplierInfo: encodedCustomer,
        bill,
        transaction_for
      }
    });
    return billResponse.data.bill;
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
      console.log("ownerData::", response.data)
      setUserDetails(response.data);

    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      const pdfFile = await billPDF(
        userDetails,
        supplierInfo,
        bill,
        parsedItems,
        parsedExtraCharges,
        totalAmount
      );
      setIsGeneratingPDF(false);
      Alert.alert("Success", "PDF generated successfully");
    } catch (error) {
      console.error("PDF generation error:", error);
      Alert.alert("Error", "Failed to generate PDF");
      setIsGeneratingPDF(false);
    }
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
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Bill Preview</Text>
              <Text style={styles.headerSubtitle}>
                {mode === 'add' ? 'Create New Bill' : 'Update Bill'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.downloadHeaderButton}
              onPress={handleDownloadPDF}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Download size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Bill Preview Card */}
        <View style={styles.previewCard}>
          {/* Business Info */}
          <View style={styles.businessHeader}>
            <View style={styles.businessIconContainer}>
              <Receipt size={24} color="#0A4D3C" />
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
          {supplierInfo && (
            <View style={styles.customerHeader}>
              <View style={styles.customerIconContainer}>
                <User size={24} color="#FFFFFF" />
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{supplierInfo?.name}</Text>
                {supplierInfo?.address && (
                  <View style={styles.infoRow}>
                    <MapPin size={12} color="#64748B" />
                    <Text style={styles.infoText}>{supplierInfo.address}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Phone size={12} color="#64748B" />
                  <Text style={styles.infoText}>{supplierInfo?.mobile}</Text>
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
              <Text style={styles.tableHeaderCell}>Price</Text>
              <Text style={styles.tableHeaderCell}>Total</Text>
            </View>

            {parsedItems?.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>
                  {item?.itemName}
                </Text>
                <Text style={styles.tableCell}>{item?.quantity}</Text>
                <Text style={styles.tableCell}>₹{item?.price}</Text>
                <Text style={styles.tableCell}>₹{Number(item?.quantity) * Number(item?.price)}</Text>
              </View>
            ))}
          </View>

          {/* Extra Charges */}
          {parsedExtraCharges?.length > 0 && (
            <View style={styles.chargesContainer}>
              <Text style={styles.chargesTitle}>Charges & Discounts</Text>
              {parsedExtraCharges?.map((item, index) => (
                <View key={index} style={styles.chargeRow}>
                  <View style={styles.chargeInfo}>
                    <Text style={styles.chargeName}>{item?.name}</Text>
                    <View style={styles.chargeTypeBadge}>
                      {item?.discountType === "amount" ? (
                        <IndianRupee size={10} color="#0A4D3C" />
                      ) : (
                        <Percent size={10} color="#0A4D3C" />
                      )}
                      <Text style={styles.chargeTypeText}>
                        {item?.discountType === "amount" ? "Fixed" : "Percentage"}
                      </Text>
                    </View>
                  </View>
                  <Text style={[
                    styles.chargeAmount,
                    item?.type === "charge" ? styles.chargePositive : styles.chargeNegative
                  ]}>
                    {item?.type === "charge" ? "+" : "-"} ₹{parseFloat(item?.finalAmount).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Total Amount */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>₹ {parseFloat(totalAmount).toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Options */}
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Payment Status</Text>

          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                format === 'paid' && styles.paymentOptionActive
              ]}
              onPress={() => setFormat('paid')}
            >
              <View style={[
                styles.radioOuter,
                format === 'paid' && styles.radioOuterActive
              ]}>
                {format === 'paid' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.paymentOptionContent}>
                <CheckCircle size={16} color={format === 'paid' ? '#0A4D3C' : '#64748B'} />
                <Text style={[
                  styles.paymentOptionText,
                  format === 'paid' && styles.paymentOptionTextActive
                ]}>Paid</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                format === 'unpaid' && styles.paymentOptionActive
              ]}
              onPress={() => setFormat('unpaid')}
            >
              <View style={[
                styles.radioOuter,
                format === 'unpaid' && styles.radioOuterActive
              ]}>
                {format === 'unpaid' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.paymentOptionContent}>
                <Clock size={16} color={format === 'unpaid' ? '#0A4D3C' : '#64748B'} />
                <Text style={[
                  styles.paymentOptionText,
                  format === 'unpaid' && styles.paymentOptionTextActive
                ]}>Unpaid</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Due Date Picker */}
          {format === 'unpaid' && (
            <View style={styles.dueDateContainer}>
              <TouchableOpacity
                style={styles.dueDateButton}
                onPress={() => setShowDueDatePicker(true)}
              >
                <Calendar size={18} color="#FFFFFF" />
                <Text style={styles.dueDateButtonText}>
                  Due Date: {dueDate ? moment(dueDate).format('DD MMM YYYY') : ''}
                </Text>
              </TouchableOpacity>

              {showDueDatePicker && (
                <DateTimePicker
                  value={dueDate || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    setShowDueDatePicker(false);
                    if (selectedDate) {
                      setDueDate(selectedDate);
                    }
                  }}
                />
              )}
            </View>
          )}
        </View>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <ProgressButton
            title={mode === 'add' ? 'Create Bill' : 'Update Bill'}
            loading={loading}
            progress={uploadProgress}
            success={success}
            onPress={saveBill}
          />
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
  downloadHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
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
  chargesContainer: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  chargesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0A4D3C',
    marginBottom: 10,
  },
  chargeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  chargeInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chargeName: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '500',
  },
  chargeTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  chargeTypeText: {
    fontSize: 9,
    color: '#0A4D3C',
    fontWeight: '500',
  },
  chargeAmount: {
    fontSize: 13,
    fontWeight: '600',
  },
  chargePositive: {
    color: '#0A4D3C',
  },
  chargeNegative: {
    color: '#EF4444',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#0A4D3C',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A4D3C',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0A4D3C',
  },
  paymentSection: {
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
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  paymentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  paymentOptionActive: {
    borderColor: '#0A4D3C',
    backgroundColor: '#E8F5E9',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioOuterActive: {
    borderColor: '#0A4D3C',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0A4D3C',
  },
  paymentOptionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  paymentOptionTextActive: {
    color: '#0A4D3C',
    fontWeight: '600',
  },
  dueDateContainer: {
    marginTop: 8,
  },
  dueDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A4D3C',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 10,
  },
  dueDateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonContainer: {
    marginBottom: 20,
  },
});