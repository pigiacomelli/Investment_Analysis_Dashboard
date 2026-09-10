export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
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
