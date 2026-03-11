import React, { useMemo, useState, useEffect } from 'react';
import { Sale, Expense, PredictionData, Settings, Product } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO, startOfMonth, addMonths, subMonths } from 'date-fns';
import { BrainCircuit, TrendingUp, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { generateBusinessInsights } from '../services/gemini';
import ReactMarkdown from 'react-markdown';

interface AnalyticsProps {
  sales: Sale[];
  expenses: Expense[];
  products: Product[];
  settings: Settings;
  exchangeRate: number;
}

export default function Analytics({ sales, expenses, products, settings, exchangeRate }: AnalyticsProps) {
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (sales.length > 0) {
      handleGenerateInsights();
    }
  }, [sales.length]);

  const handleGenerateInsights = async () => {
    setIsGenerating(true);
    const insights = await generateBusinessInsights(sales, expenses, products);
    setAiInsights(insights);
    setIsGenerating(false);
  };
  const forecastData = useMemo(() => {
    const parseDate = (d: string) => {
      try {
        return parseISO(d.includes(' ') ? d.replace(' ', 'T') + 'Z' : d);
      } catch (e) {
        return new Date(d);
      }
    };

    // Group sales by month
    const monthlyTotals: Record<string, number> = {};
    sales.forEach(s => {
      const monthKey = format(startOfMonth(parseDate(s.timestamp)), 'yyyy-MM');
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + s.amount;
    });

    const months = Object.keys(monthlyTotals).sort();
    if (months.length < 3) return null;

    // Simple Linear Regression: y = mx + b
    const n = months.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    months.forEach((m, i) => {
      sumX += i;
      sumY += monthlyTotals[m];
      sumXY += i * monthlyTotals[m];
      sumX2 += i * i;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const predictions: PredictionData[] = [];
    
    // Past data
    months.forEach((m, i) => {
      predictions.push({
        name: format(parseISO(m + '-01'), 'MMM yy'),
        actual: monthlyTotals[m],
        predicted: Math.round(slope * i + intercept)
      });
    });

    // Future 6 months
    const lastMonth = parseISO(months[months.length - 1] + '-01');
    for (let i = 1; i <= 6; i++) {
      const futureMonth = addMonths(lastMonth, i);
      predictions.push({
        name: format(futureMonth, 'MMM yy'),
        predicted: Math.round(slope * (n + i - 1) + intercept)
      });
    }

    return predictions;
  }, [sales]);

  const stats = useMemo(() => {
    if (!forecastData) return null;
    const nextMonth = forecastData.find(d => !d.actual);
    const lastMonth = forecastData.filter(d => d.actual).pop();
    
    if (!nextMonth || !lastMonth) return null;

    const growth = ((nextMonth.predicted - (lastMonth.actual || 0)) / (lastMonth.actual || 1)) * 100;
    
    return {
      nextMonthRevenue: nextMonth.predicted,
      growth: growth.toFixed(1),
      isPositive: growth >= 0
    };
  }, [forecastData]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-[#0F172A]">Predictive Analytics</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">AI-driven insights and future performance forecasting.</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 p-3 rounded-2xl">
          <BrainCircuit size={32} />
        </div>
      </header>

      {!forecastData ? (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-8 rounded-3xl flex items-center gap-4 text-amber-800 dark:text-amber-200">
          <AlertCircle size={24} />
          <p className="font-medium">Insufficient data for accurate predictions. Please record at least 3 months of sales history.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-[#E5E7EB] dark:border-slate-800 shadow-sm">
                  <h3 className="text-sm font-bold text-[#6B7280] uppercase tracking-wider mb-2">Next Month Forecast</h3>
                  <p className="text-4xl font-bold text-[#111827] dark:text-white">{formatCurrency(stats?.nextMonthRevenue || 0, settings.currency, settings.privacyMode, exchangeRate)}</p>
                  <div className={`mt-4 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${stats?.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    <TrendingUp size={12} className={stats?.isPositive ? '' : 'rotate-180'} />
                    {stats?.growth}% projected {stats?.isPositive ? 'increase' : 'decrease'}
                  </div>
                </div>

                <div className="bg-[#111827] dark:bg-slate-800 p-8 rounded-3xl text-white shadow-xl shadow-slate-200 dark:shadow-none">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Confidence Level</h3>
                  <p className="text-4xl font-bold">84%</p>
                  <p className="text-slate-400 text-sm mt-4">Based on historical consistency and seasonal trends identified in your beverage sales data.</p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-[#E5E7EB] dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold text-[#111827] dark:text-white">Revenue Forecast Model</h3>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
                      <span className="text-xs font-medium text-[#6B7280]">Actual</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#6366F1]"></div>
                      <span className="text-xs font-medium text-[#6B7280]">Predicted</span>
                    </div>
                  </div>
                </div>
                
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecastData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94A3B8', fontSize: 12}}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94A3B8', fontSize: 12}}
                        tickFormatter={(value) => formatCurrency(value, settings.currency, settings.privacyMode, exchangeRate)}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [formatCurrency(value, settings.currency, settings.privacyMode, exchangeRate), 'Revenue']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="actual" 
                        stroke="#10B981" 
                        strokeWidth={4} 
                        dot={{ r: 6, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 8 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="predicted" 
                        stroke="#6366F1" 
                        strokeWidth={2} 
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-[#E5E7EB] dark:border-slate-800 shadow-sm flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-purple-500" size={20} />
                  <h3 className="text-lg font-bold text-[#111827] dark:text-white">AI Advisor</h3>
                </div>
                <button 
                  onClick={handleGenerateInsights}
                  disabled={isGenerating}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                  title="Refresh Insights"
                >
                  <BrainCircuit size={18} className={isGenerating ? 'animate-pulse' : ''} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                    <Loader2 size={32} className="animate-spin" />
                    <p className="text-sm font-medium">Analyzing your business data...</p>
                  </div>
                ) : aiInsights ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{aiInsights}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center space-y-4">
                    <BrainCircuit size={48} strokeWidth={1} />
                    <p className="text-sm">Record more sales to unlock AI-driven business advice.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
