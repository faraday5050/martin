import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, EyeOff, ArrowRight, Sparkles, BrainCircuit } from 'lucide-react';
import { Sale, Expense, Product, Settings } from '../types';
import { format, subDays, startOfDay, isWithinInterval, startOfMonth, parseISO, addMonths } from 'date-fns';
import { formatCurrency } from '../utils/currency';
import { generateBusinessInsights } from '../services/gemini';
import ReactMarkdown from 'react-markdown';

interface DashboardProps {
  sales: Sale[];
  expenses: Expense[];
  products: Product[];
  settings: Settings;
  exchangeRate: number;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

export default function Dashboard({ sales, expenses, products, settings, exchangeRate }: DashboardProps) {
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (sales.length > 0 && !aiSummary) {
      handleGenerateSummary();
    }
  }, [sales.length]);

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    const insights = await generateBusinessInsights(sales, expenses, products);
    // Just take the first few lines for the dashboard
    const summary = insights.split('\n').slice(0, 5).join('\n');
    setAiSummary(summary);
    setIsGenerating(false);
  };
  const stats = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const monthStart = startOfMonth(now);
    
    const parseDate = (d: string) => {
      try {
        return parseISO(d.includes(' ') ? d.replace(' ', 'T') + 'Z' : d);
      } catch (e) {
        return new Date(d);
      }
    };
    
    const dailySales = sales
      .filter(s => startOfDay(parseDate(s.timestamp)).getTime() === today.getTime())
      .reduce((sum, s) => sum + s.amount, 0);

    const weeklySales = sales
      .filter(s => isWithinInterval(parseDate(s.timestamp), { start: subDays(today, 7), end: now }))
      .reduce((sum, s) => sum + s.amount, 0);

    const monthlySales = sales
      .filter(s => isWithinInterval(parseDate(s.timestamp), { start: monthStart, end: now }))
      .reduce((sum, s) => sum + s.amount, 0);

    const monthlyExpenses = expenses
      .filter(e => isWithinInterval(parseDate(e.timestamp), { start: monthStart, end: now }))
      .reduce((sum, e) => sum + e.amount, 0);


    return { dailySales, weeklySales, monthlySales, monthlyExpenses };
  }, [sales, expenses]);

  const chartData = useMemo(() => {
    const parseDate = (d: string) => {
      try {
        return parseISO(d.includes(' ') ? d.replace(' ', 'T') + 'Z' : d);
      } catch (e) {
        return new Date(d);
      }
    };

    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), i);
      const dayStr = format(date, 'MMM dd');
      const daySales = sales
        .filter(s => startOfDay(parseDate(s.timestamp)).getTime() === startOfDay(date).getTime())
        .reduce((sum, s) => sum + s.amount, 0);
      return { name: dayStr, revenue: daySales };
    }).reverse();

    return last7Days;
  }, [sales]);

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    sales.forEach(s => {
      const cat = s.product_id ? products.find(p => p.id === s.product_id)?.category || 'Other' : 'Custom';
      cats[cat] = (cats[cat] || 0) + s.amount;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [sales, products]);

  // Simple Linear Regression for Forecast
  const forecastData = useMemo(() => {
    if (sales.length < 5) return null;

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
      const monthKey = format(parseDate(s.timestamp), 'yyyy-MM');
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + s.amount;
    });

    const sortedMonths = Object.keys(monthlyTotals).sort();
    const y = sortedMonths.map(m => monthlyTotals[m]);
    const x = Array.from({ length: y.length }).map((_, i) => i);

    // Calculate slope (m) and intercept (b)
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const denominator = (n * sumXX - sumX * sumX);
    if (denominator === 0) return null;

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    // Predict next 3 months
    const predictions = [];
    // Add historical data
    sortedMonths.forEach((m, i) => {
      predictions.push({ name: format(parseISO(m + '-01'), 'MMM yy'), actual: monthlyTotals[m], predicted: slope * i + intercept });
    });

    // Add forecast
    for (let i = 1; i <= 3; i++) {
      const lastMonthDate = parseISO(sortedMonths[sortedMonths.length - 1] + '-01');
      const nextMonth = addMonths(lastMonthDate, i);
      predictions.push({ 
        name: format(nextMonth, 'MMM yy'), 
        predicted: Math.max(0, slope * (n + i - 1) + intercept),
        isForecast: true 
      });
    }

    return predictions;
  }, [sales]);

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-[#0F172A]">Business Overview</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">Real-time performance metrics and sales forecasting.</p>
        </div>
        {settings.privacyMode && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-full text-xs font-bold border border-amber-100">
            <EyeOff size={14} /> Privacy Mode Active
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Today's Sales" value={stats.dailySales} icon={<DollarSign className="text-emerald-600" />} color="emerald" settings={settings} exchangeRate={exchangeRate} />
        <StatCard title="Weekly Revenue" value={stats.weeklySales} icon={<TrendingUp className="text-blue-600" />} color="blue" settings={settings} exchangeRate={exchangeRate} />
        <StatCard title="Monthly Revenue" value={stats.monthlySales} icon={<ShoppingCart className="text-indigo-600" />} color="indigo" settings={settings} exchangeRate={exchangeRate} />
        <StatCard title="Monthly Expenses" value={stats.monthlyExpenses} icon={<TrendingDown className="text-amber-600" />} color="amber" settings={settings} exchangeRate={exchangeRate} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-black mb-8 text-[#0F172A] dark:text-white">7-Day Revenue Trend</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} tickFormatter={(v) => formatCurrency(v, settings.currency, settings.privacyMode, exchangeRate)} />
                  <Tooltip 
                    cursor={{fill: '#F8FAFC'}}
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    formatter={(v: any) => [formatCurrency(Number(v), settings.currency, settings.privacyMode, exchangeRate), 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#0F172A" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {aiSummary && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-8 rounded-3xl border border-emerald-100 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-emerald-600" size={20} />
                <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-200 uppercase tracking-wider">AI Quick Insight</h3>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-emerald-900 dark:text-emerald-100">
                <ReactMarkdown>{aiSummary}</ReactMarkdown>
              </div>
              <button 
                onClick={() => document.querySelector('[title="Predictions"]')?.dispatchEvent(new MouseEvent('click', {bubbles: true}))}
                className="mt-4 text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                View full analysis <ArrowRight size={12} />
              </button>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-black mb-8 text-[#0F172A] dark:text-white">Sales by Category</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData.length > 0 ? categoryData : [{name: 'No Data', value: 1}]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  {categoryData.length === 0 && <Cell fill="#F1F5F9" />}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  formatter={(v: any) => [formatCurrency(Number(v), settings.currency, settings.privacyMode, exchangeRate), 'Revenue']}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle" 
                  wrapperStyle={{ paddingTop: '20px', fontSize: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {forecastData && (
        <div className="bg-[#0F172A] p-10 rounded-[40px] text-white shadow-2xl shadow-slate-300">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="text-2xl font-black flex items-center gap-3 text-white">
                <TrendingUp className="text-[#10B981]" /> Sales Forecast & Predictions
              </h3>
              <p className="text-slate-400 mt-2">AI-driven insights based on your historical sales data.</p>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-full border border-white/10 text-xs font-bold uppercase tracking-widest text-[#10B981]">
              Predictive Mode Active
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            <div className="lg:col-span-3 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10}} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#1E293B', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)'}}
                    itemStyle={{fontSize: '12px'}}
                    formatter={(v: any) => [formatCurrency(Number(v), settings.currency, settings.privacyMode, exchangeRate), 'Revenue']}
                  />
                  <Line type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={3} dot={{r: 4, fill: '#10B981'}} name="Actual Sales" />
                  <Line type="monotone" dataKey="predicted" stroke="#6366F1" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Predicted Trend" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-6">
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Next Month Forecast</p>
                <p className="text-2xl font-bold text-[#10B981]">{formatCurrency(Math.round(forecastData[forecastData.length - 3]?.predicted || 0), settings.currency, settings.privacyMode, exchangeRate)}</p>
                <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                  <ArrowRight size={12} /> Based on {sales.length} transactions
                </p>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">3-Month Outlook</p>
                <p className="text-2xl font-bold text-[#6366F1]">{formatCurrency(Math.round(forecastData[forecastData.length - 1]?.predicted || 0), settings.currency, settings.privacyMode, exchangeRate)}</p>
                <p className="text-[10px] text-slate-500 mt-2">Projected growth trend</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color, settings, exchangeRate }: { title: string, value: number, icon: React.ReactNode, color: string, settings: Settings, exchangeRate: number }) {
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-[#E2E8F0] dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-bold text-[#0F172A] dark:text-white mt-1">
        {formatCurrency(value, settings.currency, settings.privacyMode, exchangeRate)}
      </p>
    </div>
  );
}
