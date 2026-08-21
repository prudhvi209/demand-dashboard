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
    cardBg: 'bg-gradient-to-br from-blue-500/15 via-blue-500/8 to-blue-50/50 border-blue-200/90 hover:border-blue-400/90 shadow-blue-500/5',
    titleText: 'text-blue-700',
    iconBg: 'bg-blue-500/20 text-blue-700 border-blue-300/60',
    dot: 'bg-blue-600',
    badge: 'bg-blue-100/90 text-blue-800 border-blue-300/70',
    progress: 'from-blue-600 to-sky-400',
    trackBg: 'bg-blue-200/40',
    glow: 'from-blue-500/20 via-blue-400/10 to-transparent'
  },
  rose: {
    cardBg: 'bg-gradient-to-br from-rose-500/15 via-rose-500/8 to-rose-50/50 border-rose-200/90 hover:border-rose-400/90 shadow-rose-500/5',
    titleText: 'text-rose-700',
    iconBg: 'bg-rose-500/20 text-rose-700 border-rose-300/60',
    dot: 'bg-rose-600',
    badge: 'bg-rose-100/90 text-rose-800 border-rose-300/70',
    progress: 'from-rose-500 to-pink-400',
    trackBg: 'bg-rose-200/40',
    glow: 'from-rose-500/20 via-rose-400/10 to-transparent'
  },
  sky: {
    cardBg: 'bg-gradient-to-br from-sky-500/15 via-sky-500/8 to-sky-50/50 border-sky-200/90 hover:border-sky-400/90 shadow-sky-500/5',
    titleText: 'text-sky-700',
    iconBg: 'bg-sky-500/20 text-sky-700 border-sky-300/60',
    dot: 'bg-sky-600',
    badge: 'bg-sky-100/90 text-sky-800 border-sky-300/70',
    progress: 'from-sky-500 to-indigo-400',
    trackBg: 'bg-sky-200/40',
    glow: 'from-sky-500/20 via-sky-400/10 to-transparent'
  },
  purple: {
    cardBg: 'bg-gradient-to-br from-purple-500/15 via-purple-500/8 to-purple-50/50 border-purple-200/90 hover:border-purple-400/90 shadow-purple-500/5',
    titleText: 'text-purple-700',
    iconBg: 'bg-purple-500/20 text-purple-700 border-purple-300/60',
    dot: 'bg-purple-600',
    badge: 'bg-purple-100/90 text-purple-800 border-purple-300/70',
    progress: 'from-purple-500 to-indigo-400',
    trackBg: 'bg-purple-200/40',
    glow: 'from-purple-500/20 via-purple-400/10 to-transparent'
  },
  emerald: {
    cardBg: 'bg-gradient-to-br from-emerald-500/15 via-emerald-500/8 to-emerald-50/50 border-emerald-200/90 hover:border-emerald-400/90 shadow-emerald-500/5',
    titleText: 'text-emerald-700',
    iconBg: 'bg-emerald-500/20 text-emerald-700 border-emerald-300/60',
    dot: 'bg-emerald-600',
    badge: 'bg-emerald-100/90 text-emerald-800 border-emerald-300/70',
    progress: 'from-emerald-500 to-teal-400',
    trackBg: 'bg-emerald-200/40',
    glow: 'from-emerald-500/20 via-emerald-400/10 to-transparent'
  },
  amber: {
    cardBg: 'bg-gradient-to-br from-amber-500/15 via-amber-500/8 to-amber-50/50 border-amber-200/90 hover:border-amber-400/90 shadow-amber-500/5',
    titleText: 'text-amber-700',
    iconBg: 'bg-amber-500/20 text-amber-700 border-amber-300/60',
    dot: 'bg-amber-600',
    badge: 'bg-amber-100/90 text-amber-800 border-amber-300/70',
    progress: 'from-amber-500 to-orange-400',
    trackBg: 'bg-amber-200/40',
    glow: 'from-amber-500/20 via-amber-400/10 to-transparent'
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
      className={`relative rounded-2xl p-5 md:p-6 flex flex-col justify-between border shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03)] backdrop-blur-xl transition-all duration-200 ${currentTheme.cardBg} ${
        onClick 
          ? 'cursor-pointer hover:shadow-[0_12px_30px_-4px_rgba(15,23,42,0.09)] hover:-translate-y-0.5 active:translate-y-0' 
          : 'cursor-default hover:shadow-[0_8px_25px_-4px_rgba(15,23,42,0.06)]'
      }`}
    >
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div className={`absolute -right-8 -top-8 w-36 h-36 bg-gradient-to-br ${currentTheme.glow} rounded-full blur-2xl opacity-90`} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-2 h-2 rounded-full ${currentTheme.dot} flex-shrink-0`} />
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

        <div className={`w-full h-1.5 ${currentTheme.trackBg} rounded-full overflow-hidden mt-3.5 border border-black/5`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(5, percentage !== undefined && percentage > 0 ? percentage : 100))}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full bg-gradient-to-r ${currentTheme.progress} rounded-full`}
          />
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
