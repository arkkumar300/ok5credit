import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Share, Phone, MessageCircle, Calendar, PhoneCall } from 'lucide-react-native';
import { Appbar } from 'react-native-paper';

export default function TransactionSuccessScreen() {
  const router = useRouter();
  const { personName, personType, amount, transactionType, note, date } = useLocalSearchParams();

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const formatTransactionType = (type) => {
    return type === 'received' ? 'Received' : 'Given';
  };

  const getAmountColor = (type) => {
    return type === 'received' ? '#4CAF50' : '#F44336';
  };

  const getArrowIcon = (type) => {
    return type === 'received' ? '↑' : '↓';
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToDashboard}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.personInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitial(personName)}</Text>
          </View>
          <View>
            <Text style={styles.personName}>{personName}</Text>
            <Text style={styles.viewProfile}>View Profile</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <MessageCircle size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Phone size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </Appbar.Header>

      <View style={styles.adBanner}>
        <Text style={styles.adText}>CoinDCX - Trade Without Limits. No Expiry. Just Opportunities.</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.todayBadge}>
          <Text style={styles.todayText}>Today</Text>
        </View>

        <View style={styles.transactionCard}>
          <Text style={[styles.transactionAmount, { color: getAmountColor(transactionType) }]}>
            {getArrowIcon(transactionType)} ₹{amount}
          </Text>
          <Text style={styles.transactionTime}>04:51 PM ✓</Text>
        </View>

        <Text style={styles.balanceDue}>₹{amount} {transactionType === 'received' ? 'Advance' : 'Due'}</Text>

        <TouchableOpacity style={styles.shareButton}>
          <Share size={16} color="#4CAF50" />
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>

        <View style={styles.illustration}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=300&h=200' }}
            style={styles.illustrationImage}
            resizeMode="contain"
          />
          <Text style={styles.illustrationText}>
            All transactions between you and customers are totally private & secure.
          </Text>
        </View>
      </View>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.bottomButton}>
          <Calendar size={20} color="#333" />
          <Text style={styles.bottomButtonText}>Set Due Date</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.callButton}>
          <PhoneCall size={16} color="white" />
          <Text style={styles.callButtonText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.remindButton}>
          <MessageCircle size={16} color="white" />
          <Text style={styles.remindButtonText}>Remind</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.balanceSection}>
        <Text style={styles.balanceLabel}>Balance Due</Text>
        <Text style={styles.balanceAmount}>₹{amount} ›</Text>
      </View>

      <View style={styles.transactionTypes}>
        <TouchableOpacity style={styles.receivedSection}>
          <Text style={styles.receivedText}>↓ Received</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.givenSection}>
          <Text style={styles.givenText}>↑ Given</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
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
  viewProfile: {
    fontSize: 12,
    color: '#4CAF50',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  adBanner: {
    backgroundColor: '#1565C0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  adText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  todayBadge: {
    alignSelf: 'center',
    backgroundColor: '#81C784',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 20,
  },
  todayText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  transactionCard: {
    backgroundColor: 'white',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  transactionTime: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  balanceDue: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 30,
  },
  shareButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    marginLeft: 4,
  },
  illustration: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  illustrationImage: {
    width: 200,
    height: 150,
    marginBottom: 20,
  },
  illustrationText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomActions: {
    flexDirection: 'row',
    backgroundColor: '#E0F2F1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  bottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bottomButtonText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
  callButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  remindButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  remindButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  balanceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
  },
  transactionTypes: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  receivedSection: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  givenSection: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  receivedText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  givenText: {
    fontSize: 16,
    color: '#F44336',
    fontWeight: '600',
  },
});