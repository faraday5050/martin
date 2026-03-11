import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Package, 
  Receipt, 
  Download, 
  LogOut,
  User,
  Droplets,
  TrendingUp,
  BrainCircuit,
  Settings,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onDownloadReport: () => void;
  user: { username: string, role: string } | null;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ activeTab, setActiveTab, onLogout, onDownloadReport, user, isOpen, setIsOpen }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sales-input', label: 'Record Sale', icon: PlusCircle },
    { id: 'sales-history', label: 'Sales History', icon: History },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'profits', label: 'Profits', icon: TrendingUp },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'ltv', label: 'Growth & Trends', icon: TrendingUp },
    { id: 'analytics', label: 'Predictions', icon: BrainCircuit },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <div className={`${isOpen ? 'w-72' : 'w-24'} bg-[#0F172A] text-white h-screen flex flex-col fixed left-0 top-0 shadow-2xl z-50 transition-all duration-300 border-r border-white/5`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-10 w-6 h-6 bg-[#10B981] rounded-full flex items-center justify-center text-[#0F172A] shadow-lg hover:scale-110 transition-transform z-[60]"
      >
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      <div className={`p-6 ${!isOpen && 'flex justify-center px-0'}`}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-[#10B981] rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20 shrink-0">
            <Droplets className="text-[#0F172A]" size={24} />
          </div>
          {isOpen && <h1 className="text-2xl font-black tracking-tighter">QUENCH<span className="text-[#10B981]">MART</span></h1>}
        </div>
        {isOpen && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Unlock the Vault of Flavor</p>}
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-hidden overflow-x-hidden">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-6 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-[#10B981] text-[#0F172A] shadow-lg shadow-emerald-900/20' 
                : 'text-slate-400 hover:bg-white/5 hover:text-[#10B981]'
            } ${!isOpen && 'justify-center px-0'}`}
            title={!isOpen ? item.label : ''}
          >
            <item.icon size={20} className="shrink-0" />
            {isOpen && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className={`p-4 space-y-3 ${!isOpen && 'px-2'}`}>
        <div className={`bg-white/5 rounded-3xl border border-white/5 ${isOpen ? 'p-4' : 'p-2 flex flex-col items-center'}`}>
          <div className={`flex items-center gap-3 ${isOpen ? 'mb-4' : 'mb-0'}`}>
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-white/10 shrink-0">
              <User size={18} className="text-slate-300" />
            </div>
            {isOpen && (
              <div>
                <p className="text-sm font-bold text-white truncate max-w-[120px]">{user?.username}</p>
                <p className="text-[10px] font-bold text-[#10B981] uppercase tracking-widest">{user?.role}</p>
              </div>
            )}
          </div>
          
          {isOpen && (
            <>
              <button 
                onClick={onDownloadReport}
                className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl text-xs font-bold transition-all mb-2"
              >
                <Download size={14} /> Download CSV
              </button>
              <button 
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 py-3 rounded-xl text-xs font-bold transition-all"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </>
          )}
          
          {!isOpen && (
            <button 
              onClick={onLogout}
              className="mt-4 text-red-400 hover:text-red-300 p-2 rounded-xl hover:bg-red-400/10 transition-all"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
