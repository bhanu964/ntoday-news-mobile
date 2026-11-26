import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppLanguage, TRANSLATIONS } from '@/constants/translations';
import { StorageService } from '@/services/storageService';

type TranslationDictionary = (typeof TRANSLATIONS)[AppLanguage];

interface LanguageContextValue {
  language: AppLanguage;
  isTelugu: boolean;
  t: TranslationDictionary;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'te',
  isTelugu: true,
  t: TRANSLATIONS.te,
  setLanguage: () => {},
  toggleLanguage: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('te');

  useEffect(() => {
    StorageService.getLanguage().then((savedLang) => {
      setLanguageState(savedLang);
    });
  }, []);

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang);
    StorageService.setLanguage(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const next: AppLanguage = prev === 'te' ? 'en' : 'te';
      StorageService.setLanguage(next);
      return next;
    });
  }, []);

  const value: LanguageContextValue = {
    language,
    isTelugu: language === 'te',
    t: TRANSLATIONS[language],
    setLanguage,
    toggleLanguage,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
