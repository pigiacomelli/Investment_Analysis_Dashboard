import portuguese from './pt-BR.json'
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils/format'

export type Locale = 'en' | 'pt-BR'
export const LANGUAGE_COOKIE = 'capitalscope-language'
export const DEFAULT_LOCALE: Locale = 'en'
export const resolveLocale = (value?: string): Locale => value === 'pt-BR' ? 'pt-BR' : DEFAULT_LOCALE

export function createI18n(locale: Locale) {
  return {
    locale,
    t: (message: string, values: readonly (string | number)[] = []) => {
      const translated = locale === 'pt-BR' ? portuguese[message as keyof typeof portuguese] ?? message : message
      return translated.replace(/\{(\d+)\}/g, (match, index) => values[Number(index)] === undefined ? match : String(values[Number(index)]))
    },
    formatCurrency: (value: number, currency = 'USD') => formatCurrency(value, currency, locale),
    formatPercentage: (value: number | null) => formatPercentage(value, locale),
    formatDate: (value: Date | string) => formatDate(value, locale),
  }
}
