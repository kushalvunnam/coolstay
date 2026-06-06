import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'violet', trend }) => {
  // Configured colors
  const colorMap = {
    violet: {
      bg: 'bg-violet-50 dark:bg-violet-950/20',
      text: 'text-violet-600 dark:text-violet-400',
      border: 'border-violet-100 dark:border-violet-900/30',
      glow: 'shadow-[0_0_20px_rgba(124,58,237,0.05)]'
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-900/30',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.05)]'
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-100 dark:border-amber-900/30',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.05)]'
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-900/30',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.05)]'
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950/20',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-100 dark:border-rose-900/30',
      glow: 'shadow-[0_0_20px_rgba(244,63,94,0.05)]'
    }
  };

  const currentColors = colorMap[color] || colorMap.violet;

  return (
    <div className={`p-6 rounded-2xl border bg-white dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/40 ${currentColors.glow} hover:shadow-xl transition-all duration-300 group`}>
      <div className="flex items-center justify-between">
        {/* Info label */}
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white mt-1 group-hover:scale-[1.02] origin-left transition-transform duration-200">
            {value}
          </h3>
        </div>
        {/* Decorative Icon Wrapper */}
        <div className={`p-3.5 rounded-2xl ${currentColors.bg} ${currentColors.text} border ${currentColors.border} transition-all duration-300 group-hover:rotate-6`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center gap-1.5">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">{trend}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
