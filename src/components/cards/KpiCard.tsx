import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cardRevealVariants } from '../../lib/animations';

import { InfoTooltip } from '../common/InfoTooltip';

interface KpiCardProps {
  title: string;
  value: string | number;
  valueRaw?: number;
  subtitle?: string;
  badge?: string;
  percentage?: number;
  icon: LucideIcon;
  theme?: 'blue' | 'rose' | 'sky' | 'purple' | 'emerald' | 'amber';
  unit?: string;
  infoTooltip?: string;
  onClick?: () => void;
}

const themeStyles = {
  blue: {
    titleText: 'text-slate-500',
    iconBg: 'bg-blue-500/10 text-blue-600 border-blue-200/50',
    dot: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-700 border-blue-200/60',
    progress: 'from-blue-600 to-sky-400',
    trackBg: 'bg-slate-100',
    glow: 'from-blue-500/10 via-blue-400/5 to-transparent'
  },
  rose: {
    titleText: 'text-slate-500',
    iconBg: 'bg-rose-500/10 text-rose-600 border-rose-200/50',
    dot: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-700 border-rose-200/60',
    progress: 'from-rose-500 to-pink-400',
    trackBg: 'bg-slate-100',
    glow: 'from-rose-500/10 via-rose-400/5 to-transparent'
  },
  sky: {
    titleText: 'text-slate-500',
    iconBg: 'bg-sky-500/10 text-sky-600 border-sky-200/50',
    dot: 'bg-sky-500',
    badge: 'bg-sky-50 text-sky-700 border-sky-200/60',
    progress: 'from-sky-500 to-indigo-400',
    trackBg: 'bg-slate-100',
    glow: 'from-sky-500/10 via-sky-400/5 to-transparent'
  },
  purple: {
    titleText: 'text-slate-500',
    iconBg: 'bg-purple-500/10 text-purple-600 border-purple-200/50',
    dot: 'bg-purple-500',
    badge: 'bg-purple-50 text-purple-700 border-purple-200/60',
    progress: 'from-purple-500 to-indigo-400',
    trackBg: 'bg-slate-100',
    glow: 'from-purple-500/10 via-purple-400/5 to-transparent'
  },
  emerald: {
    titleText: 'text-slate-500',
    iconBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    progress: 'from-emerald-500 to-teal-400',
    trackBg: 'bg-slate-100',
    glow: 'from-emerald-500/10 via-emerald-400/5 to-transparent'
  },
  amber: {
    titleText: 'text-slate-500',
    iconBg: 'bg-amber-500/10 text-amber-600 border-amber-200/50',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200/60',
    progress: 'from-amber-500 to-orange-400',
    trackBg: 'bg-slate-100',
    glow: 'from-amber-500/10 via-amber-400/5 to-transparent'
  }
};

const formatKpiValue = (val: number | string, raw?: number): string => {
  if (raw !== undefined) {
    const formatted = raw % 1 === 0 ? String(Math.round(raw)) : raw.toFixed(2).replace(/\.?0+$/, '');
    return formatted;
  }
  if (typeof val === 'number') return val.toLocaleString();
  return String(val);
};

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  valueRaw,
  subtitle,
  badge,
  percentage,
  icon: Icon,
  theme = 'blue',
  unit,
  infoTooltip,
  onClick
}) => {
  const currentTheme = themeStyles[theme];
  const displayValue = formatKpiValue(value, valueRaw);

  return (
    <motion.div
      variants={cardRevealVariants}
      initial="initial"
      animate="animate"
      onClick={onClick}
      className={`glass-card relative rounded-2xl p-5 md:p-6 flex flex-col justify-between border border-white/80 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03)] backdrop-blur-xl transition-all duration-200 ${
        onClick 
          ? 'cursor-pointer hover:shadow-[0_10px_28px_-4px_rgba(15,23,42,0.08)] hover:border-blue-200/80 hover:-translate-y-0.5 active:translate-y-0' 
          : 'cursor-default hover:shadow-[0_8px_25px_-4px_rgba(15,23,42,0.06)]'
      }`}
    >
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div className={`absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br ${currentTheme.glow} rounded-full blur-2xl opacity-80`} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-1.5 h-1.5 rounded-full ${currentTheme.dot} flex-shrink-0`} />
            <span className={`text-[11px] font-bold uppercase tracking-wider ${currentTheme.titleText} font-sans truncate`}>
              {title}
            </span>
          </div>
          <div className={`p-2.5 rounded-xl border ${currentTheme.iconBg} backdrop-blur-md shadow-2xs flex-shrink-0 flex items-center justify-center`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans leading-none flex items-baseline gap-1.5">
              {displayValue}
              {unit && (
                <span className="text-sm font-semibold text-slate-400 tracking-wide">{unit}</span>
              )}
            </h3>
            {infoTooltip && (
              <InfoTooltip text={infoTooltip} position="top" iconSize={14} />
            )}
          </div>
          {badge && (
            <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-tight border shadow-2xs ${currentTheme.badge}`}>
              <span className="truncate">{badge}</span>
            </div>
          )}
        </div>

        
      </div>

      {subtitle && (
        <div className="mt-3.5 relative z-10">
          <p className="text-xs text-slate-500 font-medium tracking-tight">{subtitle}</p>
        </div>
      )}
    </motion.div>
  );
};
