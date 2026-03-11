import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, Legend
} from 'recharts';
import { TrendingUp, DollarSign, PieChart, ArrowUpRight, Target, LayoutDashboard } from 'lucide-react';
import { Sale, Product, Settings } from '../types';
import { format, subDays, startOfDay, parseISO } from 'date-fns';
import { formatCurrency } from '../utils/currency';

interface ProfitsProps {
  sales: Sale[];
  products: Product[];
  settings: Settings;
  exchangeRate: number;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

export default function Profits({ sales, products, settings, exchangeRate }: ProfitsProps) {
  const profitStats = useMemo(() => {
    const parseDate = (d: string) => {
      try {
        return parseISO(d.includes(' ') ? d.replace(' ', 'T') + 'Z' : d);
      } catch (e) {
        return new Date(d);
      }
    };

    let totalProfit = 0;
    const categoryProfits: Record<string, number> = {};
    const subCategoryProfits: Record<string, number> = {};
    const dailyProfits: Record<string, number> = {};

    sales.forEach(sale => {
      const product = products.find(p => p.id === sale.product_id);
      if (product) {
        const cost = product.wholesale_price * sale.quantity;
        const profit = sale.amount - cost;
        totalProfit += profit;

        // Category
        const cat = product.category || 'Other';
        categoryProfits[cat] = (categoryProfits[cat] || 0) + profit;

        // Subcategory
        const subCat = product.sub_category || 'Other';
        subCategoryProfits[subCat] = (subCategoryProfits[subCat] || 0) + profit;

        // Daily
        const dayStr = format(startOfDay(parseDate(sale.timestamp)), 'MMM dd');
        dailyProfits[dayStr] = (dailyProfits[dayStr] || 0) + profit;
      }
    });

    // Format for charts
    const timeData = Array.from({ length: 14 }).map((_, i) => {
      const date = subDays(new Date(), i);
      const dayStr = format(date, 'MMM dd');
      return { name: dayStr, profit: dailyProfits[dayStr] || 0 };
    }).reverse();

    const catData = Object.entries(categoryProfits)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const subCatData = Object.entries(subCategoryProfits)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 subcategories

    return { totalProfit, timeData, catData, subCatData };
  }, [sales, products]);

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-[#0F172A]">Profit Intelligence</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">Detailed analysis of your net earnings and profit margins.</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 px-6 py-3 rounded-2xl border border-emerald-100 dark:border-emerald-800 flex items-center gap-3">
          <div className="p-2 bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-200 dark:shadow-none">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Total Net Profit</p>
            <p className="text-xl font-black text-[#0F172A] dark:text-white">
              {formatCurrency(profitStats.totalProfit, settings.currency, settings.privacyMode, exchangeRate)}
            </p>
          </div>
        </div>
      </header>

      {/* Profit Dialogue Box / Summary Section */}
      <section className="bg-[#0F172A] p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/10 text-xs font-bold uppercase tracking-widest text-[#10B981]">
              <Target size={14} /> Profit Accumulation Dialogue
            </div>
            <h3 className="text-4xl font-black leading-tight">Your business has generated <span className="text-[#10B981]">{formatCurrency(profitStats.totalProfit, settings.currency, settings.privacyMode, exchangeRate)}</span> in total net profit.</h3>
            <p className="text-slate-400 text-lg leading-relaxed">
              This represents the actual earnings after deducting the wholesale cost of all products sold. 
              Your current profit margin is healthy, driven primarily by high-performing categories.
            </p>
            <div className="flex gap-4 pt-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Top Category</p>
                <p className="text-xl font-bold text-white">{profitStats.catData[0]?.name || 'N/A'}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Top Sub-Category</p>
                <p className="text-xl font-bold text-white">{profitStats.subCatData[0]?.name || 'N/A'}</p>
              </div>
            </div>
          </div>
          <div className="h-[300px] bg-white/5 rounded-3xl border border-white/10 p-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Profit Trend (Last 14 Days)</p>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={profitStats.timeData}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{backgroundColor: '#1E293B', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)'}}
                  itemStyle={{fontSize: '12px'}}
                  formatter={(v: any) => [formatCurrency(Number(v), settings.currency, settings.privacyMode, exchangeRate), 'Profit']}
                />
                <Area type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profit by Category */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
              <PieChart size={20} />
            </div>
            <h3 className="text-lg font-black text-[#0F172A] dark:text-white">Profit by Category</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitStats.catData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} width={100} />
                <Tooltip 
                  cursor={{fill: '#F8FAFC'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  formatter={(v: any) => [formatCurrency(Number(v), settings.currency, settings.privacyMode, exchangeRate), 'Profit']}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={30}>
                  {profitStats.catData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit by Sub-Category */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-[#E2E8F0] dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg">
              <LayoutDashboard size={20} />
            </div>
            <h3 className="text-lg font-black text-[#0F172A] dark:text-white">Top Sub-Category Profits</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitStats.subCatData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 10}} tickFormatter={(v) => formatCurrency(v, settings.currency, settings.privacyMode, exchangeRate)} />
                <Tooltip 
                  cursor={{fill: '#F8FAFC'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  formatter={(v: any) => [formatCurrency(Number(v), settings.currency, settings.privacyMode, exchangeRate), 'Profit']}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={25}>
                  {profitStats.subCatData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 bg-white dark:bg-slate-900 rounded-[32px] border border-[#E2E8F0] dark:border-slate-800">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl">
              <ArrowUpRight size={24} />
            </div>
          </div>
          <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Net Profit Margin</p>
          <p className="text-3xl font-bold text-[#0F172A] dark:text-white mt-1">
            {sales.reduce((sum, s) => sum + s.amount, 0) > 0 
              ? ((profitStats.totalProfit / sales.reduce((sum, s) => sum + s.amount, 0)) * 100).toFixed(1) 
              : 0}%
          </p>
          <p className="text-xs text-slate-500 mt-2">Efficiency of revenue conversion</p>
        </div>

        <div className="p-8 bg-white dark:bg-slate-900 rounded-[32px] border border-[#E2E8F0] dark:border-slate-800">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
              <TrendingUp size={24} />
            </div>
          </div>
          <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Avg. Profit / Sale</p>
          <p className="text-3xl font-bold text-[#0F172A] dark:text-white mt-1">
            {formatCurrency(sales.length > 0 ? Math.round(profitStats.totalProfit / sales.length) : 0, settings.currency, settings.privacyMode, exchangeRate)}
          </p>
          <p className="text-xs text-slate-500 mt-2">Net earnings per transaction</p>
        </div>

        <div className="p-8 bg-white dark:bg-slate-900 rounded-[32px] border border-[#E2E8F0] dark:border-slate-800">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl">
              <PieChart size={24} />
            </div>
          </div>
          <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Profit Contribution</p>
          <p className="text-3xl font-bold text-[#0F172A] dark:text-white mt-1">
            {profitStats.catData[0]?.name || 'None'}
          </p>
          <p className="text-xs text-slate-500 mt-2">Highest earning category</p>
        </div>
      </div>
    </div>
  );
}
