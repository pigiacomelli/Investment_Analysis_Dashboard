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
    expect(result.roiP10).toBeLessThan(result.roiP50)
    expect(result.roiP90).toBeGreaterThan(result.roiP50)
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
    expect(() => runMonteCarloSimulation(mockInvestment, { iterations: 0 })).toThrow(RangeError)
    expect(() => runMonteCarloSimulation(mockInvestment, { iterations: 1.5 })).toThrow(RangeError)
  })
})
