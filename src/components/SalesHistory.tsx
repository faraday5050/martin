import React from 'react';
import { format, parseISO } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { Sale, Settings } from '../types';
import { formatCurrency } from '../utils/currency';

interface SalesHistoryProps {
  sales: Sale[];
  settings: Settings;
  exchangeRate: number;
}

export default function SalesHistory({ sales, settings, exchangeRate }: SalesHistoryProps) {
  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-[#0F172A]">Sales History</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">Review and manage all past transactions.</p>
        </div>
        <div className="text-sm font-medium text-[#6B7280]">
          Total Records: {sales.length}
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-[#E5E7EB] dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F9FAFB] dark:bg-slate-800/50 border-b border-[#E5E7EB] dark:border-slate-800">
              <th className="px-8 py-5 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Date</th>
              <th className="px-8 py-5 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Product / Description</th>
              <th className="px-8 py-5 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Qty</th>
              <th className="px-8 py-5 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">User</th>
              <th className="px-8 py-5 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6] dark:divide-slate-800">
            {sales.map((sale) => {
              const parseDate = (d: string) => {
                try {
                  return parseISO(d.includes(' ') ? d.replace(' ', 'T') + 'Z' : d);
                } catch (e) {
                  return new Date(d);
                }
              };
              return (
                <tr key={sale.id} className="hover:bg-[#F9FAFB] dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-8 py-5 text-sm font-medium text-[#4B5563] dark:text-slate-400">
                    {format(parseDate(sale.timestamp), 'MMM d, yyyy HH:mm')}
                  </td>
                <td className="px-8 py-5">
                  <p className="text-sm font-bold text-[#111827] dark:text-white">{sale.product_name || 'Custom Sale'}</p>
                  <p className="text-[10px] text-[#6B7280] uppercase">{sale.description}</p>
                </td>
                <td className="px-8 py-5 text-sm text-[#6B7280] dark:text-slate-500">
                  {sale.quantity}
                </td>
                <td className="px-8 py-5 text-xs text-[#4B5563] dark:text-slate-400">
                  {sale.username}
                </td>
                <td className="px-8 py-5 text-sm font-bold text-[#111827] dark:text-white text-right">
                  {formatCurrency(sale.amount, settings.currency, settings.privacyMode, exchangeRate)}
                </td>
              </tr>
            ); })}
            {sales.length > 0 && (
              <tr className="bg-slate-50 dark:bg-slate-800/80 font-black border-t-2 border-slate-200 dark:border-slate-700">
                <td colSpan={2} className="px-8 py-6 text-sm uppercase tracking-widest text-[#0F172A] dark:text-white">Total Sales Volume</td>
                <td className="px-8 py-6 text-sm text-[#4B5563] dark:text-slate-400">
                  {sales.reduce((sum, s) => sum + s.quantity, 0)}
                </td>
                <td className="px-8 py-6"></td>
                <td className="px-8 py-6 text-sm text-[#111827] dark:text-white text-right">
                  {formatCurrency(sales.reduce((sum, s) => sum + s.amount, 0), settings.currency, settings.privacyMode, exchangeRate)}
                </td>
              </tr>
            )}
            {sales.length === 0 && (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center text-[#9CA3AF] italic">
                  No sales recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
