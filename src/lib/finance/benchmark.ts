/** Planning assumptions, not a live CDI quote. Annual rates are decimal effective rates. */
export const DEFAULT_DURATION_MONTHS = 6
export const EXAMPLE_BENCHMARK_ANNUAL_PERCENT = 10.75

export function calculateBenchmark(cost: number, revenue: number, months: number, annualRate: number) {
  if (![cost, revenue, months, annualRate].every(Number.isFinite) || cost < 0 || revenue < 0 || months <= 0 || annualRate < 0 || annualRate > 5) {
    throw new RangeError('Use nonnegative finite amounts, a positive duration and an annual rate between 0 and 5')
  }
  const profit = revenue - cost
  const roi = cost > 0 ? profit / cost : null
  const monthlyRate = Math.expm1(Math.log1p(annualRate) / 12)
  const benchmarkReturn = Math.expm1(Math.log1p(annualRate) * months / 12)
  const benchmarkProfit = cost > 0 ? cost * benchmarkReturn : null
  // No positive-time equality exists for a loss or for a positive profit at a zero benchmark rate.
  const monthsToMatch = roi === null || roi < 0 ? null : roi === 0 ? 0
    : annualRate > 0 ? 12 * Math.log1p(roi) / Math.log1p(annualRate) : null
  const requiredRevenue = cost > 0 ? cost * (1 + benchmarkReturn) : null
  return {
    profit,
    roiPercent: roi === null ? null : roi * 100,
    monthlyROI: roi === null ? null : (roi === -1 ? -1 : Math.expm1(Math.log1p(roi) / months)) * 100,
    annualizedROI: roi === null ? null : (roi === -1 ? -1 : Math.expm1(Math.log1p(roi) * 12 / months)) * 100,
    monthlyBenchmarkPercent: monthlyRate * 100,
    benchmarkROIPercent: benchmarkReturn * 100,
    benchmarkProfit,
    excessProfit: benchmarkProfit === null ? null : profit - benchmarkProfit,
    requiredRevenue,
    revenueHeadroomPercent: requiredRevenue === null || revenue <= 0 ? null : (revenue - requiredRevenue) / revenue * 100,
    returnMultiple: roi === null || benchmarkReturn === 0 ? null : roi / benchmarkReturn,
    monthsToMatch,
    timeHeadroomMonths: monthsToMatch === null ? null : monthsToMatch - months,
  }
}
