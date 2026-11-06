import { describe, expect, it } from 'vitest'
import { runMonteCarloSimulation } from './monteCarlo'
import { InvestmentWithDetails } from './index'

const mockInvestment = {
  id: 'investment-1',
  name: 'Test',
  description: '',
  category: 'Test',
  status: 'ACTIVE',
  currency: 'USD',
  initialInvestment: 10_000,
  startDate: new Date('2026-01-01T00:00:00Z'),
  endDate: null,
  notes: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  revenues: [{ projectedAmount: 100_000, actualAmount: 0 }],
  costs: [
    { costType: 'FIXED', projectedAmount: 20_000, actualAmount: 0 },
    { costType: 'VARIABLE', projectedAmount: 30_000, actualAmount: 0 },
  ],
  capitalContributions: [],
} as unknown as InvestmentWithDetails

describe('Monte Carlo Simulation', () => {
  it('calculates stable profit and ROI percentiles', () => {
    const result = runMonteCarloSimulation(mockInvestment, {
      revenueVolatility: 0.2,
      variableCostVolatility: 0.2,
      fixedCostVolatility: 0,
      iterations: 10_000,
      seed: 42,
    })

    expect(result.iterations).toBe(10_000)
    expect(result.histogram).toHaveLength(20)
    expect(result.histogram.reduce((sum, bin) => sum + bin.count, 0)).toBe(10_000)
    expect(result.baseProfit).toBe(50_000)
    expect(result.baseROI).toBe(100)
    expect(result.p10).toBeLessThan(result.p50)
    expect(result.p50).toBeGreaterThan(48_000)
    expect(result.p50).toBeLessThan(52_000)
    expect(result.p90).toBeGreaterThan(result.p50)
    expect(result.roiP10).toBeLessThan(result.roiP50!)
    expect(result.roiP90).toBeGreaterThan(result.roiP50!)
    expect(result.probabilityOfProfit + result.probabilityOfLoss).toBeCloseTo(100, 10)
  })

  it('is reproducible for the same seed and inputs', () => {
    const assumptions = { iterations: 2_000, seed: 12345 }
    const first = runMonteCarloSimulation(mockInvestment, assumptions)
    const second = runMonteCarloSimulation(mockInvestment, assumptions)

    expect(second).toEqual(first)
  })

  it('returns the exact baseline when all volatility is zero', () => {
    const result = runMonteCarloSimulation(mockInvestment, {
      revenueVolatility: 0,
      variableCostVolatility: 0,
      fixedCostVolatility: 0,
      iterations: 100,
    })

    expect(result.p10).toBe(50_000)
    expect(result.p50).toBe(50_000)
    expect(result.p90).toBe(50_000)
    expect(result.meanProfit).toBe(50_000)
    expect(result.profitStdDev).toBe(0)
    expect(result.probabilityOfProfit).toBe(100)
    expect(result.probabilityOfLoss).toBe(0)
    expect(result.histogram).toEqual([
      { binStart: 50_000, binEnd: 50_000, binMidpoint: 50_000, count: 100 },
    ])
  })

  it('rejects invalid volatility and iteration counts', () => {
    expect(() => runMonteCarloSimulation(mockInvestment, { revenueVolatility: -0.1 })).toThrow(RangeError)
    expect(() => runMonteCarloSimulation(mockInvestment, { fixedCostVolatility: 1.1 })).toThrow(RangeError)
    expect(() => runMonteCarloSimulation(mockInvestment, { holdingPeriodVolatility: 1.2 })).toThrow(RangeError)
    expect(() => runMonteCarloSimulation(mockInvestment, { expectedMonthsToSell: 0 })).toThrow(RangeError)
    expect(() => runMonteCarloSimulation(mockInvestment, { cdiAnnualRate: -0.05 })).toThrow(RangeError)
    expect(() => runMonteCarloSimulation(mockInvestment, { iterations: 0 })).toThrow(RangeError)
    expect(() => runMonteCarloSimulation(mockInvestment, { iterations: 1.5 })).toThrow(RangeError)
  })

  it('calculates CDI benchmark, holding time limit, and tail risk metrics', () => {
    const result = runMonteCarloSimulation(mockInvestment, {
      revenueVolatility: 0.2,
      variableCostVolatility: 0.2,
      fixedCostVolatility: 0,
      holdingPeriodVolatility: 0.25,
      expectedMonthsToSell: 6,
      cdiAnnualRate: 0.12,
      iterations: 5_000,
      seed: 99,
    })

    expect(result.cdiAnnualRate).toBe(0.12)
    expect(result.expectedMonthsToSell).toBe(6)
    expect(result.p90MonthsToSell).toBeGreaterThan(6)
    expect(result.cdiMonthlyRatePercent).toBeCloseTo(((1.12 ** (1 / 12)) - 1) * 100, 5)
    expect(result.cdiBenchmarkProfit).toBeGreaterThan(0)
    expect(result.probabilityOfBeatingCDI).toBeGreaterThan(80)
    expect(result.probabilityOfBeatingCDI).toBeLessThanOrEqual(result.probabilityOfProfit)
    expect(result.returnMultipleVsCDI).toBeGreaterThan(1)
    expect(result.maxMonthsToBeatCDI).not.toBeNull()
    expect(result.maxMonthsToBeatCDI!).toBeGreaterThan(60)
    expect(result.profitP05).toBeLessThanOrEqual(result.p10)
    expect(result.meanWorst5Profit).toBeLessThanOrEqual(result.profitP05)
    expect(result.excessToRiskRatio).toBeGreaterThan(1)
  })
})

describe('Simulation accounting and benchmark invariants', () => {
  const zeroRisk = { revenueVolatility: 0, variableCostVolatility: 0, fixedCostVolatility: 0, holdingPeriodVolatility: 0, iterations: 100 }
  it('keeps realised amounts fixed, even with nonzero volatility', () => {
    const settled = { ...mockInvestment, revenues: [{ projectedAmount: 100, actualAmount: 120 }], costs: [{ costType: 'FIXED', projectedAmount: 80, actualAmount: 100 }] } as InvestmentWithDetails
    const result = runMonteCarloSimulation(settled, { ...zeroRisk, revenueVolatility: 0.5, fixedCostVolatility: 0.5, holdingPeriodVolatility: 0.5 })
    expect(result.meanProfit).toBe(20)
    expect(result.profitStdDev).toBe(0)
    expect(result.p90MonthsToSell).toBe(6)
    expect(result.excessToRiskRatio).toBeNull()
  })
  it('counts zero profit as break-even, and has no risk ratio without dispersion', () => {
    const equal = { ...mockInvestment, revenues: [{ projectedAmount: 50_000, actualAmount: 0 }] } as InvestmentWithDetails
    const result = runMonteCarloSimulation(equal, zeroRisk)
    expect(result.probabilityOfProfit).toBe(0)
    expect(result.probabilityOfLoss).toBe(0)
    expect(result.probabilityOfBreakEven).toBe(100)
    expect(result.excessToRiskRatio).toBeNull()
    expect(result.maxMonthsToBeatCDI).toBe(0)
  })
  it('does not invent an ROI or benchmark capital from funding when there are no costs', () => {
    const result = runMonteCarloSimulation({ ...mockInvestment, costs: [] }, zeroRisk)
    expect(result.baseROI).toBeNull()
    expect(result.meanROI).toBeNull()
    expect(result.probabilityOfBeatingCDI).toBeNull()
    expect(result.cdiBenchmarkProfit).toBeNull()
  })
  it('applies a ceiling consistently to baseline and scenarios without erasing receipts', () => {
    const result = runMonteCarloSimulation(mockInvestment, { ...zeroRisk, maxRevenue: 60_000 })
    expect(result.baseProfit).toBe(10_000)
    expect(result.meanProfit).toBe(10_000)
    expect(result.baseROI).toBe(20)
    const received = { ...mockInvestment, revenues: [{ projectedAmount: 100_000, actualAmount: 80_000 }] } as InvestmentWithDetails
    expect(() => runMonteCarloSimulation(received, { maxRevenue: 70_000 })).toThrow(RangeError)
    expect(() => runMonteCarloSimulation(mockInvestment, { maxRevenue: NaN })).toThrow(RangeError)
  })
  it('matches an independent deterministic compound-interest example', () => {
    const result = runMonteCarloSimulation(mockInvestment, { ...zeroRisk, expectedMonthsToSell: 12, cdiAnnualRate: 0.12 })
    expect(result.cdiBenchmarkProfit).toBeCloseTo(6000, 7)
    expect(result.meanExcessProfitOverCDI).toBeCloseTo(44000, 7)
    expect(result.maxMonthsToBeatCDI).toBeCloseTo(12 * Math.log(2) / Math.log(1.12), 7)
    expect(result.probabilityOfBeatingCDI).toBe(100)
  })
})
