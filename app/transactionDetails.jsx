import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  Alert, Modal, TextInput
} from 'react-native';
import { Calendar, Check, FileText, HelpCircle, ArrowLeft, Edit, Delete } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Appbar, Avatar } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import moment from 'moment';
import ApiService from './components/ApiServices';

export default function TransactionDetails() {
  const navigation = useNavigation();
  const { transactionDetails, Name } = useLocalSearchParams();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transaction, setTransaction] = useState(null);
  const [transactionType, setTransactionType] = useState(null);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [newAmount, setNewAmount] = useState("");

  const formateDate = (date) =>
    date ? moment(date).format("DD MMM YYYY") : "";

  const handleDeleteTransaction = async () => {
    try {
      const url = `/transactions/delete/${transaction.id}`;
      const idPayload =
      transaction.transaction_for === "customer"
        ? { customer_id: transaction.customer_id }
        : { supplier_id: transaction.supplier_id };

    const payload = {
      ...idPayload,
      userId: transaction.business_owner_id,
      transaction_type: transactionType,
      transaction_for: transaction.transaction_for,
      amount: Number(newAmount),
    };
    
    const response = await ApiService.put(url,payload, {
        headers: { "Content-Type": "application/json" },
      });
  console.log("rrr:::",response)
      if (response.data) {
        Alert.alert("Deleted", "Transaction deleted successfully");
        setShowDeleteModal(false);
  
        // go back to previous screen
        navigation.goBack();
      } else {
        Alert.alert("Delete Failed", response.data?.message || "Unknown error");
      }
    } catch (error) {
      console.log("Delete Error:", error);
      Alert.alert("Error", "Something went wrong");
    }
  };
  
  useEffect(() => {
    const tx = JSON.parse(transactionDetails);
    setTransaction(tx);
    setTransactionType(tx?.transaction_type);
  }, []);

  // ---------------------- HANDLE EDIT API ----------------------
  const handleUpdateTransaction = async () => {
    console.log("transaction::",transaction)
    if (!newAmount || isNaN(Number(newAmount))) {
      Alert.alert("Invalid Amount", "Please enter a valid number.");
      return;
    }
  
    try {
      const url =  transaction.transaction_for === "customer"? `/transactions/customer/${transaction.id}`:`/transactions/supplier/${transaction.id}`;
  
      // If transaction_for === "customer" → send customer_id
      // If transaction_for === "supplier" → send supplier_id
      const idPayload =
        transaction.transaction_for === "customer"
          ? { customer_id: transaction.customer_id }
          : { supplier_id: transaction.supplier_id };
  
      const payload = {
        ...idPayload,
        userId: transaction.business_owner_id,
        transaction_type: transactionType,
        transaction_for: transaction.transaction_for,
        amount: Number(newAmount),
      };
  
      console.log("UPDATE PAYLOAD:", payload);
  
      const response = await ApiService.put(url, payload, {
        headers: { "Content-Type": "application/json" },
      });
  
      if (response.data) {
        Alert.alert("Success", "Transaction updated successfully");
  
        setTransaction(prev => ({
          ...prev,
          amount: Number(newAmount),
        }));
  
        setShowEditModal(false);
      } else {
        Alert.alert("Update Failed", response.data?.message || "Unknown error");
      }
    } catch (error) {
      console.error("API Error:", error);
      Alert.alert("Error", "Something went wrong!");
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Appbar.Header style={[styles.header, { borderColor: "#f3f3f3", borderBottomWidth: 3 }]}>
        <ArrowLeft size={24} onPress={() => navigation.goBack()} style={{ marginHorizontal: 10 }} />

        <View style={styles.userInfo}>
          <Avatar.Text size={30} label={Name?.charAt(0).toUpperCase()} style={{ marginLeft: 10 }} />
          <Text style={[styles.userName, { marginLeft: 10 }]}>{Name}</Text>
        </View>

        <HelpCircle color="#555" size={24} />
      </Appbar.Header>

      {/* Amount */}
      <View style={styles.amountContainer}>
        <Text style={styles.amount}>₹ {transaction?.amount || 0}</Text>
      </View>

      {/* Details */}
      <ScrollView style={styles.detailsContainer}>
        <View style={styles.row}>
          <FileText size={18} color="#555" />
          <Text style={styles.rowText}>Bill Number: {transaction?.bill_id || "N/A"}</Text>
        </View>

        <View style={styles.row}>
          <Check size={18} color="#4CAF50" />
          <Text style={styles.rowText}>Sync Successful</Text>
        </View>

        <View style={styles.row}>
          <Calendar size={18} color="#555" />
          <Text style={styles.rowText}>Added On {formateDate(transaction?.transaction_date)}</Text>
        </View>

        {transactionType === "you_gave" && (
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              setNewAmount(String(transaction?.amount));
              setShowEditModal(true);
            }}
          >
            <Edit size={18} color="#25D366" />
            <Text style={[styles.rowText, { color: "#25D366" }]}>Edit Transaction</Text>
          </TouchableOpacity>
        )}

<TouchableOpacity
  style={styles.row}
  onPress={() => setShowDeleteModal(true)}
>
  <Delete size={18} color="red" />
  <Text style={[styles.rowText, { color: "red" }]}>Delete Transaction</Text>
</TouchableOpacity>

      </ScrollView>

      {/* ---------------- MODAL FOR EDIT --------------------- */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContainer}>
            <Text style={modalStyles.title}>Edit Amount</Text>

            <TextInput
              value={newAmount}
              onChangeText={setNewAmount}
              keyboardType="numeric"
              style={modalStyles.input}
              placeholder="Enter new amount"
            />

            <View style={modalStyles.btnRow}>
              <TouchableOpacity
                style={[modalStyles.button, { backgroundColor: "#ccc" }]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={modalStyles.btnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[modalStyles.button, { backgroundColor: "#25D366" }]}
                onPress={handleUpdateTransaction}
              >
                <Text style={[modalStyles.btnText, { color: "#fff" }]}>
                  Update
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ---------------- DELETE CONFIRM MODAL --------------------- */}
<Modal visible={showDeleteModal} transparent animationType="fade">
  <View style={modalStyles.modalOverlay}>
    <View style={modalStyles.modalContainer}>
      <Text style={modalStyles.title}>Delete Transaction?</Text>
      <Text style={{ textAlign: "center", marginBottom: 20 }}>
        Are you sure you want to delete this transaction?  
      </Text>

      <View style={modalStyles.btnRow}>
        <TouchableOpacity
          style={[modalStyles.button, { backgroundColor: "#ccc" }]}
          onPress={() => setShowDeleteModal(false)}
        >
          <Text style={modalStyles.btnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[modalStyles.button, { backgroundColor: "red" }]}
          onPress={handleDeleteTransaction}
        >
          <Text style={[modalStyles.btnText, { color: "#fff" }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

    </SafeAreaView>
  );
}

// ---------- STYLES ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", padding: 16, justifyContent: "space-between" },
  userInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  userName: { fontSize: 16, fontWeight: "600" },
  amountContainer: { alignItems: "center", paddingVertical: 20 },
  amount: { fontSize: 40, fontWeight: "bold", color: "#000" },
  detailsContainer: { paddingHorizontal: 20 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 15, borderBottomColor: "#eee", borderBottomWidth: 1 },
  rowText: { marginLeft: 12, fontSize: 15 },
});

// ---------- MODAL STYLES ----------
const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  input: {
    borderWidth: 1, borderColor: "#aaa", padding: 12, borderRadius: 8, fontSize: 16,
    marginBottom: 20,
  },
  btnRow: { flexDirection: "row", justifyContent: "space-between" },
  button: { padding: 12, borderRadius: 8, width: "48%", alignItems: "center" },
  btnText: { fontWeight: "600", fontSize: 16 },
});
