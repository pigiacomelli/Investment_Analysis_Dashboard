'use client';

import { useState } from 'react';
import { InvestmentWithDetails, calculateProjectedProfit, calculateActualProfit, calculateActualROI, calculateProjectedROI, calculateProjectedRevenue, calculateActualRevenue, calculateProjectedCosts, calculateActualCosts } from '@/lib/finance';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';
import { useRouter } from 'next/navigation';
import { createCost, deleteCost, updateCost, createRevenue, deleteRevenue, updateRevenue, updateInvestment, deleteInvestment } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { Plus, Trash2, Edit2, X, Save, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import { MonteCarloSimulation } from './MonteCarloSimulation';

export function ExcelDashboard({ investment }: { investment: InvestmentWithDetails }) {
  const { revenues, costs, currency, initialInvestment, capitalContributions } = investment;
  const fixedCosts = costs.filter(c => c.costType === 'FIXED');
  const variableCosts = costs.filter(c => c.costType === 'VARIABLE');

  const projProfit = calculateProjectedProfit(revenues, costs);
  const actProfit = calculateActualProfit(revenues, costs);
  const variance = actProfit - projProfit;
  
  const projRev = calculateProjectedRevenue(revenues);
  const actRev = calculateActualRevenue(revenues);
  const projCosts = calculateProjectedCosts(costs);
  const actCosts = calculateActualCosts(costs);

  const projROI = calculateProjectedROI(initialInvestment, capitalContributions, revenues, costs);
  const actROI = calculateActualROI(initialInvestment, capitalContributions, revenues, costs);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const router = useRouter();

  const handleUpdateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Include required fields that aren't in the inline form
    formData.append('status', investment.status);
    formData.append('initialInvestment', investment.initialInvestment.toString());
    await updateInvestment(investment.id, formData);
    setIsEditingProject(false);
  };

  const handleDeleteProject = async () => {
    if (confirm('Are you sure you want to delete this entire project and all its data? This cannot be undone.')) {
      await deleteInvestment(investment.id);
      router.push('/');
    }
  };

  // Form Handlers
  const handleAddRevenue = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('investmentId', investment.id);
    await createRevenue(investment.id, formData);
    (e.target as HTMLFormElement).reset();
  };

  const handleUpdateRevenue = async (e: React.FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await updateRevenue(id, investment.id, formData);
    setEditingId(null);
  };

  const handleAddCost = async (e: React.FormEvent<HTMLFormElement>, type: 'FIXED' | 'VARIABLE') => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('investmentId', investment.id);
    formData.append('costType', type);
    await createCost(investment.id, formData);
    (e.target as HTMLFormElement).reset();
  };

  const handleUpdateCost = async (e: React.FormEvent<HTMLFormElement>, id: string, type: 'FIXED' | 'VARIABLE') => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('costType', type);
    await updateCost(id, investment.id, formData);
    setEditingId(null);
  };

  const KpiCard = ({ title, value, subtext, description, icon: Icon, trend }: any) => (
    <div className="bg-card border border-border p-5 rounded-xl shadow-sm flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold mt-2">{value}</h3>
        {subtext && (
          <p className={cn("text-xs font-medium mt-1", trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground')}>
            {subtext}
          </p>
        )}
        {description && (
          <p className="text-[10px] font-mono mt-2 bg-muted/50 p-1.5 rounded-md text-muted-foreground border border-border/50">
            {description}
          </p>
        )}
      </div>
      <div className={cn("p-2 rounded-lg", trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : trend === 'down' ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary')}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {isEditingProject ? (
          <form onSubmit={handleUpdateProject} className="flex-1 flex gap-2 max-w-2xl">
            <input name="name" required defaultValue={investment.name} className="flex-1 px-3 py-2 bg-background border border-input rounded-md font-bold text-xl" />
            <select name="category" required defaultValue={investment.category} className="px-3 py-2 bg-background border border-input rounded-md">
              <option value="Business">Business</option>
              <option value="Startup">Startup</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Stock Investment">Stock Investment</option>
              <option value="Private Investment">Private Investment</option>
              <option value="Software Project">Software Project</option>
              <option value="Other">Other</option>
            </select>
            <select name="currency" required defaultValue={investment.currency} className="px-3 py-2 bg-background border border-input rounded-md">
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="BRL">BRL (R$)</option>
              <option value="GBP">GBP (£)</option>
            </select>
            <input type="date" name="startDate" required defaultValue={new Date(investment.startDate).toISOString().split('T')[0]} className="px-3 py-2 bg-background border border-input rounded-md" />
            <div className="flex items-center gap-1 ml-2">
              <button type="submit" className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"><Save className="w-4 h-4" /></button>
              <button type="button" onClick={() => setIsEditingProject(false)} className="p-2 border border-input text-muted-foreground rounded-md hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
          </form>
        ) : (
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 group">
              {investment.name}
              <button onClick={() => setIsEditingProject(true)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all p-1">
                <Edit2 className="w-4 h-4" />
              </button>
            </h1>
            <p className="text-muted-foreground">{investment.category} • {investment.currency} • Started {new Date(investment.startDate).toLocaleDateString()}</p>
          </div>
        )}
        
        {!isEditingProject && (
          <button onClick={handleDeleteProject} className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-md font-medium text-sm transition-colors border border-destructive/20">
            <Trash2 className="w-4 h-4" /> Delete Project
          </button>
        )}
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Projected Profit" 
          value={formatCurrency(projProfit, currency)} 
          description={`${formatCurrency(projRev, currency)} - ${formatCurrency(projCosts, currency)}`}
          icon={Activity} 
        />
        <KpiCard 
          title="Actual Profit" 
          value={formatCurrency(actProfit, currency)} 
          subtext={`${variance > 0 ? '+' : ''}${formatCurrency(variance, currency)} Variance`}
          description={`${formatCurrency(actRev, currency)} - ${formatCurrency(actCosts, currency)}`}
          trend={variance > 0 ? 'up' : variance < 0 ? 'down' : 'neutral'}
          icon={DollarSign} 
        />
        <KpiCard 
          title="Projected ROI" 
          value={formatPercentage(projROI)} 
          description={`${formatCurrency(projProfit, currency)} / ${formatCurrency(projCosts, currency)}`}
          icon={TrendingUp} 
        />
        <KpiCard 
          title="Actual ROI" 
          value={formatPercentage(actROI)} 
          subtext={`${(actROI - projROI).toFixed(2)}% vs Projected`}
          description={`${formatCurrency(actProfit, currency)} / ${formatCurrency(actCosts, currency)}`}
          trend={actROI > projROI ? 'up' : actROI < projROI ? 'down' : 'neutral'}
          icon={actROI > projROI ? TrendingUp : TrendingDown} 
        />
      </div>

      {/* Data Grid Section */}
      <div className="space-y-6">
        
        {/* REVENUES GRID */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-lg text-emerald-500 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Revenues
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase text-muted-foreground bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Projected</th>
                  <th className="px-4 py-3 font-medium text-right">Actual</th>
                  <th className="px-4 py-3 font-medium text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {revenues.map(rev => editingId === rev.id ? (
                  <tr key={rev.id} className="bg-muted/30">
                    <td colSpan={6} className="p-0">
                      <form onSubmit={(e) => handleUpdateRevenue(e, rev.id)} className="flex w-full">
                        <div className="flex-1 grid grid-cols-5 divide-x divide-border">
                          <input name="name" required defaultValue={rev.name} className="px-4 py-3 bg-transparent border-none outline-none text-sm focus:bg-background transition-colors" />
                          <input name="category" required defaultValue={rev.category} className="px-4 py-3 bg-transparent border-none outline-none text-sm focus:bg-background transition-colors" />
                          <input type="date" name="date" required defaultValue={new Date(rev.date).toISOString().split('T')[0]} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-muted-foreground focus:bg-background transition-colors" />
                          <input type="number" step="0.01" name="projectedAmount" required defaultValue={rev.projectedAmount} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                          <input type="number" step="0.01" name="actualAmount" defaultValue={rev.actualAmount || ''} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                        </div>
                        <div className="flex w-24 border-l border-border">
                          <button type="button" onClick={() => setEditingId(null)} className="flex-1 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
                          <button type="submit" className="flex-1 flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10 transition-colors border-l border-border"><Save className="w-4 h-4" /></button>
                        </div>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={rev.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3 font-medium">{rev.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{rev.category}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(rev.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(rev.projectedAmount, currency)}</td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-500">{formatCurrency(rev.actualAmount || 0, currency)}</td>
                    <td className="px-4 py-3 text-center flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => setEditingId(rev.id)} className="text-blue-500 hover:bg-blue-500/10 p-1.5 rounded transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deleteRevenue(rev.id, investment.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded transition-all"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                
                {/* INLINE ADD REVENUE ROW */}
                <tr className="bg-muted/10">
                  <td colSpan={6} className="p-0">
                    <form onSubmit={handleAddRevenue} className="flex w-full">
                      <div className="flex-1 grid grid-cols-5 divide-x divide-border">
                        <input name="name" required placeholder="New Revenue..." className="px-4 py-3 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50 focus:bg-background transition-colors" />
                        <input name="category" required placeholder="Category" className="px-4 py-3 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50 focus:bg-background transition-colors" />
                        <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-muted-foreground focus:bg-background transition-colors" />
                        <input type="number" step="0.01" name="projectedAmount" required placeholder="Proj $" className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                        <input type="number" step="0.01" name="actualAmount" placeholder="Act $" className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                      </div>
                      <button type="submit" className="px-6 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 font-medium text-sm flex items-center justify-center transition-colors border-l border-border w-24">
                        Add
                      </button>
                    </form>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FIXED COSTS GRID */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-lg text-orange-500 flex items-center gap-2">
              <Activity className="w-5 h-5" /> Fixed Costs
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase text-muted-foreground bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Recurrence</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Projected</th>
                  <th className="px-4 py-3 font-medium text-right">Actual</th>
                  <th className="px-4 py-3 font-medium text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fixedCosts.map(cost => editingId === cost.id ? (
                  <tr key={cost.id} className="bg-muted/30">
                    <td colSpan={7} className="p-0">
                      <form onSubmit={(e) => handleUpdateCost(e, cost.id, 'FIXED')} className="flex w-full">
                        <div className="flex-1 grid grid-cols-6 divide-x divide-border">
                          <input name="name" required defaultValue={cost.name} className="px-4 py-3 bg-transparent border-none outline-none text-sm focus:bg-background transition-colors" />
                          <input name="category" required defaultValue={cost.category} className="px-4 py-3 bg-transparent border-none outline-none text-sm focus:bg-background transition-colors" />
                          <select name="recurrence" required defaultValue={cost.recurrence} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-muted-foreground focus:bg-background transition-colors appearance-none">
                            <option value="MONTHLY">Monthly</option>
                            <option value="YEARLY">Yearly</option>
                            <option value="ONE_TIME">One Time</option>
                            <option value="WEEKLY">Weekly</option>
                          </select>
                          <input type="date" name="date" required defaultValue={new Date(cost.date).toISOString().split('T')[0]} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-muted-foreground focus:bg-background transition-colors" />
                          <input type="number" step="0.01" name="projectedAmount" required defaultValue={cost.projectedAmount} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                          <input type="number" step="0.01" name="actualAmount" defaultValue={cost.actualAmount || ''} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                        </div>
                        <div className="flex w-24 border-l border-border">
                          <button type="button" onClick={() => setEditingId(null)} className="flex-1 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
                          <button type="submit" className="flex-1 flex items-center justify-center text-orange-500 hover:bg-orange-500/10 transition-colors border-l border-border"><Save className="w-4 h-4" /></button>
                        </div>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={cost.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3 font-medium">{cost.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{cost.category}</td>
                    <td className="px-4 py-3 text-muted-foreground">{cost.recurrence}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(cost.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(cost.projectedAmount, currency)}</td>
                    <td className="px-4 py-3 text-right font-medium text-orange-500">{formatCurrency(cost.actualAmount || 0, currency)}</td>
                    <td className="px-4 py-3 text-center flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => setEditingId(cost.id)} className="text-blue-500 hover:bg-blue-500/10 p-1.5 rounded transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deleteCost(cost.id, investment.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded transition-all"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                
                {/* INLINE ADD COST ROW */}
                <tr className="bg-muted/10">
                  <td colSpan={7} className="p-0">
                    <form onSubmit={(e) => handleAddCost(e, 'FIXED')} className="flex w-full">
                      <div className="flex-1 grid grid-cols-6 divide-x divide-border">
                        <input name="name" required placeholder="New Fixed Cost..." className="px-4 py-3 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50 focus:bg-background transition-colors" />
                        <input name="category" required placeholder="Category" className="px-4 py-3 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50 focus:bg-background transition-colors" />
                        <select name="recurrence" required className="px-4 py-3 bg-transparent border-none outline-none text-sm text-muted-foreground focus:bg-background transition-colors appearance-none">
                          <option value="MONTHLY">Monthly</option>
                          <option value="YEARLY">Yearly</option>
                          <option value="ONE_TIME">One Time</option>
                          <option value="WEEKLY">Weekly</option>
                        </select>
                        <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-muted-foreground focus:bg-background transition-colors" />
                        <input type="number" step="0.01" name="projectedAmount" required placeholder="Proj $" className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                        <input type="number" step="0.01" name="actualAmount" placeholder="Act $" className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                      </div>
                      <button type="submit" className="px-6 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 font-medium text-sm flex items-center justify-center transition-colors border-l border-border w-24">
                        Add
                      </button>
                    </form>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* VARIABLE COSTS GRID */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-lg text-red-500 flex items-center gap-2">
              <TrendingDown className="w-5 h-5" /> Variable Costs
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase text-muted-foreground bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Recurrence</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Projected</th>
                  <th className="px-4 py-3 font-medium text-right">Actual</th>
                  <th className="px-4 py-3 font-medium text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {variableCosts.map(cost => editingId === cost.id ? (
                  <tr key={cost.id} className="bg-muted/30">
                    <td colSpan={7} className="p-0">
                      <form onSubmit={(e) => handleUpdateCost(e, cost.id, 'VARIABLE')} className="flex w-full">
                        <div className="flex-1 grid grid-cols-6 divide-x divide-border">
                          <input name="name" required defaultValue={cost.name} className="px-4 py-3 bg-transparent border-none outline-none text-sm focus:bg-background transition-colors" />
                          <input name="category" required defaultValue={cost.category} className="px-4 py-3 bg-transparent border-none outline-none text-sm focus:bg-background transition-colors" />
                          <select name="recurrence" required defaultValue={cost.recurrence} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-muted-foreground focus:bg-background transition-colors appearance-none">
                            <option value="ONE_TIME">One Time</option>
                            <option value="MONTHLY">Monthly</option>
                            <option value="YEARLY">Yearly</option>
                            <option value="WEEKLY">Weekly</option>
                          </select>
                          <input type="date" name="date" required defaultValue={new Date(cost.date).toISOString().split('T')[0]} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-muted-foreground focus:bg-background transition-colors" />
                          <input type="number" step="0.01" name="projectedAmount" required defaultValue={cost.projectedAmount} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                          <input type="number" step="0.01" name="actualAmount" defaultValue={cost.actualAmount || ''} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                        </div>
                        <div className="flex w-24 border-l border-border">
                          <button type="button" onClick={() => setEditingId(null)} className="flex-1 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
                          <button type="submit" className="flex-1 flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-colors border-l border-border"><Save className="w-4 h-4" /></button>
                        </div>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <tr key={cost.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3 font-medium">{cost.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{cost.category}</td>
                    <td className="px-4 py-3 text-muted-foreground">{cost.recurrence}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(cost.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(cost.projectedAmount, currency)}</td>
                    <td className="px-4 py-3 text-right font-medium text-red-500">{formatCurrency(cost.actualAmount || 0, currency)}</td>
                    <td className="px-4 py-3 text-center flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => setEditingId(cost.id)} className="text-blue-500 hover:bg-blue-500/10 p-1.5 rounded transition-all"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deleteCost(cost.id, investment.id)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded transition-all"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                
                {/* INLINE ADD COST ROW */}
                <tr className="bg-muted/10">
                  <td colSpan={7} className="p-0">
                    <form onSubmit={(e) => handleAddCost(e, 'VARIABLE')} className="flex w-full">
                      <div className="flex-1 grid grid-cols-6 divide-x divide-border">
                        <input name="name" required placeholder="New Variable Cost..." className="px-4 py-3 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50 focus:bg-background transition-colors" />
                        <input name="category" required placeholder="Category" className="px-4 py-3 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50 focus:bg-background transition-colors" />
                        <select name="recurrence" required className="px-4 py-3 bg-transparent border-none outline-none text-sm text-muted-foreground focus:bg-background transition-colors appearance-none">
                          <option value="ONE_TIME">One Time</option>
                          <option value="MONTHLY">Monthly</option>
                          <option value="YEARLY">Yearly</option>
                          <option value="WEEKLY">Weekly</option>
                        </select>
                        <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="px-4 py-3 bg-transparent border-none outline-none text-sm text-muted-foreground focus:bg-background transition-colors" />
                        <input type="number" step="0.01" name="projectedAmount" required placeholder="Proj $" className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                        <input type="number" step="0.01" name="actualAmount" placeholder="Act $" className="px-4 py-3 bg-transparent border-none outline-none text-sm text-right focus:bg-background transition-colors" />
                      </div>
                      <button type="submit" className="px-6 bg-red-500/10 text-red-500 hover:bg-red-500/20 font-medium text-sm flex items-center justify-center transition-colors border-l border-border w-24">
                        Add
                      </button>
                    </form>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      


      {/* Risk Simulation */}
      <MonteCarloSimulation investment={investment} />

    </div>
  );
}
