import { describe, it, expect } from 'vitest';
import {
  calculateTotalInvestedCapital,
  calculateProjectedRevenue,
  calculateActualRevenue,
  calculateProjectedFixedCosts,
  calculateActualFixedCosts,
  calculateProjectedVariableCosts,
  calculateActualVariableCosts,
  calculateProjectedCosts,
  calculateActualCosts,
  calculateProjectedProfit,
  calculateActualProfit,
  calculateProjectedROI,
  calculateActualROI,
  calculateVariance,
  calculatePortfolioROI,
  calculateCashFlow,
  InvestmentWithDetails
} from './index';

describe('Finance calculations', () => {
  const d1 = new Date('2024-01-15T12:00:00Z');
  const d2 = new Date('2024-02-15T12:00:00Z');

  const mockCosts = [
    { costType: 'FIXED', projectedAmount: 1000, actualAmount: 1100, date: d1 },
    { costType: 'FIXED', projectedAmount: 500, actualAmount: 500, date: d2 },
    { costType: 'VARIABLE', projectedAmount: 200, actualAmount: 300, date: d1 },
    { costType: 'VARIABLE', projectedAmount: 300, actualAmount: 100, date: d2 },
  ] as any[];

  const mockRevenues = [
    { projectedAmount: 5000, actualAmount: 6000, date: d1 },
    { projectedAmount: 8000, actualAmount: 9000, date: d2 },
  ] as any[];

  const mockContributions = [
    { amount: 2000, date: d2 }
  ] as any[];

  it('1. calculates total invested capital', () => {
    expect(calculateTotalInvestedCapital(10000, mockContributions)).toBe(12000);
    expect(calculateTotalInvestedCapital(10000, [])).toBe(10000);
  });

  it('2. aggregates projected and actual revenue', () => {
    expect(calculateProjectedRevenue(mockRevenues)).toBe(13000);
    expect(calculateActualRevenue(mockRevenues)).toBe(15000);
  });

  it('3. aggregates projected and actual fixed costs', () => {
    expect(calculateProjectedFixedCosts(mockCosts)).toBe(1500);
    expect(calculateActualFixedCosts(mockCosts)).toBe(1600);
  });

  it('4. aggregates projected and actual variable costs', () => {
    expect(calculateProjectedVariableCosts(mockCosts)).toBe(500);
    expect(calculateActualVariableCosts(mockCosts)).toBe(400);
  });

  it('5. aggregates projected and actual total costs', () => {
    expect(calculateProjectedCosts(mockCosts)).toBe(2000);
    expect(calculateActualCosts(mockCosts)).toBe(2000);
  });

  it('6. calculates projected and actual profit', () => {
    // Projected: 13000 - 2000 = 11000
    expect(calculateProjectedProfit(mockRevenues, mockCosts)).toBe(11000);
    // Actual: 15000 - 2000 = 13000
    expect(calculateActualProfit(mockRevenues, mockCosts)).toBe(13000);
  });

  it('7. calculates projected and actual ROI', () => {
    // Cap: 12000
    // Proj Profit: 11000 -> ROI = (11000 / 12000) * 100 = 91.666...
    expect(calculateProjectedROI(10000, mockContributions, mockRevenues, mockCosts)).toBeCloseTo(91.666, 2);
    // Act Profit: 13000 -> ROI = (13000 / 12000) * 100 = 108.333...
    expect(calculateActualROI(10000, mockContributions, mockRevenues, mockCosts)).toBeCloseTo(108.333, 2);
  });

  it('8. returns 0 for ROI when capital is zero', () => {
    expect(calculateProjectedROI(0, [], mockRevenues, mockCosts)).toBe(0);
    expect(calculateActualROI(0, [], mockRevenues, mockCosts)).toBe(0);
  });

  it('9. handles negative profit scenario', () => {
    const lowRevenues = [{ projectedAmount: 1000, actualAmount: 500, date: d1 }] as any[];
    expect(calculateProjectedProfit(lowRevenues, mockCosts)).toBe(-1000);
    expect(calculateActualProfit(lowRevenues, mockCosts)).toBe(-1500);
    expect(calculateActualROI(10000, [], lowRevenues, mockCosts)).toBe(-15);
  });

  it('10. calculates variance correctly', () => {
    expect(calculateVariance(1000, 1200)).toEqual({ value: 200, percentage: 20 });
    expect(calculateVariance(1000, 800)).toEqual({ value: -200, percentage: -20 });
    expect(calculateVariance(0, 500)).toEqual({ value: 500, percentage: 0 });
  });

  it('11. calculates portfolio ROI across investments', () => {
    const investments = [
      {
        initialInvestment: 5000,
        capitalContributions: [],
        revenues: [{ actualAmount: 10000, date: d1, projectedAmount: 0 }],
        costs: [{ actualAmount: 2000, costType: 'FIXED', date: d1, projectedAmount: 0 }]
      },
      {
        initialInvestment: 15000,
        capitalContributions: [],
        revenues: [{ actualAmount: 20000, date: d1, projectedAmount: 0 }],
        costs: [{ actualAmount: 4000, costType: 'FIXED', date: d1, projectedAmount: 0 }]
      }
    ] as any;
    
    // Total capital = 20000
    // Proj Profit = (0 - 0) + (0 - 0) = 0
    // Act Profit = (10000 - 2000) + (20000 - 4000) = 8000 + 16000 = 24000
    // Act ROI = 24000 / 20000 * 100 = 120%
    const roi = calculatePortfolioROI(investments);
    expect(roi.actualROI).toBe(120);
    expect(roi.projectedROI).toBe(0);
  });

  it('12. calculates monthly cash flow aggregation', () => {
    const investment = {
      startDate: d1,
      initialInvestment: 10000,
      capitalContributions: mockContributions,
      revenues: mockRevenues,
      costs: mockCosts
    } as any;

    const cf = calculateCashFlow(investment);
    expect(cf).toHaveLength(2);

    // 2024-01
    expect(cf[0].dateKey).toBe('2024-01');
    expect(cf[0].capitalContributions).toBe(10000);
    expect(cf[0].revenue).toBe(6000);
    expect(cf[0].fixedCosts).toBe(1100);
    expect(cf[0].variableCosts).toBe(300);
    // net = 6000 - 1100 - 300 - 10000 = -5400
    expect(cf[0].netCashFlow).toBe(-5400);
    expect(cf[0].cumulativeCashFlow).toBe(-5400);

    // 2024-02
    expect(cf[1].dateKey).toBe('2024-02');
    expect(cf[1].capitalContributions).toBe(2000);
    expect(cf[1].revenue).toBe(9000);
    expect(cf[1].fixedCosts).toBe(500);
    expect(cf[1].variableCosts).toBe(100);
    // net = 9000 - 500 - 100 - 2000 = 6400
    expect(cf[1].netCashFlow).toBe(6400);
    expect(cf[1].cumulativeCashFlow).toBe(-5400 + 6400); // 1000
  });

  it('13. handles empty arrays for revenues and costs', () => {
    expect(calculateProjectedProfit([], [])).toBe(0);
    expect(calculateActualProfit([], [])).toBe(0);
    expect(calculateProjectedROI(1000, [], [], [])).toBe(0);
    expect(calculateActualROI(1000, [], [], [])).toBe(0);
    expect(calculateTotalInvestedCapital(1000, [])).toBe(1000);
    
    const investment = {
      startDate: null,
      initialInvestment: 0,
      capitalContributions: [],
      revenues: [],
      costs: []
    } as any;
    expect(calculateCashFlow(investment)).toEqual([]);
  });
});
