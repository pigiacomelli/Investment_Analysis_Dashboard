import { describe, expect, it } from 'vitest'
import { Cost, Revenue } from '@prisma/client'
import { calculateForecast } from './index'

const cost = (projectedAmount: number, actualAmount: number) => ({ projectedAmount, actualAmount }) as unknown as Cost
const revenue = (projectedAmount: number, actualAmount: number) => ({ projectedAmount, actualAmount }) as unknown as Revenue

describe('calculateForecast', () => {
  it('uses actuals for realised lines and the plan for the rest', () => {
    // Bought and renovated, not sold yet; buyer-side costs still pending
    const f = calculateForecast([revenue(124_000, 0)], [cost(44_855, 44_855), cost(17_000, 16_500), cost(6_200, 0)])
    expect(f.costsPaid).toBe(61_355)
    expect(f.costsRemaining).toBe(6_200)
    expect(f.estimatedCost).toBe(67_555)
    expect(f.expectedRevenue).toBe(124_000)
    expect(f.expectedProfit).toBe(56_445)
    expect(f.expectedROI).toBeCloseTo((56_445 / 67_555) * 100, 8)
    expect(f.safetyMargin).toBeCloseTo((56_445 / 124_000) * 100, 8)
    expect(f.isRealised).toBe(false)
  })

  it('prefers actual revenue once received and flags a fully realised project', () => {
    const f = calculateForecast([revenue(100, 120)], [cost(50, 40)])
    expect(f.expectedProfit).toBe(80)
    expect(f.isRealised).toBe(true)
  })

  it('returns null ratios without costs or revenue', () => {
    const f = calculateForecast([], [])
    expect(f.expectedROI).toBeNull()
    expect(f.safetyMargin).toBeNull()
    expect(f.isRealised).toBe(false)
  })
})
