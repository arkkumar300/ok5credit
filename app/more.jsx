import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { TrendingUp, User, FileText,MoreHorizontal, Package, Settings, CreditCard, Star, CircleHelp as HelpCircle, Share2, Share } from 'lucide-react-native';
import { Appbar, Avatar } from 'react-native-paper';

export default function MoreScreen() {
  const router = useRouter();

  const menuItems = [
    {
      section: 'Account',
      items: [
        { icon: <User size={20} color="#666" />, title: 'Account', subtitle: 'Profile settings and account details',onPress: () => router.push('/accounts') },
        { icon: <User size={20} color="#666" />, title: 'Profile', subtitle: 'Personal information and business details',onPress: () => router.push('/profile') },
      ]
    },
    {
      section: 'Business',
      items: [
        { icon: <FileText size={20} color="#666" />, title: 'Bills', subtitle: 'Manage invoices and billing', onPress: () => router.push('/bills')},
        { icon: <Package size={20} color="#666" />, title: 'Stock Management', subtitle: 'Track inventory and stock levels',  onPress: () => router.push('/items') },
        { icon: <CreditCard size={20} color="#666" />, title: 'My Plan', subtitle: 'Subscription and billing details', onPress: () => router.push('/my-plan') },
        // { icon: <Settings size={20} color="#666" />, title: 'Multi Device', subtitle: 'Manage connected devices' },
      ]
    },
    {
      section: 'Support',
      items: [
        { icon: <HelpCircle size={20} color="#666" />, title: 'Help', subtitle: 'Get support and help center' },
        // { icon: <Settings size={20} color="#666" />, title: 'Settings', subtitle: 'App preferences and configurations' },
        { icon: <Star size={20} color="#666" />, title: 'Rate App', subtitle: 'Rate Aqua Credit on app store' },
        { icon: <Share2 size={20} color="#666" />, title: 'Share App', subtitle: 'Invite friends to use Aqua Credit' },
      ]
    }
  ];

  const handleItemPress = (item) => {
    if (item.onPress) {
      item.onPress();
    } else {
      console.log('Navigate to:', item.title);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
            <Appbar.Header>
        <Avatar.Text label='A' size={45} color='#ffffff' style={{ backgroundColor: '#2E7D32', marginStart: 8 }} />
        <Appbar.Content title="My Plans" titleStyle={{ textAlign: 'center', fontWeight: 'bold' }} />
        <Avatar.Icon icon={() => <Share size={22} color={'#2E7D32'} />} size={45} style={{
          backgroundColor: '#F1F8E9', shadowColor: '#2E7D32',
          shadowColor: '#2E7D32',       // Dark green
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 5, marginEnd: 8,                 // For Android
          borderRadius: 8
        }} />
      </Appbar.Header>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {menuItems.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.menuItem,
                    itemIndex !== section.items.length - 1 && styles.menuItemBorder
                  ]}
                  onPress={() => handleItemPress(item)}
                >
                  <View style={styles.menuIcon}>
                    {item.icon}
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>
                  <View style={styles.menuArrow}>
                    <Text style={styles.arrowText}>›</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.footerText}>© 2025 Aqua Credit. All rights reserved.</Text>
        </View>
      </ScrollView>
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={()=> router.push('/dashboard')}>
          <TrendingUp size={24} color="#4CAF50" />
          <Text style={styles.navText}>Ledger</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={()=> router.push('/my-plan')}>
          <Settings size={24} color="#666" />
          <Text style={styles.navText}>My Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} >
        <MoreHorizontal size={24} color="#666" />
        <Text style={styles.navText}>More</Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  backButton: {
    padding: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  menuArrow: {
    padding: 4,
  },
  arrowText: {
    fontSize: 18,
    color: '#CCC',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  versionText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

