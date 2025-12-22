import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import i18n from './i18n/i18n.js';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
];

export default function LanguageSettings() {
  const { t } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setCurrentLang(code);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('select_language')}</Text>
      {languages.map((lang) => (
        <TouchableOpacity
          key={lang.code}
          style={[
            styles.langButton,
            currentLang === lang.code && styles.activeLang,
          ]}
          onPress={() => changeLanguage(lang.code)}
        >
          <Text
            style={[
              styles.langText,
              currentLang === lang.code && styles.activeLangText,
            ]}
          >
            {lang.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 20, marginBottom: 20 },
  langButton: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 8,
    marginBottom: 10,
  },
  activeLang: { backgroundColor: '#4CAF50' },
  langText: { fontSize: 16, textAlign: 'center' },
  activeLangText: { color: 'white', fontWeight: 'bold' },
});
