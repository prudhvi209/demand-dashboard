import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Timer, Building2, AlertCircle, ChevronRight, X, Search } from 'lucide-react';
import { cardRevealVariants } from '../../lib/animations';
import { DemandRecord } from '../../types';
import { calculateAgeingMetrics, ClientAgeingSummary } from '../../utils/ageingUtils';
import { DateFilterPreset, filterRecordsByDatePreset } from '../../utils/dateFilterUtils';
import { DatePresetFilter } from '../common/DatePresetFilter';

interface ClientAgeingAnalysisProps {
  records: DemandRecord[];
  onSelectClient?: (clientName: string) => void;
}

export const ClientAgeingAnalysis: React.FC<ClientAgeingAnalysisProps> = ({
  records = [],
  onSelectClient
}) => {
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState('');

  const availableWeeks = useMemo(() => {
    return Array.from(new Set(records.map(r => r.week).filter(Boolean) as string[]));
  }, [records]);

  // Filter records by selected date preset
  const filteredRecords = useMemo(() => {
    return filterRecordsByDatePreset(records, datePreset, customStart, customEnd);
  }, [records, datePreset, customStart, customEnd]);

  // Compute accurate ageing metrics
  const metrics = useMemo(() => {
    return calculateAgeingMetrics(filteredRecords);
  }, [filteredRecords]);

  // Top 5 companies by average stay
  const topCompanies = useMemo(() => {
    return metrics.clientSummaries.slice(0, 5);
  }, [metrics.clientSummaries]);

  // Modal filtered companies
  const modalClients = useMemo(() => {
    if (!modalSearch.trim()) return metrics.clientSummaries;
    const q = modalSearch.toLowerCase().trim();
    return metrics.clientSummaries.filter(c => 
      c.client.toLowerCase().includes(q) || 
      c.oldestPosition.toLowerCase().includes(q)
    );
  }, [metrics.clientSummaries, modalSearch]);

  const maxBarValue = useMemo(() => {
    const highest = Math.max(...topCompanies.map(c => c.avgAgeingWeeks), 6);
    return highest > 0 ? highest : 6;
  }, [topCompanies]);

  const getRiskColor = (weeks: number) => {
    if (weeks > 4) return { bar: 'bg-gradient-to-r from-rose-500 to-amber-500', text: 'text-rose-600', badge: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (weeks >= 2.5) return { bar: 'bg-gradient-to-r from-amber-500 to-yellow-400', text: 'text-amber-600', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { bar: 'bg-gradient-to-r from-blue-500 to-sky-400', text: 'text-blue-600', badge: 'bg-blue-50 text-blue-700 border-blue-200' };
  };

  return (
    <>
      <motion.div
        variants={cardRevealVariants}
        initial="initial"
        animate="animate"
        className="glass-card rounded-2xl p-5 md:p-6 border border-white/80 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03)] backdrop-blur-xl"
      >
        {/* ── Minimal Header ────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Company Demand Ageing
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Average duration active requisitions stay open per company
              </p>
            </div>
          </div>

          {/* Date Filter Preset */}
          {availableWeeks.length > 0 && (
            <DatePresetFilter
              weeks={availableWeeks}
              preset={datePreset}
              customStart={customStart}
              customEnd={customEnd}
              onPresetChange={setDatePreset}
              onCustomChange={(start, end) => {
                setCustomStart(start);
                setCustomEnd(end);
              }}
            />
          )}
        </div>

        {/* ── Minimal KPI Metric Pills Row ──────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-slate-600">Average Stay</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold text-slate-900">{metrics.overallAvgWeeks}</span>
              <span className="text-[11px] font-bold text-slate-500">Wks</span>
              <span className="text-[10px] text-slate-400">({Math.round(metrics.overallAvgWeeks * 7)}d)</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-600 truncate">Longest Stay</span>
            </div>
            <span className="text-xs font-extrabold text-purple-700 truncate max-w-[130px]" title={metrics.longestStayingClient}>
              {metrics.longestStayingClient}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-semibold text-slate-600">Aged (&gt;4 Wks)</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold text-rose-600">{metrics.criticalPositionsCount}</span>
              <span className="text-[11px] font-bold text-slate-500">Pos</span>
            </div>
          </div>
        </div>

        {/* ── Main Clean Visual: Top Companies Stay Meters + Duration Mix ─ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Top Companies Ranked by Stay */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-1">
              <span>Company / Client</span>
              <span>Avg Open Stay</span>
            </div>

            {topCompanies.length > 0 ? (
              topCompanies.map((c) => {
                const style = getRiskColor(c.avgAgeingWeeks);
                const percent = Math.min(100, Math.max(12, (c.avgAgeingWeeks / maxBarValue) * 100));

                return (
                  <div
                    key={c.client}
                    onClick={() => onSelectClient?.(c.client)}
                    className="p-2.5 rounded-xl border border-slate-100 bg-white/70 hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-all cursor-pointer flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 font-bold text-[10px] flex items-center justify-center border border-blue-100 shrink-0">
                          {c.client.substring(0, 2).toUpperCase()}
                        </span>
                        <span className="text-xs font-bold text-slate-800 truncate">{c.client}</span>
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                          {c.activeCount} pos
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-xs font-extrabold ${style.text}`}>
                          {c.avgAgeingWeeks} wks
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">({c.avgAgeingDays}d)</span>
                        <ChevronRight className="w-3 h-3 text-slate-300 ml-0.5" />
                      </div>
                    </div>

                    {/* Minimalist Progress Meter */}
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${style.bar} transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No active positions to analyze</p>
            )}

            {metrics.clientSummaries.length > 5 && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full py-2 rounded-xl border border-blue-100 bg-blue-50/40 hover:bg-blue-50 text-blue-600 font-semibold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer mt-2"
              >
                <span>View All {metrics.clientSummaries.length} Companies</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Duration Buckets Card */}
          <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-3.5">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Stay Duration Split</h4>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Active positions by open duration</p>
            </div>

            <div className="space-y-2.5">
              {metrics.bucketDistribution.map((b) => (
                <div key={b.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 text-[11px]">{b.name}</span>
                    <span className="font-bold text-slate-800 text-[11px]">{b.value} pos ({b.percentage}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${b.percentage}%`, backgroundColor: b.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Modal for Full Company Ageing Breakdown (Clean & On-Demand) ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden z-10"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">All Company Ageing Durations</h3>
                    <p className="text-xs text-slate-500">Ranked by average duration positions stay open</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Search */}
              <div className="px-5 pt-3 pb-2">
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    placeholder="Search company or role..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Modal Table */}
              <div className="flex-1 overflow-y-auto px-5 py-2">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="py-2.5">Company</th>
                      <th className="py-2.5">Active Pos</th>
                      <th className="py-2.5">Avg Stay</th>
                      <th className="py-2.5">Max Stay</th>
                      <th className="py-2.5">Oldest Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {modalClients.map((c) => {
                      const style = getRiskColor(c.avgAgeingWeeks);
                      return (
                        <tr
                          key={`modal-client-${c.client}`}
                          onClick={() => {
                            setIsModalOpen(false);
                            onSelectClient?.(c.client);
                          }}
                          className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 font-bold text-slate-900">{c.client}</td>
                          <td className="py-2.5 font-semibold text-slate-700">{c.activeCount} pos</td>
                          <td className="py-2.5">
                            <span className={`font-extrabold ${style.text}`}>{c.avgAgeingWeeks} wks</span>
                            <span className="text-[10px] text-slate-400 ml-1">({c.avgAgeingDays}d)</span>
                          </td>
                          <td className="py-2.5 font-bold text-slate-700">{c.maxAgeingWeeks} wks</td>
                          <td className="py-2.5 text-slate-600 truncate max-w-[140px]" title={c.oldestPosition}>
                            {c.oldestPosition}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
