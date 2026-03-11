import React, { useMemo } from 'react';
import { Sale, Settings } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfDay, subDays } from 'date-fns';
import { TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

interface LTVProps {
  sales: Sale[];
  settings: Settings;
  exchangeRate: number;
}

export default function LTV({ sales, settings, exchangeRate }: LTVProps) {
  const totalSales = useMemo(() => sales.reduce((sum, s) => sum + s.amount, 0), [sales]);
  
  const trendData = useMemo(() => {
    const parseDate = (d: string) => {
      try {
        return parseISO(d.includes(' ') ? d.replace(' ', 'T') + 'Z' : d);
      } catch (e) {
        return new Date(d);
      }
    };

    const last30Days = Array.from({ length: 30 }).map((_, i) => {
      const date = subDays(new Date(), i);
      const dayStr = format(date, 'MMM dd');
      const daySales = sales
        .filter(s => startOfDay(parseDate(s.timestamp)).getTime() === startOfDay(date).getTime())
        .reduce((sum, s) => sum + s.amount, 0);
      return { name: dayStr, revenue: daySales };
    }).reverse();

    return last30Days;
  }, [sales]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h2 className="text-3xl font-black tracking-tight text-[#0F172A]">Lifetime Value & Trends</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">Comprehensive overview of your business growth over time.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-[#E5E7EB] dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg">
              <DollarSign size={20} />
            </div>
            <span className="text-sm font-bold text-[#6B7280] uppercase tracking-wider">Total Revenue</span>
          </div>
          <p className="text-4xl font-bold text-[#111827] dark:text-white">{formatCurrency(totalSales, settings.currency, settings.privacyMode, exchangeRate)}</p>
          <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
            <TrendingUp size={12} /> All-time accumulated sales
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-[#E5E7EB] dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
              <Calendar size={20} />
            </div>
            <span className="text-sm font-bold text-[#6B7280] uppercase tracking-wider">Total Sales Count</span>
          </div>
          <p className="text-4xl font-bold text-[#111827] dark:text-white">{sales.length}</p>
          <p className="text-xs text-blue-600 font-medium mt-2">Total transactions recorded</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-[#E5E7EB] dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm font-bold text-[#6B7280] uppercase tracking-wider">Avg. Order Value</span>
          </div>
          <p className="text-4xl font-bold text-[#111827] dark:text-white">
            {formatCurrency(sales.length > 0 ? Math.round(totalSales / sales.length) : 0, settings.currency, settings.privacyMode, exchangeRate)}
          </p>
          <p className="text-xs text-purple-600 font-medium mt-2 text-wrap">Average revenue per transaction</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-[#E5E7EB] dark:border-slate-800 shadow-sm">
        <h3 className="text-xl font-bold text-[#111827] dark:text-white mb-6">Revenue Trend (Last 30 Days)</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
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
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10B981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
