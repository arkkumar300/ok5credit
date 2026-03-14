import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, StatusBar, Dimensions, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Appbar, Divider, Card, ActivityIndicator } from 'react-native-paper';
import DropDownPicker from 'react-native-dropdown-picker';
import { ArrowLeft, File, Barcode, IndianRupee, Percent, Package, Tag, Scale, Info, CheckCircle } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ApiService from './components/ApiServices';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function AddEditItem() {
  const { item } = useLocalSearchParams();
  const [selectedItem, setSelectedItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // Dropdown states
  const [unitOpen, setUnitOpen] = useState(false);
  const [gstOpen, setGstOpen] = useState(false);
  const [rateTypeOpen, setRateTypeOpen] = useState(false);

  useEffect(() => {
    if (item) {
      try {
        const parsedItem = JSON.parse(decodeURIComponent(item));
        setSelectedItem(parsedItem);
        setId(parsedItem.id || '');
        setItemName(parsedItem.itemName || '');
        setQuantity(String(parsedItem.quantity ?? ''));
        setPrice(String(parsedItem.price ?? ''));
        setMrp(String(parsedItem.mrp ?? ''));
        setBarcode(parsedItem.barcode || '');
        setDescription(parsedItem.description || '');
        setCess(String(parsedItem.cess ?? ''));
        setUnitValue(parsedItem.unitValue || 'Nos');
        setGstValue(String(parsedItem.gstValue ?? '0.25'));
        setRateTypeValue(parsedItem.rateType || 'inclusive');
      } catch (e) {
        console.error('Invalid item param:', e);
      }
    }
  }, [item]);

  const [id, setId] = useState('');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [barcode, setBarcode] = useState('');
  const [description, setDescription] = useState('');
  const [cess, setCess] = useState('');

  const [unitValue, setUnitValue] = useState('Nos');
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

  const [gstValue, setGstValue] = useState('0.25');
  const [gstItems, setGstItems] = useState([
    { label: '0.25%', value: '0.25' },
    { label: '3%', value: '3' },
    { label: '5%', value: '5' },
    { label: '12%', value: '12' },
    { label: '18%', value: '18' },
    { label: '28%', value: '28' }
  ]);

  const [rateTypeValue, setRateTypeValue] = useState('inclusive');
  const [rateTypeItems, setRateTypeItems] = useState([
    { label: 'Rate Including Tax', value: 'inclusive' },
    { label: 'Rate Excluding Tax', value: 'exclusive' }
  ]);

  // Handle dropdown opens
  const handleUnitOpen = () => {
    setGstOpen(false);
    setRateTypeOpen(false);
  };

  const handleGstOpen = () => {
    setUnitOpen(false);
    setRateTypeOpen(false);
  };

  const handleRateTypeOpen = () => {
    setUnitOpen(false);
    setGstOpen(false);
  };

  const calculateTax = ({
    qty,
    rate,
    gstPercent,
    cessPercent,
    rateType,
  }) => {
    qty = Number(qty) || 0;
    rate = Number(rate) || 0;
    gstPercent = Number(gstPercent) || 0;
    cessPercent = Number(cessPercent) || 0;

    const totalTaxPercent = gstPercent + cessPercent;

    let taxableAmount = 0;
    let gstAmount = 0;
    let cessAmount = 0;
    let totalAmount = 0;

    if (rateType === 'inclusive') {
      totalAmount = rate * qty;
      taxableAmount = (totalAmount * 100) / (100 + totalTaxPercent);
      gstAmount = (taxableAmount * gstPercent) / 100;
      cessAmount = (taxableAmount * cessPercent) / 100;
    } else {
      taxableAmount = rate * qty;
      gstAmount = (taxableAmount * gstPercent) / 100;
      cessAmount = (taxableAmount * cessPercent) / 100;
      totalAmount = taxableAmount + gstAmount + cessAmount;
    }

    return {
      taxableAmount,
      gstAmount,
      cessAmount,
      totalAmount,
    };
  };

  const {
    taxableAmount,
    gstAmount,
    cessAmount,
    totalAmount,
  } = calculateTax({
    qty: quantity,
    rate: price,
    gstPercent: gstValue,
    cessPercent: cess,
    rateType: rateTypeValue,
  });

  const handleSave = async () => {
    if (saving) return;

    setSaving(true);

    const newItem = {
      itemName,
      quantity: Number(quantity),
      price: Number(price),
      gstValue: Number(gstValue),
      mrp: Number(mrp),
      barcode,
      description,
      cess,
      unitValue,
      rateType: rateTypeValue,
      taxableAmount: Number(taxableAmount.toFixed(2)),
      gstAmount: Number(gstAmount.toFixed(2)),
      cessAmount: Number(cessAmount.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
    };

    try {
      let response;
      if (id) {
        response = await ApiService.put(`/item/${id}`, newItem);
      } else {
        response = await ApiService.post('/item', newItem);
      }

      if (response?.data) {
        router.replace('./items');
      }
    } catch (err) {
      console.error("Error saving item:", err);
    } finally {
      setSaving(false);
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
              <Text style={styles.headerTitle}>
                {selectedItem ? 'Edit Item' : 'Add New Item'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {selectedItem ? 'Update item details' : 'Create a new item'}
              </Text>
            </View>

            <View style={styles.headerRightPlaceholder} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={!unitOpen && !gstOpen && !rateTypeOpen}
      >
        {/* Item Name Card */}
        <Card style={styles.formCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Package size={18} color="#0A4D3C" />
              <Text style={styles.sectionTitle}>Basic Information</Text>
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                label="Item Name"
                placeholder="Enter item name"
                placeholderTextColor="#94A3B8"
                value={itemName}
                onChangeText={setItemName}
                left={<TextInput.Icon icon={() => <File size={18} color="#64748B" />} />}
                mode="outlined"
                style={styles.input}
                outlineColor="#E2E8F0"
                activeOutlineColor="#0A4D3C"
              />
            </View>
          </Card.Content>
        </Card>

        {/* Quantity & Unit Card */}
        <Card style={styles.formCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Scale size={18} color="#0A4D3C" />
              <Text style={styles.sectionTitle}>Quantity & Unit</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <TextInput
                  label="Quantity"
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                  outlineColor="#E2E8F0"
                  activeOutlineColor="#0A4D3C"
                />
              </View>

              <View style={styles.halfInput}>
                <DropDownPicker
                  open={unitOpen}
                  value={unitValue}
                  items={unitItems}
                  setOpen={setUnitOpen}
                  setValue={setUnitValue}
                  setItems={setUnitItems}
                  onOpen={handleUnitOpen}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownList}
                  textStyle={styles.dropdownText}
                  placeholder="Select Unit"
                  listMode="SCROLLVIEW"
                  zIndex={3000}
                  zIndexInverse={1000}
                  dropDownDirection="AUTO"
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Pricing Card */}
        <Card style={styles.formCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <IndianRupee size={18} color="#0A4D3C" />
              <Text style={styles.sectionTitle}>Pricing Details</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <TextInput
                  label="Rate (₹)"
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  left={<TextInput.Icon icon={() => <IndianRupee size={16} color="#64748B" />} />}
                  mode="outlined"
                  style={styles.input}
                  outlineColor="#E2E8F0"
                  activeOutlineColor="#0A4D3C"
                />
              </View>

              <View style={styles.halfInput}>
                <TextInput
                  label="MRP (₹)"
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  value={mrp}
                  onChangeText={setMrp}
                  keyboardType="numeric"
                  left={<TextInput.Icon icon={() => <Tag size={16} color="#64748B" />} />}
                  mode="outlined"
                  style={styles.input}
                  outlineColor="#E2E8F0"
                  activeOutlineColor="#0A4D3C"
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Tax Card */}
        <Card style={styles.formCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Percent size={18} color="#0A4D3C" />
              <Text style={styles.sectionTitle}>Tax Information</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <DropDownPicker
                  open={gstOpen}
                  value={gstValue}
                  items={gstItems}
                  setOpen={setGstOpen}
                  setValue={setGstValue}
                  setItems={setGstItems}
                  onOpen={handleGstOpen}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownList}
                  textStyle={styles.dropdownText}
                  placeholder="GST %"
                  listMode="SCROLLVIEW"
                  zIndex={2000}
                  zIndexInverse={2000}
                  dropDownDirection="AUTO"
                />
              </View>

              <View style={styles.halfInput}>
                <TextInput
                  label="CESS %"
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  value={cess}
                  onChangeText={setCess}
                  keyboardType="numeric"
                  left={<TextInput.Icon icon={() => <Percent size={16} color="#64748B" />} />}
                  mode="outlined"
                  style={styles.input}
                  outlineColor="#E2E8F0"
                  activeOutlineColor="#0A4D3C"
                />
              </View>
            </View>

            <View style={styles.fullWidthDropdown}>
              <DropDownPicker
                open={rateTypeOpen}
                value={rateTypeValue}
                items={rateTypeItems}
                setOpen={setRateTypeOpen}
                setValue={setRateTypeValue}
                setItems={setRateTypeItems}
                onOpen={handleRateTypeOpen}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownList}
                textStyle={styles.dropdownText}
                placeholder="Rate Type"
                listMode="SCROLLVIEW"
                zIndex={1000}
                zIndexInverse={3000}
                dropDownDirection="AUTO"
              />
            </View>
          </Card.Content>
        </Card>

        {/* Additional Info Card */}
        <Card style={styles.formCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Info size={18} color="#0A4D3C" />
              <Text style={styles.sectionTitle}>Additional Information</Text>
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                label="Barcode"
                placeholder="Enter barcode"
                placeholderTextColor="#94A3B8"
                value={barcode}
                onChangeText={setBarcode}
                left={<TextInput.Icon icon={() => <Barcode size={18} color="#64748B" />} />}
                mode="outlined"
                style={styles.input}
                outlineColor="#E2E8F0"
                activeOutlineColor="#0A4D3C"
              />
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                label="Description"
                placeholder="Enter description"
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={setDescription}
                left={<TextInput.Icon icon={() => <File size={18} color="#64748B" />} />}
                mode="outlined"
                style={[styles.input, styles.textArea]}
                outlineColor="#E2E8F0"
                activeOutlineColor="#0A4D3C"
                multiline
                numberOfLines={3}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Tax Summary Card */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <View style={styles.summaryHeader}>
              <CheckCircle size={18} color="#0A4D3C" />
              <Text style={styles.summaryTitle}>Tax Summary</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Taxable Amount</Text>
              <Text style={styles.summaryValue}>₹ {taxableAmount.toFixed(2)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>GST @ {gstValue}%</Text>
              <Text style={styles.summaryValue}>₹ {gstAmount.toFixed(2)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>CESS @ {cess || 0}%</Text>
              <Text style={styles.summaryValue}>₹ {cessAmount.toFixed(2)}</Text>
            </View>

            <Divider style={styles.summaryDivider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹ {totalAmount.toFixed(2)}</Text>
            </View>

            <View style={styles.calculationNote}>
              <Text style={styles.noteText}>
                {quantity || 0} × ₹ {Number(price || 0).toFixed(2)}
                {rateTypeValue === 'inclusive' ? ' (incl. tax)' : ' (excl. tax)'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={handleSave}
            disabled={saving}
          >
            <LinearGradient
              colors={['#0A4D3C', '#1B6B50']}
              style={styles.saveButtonGradient}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle size={18} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>
                    {selectedItem ? 'Update Item' : 'Save Item'}
                  </Text>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  formCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A4D3C',
  },
  inputWrapper: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    height: 48,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  halfInput: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
  },
  fullWidthDropdown: {
    height: 48,
    justifyContent: 'center',
    marginTop: 8,
  },
  dropdown: {
    borderColor: '#E2E8F0',
    borderRadius: 8,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
  },
  dropdownList: {
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownText: {
    fontSize: 14,
    color: '#1E293B',
  },
  summaryCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A4D3C',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E293B',
  },
  summaryDivider: {
    backgroundColor: '#E2E8F0',
    height: 1,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A4D3C',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A4D3C',
  },
  calculationNote: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
  },
  noteText: {
    fontSize: 11,
    color: '#0A4D3C',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  saveButton: {
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});