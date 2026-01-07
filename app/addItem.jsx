import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Appbar, Divider } from 'react-native-paper';
import DropDownPicker from 'react-native-dropdown-picker';
import { ArrowLeft, File, Barcode, IndianRupee, PercentCircle } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ApiService from './components/ApiServices';

export default function AddEditItem() {
  const { item } = useLocalSearchParams();
  const [selectedItem, setSelectedItem] = useState(null);

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

  const [unitOpen, setUnitOpen] = useState(false);
  const [unitValue, setUnitValue] = useState('Nos');
  const [unitItems, setUnitItems] = useState([
    { label: 'Nos', value: 'Nos' },
    { label: 'Items', value: 'Items' },
    { label: 'Packages', value: 'Packages' },
    { label: 'Boxes', value: 'Boxes' },
    { label: 'Dozens', value: 'Dozens' },
    { label: 'Pairs', value: 'Pairs' }
  ]);

  const [gstOpen, setGstOpen] = useState(false);
  const [gstValue, setGstValue] = useState('0.25');
  const [gstItems, setGstItems] = useState([
    { label: '0.25%', value: '0.25' },
    { label: '5%', value: '5' },
    { label: '12%', value: '12' },
    { label: '18%', value: '18' }
  ]);

  const [rateTypeOpen, setRateTypeOpen] = useState(false);
  const [rateTypeValue, setRateTypeValue] = useState('inclusive');
  const [rateTypeItems, setRateTypeItems] = useState([
    { label: 'Rate Including Tax', value: 'inclusive' },
    { label: 'Rate Excluding Tax', value: 'exclusive' }
  ]);

  const qty = parseFloat(quantity) || 0;
  const basePrice = parseFloat(price) || 0;
  const gstPercent = parseFloat(gstValue) || 0;
  const cessPercent = parseFloat(cess) || 0;

  const taxableAmount =
    (basePrice * qty * 100) / (100 + gstPercent + cessPercent);
  const gstAmount = (taxableAmount * gstPercent) / 100;
  const cessAmount = (taxableAmount * cessPercent) / 100;
  const total = basePrice * qty;

  const router = useRouter();

  // useEffect(() => {
  //   console.log("item::", item)
  //   if (item) {
  //     try {
  //       const parsedItem = JSON.parse(decodeURIComponent(item));

  //       setSelectedItem(parsedItem);
  //       setItemName(parsedItem.itemName || '');
  //       setId(parsedItem.id || '');
  //       setQuantity(parsedItem.quantity || '');
  //       setPrice(parsedItem.price || '');
  //       setMrp(parsedItem.mrp || '');
  //       setBarcode(parsedItem.barcode || '');
  //       setDescription(parsedItem.description || '');
  //       setCess(parsedItem.cess || '');
  //       setUnitValue(parsedItem.unitValue || 'Nos');
  //       setGstValue(parsedItem.gstValue || '0.25');
  //       setRateTypeValue(parsedItem.rateType || 'inclusive');
  //     } catch (e) {
  //       console.error('Invalid item param:', e);
  //     }
  //   }
  // }, [item]);

  const handleSave = async () => {
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
    };
    let response = null;
    try {
      if (id) {
        response = await ApiService.put(`/item/${id}`, newItem);
      } else {
        response = await ApiService.post('/item', newItem);
      }


      if (!response.data) {
        throw new Error(`HTTP error! status: ${res.status}, ${errorText}`);
      }

      if (response.data) {

        const data = await response.data;
        console.log("data ::", data)
        router.push('./items')
      }

    } catch (err) {
      console.error("Error creating item:", err);
      throw err;
    }
  };

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} icon={() => <ArrowLeft size={22} />} />
        <Appbar.Content title={selectedItem ? 'Edit Item' : 'Add New Item'} />
      </Appbar.Header>

      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <TextInput
          label="Item Name"
          placeholder='name'
          placeholderTextColor={"#aaaaaa"}
          value={itemName}
          onChangeText={setItemName}
          left={<TextInput.Icon icon={() => <File size={18} />} />}
          mode="outlined"
          style={styles.input}
        />

        <View style={styles.row}>
          <TextInput
            label="Quantity"
            placeholder='Quantity'
            placeholderTextColor={"#aaaaaa"}
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

        <View style={styles.row}>
          <TextInput
            label="Rate"
            placeholder='Rate'
            placeholderTextColor={"#aaaaaa"}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            left={<TextInput.Icon icon={() => <IndianRupee size={18} />} />}
            mode="outlined"
            style={[styles.input, { flex: 1 }]}
          />
          <TextInput
            label="MRP"
            placeholder='MRP'
            placeholderTextColor={"#aaaaaa"}
            value={mrp}
            onChangeText={setMrp}
            keyboardType="numeric"
            mode="outlined"
            style={[styles.input, { flex: 1 }]}
          />
        </View>

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
            placeholder='CESS %'
            placeholderTextColor={"#aaaaaa"}
            value={cess}
            onChangeText={setCess}
            keyboardType="numeric"
            left={<TextInput.Icon icon={() => <PercentCircle size={18} />} />}
            mode="outlined"
            style={[styles.input, { flex: 1 }]}
          />
        </View>

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

        <TextInput
          label="Barcode"
          placeholder='Barcode %'
          placeholderTextColor={"#aaaaaa"}
          value={barcode}
          onChangeText={setBarcode}
          keyboardType="numeric"
          left={<TextInput.Icon icon={() => <Barcode size={18} />} />}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Description"
          placeholder='Description'
          placeholderTextColor={"#aaaaaa"}
          value={description}
          onChangeText={setDescription}
          left={<TextInput.Icon icon={() => <File size={18} />} />}
          mode="outlined"
          style={styles.input}
        />

        <Divider style={{ marginVertical: 16 }} />

        <View style={styles.totalBox}>
          <Text variant="titleMedium">Total: ₹ {total.toFixed(2)}</Text>
          <Text>GST @ {gstValue}% = ₹ {gstAmount.toFixed(2)}</Text>
          <Text>CESS @ {cess || 0}% = ₹ {cessAmount.toFixed(2)}</Text>
          <Text>{qty} x ₹ {basePrice.toFixed(2)} = ₹ {total.toFixed(2)}</Text>
        </View>

        <View style={styles.buttonRow}>
          <Button mode="outlined" onPress={handleSave} style={{ flex: 1, marginRight: 8 }}>
            {selectedItem ? 'Update' : '+ Save & New'}
          </Button>
          <Button mode="contained" onPress={handleSave} style={{ flex: 1 }}>
            Done
          </Button>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff' },
  input: { marginBottom: 16, color: '#333333' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16
  },
  dropdown: {
    borderColor: '#ccc',
    minHeight: 52
  },
  totalBox: {
    padding: 16,
    backgroundColor: '#f1f8f5',
    borderRadius: 8,
    marginBottom: 20
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 32
  }
});
