import { describe, it, expect } from 'vitest';
import { runMonteCarloSimulation } from './monteCarlo';
import { InvestmentWithDetails } from './index';

describe('Monte Carlo Simulation', () => {
  it('runs successfully and calculates percentiles correctly', () => {
    const mockInvestment: InvestmentWithDetails = {
      id: '1',
      name: 'Test',
      description: '',
      category: 'Test',
      status: 'ACTIVE',
      currency: 'USD',
      initialInvestment: 10000,
      startDate: new Date(),
      endDate: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      revenues: [
        { projectedAmount: 100000, actualAmount: 0 } as any
      ],
      costs: [
        { costType: 'FIXED', projectedAmount: 20000, actualAmount: 0 } as any,
        { costType: 'VARIABLE', projectedAmount: 30000, actualAmount: 0 } as any
      ],
      capitalContributions: []
    };

    // Base Profit = 100k - 20k - 30k = 50k
    
    const result = runMonteCarloSimulation(mockInvestment, 0.20, 1000);
    
    expect(result.iterations).toBe(1000);
    expect(result.histogram.length).toBe(20);
    
    // P50 should be relatively close to the base profit (50k)
    expect(result.p50).toBeGreaterThan(45000);
    expect(result.p50).toBeLessThan(55000);

    // P10 should be lower than P50
    expect(result.p10).toBeLessThan(result.p50);
    
    // P90 should be higher than P50
    expect(result.p90).toBeGreaterThan(result.p50);
  });
});
