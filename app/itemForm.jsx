import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Divider } from 'react-native-paper';
import { File, Barcode, IndianRupee, PercentCircle } from 'lucide-react-native';
import DropDownPicker from 'react-native-dropdown-picker';

export default function ItemForm({ setItem, setNewItem }) {
  const [itemName, setItemName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [barcode, setBarcode] = useState('568848705');
  const [isAddMore, setIsAddMore] = useState(false);
  const [description, setDescription] = useState('');
  const [cess, setCess] = useState('0');
  const [taxType, setTaxType] = useState('inclusive');
  const [gst, setGst] = useState('0');

  const [gstOpen, setGstOpen] = useState(false);
  //   const [gstValue, setGstValue] = useState('0');
  const [gstItems, setGstItems] = useState([
    { label: 'No GST', value: '0' },
    { label: '0.25%', value: '0.25' },
    { label: '5%', value: '5' },
    { label: '12%', value: '12' },
    { label: '18%', value: '18' },
  ]);


  // Unit dropdown
  const [unitOpen, setUnitOpen] = useState(false);
  const [unit, setUnit] = useState('Nos');
  const [unitItems, setUnitItems] = useState([
    { label: 'Nos', value: 'Nos' },
    { label: 'Items', value: 'Items' },
    { label: 'Packages', value: 'Packages' },
    { label: 'Boxes', value: 'Boxes' },
    { label: 'Dozens', value: 'Dozens' },
    { label: 'Pairs', value: 'Pairs' },
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
  let netPrice = 0; // price without tax

  if (taxType === 'inclusive') {
    const divisor = 100 + gstPercent + cessPercent;
    gstAmount = (amount * gstPercent) / divisor;
    cessAmount = (amount * cessPercent) / divisor;
    netPrice = amount - (gstAmount + cessAmount);
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
    <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={80} // adjust as needed
  >

    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 120 }}>
      {/* Item Name */}
      <TextInput
        label="Item Name"
        value={itemName}
        onChangeText={setItemName}
        left={<TextInput.Icon icon={() => <File size={18} />} />}
        mode="outlined"
        style={styles.input}
      />

      {showForm && (
        <>
          {/* Quantity & Unit */}
          <View style={styles.row}>
            <TextInput
              label="Quantity"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              mode="outlined"
              style={[styles.input, { flex: 1 }]}
            />
            <View style={{ flex: 1, zIndex: 9999,elevation: 10,}}>

              <DropDownPicker
                open={unitOpen}
                value={unit}
                items={unitItems}
                setOpen={setUnitOpen}
                setValue={setUnit}
                setItems={setUnitItems}
                style={[styles.input, { flex: 1, marginLeft: 10 }]}
                placeholder="Select Unit"
                listMode="SCROLLVIEW"
              />
            </View>
          </View>

          {/* Rate & MRP */}
          <View style={styles.row}>
            <TextInput
              label="Rate"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              left={<TextInput.Icon icon={() => <IndianRupee size={18} />} />}
              mode="outlined"
              style={[styles.input, { flex: 1 }]}
            />
            <TextInput
              label="MRP"
              value={mrp}
              onChangeText={setMrp}
              keyboardType="numeric"
              mode="outlined"
              style={[styles.input, { flex: 1, marginLeft: 10 }]}
            />
          </View>
          <Text style={{ color: '#00B050', fontWeight: 'bold', marginVertical: 8 }} onPress={() => {
            setIsAddMore(!isAddMore)
          }}>
            {isAddMore ? "Hide Advanced Settings" : "Show Advanced Settings"}</Text>
          {isAddMore && (
            <>

              {/* Barcode */}
              <TextInput
                label="Barcode"
                value={barcode}
                onChangeText={setBarcode}
                keyboardType="numeric"
                left={<TextInput.Icon icon={() => <Barcode size={18} />} />}
                mode="outlined"
                style={styles.input}
              />

              {/* Tax Toggle */}
              <View style={styles.row}>
                <Button
                  mode={taxType === 'inclusive' ? 'contained' : 'outlined'}
                  onPress={() => setTaxType('inclusive')}
                  style={{ flex: 1 }}
                >
                  Inclusive
                </Button>

                <Button
                  mode={taxType === 'exclusive' ? 'contained' : 'outlined'}
                  onPress={() => setTaxType('exclusive')}
                  style={{ flex: 1, marginLeft: 10 }}
                >
                  Exclusive
                </Button>
              </View>

              {/* GST & CESS */}
              <View style={styles.row}>
                <View style={{ flex: 1, zIndex: 9999,elevation: 10, }}>
                  <DropDownPicker
                    open={gstOpen}
                    value={gst}
                    items={gstItems}
                    setOpen={setGstOpen}
                    setValue={setGst}
                    setItems={setGstItems}
                    style={styles.dropdown}
                    placeholder="GST"
                    listMode="SCROLLVIEW"
                  />
                </View>

                <TextInput
                  label="CESS %"
                  value={cess}
                  onChangeText={setCess}
                  keyboardType="numeric"
                  left={<TextInput.Icon icon={() => <PercentCircle size={18} />} />}
                  mode="outlined"
                  style={[styles.input, { flex: 1, marginLeft: 10 }]}
                />
              </View>

              {/* Description */}
              <TextInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                left={<TextInput.Icon icon={() => <File size={18} />} />}
                mode="outlined"
                style={styles.input}
              />

            </>
          )}

          <Divider style={{ marginVertical: 16 }} />

          {/* Calculations */}
          <View style={styles.totalBox}>
            <Text>Total: ₹ {total.toFixed(2)}</Text>
            <Text>Net Price: ₹ {netPrice.toFixed(2)}</Text>
            <Text>GST: ₹ {gstAmount.toFixed(2)}</Text>
            <Text>CESS: ₹ {cessAmount.toFixed(2)}</Text>
            <Text>
              {qty} x ₹ {basePrice.toFixed(2)} = ₹ {total.toFixed(2)}
            </Text>
          </View>


          {/* Buttons */}
          <View style={[styles.row, { marginBottom: 100 }]}>
            <Button mode="outlined" onPress={() => setItem(false)} style={{ flex: 1, marginRight: 10 }}>
              Close
            </Button>
            <Button mode="contained" onPress={handleSave} style={{ flex: 1 }}>
              Done
            </Button>
          </View>
        </>
      )}
    </ScrollView>
  </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', height: Dimensions.get('screen').height,paddingVertical: 60 },
  input: { marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  totalBox: { padding: 10, backgroundColor: '#f5f5f5', borderRadius: 8, marginBottom: 10 },
});
