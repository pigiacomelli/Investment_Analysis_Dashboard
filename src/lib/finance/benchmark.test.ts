import { describe, it, expect } from 'vitest'
import { calculateBenchmark } from './benchmark'
import { calculateForecast, summarizeProject, summarizePortfolio, calculatePortfolioROI, calculateVariance, type InvestmentWithDetails } from './index'

const project = (overrides: Partial<InvestmentWithDetails> = {}) => ({
  id: 'one', currency: 'BRL', startDate: new Date('2026-01-01'), initialInvestment: 100_000,
  capitalContributions: [], costs: [{ projectedAmount: 100_000, actualAmount: 100_000, costType: 'FIXED', date: new Date('2026-01-01'), category: 'Compra' }],
  revenues: [{ projectedAmount: 120_000, actualAmount: 0, date: new Date('2026-07-01') }],
  ...overrides,
}) as InvestmentWithDetails

describe('Compound benchmark comparison', () => {
  it('compares equal periods and solves the inverse interest equation', () => {
    const result = calculateBenchmark(100_000, 120_000, 6, 0.12)
    expect(result.roiPercent).toBeCloseTo(20)
    expect(result.monthlyROI).toBeCloseTo(3.08533208864446, 8)
    expect(result.benchmarkProfit).toBeCloseTo(5830.05244258363, 7)
    expect(result.excessProfit).toBeCloseTo(14169.9475574164, 7)
    expect(result.requiredRevenue).toBeCloseTo(105830.0524425836, 7)
    expect(result.monthsToMatch).toBeCloseTo(19.3057, 3)
    const atMatch = calculateBenchmark(100_000, 120_000, result.monthsToMatch!, 0.12)
    expect(atMatch.excessProfit).toBeCloseTo(0, 7)
    expect(result.annualizedROI).toBeCloseTo(44, 8)
  })
  it('does not fabricate ratios or a finite deadline without a valid denominator', () => {
    expect(calculateBenchmark(0, 120, 6, 0.12).roiPercent).toBeNull()
    expect(calculateBenchmark(0, 120, 6, 0.12).benchmarkProfit).toBeNull()
    expect(calculateBenchmark(100, 120, 6, 0).monthsToMatch).toBeNull()
    expect(calculateBenchmark(100, 120, 6, 0).returnMultiple).toBeNull()
    expect(calculateBenchmark(100, 90, 6, 0.12).monthsToMatch).toBeNull()
    expect(calculateBenchmark(100, 100, 6, 0.12).monthsToMatch).toBe(0)
    expect(calculateBenchmark(100, 0, 6, 0.12).monthlyROI).toBe(-100)
  })
  it('shows a negative advantage after the equality date, with negative price headroom', () => {
    const result = calculateBenchmark(100, 120, 24, 0.12)
    expect(result.excessProfit).toBeLessThan(0)
    expect(result.revenueHeadroomPercent).toBeLessThan(0)
    expect(result.timeHeadroomMonths).toBeLessThan(0)
  })
  it('rejects invalid assumptions', () => {
    for (const args of [[100,120,0,0.12], [100,120,6,-0.01], [-100,120,6,0.12], [100,NaN,6,0.12]]) {
      expect(() => calculateBenchmark(...args as [number, number, number, number])).toThrow(RangeError)
    }
  })
})

describe('Consistent project and portfolio summaries', () => {
  it('keeps cash, forecast and final result distinct before a sale', () => {
    const result = summarizeProject(project())
    expect(result.forecast.expectedProfit).toBe(20_000)
    expect(result.recordedCashResult).toBe(-100_000)
    expect(result.cashBalance).toBe(0)
    expect(result.finalProfit).toBeNull()
    expect(result.finalROI).toBeNull()
    expect(result.expectedMargin).toBeCloseTo(16.6666667)
  })
  it('does not display a project ROI when revenue has not been planned', () => {
    const result = summarizeProject(project({ revenues: [] }))
    expect(result.forecast.expectedROI).toBeNull()
    expect(result.plannedROI).toBeNull()
    expect(result.finalProfit).toBeNull()
  })
  it('requires realised lines, even when their pending plan is zero', () => {
    const inv = project({ costs: [{ projectedAmount: 0, actualAmount: 0 }] as InvestmentWithDetails['costs'], revenues: [{ projectedAmount: 120, actualAmount: 120 }] as InvestmentWithDetails['revenues'] })
    expect(calculateForecast(inv.revenues, inv.costs).isRealised).toBe(false)
    expect(calculateForecast(inv.revenues, inv.costs).pendingCostCount).toBe(1)
  })
  it('reveals final profit only after costs and revenue are all realised', () => {
    const inv = project({ revenues: [{ projectedAmount: 120_000, actualAmount: 125_000 }] as InvestmentWithDetails['revenues'] })
    expect(summarizeProject(inv).finalProfit).toBe(25_000)
    expect(summarizeProject(inv).finalROI).toBe(25)
  })
  it('records a full loss and a cancelled cost explicitly settled at zero', () => {
    const inv = project({
      costs: [...project().costs, { projectedAmount: 10_000, actualAmount: 0, settledAtZero: true, costType: 'VARIABLE', category: 'Cancelled', date: new Date('2026-01-01') }] as InvestmentWithDetails['costs'],
      revenues: [{ projectedAmount: 120_000, actualAmount: 0, settledAtZero: true }] as InvestmentWithDetails['revenues'],
    })
    const result = summarizeProject(inv)
    expect(result.forecast.pendingCostCount).toBe(0)
    expect(result.forecast.pendingRevenueCount).toBe(0)
    expect(result.forecast.expectedRevenue).toBe(0)
    expect(result.forecast.estimatedCost).toBe(100_000)
    expect(result.finalProfit).toBe(-100_000)
    expect(result.finalROI).toBe(-100)
    expect(result.costSummary.variance).toBe(-10_000)
  })
  it('weights aggregate ROI by costs and isolates currencies', () => {
    const small = project({ costs: [{ projectedAmount: 100, actualAmount: 0 }] as InvestmentWithDetails['costs'], revenues: [{ projectedAmount: 200, actualAmount: 0 }] as InvestmentWithDetails['revenues'] })
    const large = project({ costs: [{ projectedAmount: 900, actualAmount: 0 }] as InvestmentWithDetails['costs'], revenues: [{ projectedAmount: 990, actualAmount: 0 }] as InvestmentWithDetails['revenues'] })
    const usd = project({ currency: 'USD' })
    const groups = summarizePortfolio([small, large, usd])
    expect(groups).toHaveLength(2)
    expect(groups.find(g => g.currency === 'BRL')?.expectedROI).toBe(19)
    expect(() => calculatePortfolioROI([small, usd])).toThrow(RangeError)
  })
  it('does not invent a change percentage with no baseline and uses magnitude for a loss baseline', () => {
    expect(calculateVariance(0, 10).percentage).toBeNull()
    expect(calculateVariance(-100, -50)).toEqual({ value: 50, percentage: 50 })
  })
})
