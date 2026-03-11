import React, { useState } from 'react';
import { Receipt, Plus } from 'lucide-react';
import { Expense, Settings } from '../types';
import { EXPENSE_CATEGORIES } from '../constants';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '../utils/currency';

interface ExpensesProps {
  expenses: Expense[];
  onExpenseAdded: () => void;
  settings: Settings;
  exchangeRate: number;
}

export default function Expenses({ expenses, onExpenseAdded, settings, exchangeRate }: ExpensesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    category: EXPENSE_CATEGORIES[0],
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          amount: Number(formData.amount),
          date: new Date(formData.date).toISOString()
        }),
      });

      if (response.ok) {
        setIsAdding(false);
        setFormData({
          amount: '',
          category: EXPENSE_CATEGORIES[0],
          description: '',
          date: format(new Date(), 'yyyy-MM-dd')
        });
        onExpenseAdded();
      }
    } catch (error) {
      console.error("Failed to add expense:", error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-[#0F172A]">Expense Tracking</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">Monitor business costs and operational spending.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-100 dark:shadow-red-900/20"
        >
          {isAdding ? 'Cancel' : <><Plus size={18} /> Record Expense</>}
        </button>
      </header>

      {isAdding && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-[#E5E7EB] dark:border-slate-800 shadow-sm mb-10">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-[#6B7280] mb-2 uppercase">Amount ({settings.currency === 'USD' ? '$' : '₦'})</label>
              <input 
                type="number" required value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
                className="w-full px-4 py-3 bg-[#F9FAFB] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6B7280] mb-2 uppercase">Category</label>
              <select 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-3 bg-[#F9FAFB] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-xl outline-none dark:text-white"
              >
                {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6B7280] mb-2 uppercase">Date</label>
              <input 
                type="date" required value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-3 bg-[#F9FAFB] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-xl outline-none dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6B7280] mb-2 uppercase">Description</label>
              <input 
                type="text" required value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 bg-[#F9FAFB] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-xl outline-none dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 transition-all">
                Save Expense
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-[#E5E7EB] dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F9FAFB] dark:bg-slate-800/50 border-b border-[#E5E7EB] dark:border-slate-800">
              <th className="px-8 py-5 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Date</th>
              <th className="px-8 py-5 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Category</th>
              <th className="px-8 py-5 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Description</th>
              <th className="px-8 py-5 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6] dark:divide-slate-800">
            {expenses.map((e) => {
              const parseDate = (d: string) => {
                try {
                  return parseISO(d.includes(' ') ? d.replace(' ', 'T') + 'Z' : d);
                } catch (e) {
                  return new Date(d);
                }
              };
              return (
                <tr key={e.id} className="hover:bg-[#F9FAFB] dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-8 py-5 text-sm text-[#4B5563] dark:text-slate-400">{format(parseDate(e.timestamp), 'MMM d, yyyy')}</td>
                <td className="px-8 py-5">
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 uppercase">
                    {e.category}
                  </span>
                </td>
                <td className="px-8 py-5 text-sm text-[#6B7280] dark:text-slate-500">{e.description}</td>
                <td className="px-8 py-5 text-sm font-bold text-red-600 text-right">{formatCurrency(e.amount, settings.currency, settings.privacyMode, exchangeRate)}</td>
              </tr>
            ); })}
            {expenses.length > 0 && (
              <tr className="bg-red-50/30 dark:bg-red-900/10 font-black border-t-2 border-red-100 dark:border-red-900/30">
                <td colSpan={3} className="px-8 py-6 text-sm uppercase tracking-widest text-red-700 dark:text-red-400">Total Operational Expenses</td>
                <td className="px-8 py-6 text-sm text-red-600 text-right">
                  {formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0), settings.currency, settings.privacyMode, exchangeRate)}
                </td>
              </tr>
            )}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center text-[#9CA3AF] italic">No expenses recorded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
