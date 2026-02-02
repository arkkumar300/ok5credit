import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, LayoutAnimation, UIManager, StyleSheet, Platform,SafeAreaView } from 'react-native';
import { Appbar } from 'react-native-paper';
import { ArrowLeft, HelpCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const faqs = [
    {
        question: 'What is "You Gave" and "You Got"?',
        answer:
            '"You Gave" means you gave money or goods to a customer (they owe you). "You Got" means you received money from a customer or supplier.',
    },
    {
        question: 'How do I add a customer or supplier?',
        answer:
            'Go to the Customers or Suppliers section, tap on the Add button, and enter the required details like name and phone number.',
    },
    {
        question: 'How do I record a credit or payment?',
        answer:
            'Open a customer or supplier profile, tap on Add Transaction, choose You Gave or You Got, enter the amount, and save.',
    },
    {
        question: 'Can I attach images to a transaction?',
        answer:
            'Yes, you can attach bill photos or payment screenshots while adding or editing a transaction.',
    },
    {
        question: 'How is the remaining balance calculated?',
        answer:
            'Remaining balance is automatically calculated based on total credit minus total payments made.',
    },
];

const FAQScreen = () => {
    const [activeIndex, setActiveIndex] = useState(null);
    const [searchText, setSearchText] = useState('');
    const navigation = useNavigation();

    const toggleFAQ = (index) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setActiveIndex(activeIndex === index ? null : index);
    };

    const filteredFaqs = faqs.filter((item) =>
        item.question.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <SafeAreaView style={styles.container}>
                <Appbar.Header style={[styles.header, { borderColor: "#f3f3f3", borderBottomWidth: 3 }]}>
                    <ArrowLeft size={24} onPress={() => navigation.goBack()} style={{ marginHorizontal: 10 }} />

                    <View style={styles.userInfo}>
                        <Text style={{fontSize:20,fontWeight:'bold', marginLeft: 10 }}>Frequently Asked Questions
                        </Text>
                    </View>
                </Appbar.Header>

            <ScrollView
                style={{ flex: 1, backgroundColor: '#f5f5f5', paddingHorizontal:16 }}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>
                </Text>

                {/* Search */}
                <TextInput
                    placeholder="Search FAQs..."
                    value={searchText}
                    onChangeText={setSearchText}
                    style={{
                        backgroundColor: '#ffffff',
                        padding: 12,
                        borderRadius: 10,
                        fontSize: 14,
                        marginBottom: 16,
                    }}
                />

                {filteredFaqs.map((item, index) => {
                    const isOpen = activeIndex === index;

                    return (
                        <View
                            key={index}
                            style={{
                                backgroundColor: '#ffffff',
                                borderRadius: 10,
                                marginBottom: 12,
                                padding: 14,
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => toggleFAQ(index)}
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={{ fontSize: 16, fontWeight: '600', flex: 1 }}>
                                    {item.question}
                                </Text>

                                <Text
                                    style={{
                                        fontSize: 22,
                                        fontWeight: 'bold',
                                        marginLeft: 10,
                                    }}
                                >
                                    {isOpen ? '−' : '+'}
                                </Text>
                            </TouchableOpacity>

                            {isOpen && (
                                <Text
                                    style={{
                                        marginTop: 10,
                                        fontSize: 14,
                                        color: '#555',
                                        lineHeight: 20,
                                    }}
                                >
                                    {item.answer}
                                </Text>
                            )}
                        </View>
                    );
                })}
            </ScrollView>
        </SafeAreaView>

    );
};

export default FAQScreen;

const styles = StyleSheet.create({
    container: {
        flex:1,
        backgroundColor: '#fff',
    },
    input: {
        marginBottom: 16,
        backgroundColor: '#fff',
        height: 52,
    },
    row: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
        zIndex: 1,
    },
    dropdown: {
        borderColor: '#ccc',
        minHeight: 52,
        borderRadius: 6, zIndex: 9999
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
