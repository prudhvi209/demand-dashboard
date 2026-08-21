import React from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  iconSize?: number;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  text,
  position = 'top',
  className = '',
  iconSize = 13
}) => {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-900 border-x-transparent border-b-transparent border-t-4 border-x-4 border-b-0',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 border-x-transparent border-t-transparent border-b-4 border-x-4 border-t-0',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-900 border-y-transparent border-r-transparent border-l-4 border-y-4 border-r-0',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-900 border-y-transparent border-l-transparent border-r-4 border-y-4 border-l-0'
  };

  return (
    <div className={`relative inline-flex items-center group cursor-help ${className}`}>
      <div className="p-0.5 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50/80 transition-colors duration-150">
        <Info style={{ width: iconSize, height: iconSize }} className="shrink-0" />
      </div>

      {/* Tooltip Popup */}
      <div
        className={`absolute ${positionClasses[position]} hidden group-hover:flex flex-col items-center z-50 pointer-events-none transition-all duration-150 transform opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 min-w-[160px] max-w-[240px]`}
      >
        <div className="bg-slate-900/95 text-white text-[11px] font-medium leading-relaxed px-2.5 py-1.5 rounded-lg shadow-xl backdrop-blur-sm border border-slate-700/50 text-center text-balance">
          {text}
        </div>
        <div className={`w-0 h-0 absolute ${arrowClasses[position]}`} />
      </div>
    </div>
  );
};
