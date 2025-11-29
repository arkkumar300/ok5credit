import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Appbar,
  Divider,
} from 'react-native-paper';
import DropDownPicker from 'react-native-dropdown-picker';
import {
  ArrowLeft,
  File,
  Barcode,
  IndianRupee,
  PercentCircle,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';


export default function ItemForm({setItem,setNewItem}) {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [mrp, setMrp] = useState(0);
  const [barcode, setBarcode] = useState('568848705');
  const [description, setDescription] = useState('');
  const [cess, setCess] = useState(0);
  const router = useRouter();
  const [unitOpen, setUnitOpen] = useState(false);
  const [unitValue, setUnitValue] = useState('Nos');
  const [unitItems, setUnitItems] = useState([
    { label: 'Nos', value: 'Nos' },
    { label: 'Items', value: 'Items' },
    { label: 'Packages', value: 'Packages' },
    { label: 'Boxes', value: 'Boxes' },
    { label: 'Dozens', value: 'Dozens' },
    { label: 'Pairs', value: 'Pairs' },
  ]);

  const [gstOpen, setGstOpen] = useState(false);
  const [gstValue, setGstValue] = useState('0.25');
  const [gstItems, setGstItems] = useState([
    { label: '0.25%', value: '0.25' },
    { label: '5%', value: '5' },
    { label: '12%', value: '12' },
    { label: '18%', value: '18' },
  ]);

  const [rateTypeOpen, setRateTypeOpen] = useState(false);
  const [rateTypeValue, setRateTypeValue] = useState('inclusive');
  const [rateTypeItems, setRateTypeItems] = useState([
    { label: 'Rate Including Tax', value: 'inclusive' },
    { label: 'Rate Excluding Tax', value: 'exclusive' },
  ]);

  const qty = parseFloat(quantity) || 0;
  const basePrice = parseFloat(price) || 0;
  const gstPercent = parseFloat(gstValue) || 0;
  const cessPercent = parseFloat(cess) || 0;
const amount=basePrice * qty
  const taxableAmount = amount * ( (gstPercent/100) + (cessPercent/100));
  const gstAmount = (amount * gstPercent) / 100;
  const cessAmount = (amount * cessPercent) / 100;
  const total = basePrice * qty;

  const handleSave = () => {
    const total =amount;

const newItem = {
  itemName,
  quantity: qty,
  price: basePrice,
  mrp,taxableAmount,
  barcode,
  description,
  cess,cessAmount,
  unitValue,
  gstValue,gstAmount,
  rateType: rateTypeValue,
  total,  // ✅ total for billing
};

    setNewItem(newItem);  // ✅ this passes the item back
    setItem(false);    
    // Simulate saving logic here or pass back via router (or context, etc.)
  };


  return (

      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">

        {/* Item Name */}
        <TextInput
          label="Item Name"
          value={itemName}
          onChangeText={setItemName}
          left={<TextInput.Icon icon={() => <File size={18} />}/>}
          mode="outlined"
          style={styles.input}
        />

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
          <View style={{ flex: 1, zIndex: 10 }}>
            <DropDownPicker
              open={unitOpen}
              value={unitValue}
              items={unitItems}
              setOpen={setUnitOpen}
              setValue={setUnitValue}
              setItems={setUnitItems}
              style={styles.dropdown}
              placeholder="Select Unit"
              listMode="SCROLLVIEW"
            />
          </View>
        </View>

        {/* Price & MRP */}
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
            style={[styles.input, { flex: 1 }]}
          />
        </View>

        {/* GST and CESS */}
        <View style={styles.row}>
          <View style={{ flex: 1, zIndex: 9 }}>
            <DropDownPicker
              open={gstOpen}
              value={gstValue}
              items={gstItems}
              setOpen={setGstOpen}
              setValue={setGstValue}
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
            mode="outlined"
            left={<TextInput.Icon icon={() => <PercentCircle size={18} />} />}
            style={[styles.input, { flex: 1 }]}
          />
        </View>

        {/* Rate Type */}
        <View style={{ zIndex: 8 }}>
          <DropDownPicker
            open={rateTypeOpen}
            value={rateTypeValue}
            items={rateTypeItems}
            setOpen={setRateTypeOpen}
            setValue={setRateTypeValue}
            setItems={setRateTypeItems}
            style={styles.dropdown}
            placeholder="Rate Type"
            listMode="SCROLLVIEW"
          />
        </View>

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

        {/* Description */}
        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          left={<TextInput.Icon icon={() => <File size={18} />} />}
          mode="outlined"
          style={styles.input}
        />

        {/* Divider */}
        <Divider style={{ marginVertical: 16 }} />

        {/* Calculation Box */}
        <View style={styles.totalBox}>
          <Text variant="titleMedium">Total: ₹ {total.toFixed(2)}</Text>
          <Text>GST @ {gstValue}% = ₹ {gstAmount.toFixed(2)}</Text>
          <Text>CESS @ {cess}% = ₹ {cessAmount.toFixed(2)}</Text>
          <Text>{qty} x ₹ {basePrice.toFixed(2)} = ₹ {total.toFixed(2)}</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <Button mode="outlined" onPress={()=> setItem(false) } style={{ flex: 1, marginRight: 8 }}>
            close
          </Button>
          <Button mode="contained" onPress={handleSave} style={{ flex: 1 }}>
            Done
          </Button>
        </View>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff' },
  input: { marginBottom: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  dropdown: {
    borderColor: '#ccc',
    minHeight: 52,
  },
  totalBox: {
    padding: 16,
    backgroundColor: '#f1f8f5',
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 32,
  },
});
