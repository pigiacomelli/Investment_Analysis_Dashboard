import { describe, it, expect } from 'vitest';
import type { CapitalContribution, Cost, Revenue } from '@prisma/client';
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
  summarizeCosts,
  InvestmentWithDetails
} from './index';
import { formatPercentage } from '../utils/format';

describe('Finance calculations', () => {
  const d1 = new Date('2024-01-15T12:00:00Z');
  const d2 = new Date('2024-02-15T12:00:00Z');

  const mockCosts = [
    { costType: 'FIXED', projectedAmount: 1000, actualAmount: 1100, date: d1 },
    { costType: 'FIXED', projectedAmount: 500, actualAmount: 500, date: d2 },
    { costType: 'VARIABLE', projectedAmount: 200, actualAmount: 300, date: d1 },
    { costType: 'VARIABLE', projectedAmount: 300, actualAmount: 100, date: d2 },
  ] as unknown as Cost[];

  const mockRevenues = [
    { projectedAmount: 5000, actualAmount: 6000, date: d1 },
    { projectedAmount: 8000, actualAmount: 9000, date: d2 },
  ] as unknown as Revenue[];

  const mockContributions = [
    { amount: 2000, date: d2 }
  ] as unknown as CapitalContribution[];

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
    // Proj Costs: 2000
    // Proj Profit: 11000 -> ROI = (11000 / 2000) * 100 = 550%
    expect(calculateProjectedROI(mockRevenues, mockCosts)).toBe(550);
    // Act Profit: 13000 -> ROI = (13000 / 2000) * 100 = 650%
    expect(calculateActualROI(mockRevenues, mockCosts)).toBe(650);
  });

  it('8. calculates ROI on total project costs independently of project funding', () => {
    expect(calculateProjectedROI(mockRevenues, mockCosts)).toBe(550);
    expect(calculateActualROI(mockRevenues, mockCosts)).toBe(650);
  });

  it('9. handles negative profit scenario', () => {
    const lowRevenues = [{ projectedAmount: 1000, actualAmount: 500, date: d1 }] as unknown as Revenue[];
    expect(calculateProjectedProfit(lowRevenues, mockCosts)).toBe(-1000);
    expect(calculateActualProfit(lowRevenues, mockCosts)).toBe(-1500);
    // Act Profit: -1500. Act Costs: 2000. ROI = -1500 / 2000 * 100 = -75
    expect(calculateActualROI(lowRevenues, mockCosts)).toBe(-75);
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
    ] as unknown as InvestmentWithDetails[];
    
    // Total Act Costs = 2000 + 4000 = 6000
    // Proj Profit = (0 - 0) + (0 - 0) = 0
    // Act Profit = (10000 - 2000) + (20000 - 4000) = 8000 + 16000 = 24000
    // Act ROI = 24000 / 6000 * 100 = 400%
    const roi = calculatePortfolioROI(investments);
    expect(roi.actualROI).toBe(400);
    expect(roi.projectedROI).toBe(0);
  });

  it('12. calculates monthly cash flow aggregation', () => {
    const investment = {
      startDate: d1,
      initialInvestment: 10000,
      capitalContributions: mockContributions,
      revenues: mockRevenues,
      costs: mockCosts
    } as unknown as InvestmentWithDetails;

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
    expect(calculateProjectedROI([], [])).toBe(0);
    expect(calculateActualROI([], [])).toBe(0);
    expect(calculateTotalInvestedCapital(1000, [])).toBe(1000);
    
    const investment = {
      startDate: null,
      initialInvestment: 0,
      capitalContributions: [],
      revenues: [],
      costs: []
    } as unknown as InvestmentWithDetails;
    expect(calculateCashFlow(investment)).toEqual([]);
  });

  it('14. formats percentages correctly without 10x or 100x multiplier error', () => {
    expect(formatPercentage(550)).toBe('550.00%');
    expect(formatPercentage(50)).toBe('50.00%');
    expect(formatPercentage(0)).toBe('0.00%');
  });

  it('15. groups planned and actual costs by type, category and month', () => {
    const rows = [
      { category: 'Hosting', costType: 'FIXED', projectedAmount: 100, actualAmount: 130, date: d1 },
      { category: 'Hosting', costType: 'FIXED', projectedAmount: 50, actualAmount: 40, date: d2 },
      { category: 'Marketing', costType: 'VARIABLE', projectedAmount: 0, actualAmount: 60, date: d2 },
    ] as Cost[];
    const result = summarizeCosts(rows);
    expect(result.projected).toBe(150);
    expect(result.actual).toBe(230);
    expect(result.variance).toBe(80);
    expect(result.variancePercentage).toBeCloseTo(53.333333);
    expect(result.fixed).toMatchObject({ projected: 150, actual: 170, variance: 20 });
    expect(result.variable).toMatchObject({ projected: 0, actual: 60, variance: 60 });
    expect(result.categories).toEqual([
      { label: 'Hosting', projected: 150, actual: 170, variance: 20 },
      { label: 'Marketing', projected: 0, actual: 60, variance: 60 },
    ]);
    expect(result.months).toEqual([
      { label: '2024-01', projected: 100, actual: 130, variance: 30 },
      { label: '2024-02', projected: 50, actual: 100, variance: 50 },
    ]);
  });

  it('16. does not invent a variance percentage without a planned baseline', () => {
    expect(summarizeCosts([]).variancePercentage).toBeNull();
    expect(summarizeCosts([{ category: 'Unexpected', costType: 'VARIABLE', projectedAmount: 0, actualAmount: 25, date: d1 }] as Cost[]).variancePercentage).toBeNull();
  });

  it('17. excludes unaccounted zero costs from actual comparisons while keeping the full plan', () => {
    const rows = [
      { category: 'Hosting', costType: 'FIXED', projectedAmount: 100, actualAmount: 120, date: d1 },
      { category: 'Marketing', costType: 'VARIABLE', projectedAmount: 500, actualAmount: 0, date: d2 },
    ] as Cost[];
    const result = summarizeCosts(rows);
    expect(result).toMatchObject({ totalPlanned: 600, pendingPlanned: 500, projected: 100, actual: 120, variance: 20, recordedCount: 1, pendingCount: 1 });
    expect(result.variancePercentage).toBe(20);
    expect(result.categories).toEqual([{ label: 'Hosting', projected: 100, actual: 120, variance: 20 }]);
    expect(result.months).toEqual([{ label: '2024-01', projected: 100, actual: 120, variance: 20 }]);
    expect(calculateProjectedCosts(rows)).toBe(600);
    expect(calculateActualCosts(rows)).toBe(120);
  });

  it('18. reports no comparison and no cash-flow month when every cost is pending', () => {
    const rows = [{ category: 'Hosting', costType: 'FIXED', projectedAmount: 100, actualAmount: 0, date: d2 }] as Cost[];
    expect(summarizeCosts(rows)).toMatchObject({ totalPlanned: 100, projected: 0, actual: 0, variance: 0, variancePercentage: null, recordedCount: 0, pendingCount: 1, categories: [], months: [] });
    const investment = { startDate: null, initialInvestment: 0, capitalContributions: [], revenues: [], costs: rows } as unknown as InvestmentWithDetails;
    expect(calculateCashFlow(investment)).toEqual([]);
  });
});
