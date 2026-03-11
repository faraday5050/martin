import React from 'react';
import { Info, ExternalLink, Cpu, Globe, Award } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header>
        <h2 className="text-3xl font-black tracking-tight text-[#0F172A]">About Quench Mart</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">Project background and developer information.</p>
      </header>

      <div className="grid grid-cols-1 gap-8">
        <section className="bg-white dark:bg-slate-900 rounded-[40px] border border-[#E2E8F0] dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-10 md:p-16 text-center space-y-8">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 text-[#10B981] rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-100 dark:shadow-none">
              <Award size={40} />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-2xl font-black text-[#0F172A] dark:text-white">3MTT Knowledge Showcase</h3>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                This application is a dedicated <span className="font-bold text-[#0F172A] dark:text-white">knowledge showcase for the NextGen cohort</span>, 
                developed under the <span className="text-[#10B981] font-bold">Financial Inclusion Pillar</span> of the 3 Million Technical Talent (3MTT) program.
              </p>
            </div>

            <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-md">
                  <Cpu className="text-slate-400" size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em] mb-1">Developed By</p>
                  <h4 className="text-xl font-black text-[#0F172A] dark:text-white">Yahaya Eneojo Michael</h4>
                  <p className="text-[#10B981] font-bold mt-1">Machine Learning & AI Engineer</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0F172A] p-8 rounded-[32px] text-white">
            <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Globe size={16} /> Project Vision
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Quench Mart aims to bridge the gap in financial record-keeping for small-scale beverage businesses, 
              providing them with enterprise-grade analytics and forecasting tools to drive sustainable growth.
            </p>
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-[#E2E8F0] dark:border-slate-800">
            <h4 className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Info size={16} /> Technical Stack
            </h4>
            <div className="flex flex-wrap gap-2">
              {['React', 'TypeScript', 'Tailwind CSS', 'Express', 'SQLite', 'Recharts', 'AI Forecasting'].map(tech => (
                <span key={tech} className="px-3 py-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-full border border-slate-100 dark:border-slate-700">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
