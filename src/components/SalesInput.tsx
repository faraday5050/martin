import React, { useState } from 'react';
import { PlusCircle, Tag, ShoppingBag } from 'lucide-react';
import { Product, Settings } from '../types';
import { formatCurrency } from '../utils/currency';

interface SalesInputProps {
  products: Product[];
  onSaleAdded: () => void;
  settings: Settings;
  exchangeRate: number;
}

export default function SalesInput({ products, onSaleAdded, settings, exchangeRate }: SalesInputProps) {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [pricingType, setPricingType] = useState<'retail' | 'wholesale'>('retail');
  const [customAmount, setCustomAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedProduct = products.find(p => p.id === Number(productId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const price = selectedProduct 
      ? (pricingType === 'retail' ? selectedProduct.retail_price : selectedProduct.wholesale_price)
      : Number(customAmount);
    
    const amount = selectedProduct ? price * Number(quantity) : price;

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          product_id: productId ? Number(productId) : null,
          amount,
          quantity: Number(quantity),
          description: selectedProduct ? `${selectedProduct.category} - ${selectedProduct.name} (${pricingType.toUpperCase()})` : description,
        }),
      });

      if (response.ok) {
        setProductId('');
        setQuantity('1');
        setCustomAmount('');
        setDescription('');
        onSaleAdded();
        alert('Sale recorded successfully!');
      }
    } catch (error) {
      console.error("Failed to add sale:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-10">
        <h2 className="text-3xl font-black tracking-tight text-[#0F172A]">Record New Sale</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">Select a product from inventory or enter a custom transaction.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-[#E2E8F0] dark:border-slate-800 shadow-sm space-y-8">
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-2">Select Product</label>
            <select 
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-4 py-4 bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-[#10B981] focus:border-transparent outline-none transition-all text-sm font-medium dark:text-white"
            >
              <option value="">-- Custom Sale (No Product) --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sub_category}) - R: {formatCurrency(p.retail_price, settings.currency, false, exchangeRate)} / W: {formatCurrency(p.wholesale_price, settings.currency, false, exchangeRate)}
                </option>
              ))}
            </select>
          </div>

          {productId ? (
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-2">Pricing Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPricingType('retail')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold transition-all ${pricingType === 'retail' ? 'bg-[#10B981] text-white border-[#10B981]' : 'bg-white dark:bg-slate-800 text-[#64748B] border-[#E2E8F0] dark:border-slate-700 hover:bg-slate-50'}`}
                  >
                    <Tag size={18} /> Retail
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingType('wholesale')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold transition-all ${pricingType === 'wholesale' ? 'bg-[#F59E0B] text-white border-[#F59E0B]' : 'bg-white dark:bg-slate-800 text-[#64748B] border-[#E2E8F0] dark:border-slate-700 hover:bg-slate-50'}`}
                  >
                    <ShoppingBag size={18} /> Wholesale
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-2">Quantity ({selectedProduct?.unit_type})</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-4 py-4 bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-[#10B981] focus:border-transparent outline-none transition-all text-lg font-bold dark:text-white"
                />
                {selectedProduct && (
                  <div className="mt-4 p-4 bg-[#F0FDFA] dark:bg-emerald-900/20 rounded-2xl border border-[#CCFBF1] dark:border-emerald-800">
                    <p className="text-sm font-bold text-[#0D9488] dark:text-emerald-400 flex justify-between">
                      <span>Total Amount:</span>
                      <span>{formatCurrency(((pricingType === 'retail' ? selectedProduct.retail_price : selectedProduct.wholesale_price) || 0) * Number(quantity), settings.currency, false, exchangeRate)}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-2">Amount ({settings.currency === 'USD' ? '$' : '₦'})</label>
                <input 
                  type="number" 
                  required
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-4 bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-[#10B981] focus:border-transparent outline-none transition-all text-xl font-bold dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-2">Description</label>
                <input 
                  type="text" 
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What was sold?"
                  className="w-full px-4 py-4 bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-[#10B981] focus:border-transparent outline-none transition-all text-sm dark:text-white"
                />
              </div>
            </>
          )}
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-[#0F172A] dark:bg-emerald-600 hover:bg-black dark:hover:bg-emerald-700 text-white font-bold py-5 rounded-2xl shadow-lg shadow-slate-200 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <PlusCircle size={20} /> {loading ? 'Processing...' : 'Complete Transaction'}
        </button>
      </form>
    </div>
  );
}
