import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { ArrowLeft, Circle, DotSquare, Download, FileText, Square } from 'lucide-react-native';

const CustomRadioButton = ({ label, value, selected, onPress }) => {
    return (
      <TouchableOpacity style={styles.radioOption} onPress={() => onPress(value)}>
        {selected ? (
          <DotSquare size={24} color="#6200ee" />
        ) : (
          <Square size={24} color="#777" />
        )}
        <Text style={styles.label}>{label}</Text>
      </TouchableOpacity>
    );
  };
  
  export default CustomRadioButton;

  const styles = StyleSheet.create({
    radioOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
    },
    label: {
      fontSize: 16,
      marginLeft: 8,
    },
  });