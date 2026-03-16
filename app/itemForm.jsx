import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Text, TextInput, Button, Divider } from 'react-native-paper';
import {
  File,
  Barcode,
  IndianRupee,
  PercentCircle,
  X,
  Package,
  Hash,
  Tag,
  ChevronDown,
  ChevronUp,
  Calculator,
} from 'lucide-react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function ItemForm({ setItem, setNewItem }) {
  const [itemName, setItemName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [barcode, setBarcode] = useState('');
  const [isAddMore, setIsAddMore] = useState(false);
  const [description, setDescription] = useState('');
  const [cess, setCess] = useState('0');
  const [taxType, setTaxType] = useState('inclusive');
  const [gst, setGst] = useState('0');

  const [gstOpen, setGstOpen] = useState(false);
  const [gstItems, setGstItems] = useState([
    { label: 'No GST', value: '0' },
    { label: '0.25%', value: '0.25' },
    { label: '5%', value: '5' },
    { label: '12%', value: '12' },
    { label: '18%', value: '18' },
    { label: '28%', value: '28' },
  ]);

  // Unit dropdown
  const [unitOpen, setUnitOpen] = useState(false);
  const [unit, setUnit] = useState('Nos');
  const [unitItems, setUnitItems] = useState([
    { label: 'Nos', value: 'Nos' },
    { label: 'Items', value: 'Items' },
    { label: 'Grams', value: 'Grams' },
    { label: 'Kg', value: 'Kg' },
    { label: 'Liter', value: 'Liter' },
    { label: 'Meter', value: 'Meter' },
    { label: 'Packages', value: 'Packages' },
    { label: 'Boxes', value: 'Boxes' },
    { label: 'Pieces', value: 'Pieces' },
    { label: 'Dozens', value: 'Dozens' },
    { label: 'Pairs', value: 'Pairs' },
    { label: 'Units', value: 'Units' }
  ]);

  // Show form only when user types item name
  useEffect(() => {
    setShowForm(itemName.trim().length > 0);
  }, [itemName]);

  // Parse numeric values
  const qty = parseFloat(quantity) || 0;
  const basePrice = parseFloat(price) || 0;
  const gstPercent = parseFloat(gst) || 0;
  const cessPercent = parseFloat(cess) || 0;

  const amount = basePrice * qty;

  let gstAmount = 0;
  let cessAmount = 0;
  let total = 0;
  let netPrice = 0;

  if (taxType === 'inclusive') {
    gstAmount = 0;
    cessAmount = 0;
    netPrice = amount;
    total = amount;
  } else {
    gstAmount = (amount * gstPercent) / 100;
    cessAmount = (amount * cessPercent) / 100;
    netPrice = amount;
    total = amount + gstAmount + cessAmount;
  }

  const handleSave = () => {
    const newItem = {
      itemName,
      quantity: qty,
      price: basePrice,
      mrp: parseFloat(mrp) || 0,
      barcode,
      description,
      unit,
      gstPercent,
      gstAmount,
      cessPercent,
      cessAmount,
      taxType,
      total,
    };
    setNewItem(newItem);
    setItem(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A4D3C" />

      {/* Premium Header */}
      <LinearGradient
        colors={['#0A4D3C', '#1B6B50']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Package size={22} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Add New Item</Text>
          </View>
          <TouchableOpacity
            onPress={() => setItem(false)}
            style={styles.closeButton}
          >
            <X size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Enter item details below</Text>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Item Name Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Basic Information
            </Text>

            <Text style={styles.inputLabel}>
              Item Name <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Tag size={16} color="#0A4D3C" style={styles.inputIcon} />
              <TextInput
                placeholder="Enter item name"
                placeholderTextColor="#94A3B8"
                value={itemName}
                onChangeText={setItemName}
                mode="flat"
                textColor="#000000"
                style={styles.input}
                theme={{ colors: { primary: '#0A4D3C', text: '#000000', placeholder: '#94A3B8' } }}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
              />
            </View>
          </View>

          {showForm && (
            <>
              {/* Quantity & Unit Card */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Quantity & Pricing</Text>

                <View style={styles.row}>
                  <View style={styles.halfWidth}>
                    <Text style={styles.inputLabel}>Quantity</Text>
                    <View style={styles.inputWrapper}>
                      <Hash size={16} color="#0A4D3C" style={styles.inputIcon} />
                      <TextInput
                        placeholder="0"
                        placeholderTextColor="#94A3B8"
                        value={quantity}
                        onChangeText={setQuantity}
                        keyboardType="numeric"
                        mode="flat"
                        textColor="#000000"
                        style={styles.input}
                        theme={{ colors: { primary: '#0A4D3C', text: '#000000', placeholder: '#94A3B8' } }}
                        underlineColor="transparent"
                        activeUnderlineColor="transparent"
                      />
                    </View>
                  </View>

                  <View style={[styles.halfWidth, styles.leftMargin]}>
                    <Text style={styles.inputLabel}>Unit</Text>
                    <DropDownPicker
                      open={unitOpen}
                      value={unit}
                      items={unitItems}
                      setOpen={setUnitOpen}
                      setValue={setUnit}
                      setItems={setUnitItems}
                      style={styles.dropdown}
                      dropDownContainerStyle={styles.dropdownContainer}
                      placeholder="Select Unit"
                      placeholderStyle={{ color: '#94A3B8' }}
                      listMode="SCROLLVIEW"
                      textStyle={{ color: '#000000', fontSize: 14 }}
                      zIndex={3000}
                      zIndexInverse={1000}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.halfWidth}>
                    <Text style={styles.inputLabel}>Rate (₹)</Text>
                    <View style={styles.inputWrapper}>
                      <IndianRupee size={16} color="#0A4D3C" style={styles.inputIcon} />
                      <TextInput
                        placeholder="0.00"
                        placeholderTextColor="#94A3B8"
                        value={price}
                        onChangeText={setPrice}
                        keyboardType="numeric"
                        mode="flat"
                        textColor="#000000"
                        style={styles.input}
                        theme={{ colors: { primary: '#0A4D3C', text: '#000000', placeholder: '#94A3B8' } }}
                        underlineColor="transparent"
                        activeUnderlineColor="transparent"
                      />
                    </View>
                  </View>

                  <View style={[styles.halfWidth, styles.leftMargin]}>
                    <Text style={styles.inputLabel}>MRP (₹)</Text>
                    <View style={styles.inputWrapper}>
                      <IndianRupee size={16} color="#0A4D3C" style={styles.inputIcon} />
                      <TextInput
                        placeholder="0.00"
                        placeholderTextColor="#94A3B8"
                        value={mrp}
                        onChangeText={setMrp}
                        keyboardType="numeric"
                        mode="flat"
                        textColor="#000000"
                        style={styles.input}
                        theme={{ colors: { primary: '#0A4D3C', text: '#000000', placeholder: '#94A3B8' } }}
                        underlineColor="transparent"
                        activeUnderlineColor="transparent"
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Advanced Settings Toggle */}
              <TouchableOpacity
                style={styles.advancedToggle}
                onPress={() => setIsAddMore(!isAddMore)}
              >
                <LinearGradient
                  colors={['rgba(10,77,60,0.05)', 'rgba(10,77,60,0.02)']}
                  style={styles.advancedToggleGradient}
                >
                  <Text style={styles.advancedToggleText}>
                    {isAddMore ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
                  </Text>
                  {isAddMore ? (
                    <ChevronUp size={14} color="#0A4D3C" />
                  ) : (
                    <ChevronDown size={14} color="#0A4D3C" />
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {isAddMore && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Advanced Details</Text>

                  {/* Barcode */}
                  <Text style={styles.inputLabel}>HSN Code</Text>
                  <View style={styles.inputWrapper}>
                    <Barcode size={16} color="#0A4D3C" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Enter HSN code"
                      placeholderTextColor="#94A3B8"
                      value={barcode}
                      onChangeText={setBarcode}
                      keyboardType="numeric"
                      mode="flat"
                      style={styles.input}
                      theme={{ colors: { primary: '#0A4D3C', text: '#000000', placeholder: '#94A3B8' } }}
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                    />
                  </View>

                  {/* Tax Type Toggle */}
                  <Text style={[styles.inputLabel, { marginTop: 8 }]}>Tax Type</Text>
                  <View style={styles.taxToggleRow}>
                    <TouchableOpacity
                      style={[
                        styles.taxToggleButton,
                        taxType === 'inclusive' && styles.taxToggleActive
                      ]}
                      onPress={() => setTaxType('inclusive')}
                    >
                      <Text style={[
                        styles.taxToggleText,
                        taxType === 'inclusive' && styles.taxToggleTextActive
                      ]}>
                        Inclusive
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.taxToggleButton,
                        taxType === 'exclusive' && styles.taxToggleActive
                      ]}
                      onPress={() => setTaxType('exclusive')}
                    >
                      <Text style={[
                        styles.taxToggleText,
                        taxType === 'exclusive' && styles.taxToggleTextActive
                      ]}>
                        Exclusive
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* GST & CESS */}
                  <View style={styles.row}>
                    <View style={styles.halfWidth}>
                      <Text style={styles.inputLabel}>GST (%)</Text>
                      <DropDownPicker
                        open={gstOpen}
                        value={gst}
                        items={gstItems}
                        setOpen={setGstOpen}
                        setValue={setGst}
                        setItems={setGstItems}
                        style={styles.dropdown}
                        dropDownContainerStyle={styles.dropdownContainer}
                        placeholder="Select GST"
                        placeholderStyle={{ color: '#94A3B8' }}
                        listMode="SCROLLVIEW"
                        textStyle={{ color: '#000000', fontSize: 14 }}
                        zIndex={2000}
                        zIndexInverse={2000}
                      />
                    </View>

                    <View style={[styles.halfWidth, styles.leftMargin]}>
                      <Text style={styles.inputLabel}>CESS (%)</Text>
                      <View style={styles.inputWrapper}>
                        <PercentCircle size={16} color="#0A4D3C" style={styles.inputIcon} />
                        <TextInput
                          placeholder="0"
                          placeholderTextColor="#94A3B8"
                          value={cess}
                          onChangeText={setCess}
                          keyboardType="numeric"
                          mode="flat"
                          style={styles.input}
                          theme={{ colors: { primary: '#0A4D3C', text: '#000000', placeholder: '#94A3B8' } }}
                          underlineColor="transparent"
                          activeUnderlineColor="transparent"
                        />
                      </View>
                    </View>
                  </View>

                  {/* Description */}
                  <Text style={styles.inputLabel}>Description</Text>
                  <View style={styles.inputWrapper}>
                    <File size={16} color="#0A4D3C" style={styles.inputIcon} />
                    <TextInput
                      placeholder="Enter description"
                      placeholderTextColor="#94A3B8"
                      value={description}
                      onChangeText={setDescription}
                      mode="flat"
                      style={[styles.input, styles.textArea]}
                      multiline
                      numberOfLines={2}
                      theme={{ colors: { primary: '#0A4D3C', text: '#000000', placeholder: '#94A3B8' } }}
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                    />
                  </View>
                </View>
              )}

              {/* Calculation Summary Card */}
              <LinearGradient
                colors={['rgba(10,77,60,0.04)', 'rgba(10,77,60,0.01)']}
                style={styles.calculationCard}
              >
                <View style={styles.calculationHeader}>
                  <Calculator size={16} color="#0A4D3C" />
                  <Text style={styles.calculationTitle}>Calculation Summary</Text>
                </View>

                <View style={styles.calculationRow}>
                  <Text style={styles.calculationLabel}>Quantity × Rate</Text>
                  <Text style={styles.calculationValue}>{qty} × ₹{basePrice.toFixed(2)}</Text>
                </View>

                <View style={styles.calculationRow}>
                  <Text style={styles.calculationLabel}>Net Amount</Text>
                  <Text style={styles.calculationValue}>₹{netPrice.toFixed(2)}</Text>
                </View>

                {taxType === 'exclusive' && gstPercent > 0 && (
                  <View style={styles.calculationRow}>
                    <Text style={styles.calculationLabel}>GST ({gstPercent}%)</Text>
                    <Text style={styles.calculationValue}>₹{gstAmount.toFixed(2)}</Text>
                  </View>
                )}

                {taxType === 'exclusive' && cessPercent > 0 && (
                  <View style={styles.calculationRow}>
                    <Text style={styles.calculationLabel}>CESS ({cessPercent}%)</Text>
                    <Text style={styles.calculationValue}>₹{cessAmount.toFixed(2)}</Text>
                  </View>
                )}

                <View style={styles.calculationDivider} />

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
                </View>
              </LinearGradient>

              {/* Action Buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setItem(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSave}
                >
                  <LinearGradient
                    colors={['#0A4D3C', '#1B6B50']}
                    style={styles.saveGradient}
                  >
                    <Text style={styles.saveButtonText}>Save Item</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? 40 : 0,
    paddingBottom: 12,
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A4D3C',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
    marginLeft: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  requiredStar: {
    color: '#DC2626',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.15)',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    marginBottom: 12,
    minHeight: 30,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: 14,
    paddingVertical: 0,
    color: '#000000',
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  halfWidth: {
    flex: 1,
  },
  leftMargin: {
    marginLeft: 10,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.15)',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    minHeight: 44,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.15)',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  advancedToggle: {
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  advancedToggleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.2)',
    borderRadius: 14,
  },
  advancedToggleText: {
    fontSize: 13,
    color: '#0A4D3C',
    fontWeight: '600',
  },
  taxToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  taxToggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.2)',
    backgroundColor: '#FFFFFF',
  },
  taxToggleActive: {
    backgroundColor: '#0A4D3C',
    borderColor: '#0A4D3C',
  },
  taxToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0A4D3C',
  },
  taxToggleTextActive: {
    color: '#FFFFFF',
  },
  calculationCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(10,77,60,0.1)',
  },
  calculationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  calculationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A4D3C',
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calculationLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  calculationValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  calculationDivider: {
    height: 1,
    backgroundColor: 'rgba(10,77,60,0.1)',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A4D3C',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  button: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    overflow: 'hidden',
  },
  saveGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});