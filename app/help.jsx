import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, LayoutAnimation, UIManager, StyleSheet, Platform, SafeAreaView, StatusBar } from 'react-native';
import { Appbar, Searchbar, Card } from 'react-native-paper';
import { ArrowLeft, HelpCircle, Search, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

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
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0A4D3C" />

            {/* Premium Header with Gradient */}
            <LinearGradient
                colors={['#0A4D3C', '#1B6B50']}
                style={styles.headerGradient}
            >
                <SafeAreaView>
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.backButton}
                        >
                            <ArrowLeft size={24} color="#FFFFFF" />
                        </TouchableOpacity>

                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>FAQ</Text>
                            <Text style={styles.headerSubtitle}>
                                Frequently Asked Questions
                            </Text>
                        </View>

                        <View style={styles.headerRightPlaceholder}>
                            <HelpCircle size={20} color="rgba(255,255,255,0.8)" />
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchWrapper}>
                    <Search size={18} color="#64748B" style={styles.searchIcon} />
                    <TextInput
                        placeholder="Search FAQs..."
                        placeholderTextColor="#94A3B8"
                        value={searchText}
                        onChangeText={setSearchText}
                        style={styles.searchInput}
                    />
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {filteredFaqs.length > 0 ? (
                    filteredFaqs.map((item, index) => {
                        const isOpen = activeIndex === index;

                        return (
                            <Card key={index} style={styles.faqCard}>
                                <TouchableOpacity
                                    onPress={() => toggleFAQ(index)}
                                    style={styles.questionContainer}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.questionWrapper}>
                                        <View style={styles.questionNumber}>
                                            <Text style={styles.numberText}>{index + 1}</Text>
                                        </View>
                                        <Text style={styles.questionText}>
                                            {item.question}
                                        </Text>
                                    </View>

                                    <View style={styles.iconContainer}>
                                        {isOpen ? (
                                            <ChevronUp size={20} color="#0A4D3C" />
                                        ) : (
                                            <ChevronDown size={20} color="#64748B" />
                                        )}
                                    </View>
                                </TouchableOpacity>

                                {isOpen && (
                                    <View style={styles.answerContainer}>
                                        <View style={styles.answerDivider} />
                                        <Text style={styles.answerText}>
                                            {item.answer}
                                        </Text>
                                    </View>
                                )}
                            </Card>
                        );
                    })
                ) : (
                    <View style={styles.emptyContainer}>
                        <HelpCircle size={60} color="#E2E8F0" />
                        <Text style={styles.emptyTitle}>No FAQs Found</Text>
                        <Text style={styles.emptySubtext}>
                            Try searching with different keywords
                        </Text>
                    </View>
                )}

                {/* Bottom Padding */}
                <View style={styles.bottomPadding} />
            </ScrollView>
        </View>

    );
};

export default FAQScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    headerGradient: {
        paddingTop: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    headerRightPlaceholder: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F8FAFC',
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 12,
        height: 48,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#1E293B',
        padding: 0,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    faqCard: {
        marginBottom: 12,
        borderRadius: 12,
        elevation: 2,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
    },
    questionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    questionWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    questionNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    numberText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0A4D3C',
    },
    questionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
        flex: 1,
        lineHeight: 20,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    answerContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    answerDivider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginBottom: 12,
    },
    answerText: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 22,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0A4D3C',
        marginTop: 16,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 8,
    },
    bottomPadding: {
        height: 20,
    },
});