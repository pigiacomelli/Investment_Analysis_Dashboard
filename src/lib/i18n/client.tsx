'use client'

import { createContext, useContext, useMemo } from 'react'
import { createI18n, DEFAULT_LOCALE, type Locale } from './shared'

const I18nContext = createContext(createI18n(DEFAULT_LOCALE))

export function LanguageProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = useMemo(() => createI18n(locale), [locale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = () => useContext(I18nContext)
