'use client';

import { InvestmentWithDetails } from '@/lib/finance';
import { formatCurrency } from '@/lib/utils/format';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface DashboardChartsProps {
  investments: InvestmentWithDetails[];
}

const COLORS = ['#334155', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardCharts({ investments }: DashboardChartsProps) {
  if (!investments || investments.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-lg border border-slate-200">
        No investment data available for charts.
      </div>
    );
  }

  const revenueData = investments.map(inv => {
    const proj = inv.revenues.reduce((sum, r) => sum + r.projectedAmount, 0);
    const act = inv.revenues.reduce((sum, r) => sum + (r.actualAmount || 0), 0);
    return { name: inv.name, Projected: proj, Actual: act };
  });

  const costData = investments.map(inv => {
    const proj = inv.costs.reduce((sum, c) => sum + c.projectedAmount, 0);
    const act = inv.costs.reduce((sum, c) => sum + (c.actualAmount || 0), 0);
    return { name: inv.name, Projected: proj, Actual: act };
  });

  const allCosts = investments.flatMap(i => i.costs);
  const fixedTotal = allCosts.filter(c => c.costType === 'FIXED').reduce((sum, c) => sum + (c.actualAmount || c.projectedAmount), 0);
  const varTotal = allCosts.filter(c => c.costType === 'VARIABLE').reduce((sum, c) => sum + (c.actualAmount || c.projectedAmount), 0);
  const costBreakdownData = [
    { name: 'Fixed Costs', value: fixedTotal },
    { name: 'Variable Costs', value: varTotal }
  ].filter(d => d.value > 0);

  const capitalAllocationData = investments.map(inv => {
    const additional = inv.capitalContributions.reduce((sum, c) => sum + c.amount, 0);
    return { name: inv.name, value: inv.initialInvestment + additional };
  }).filter(d => d.value > 0);

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-md rounded-md text-sm">
          <p className="font-semibold text-slate-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value, 'USD')} 
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const pieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-md rounded-md text-sm">
          <p className="font-semibold text-slate-800">{payload[0].name}</p>
          <p className="text-slate-600">{formatCurrency(payload[0].value, 'USD')}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm h-80">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Projected vs Actual Revenue</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={revenueData} margin={{ top: 5, right: 5, left: 5, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
            <Tooltip content={customTooltip} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="Projected" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Actual" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm h-80">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Projected vs Actual Costs</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={costData} margin={{ top: 5, right: 5, left: 5, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
            <Tooltip content={customTooltip} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="Projected" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Actual" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm h-80">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Fixed vs Variable Costs</h3>
        {costBreakdownData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={costBreakdownData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {costBreakdownData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={pieTooltip} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">No cost data</div>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm h-80">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Portfolio Capital Allocation</h3>
        {capitalAllocationData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={capitalAllocationData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {capitalAllocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={pieTooltip} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">No investment data</div>
        )}
      </div>
    </div>
  );
}
