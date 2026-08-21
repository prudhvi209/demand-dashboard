import React, { useState, useRef, useEffect } from "react";
import { CalendarDays, X, ChevronDown, Check } from "lucide-react";

export interface ChartDateRange {
  startWeek: string | null;
  endWeek: string | null;
}

interface ChartDateFilterProps {
  weeks: string[];
  value: ChartDateRange;
  onChange: (range: ChartDateRange) => void;
  accentColor?: string;
}

export const ChartDateFilter: React.FC<ChartDateFilterProps> = ({
  weeks,
  value,
  onChange,
  accentColor = "text-blue-600",
}) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ChartDateRange>(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setDraft(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isActive = value.startWeek !== null || value.endWeek !== null;

  const apply = () => { onChange(draft); setOpen(false); };

  const clear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const reset: ChartDateRange = { startWeek: null, endWeek: null };
    setDraft(reset);
    onChange(reset);
    setOpen(false);
  };

  const label = (() => {
    if (value.startWeek && value.endWeek) return `${value.startWeek} → ${value.endWeek}`;
    if (value.startWeek) return `From ${value.startWeek}`;
    if (value.endWeek) return `Until ${value.endWeek}`;
    return "Date Filter";
  })();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
          isActive
            ? `bg-blue-50 border-blue-200 ${accentColor}`
            : "bg-white/60 border-white/80 text-slate-500 hover:bg-white/90 hover:text-slate-700"
        } shadow-sm backdrop-blur-sm`}
        title="Filter chart date range"
      >
        <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="hidden sm:inline truncate max-w-[130px]">{label}</span>
        {isActive ? (
          <X className="w-3 h-3 flex-shrink-0 opacity-60 hover:opacity-100" onClick={clear} />
        ) : (
          <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-64 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-slate-200/80 p-3 flex flex-col gap-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Filter by Week Range</p>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold text-slate-600">From Week</label>
            <select
              value={draft.startWeek ?? ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, startWeek: e.target.value || null }))}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
            >
              <option value="">All (earliest)</option>
              {weeks.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold text-slate-600">To Week</label>
            <select
              value={draft.endWeek ?? ""}
              onChange={(e) => setDraft((prev) => ({ ...prev, endWeek: e.target.value || null }))}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
            >
              <option value="">All (latest)</option>
              {weeks.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={apply}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors"
            >
              <Check className="w-3 h-3" />
              Apply
            </button>
            <button
              onClick={clear}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-semibold transition-colors"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
