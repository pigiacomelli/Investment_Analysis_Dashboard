'use client';

import { useState, useMemo } from 'react';
import { InvestmentWithDetails } from '@/lib/finance';
import { runMonteCarloSimulation } from '@/lib/finance/monteCarlo';
import { formatCurrency } from '@/lib/utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Settings2, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';

export function MonteCarloSimulation({ investment }: { investment: InvestmentWithDetails }) {
  const [volatility, setVolatility] = useState<number>(0.20);
  
  // Re-run simulation when volatility changes
  const simulation = useMemo(() => {
    return runMonteCarloSimulation(investment, volatility, 2000);
  }, [investment, volatility]);

  const { p10, p50, p90, histogram } = simulation;

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden p-6 mt-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" /> 
            Monte Carlo Risk Simulation
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Simulating 2,000 scenarios by varying revenues and variable costs (fixed costs remain constant).
          </p>
        </div>
        
        <div className="flex flex-col gap-2 min-w-[200px] bg-muted/30 p-4 rounded-lg border border-border">
          <label className="text-sm font-medium flex justify-between">
            Volatility (Risk)
            <span className="text-primary font-bold">{(volatility * 100).toFixed(0)}%</span>
          </label>
          <input 
            type="range" 
            min="0.05" 
            max="0.50" 
            step="0.05" 
            value={volatility} 
            onChange={(e) => setVolatility(parseFloat(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Low (5%)</span>
            <span>High (50%)</span>
          </div>
        </div>
      </div>

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <h3 className="font-semibold text-sm">P10 Pessimistic</h3>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(p10, investment.currency)}</p>
          <p className="text-xs text-muted-foreground mt-1">90% chance of exceeding this profit</p>
        </div>

        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <TrendingUp className="w-4 h-4" />
            <h3 className="font-semibold text-sm">P50 Base Case</h3>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(p50, investment.currency)}</p>
          <p className="text-xs text-muted-foreground mt-1">Median expected profit</p>
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center gap-2 text-emerald-500 mb-2">
            <TrendingUp className="w-4 h-4" />
            <h3 className="font-semibold text-sm">P90 Optimistic</h3>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(p90, investment.currency)}</p>
          <p className="text-xs text-muted-foreground mt-1">10% chance of reaching this profit</p>
        </div>
      </div>

      {/* Histogram Chart */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={histogram} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="bin" 
              tickFormatter={(value) => formatCurrency(Number(value), investment.currency)}
              tick={{ fontSize: 11 }}
              tickMargin={10}
              stroke="rgba(255,255,255,0.2)"
            />
            <YAxis hide />
            <Tooltip
              formatter={(value: any) => [`${value} Scenarios`, 'Frequency']}
              labelFormatter={(label) => `Profit: ${formatCurrency(Number(label), investment.currency)}`}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {histogram.map((entry, index) => {
                const binVal = Number(entry.bin);
                // Color code based on profit value
                const color = binVal < 0 ? '#ef4444' : '#3b82f6'; // red for loss, blue for profit
                return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.8} />;
              })}
            </Bar>
            
            {/* Break-even line */}
            <ReferenceLine x="0" stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Break-even', fill: '#ef4444', fontSize: 12 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
