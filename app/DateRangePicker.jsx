import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Button, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';

const DateRangePicker = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState({ type: '', visible: false });

  const setPresetDates = (type) => {
    const today = new Date();
    let start, end;

    switch (type) {
      case 'this_month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'last_30_days':
        start = new Date();
        start.setDate(start.getDate() - 30);
        end = today;
        break;
      case 'last_7_days':
        start = new Date();
        start.setDate(start.getDate() - 7);
        end = today;
        break;
      case 'last_month':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      default:
        start = today;
        end = today;
    }

    setStartDate(start);
    setEndDate(end);
  };

  const onChange = (event, selectedDate) => {
    if (showPicker.type === 'start') {
      setStartDate(selectedDate || startDate);
    } else {
      setEndDate(selectedDate || endDate);
    }
    setShowPicker({ type: '', visible: false });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Date Range</Text>

      {/* Start and End Date Buttons */}
      <View style={styles.dateContainer}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowPicker({ type: 'start', visible: true })}
        >
          <Text style={styles.dateText}>Start: {moment(startDate).format('DD/MM/YYYY')}</Text>
        </TouchableOpacity>

        <Text style={styles.toText}> - </Text>

        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowPicker({ type: 'end', visible: true })}
        >
          <Text style={styles.dateText}>End: {moment(endDate).format('DD/MM/YYYY')}</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Filter Buttons */}
      <View style={styles.quickFilters}>
        <TouchableOpacity onPress={() => setPresetDates('this_month')} style={styles.filterButton}>
          <Text>This Month</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setPresetDates('last_30_days')} style={styles.filterButton}>
          <Text>Last 30 Days</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setPresetDates('last_7_days')} style={styles.filterButton}>
          <Text>Last 7 Days</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setPresetDates('last_month')} style={styles.filterButton}>
          <Text>Last Month</Text>
        </TouchableOpacity>
      </View>

      {/* Confirm Button */}
      <TouchableOpacity style={styles.confirmButton}>
        <Text style={styles.confirmText}>✔ Confirm</Text>
      </TouchableOpacity>

      {/* Date Picker */}
      {showPicker.visible && (
        <DateTimePicker
          value={showPicker.type === 'start' ? startDate : endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'flex-start'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'green'
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  dateButton: {
    backgroundColor: '#e6f2e6',
    padding: 10,
    borderRadius: 10,
    minWidth: 130,
    alignItems: 'center'
  },
  dateText: {
    color: '#000'
  },
  toText: {
    marginHorizontal: 10,
    fontSize: 16
  },
  quickFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 20
  },
  filterButton: {
    backgroundColor: '#f2f2f2',
    padding: 10,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10
  },
  confirmButton: {
    backgroundColor: 'green',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20
  },
  confirmText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  }
});

export default DateRangePicker;
