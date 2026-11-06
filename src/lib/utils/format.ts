export function formatCurrency(amount: number, currency: string = 'USD', locale: string = 'en'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatPercentage(value: number | null, locale: string = 'en'): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100)
}

export function formatDate(date: Date | string, locale: string = 'en'): string {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatVarianceColor(value: number, favorableWhenPositive: boolean): string {
  if (value === 0) return 'text-gray-500'
  
  if (favorableWhenPositive) {
    return value > 0 ? 'text-green-500' : 'text-red-500'
  } else {
    return value < 0 ? 'text-green-500' : 'text-red-500'
  }
}
