import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Camera, Mic } from 'lucide-react-native';

export default function TransactionScreen() {
  const [amount, setAmount] = useState('88');
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState('Aug 9, 2025');
  const [activeType, setActiveType] = useState(null);

  const router = useRouter();
  const { personName, personType } = useLocalSearchParams();

  const handleNumberPress = (num) => {
    if (amount === '0' || amount === '88') {
      setAmount(num);
    } else {
      setAmount(amount + num);
    }
  };

  const handleOperationPress = (operation) => {
    switch (operation) {
      case 'clear':
        setAmount('0');
        break;
      case 'delete':
        setAmount(amount.length > 1 ? amount.slice(0, -1) : '0');
        break;
      case 'decimal':
        if (!amount.includes('.')) {
          setAmount(amount + '.');
        }
        break;
    }
  };

  const handleTypeSelect = (type) => {
    setActiveType(type);
    router.push({
      pathname: '/transaction-success',
      params: {
        personName,
        personType,
        amount,
        transactionType: type,
        note,
        date: selectedDate
      }
    });
  };

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.personInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitial(personName)}</Text>
          </View>
          <View>
            <Text style={styles.personName}>{personName}</Text>
            <Text style={styles.balanceText}>₹0</Text>
          </View>
        </View>
        <View style={styles.securedBadge}>
          <Text style={styles.securedText}>SECURED</Text>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>
      </View>

      <View style={styles.amountContainer}>
        <Text style={styles.currencySymbol}>₹</Text>
        <Text style={styles.amountDisplay}>{amount}</Text>
      </View>

      <View style={styles.dateContainer}>
        <Text style={styles.dateLabel}>Date</Text>
        <View style={styles.dateSelector}>
          <Text style={styles.dateText}>{selectedDate}</Text>
          <Text style={styles.dropdownArrow}>⌄</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.addImagesButton}>
        <Camera size={20} color="#4CAF50" />
        <Text style={styles.addImagesText}>Add Images</Text>
      </TouchableOpacity>

      <View style={styles.noteContainer}>
        <TextInput
          style={styles.noteInput}
          placeholder="Add Note (Optional)"
          value={note}
          onChangeText={setNote}
          multiline
        />
        <TouchableOpacity style={styles.micButton}>
          <Mic size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.calculator}>
        <View style={styles.calculatorRow}>
          <TouchableOpacity style={styles.calcButton} onPress={() => handleNumberPress('1')}>
            <Text style={styles.calcButtonText}>1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.calcButton} onPress={() => handleNumberPress('2')}>
            <Text style={styles.calcButtonText}>2</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.calcButton} onPress={() => handleNumberPress('3')}>
            <Text style={styles.calcButtonText}>3</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.calcButton, styles.operatorButton]} onPress={() => handleOperationPress('delete')}>
            <Text style={styles.calcButtonText}>⌫</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.calculatorRow}>
          <TouchableOpacity style={styles.calcButton} onPress={() => handleNumberPress('4')}>
            <Text style={styles.calcButtonText}>4</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.calcButton} onPress={() => handleNumberPress('5')}>
            <Text style={styles.calcButtonText}>5</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.calcButton} onPress={() => handleNumberPress('6')}>
            <Text style={styles.calcButtonText}>6</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.calcButton, styles.operatorButton]} onPress={() => handleOperationPress('clear')}>
            <Text style={styles.calcButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.calculatorRow}>
          <TouchableOpacity style={styles.calcButton} onPress={() => handleNumberPress('7')}>
            <Text style={styles.calcButtonText}>7</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.calcButton} onPress={() => handleNumberPress('8')}>
            <Text style={styles.calcButtonText}>8</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.calcButton} onPress={() => handleNumberPress('9')}>
            <Text style={styles.calcButtonText}>9</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.calcButton, styles.operatorButton]}>
            <Text style={styles.calcButtonText}>—</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.calculatorRow}>
          <TouchableOpacity style={styles.calcButton} onPress={() => handleOperationPress('decimal')}>
            <Text style={styles.calcButtonText}>.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.calcButton} onPress={() => handleNumberPress('0')}>
            <Text style={styles.calcButtonText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.calcButton, styles.equalsButton]}>
            <Text style={styles.calcButtonText}>=</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.calcButton, styles.operatorButton]}>
            <Text style={styles.calcButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.receivedButton}
          onPress={() => handleTypeSelect('received')}
        >
          <Text style={styles.receivedText}>↓ Received</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.givenButton}
          onPress={() => handleTypeSelect('given')}
        >
          <Text style={styles.givenText}>↑ Given</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#81C784',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  balanceText: {
    fontSize: 12,
    color: '#4CAF50',
  },
  securedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  securedText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '600',
    marginRight: 4,
  },
  lockIcon: {
    fontSize: 10,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  currencySymbol: {
    fontSize: 32,
    color: '#4CAF50',
    marginRight: 8,
  },
  amountDisplay: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  dateContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  dateLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  dropdownArrow: {
    fontSize: 16,
    color: '#666',
  },
  addImagesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 16,
    marginHorizontal: 80,
    marginBottom: 40,
  },
  addImagesText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 8,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  noteInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    color: '#333',
  },
  micButton: {
    padding: 8,
  },
  calculator: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  calculatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calcButton: {
    width: 70,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  operatorButton: {
    backgroundColor: '#E8F5E8',
  },
  equalsButton: {
    backgroundColor: '#4CAF50',
  },
  calcButtonText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  receivedButton: {
    flex: 1,
    backgroundColor: '#E8F5E8',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  givenButton: {
    flex: 1,
    backgroundColor: '#FFEBEE',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  receivedText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
  },
  givenText: {
    fontSize: 16,
    color: '#C62828',
    fontWeight: '600',
  },
});