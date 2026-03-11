import React, { useState, useEffect } from 'react';
import { User, Sale, Product, Expense, Settings as SettingsType } from './types';
import { getExchangeRate } from './utils/currency';
import { motion, AnimatePresence } from 'motion/react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SalesInput from './components/SalesInput';
import SalesHistory from './components/SalesHistory';
import Inventory from './components/Inventory';
import Expenses from './components/Expenses';
import Analytics from './components/Analytics';
import LTV from './components/LTV';
import Settings from './components/Settings';
import Profits from './components/Profits';
import About from './components/About';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(JSON.parse(localStorage.getItem('user') || 'null'));
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showWelcome, setShowWelcome] = useState(false);
  const [settings, setSettings] = useState<SettingsType>(() => {
    const saved = localStorage.getItem('settings');
    return saved ? JSON.parse(saved) : { theme: 'light', privacyMode: false, currency: 'NGN' };
  });
  
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [exchangeRate, setExchangeRate] = useState(1500);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (token) {
      fetchAllData();
    }
  }, [token]);

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const rate = await getExchangeRate();
      setExchangeRate(rate);
      const headers = { 'Authorization': `Bearer ${token}` };
      const [salesRes, productsRes, expensesRes] = await Promise.all([
        fetch('/api/sales', { headers }),
        fetch('/api/products', { headers }),
        fetch('/api/expenses', { headers })
      ]);

      if (salesRes.status === 401) return handleLogout();

      const [salesData, productsData, expensesData] = await Promise.all([
        salesRes.json(),
        productsRes.json(),
        expensesRes.json()
      ]);

      setSales(salesData);
      setProducts(productsData);
      setExpenses(expensesData);
    } catch (error) {
      console.error("Data fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setShowWelcome(true);
    setTimeout(() => setShowWelcome(false), 3000);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleDownloadReport = async () => {
    try {
      const response = await fetch('/api/reports/sales/csv', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quench_mart_sales_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      alert("Failed to download report");
    }
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${settings.theme === 'dark' ? 'bg-[#0F172A] text-slate-100' : 'bg-[#F8FAFC] text-[#0F172A]'} font-sans`}>
      <AnimatePresence>
        {showWelcome && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="bg-white dark:bg-slate-900 p-12 rounded-[40px] text-center shadow-2xl border border-white/10"
            >
              <motion.div 
                animate={{ rotate: [0, 10, -10, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-6xl mb-6"
              >
                👋
              </motion.div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
                Welcome back, {user?.username}!
              </h1>
              <p className="text-slate-500 dark:text-slate-400">Ready to unlock the vault of flavor today?</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={handleLogout}
        onDownloadReport={handleDownloadReport}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-72' : 'ml-24'} p-12`}>
        {loading && (
          <div className={`fixed top-0 ${isSidebarOpen ? 'left-72' : 'left-24'} right-0 h-1 bg-[#10B981] animate-pulse z-50 transition-all duration-300`}></div>
        )}

        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'dashboard' && <Dashboard sales={sales} expenses={expenses} products={products} settings={settings} exchangeRate={exchangeRate} />}
          {activeTab === 'sales-input' && <SalesInput products={products} onSaleAdded={fetchAllData} settings={settings} exchangeRate={exchangeRate} />}
          {activeTab === 'sales-history' && <SalesHistory sales={sales} settings={settings} exchangeRate={exchangeRate} />}
          {activeTab === 'inventory' && <Inventory products={products} onProductUpdated={fetchAllData} settings={settings} exchangeRate={exchangeRate} />}
          {activeTab === 'expenses' && <Expenses expenses={expenses} onExpenseAdded={fetchAllData} settings={settings} exchangeRate={exchangeRate} />}
          {activeTab === 'ltv' && <LTV sales={sales} settings={settings} exchangeRate={exchangeRate} />}
          {activeTab === 'analytics' && <Analytics sales={sales} expenses={expenses} products={products} settings={settings} exchangeRate={exchangeRate} />}
          {activeTab === 'settings' && <Settings user={user} settings={settings} onSettingsChange={setSettings} />}
          {activeTab === 'profits' && <Profits sales={sales} products={products} settings={settings} exchangeRate={exchangeRate} />}
          {activeTab === 'about' && <About />}
        </motion.div>
      </main>
    </div>
  );
}
