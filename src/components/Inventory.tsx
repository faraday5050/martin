import React, { useState } from 'react';
import { Package, Plus, Edit2, Trash2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { Product, Settings } from '../types';
import { PRODUCT_CATEGORIES } from '../constants';
import { formatCurrency } from '../utils/currency';

interface InventoryProps {
  products: Product[];
  onProductUpdated: () => void;
  settings: Settings;
  exchangeRate: number;
}

export default function Inventory({ products, onProductUpdated, settings, exchangeRate }: InventoryProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [securityKey, setSecurityKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: Object.keys(PRODUCT_CATEGORIES)[0],
    sub_category: PRODUCT_CATEGORIES[Object.keys(PRODUCT_CATEGORIES)[0] as keyof typeof PRODUCT_CATEGORIES][0],
    retail_price: '',
    wholesale_price: '',
    stock: '',
    unit_type: 'units',
    items_per_pack: '1'
  });

  const handleCategoryChange = (cat: string) => {
    setFormData({
      ...formData,
      category: cat,
      sub_category: PRODUCT_CATEGORIES[cat as keyof typeof PRODUCT_CATEGORIES][0]
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityKey) {
      alert("Please enter the Inventory Security Key");
      return;
    }

    const url = editingId ? `/api/products/${editingId}` : '/api/products';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-inventory-key': securityKey
        },
        body: JSON.stringify({
          ...formData,
          retail_price: Number(formData.retail_price),
          wholesale_price: Number(formData.wholesale_price),
          stock: Number(formData.stock),
          items_per_pack: Number(formData.items_per_pack)
        }),
      });

      if (response.ok) {
        setIsAdding(false);
        setEditingId(null);
        setFormData({
          name: '',
          category: Object.keys(PRODUCT_CATEGORIES)[0],
          sub_category: PRODUCT_CATEGORIES[Object.keys(PRODUCT_CATEGORIES)[0] as keyof typeof PRODUCT_CATEGORIES][0],
          retail_price: '',
          wholesale_price: '',
          stock: '',
          unit_type: 'units',
          items_per_pack: '1'
        });
        onProductUpdated();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to save product");
      }
    } catch (error) {
      console.error("Failed to save product:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!securityKey) {
      alert("Please enter the Inventory Security Key first");
      return;
    }
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-inventory-key': securityKey
        }
      });

      if (response.ok) {
        onProductUpdated();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete product");
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setFormData({
      name: p.name,
      category: p.category,
      sub_category: p.sub_category,
      retail_price: p.retail_price.toString(),
      wholesale_price: p.wholesale_price.toString(),
      stock: p.stock.toString(),
      unit_type: p.unit_type,
      items_per_pack: (p.items_per_pack || 1).toString()
    });
    setIsAdding(true);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-[#0F172A]">Inventory Management</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">Manage your premium beverage stock, pricing, and units.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
            <input 
              type={showKey ? "text" : "password"}
              placeholder="Security Key"
              value={securityKey}
              onChange={(e) => setSecurityKey(e.target.value)}
              className="pl-10 pr-10 py-3 bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#10B981] outline-none w-48 dark:text-white"
            />
            <button 
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button 
            onClick={() => { setIsAdding(!isAdding); setEditingId(null); }}
            className="bg-[#0F172A] dark:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-black dark:hover:bg-emerald-700 transition-all shadow-lg shadow-slate-200 dark:shadow-emerald-900/20"
          >
            {isAdding ? 'Cancel' : <><Plus size={18} /> Add Product</>}
          </button>
        </div>
      </header>

      {isAdding && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-[#E2E8F0] dark:border-slate-800 shadow-sm mb-10">
          <h3 className="text-lg font-bold mb-6 text-[#0F172A] dark:text-white">{editingId ? 'Edit Product' : 'New Product'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-[#64748B] mb-2 uppercase tracking-widest">Product Name</label>
              <input 
                type="text" required value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Zobo Premium 500ml"
                className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#10B981] dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#64748B] mb-2 uppercase tracking-widest">Unit Type</label>
              <select 
                value={formData.unit_type}
                onChange={e => setFormData({...formData, unit_type: e.target.value as any})}
                className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-xl outline-none dark:text-white"
              >
                <option value="units">Individual Units</option>
                <option value="packs">Packs / Cartons</option>
              </select>
            </div>
            {formData.unit_type === 'packs' && (
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] mb-2 uppercase tracking-widest">Items Per Pack</label>
                <input 
                  type="number" required value={formData.items_per_pack}
                  onChange={e => setFormData({...formData, items_per_pack: e.target.value})}
                  className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#10B981] dark:text-white"
                />
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold text-[#64748B] mb-2 uppercase tracking-widest">Category</label>
              <select 
                value={formData.category}
                onChange={e => handleCategoryChange(e.target.value)}
                className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-xl outline-none dark:text-white"
              >
                {Object.keys(PRODUCT_CATEGORIES).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#64748B] mb-2 uppercase tracking-widest">Sub-Category</label>
              <select 
                value={formData.sub_category}
                onChange={e => setFormData({...formData, sub_category: e.target.value})}
                className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-xl outline-none dark:text-white"
              >
                {PRODUCT_CATEGORIES[formData.category as keyof typeof PRODUCT_CATEGORIES].map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#64748B] mb-2 uppercase tracking-widest">Initial Stock ({formData.unit_type})</label>
              <input 
                type="number" required value={formData.stock}
                onChange={e => setFormData({...formData, stock: e.target.value})}
                className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-xl outline-none dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#64748B] mb-2 uppercase tracking-widest">Retail Price ({settings.currency === 'USD' ? '$' : '₦'})</label>
              <input 
                type="number" required value={formData.retail_price}
                onChange={e => setFormData({...formData, retail_price: e.target.value})}
                className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#10B981] dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#64748B] mb-2 uppercase tracking-widest">Wholesale Price ({settings.currency === 'USD' ? '$' : '₦'})</label>
              <input 
                type="number" required value={formData.wholesale_price}
                onChange={e => setFormData({...formData, wholesale_price: e.target.value})}
                className="w-full px-4 py-3 bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-[#F59E0B] dark:text-white"
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-[#10B981] text-white font-bold py-3 rounded-xl hover:bg-[#059669] transition-all shadow-lg shadow-emerald-50">
                {editingId ? 'Update Product' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-[#E2E8F0] dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] dark:bg-slate-800/50 border-b border-[#E2E8F0] dark:border-slate-800">
              <th className="px-8 py-5 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Product Details</th>
              <th className="px-8 py-5 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Retail Price</th>
              <th className="px-8 py-5 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Wholesale</th>
              <th className="px-8 py-5 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Stock Level</th>
              <th className="px-8 py-5 text-[10px] font-bold text-[#64748B] uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9] dark:divide-slate-800">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-[#F8FAFC] dark:hover:bg-slate-800/50 transition-colors group">
                <td className="px-8 py-5">
                  <p className="text-sm font-bold text-[#0F172A] dark:text-white">{p.name}</p>
                  <p className="text-[10px] text-[#64748B] uppercase font-medium">{p.category} • {p.sub_category}</p>
                </td>
                <td className="px-8 py-5 text-sm font-bold text-[#10B981]">{formatCurrency(p.retail_price, settings.currency, settings.privacyMode, exchangeRate)}</td>
                <td className="px-8 py-5 text-sm font-bold text-[#F59E0B]">{formatCurrency(p.wholesale_price, settings.currency, settings.privacyMode, exchangeRate)}</td>
                <td className="px-8 py-5">
                  <div className="flex flex-col gap-1">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full w-fit ${p.stock < 10 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {p.stock} {p.unit_type}
                    </span>
                    {p.unit_type === 'packs' && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        ({p.items_per_pack} items/pack)
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-2 transition-all">
                    <button 
                      onClick={() => startEdit(p)}
                      className="p-2 text-[#64748B] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-200"
                      title="Edit Product"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-transparent hover:border-red-100"
                      title="Delete Product"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length > 0 && (
              <tr className="bg-slate-50 dark:bg-slate-800/80 font-black border-t-2 border-slate-200 dark:border-slate-700">
                <td className="px-8 py-6 text-sm uppercase tracking-widest text-[#0F172A] dark:text-white">Total Inventory Value</td>
                <td className="px-8 py-6 text-sm text-[#10B981]">
                  {formatCurrency(products.reduce((sum, p) => sum + (p.retail_price * p.stock), 0), settings.currency, settings.privacyMode, exchangeRate)}
                </td>
                <td className="px-8 py-6 text-sm text-[#F59E0B]">
                  {formatCurrency(products.reduce((sum, p) => sum + (p.wholesale_price * p.stock), 0), settings.currency, settings.privacyMode, exchangeRate)}
                </td>
                <td className="px-8 py-6 text-sm text-[#0F172A] dark:text-white">
                  {products.reduce((sum, p) => sum + p.stock, 0)} Units
                </td>
                <td className="px-8 py-6"></td>
              </tr>
            )}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center text-[#94A3B8] italic">No inventory records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
