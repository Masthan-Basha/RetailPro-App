import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageContext = createContext(null);
const LANG_KEY = 'retailpro_language';

export const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
];

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(LANG_KEY);
      if (saved) setLanguage(saved);
    })();
  }, []);

  const changeLanguage = async (code) => {
    setLanguage(code);
    await AsyncStorage.setItem(LANG_KEY, code);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
