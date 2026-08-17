import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  PauseCircle,
  TrendingUp,
  UploadCloud,
  ArrowRight,
  Info,
  BarChart3,
  XCircle
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { FilterPanel } from '../components/dashboard/FilterPanel';
import { KpiCard } from '../components/cards/KpiCard';
import { WowDemandChart } from '../components/charts/WowDemandChart';
import { IntVsExtPieChart } from '../components/charts/IntVsExtPieChart';
import { DepartmentPieChart } from '../components/charts/DepartmentPieChart';
import { LocationPieChart } from '../components/charts/LocationPieChart';
import { RecentUploadCard } from '../components/cards/RecentUploadCard';
import { pageVariants, containerStaggerVariants } from '../lib/animations';

export const Dashboard: React.FC = () => {
  const {
    records,
    filteredRecords,
    filteredSummary,
    recentUploads,
    wowTrends,
    activeSnapshotIntVsExt,
    activeClientDistribution,
    activeSnapshotLocation,
    activeSnapshotRecords,
    setActiveTab
  } = useData();

  const latestUpload = recentUploads[0];
  const hasRecords = records.length > 0;
  const hasFilteredRecords = filteredRecords.length > 0;

  const snapshotWeek = filteredSummary.latestSnapshotWeek
    ? filteredSummary.latestSnapshotWeek.replace('-26', '-2026')
    : '';

  const s = filteredSummary;

  // Percentages relative to active demand total (not snapshot total)
  const activePct = (val: number) =>
    s.latestActiveDemandFTE > 0 ? Math.round((val / s.latestActiveDemandFTE) * 100) : 0;

  const openPct = activePct(s.latestOpenFTE);
  const identifiedPct = activePct(s.latestIdentifiedFTE);
  const holdPct = activePct(s.latestHoldFTE);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Empty State Banner */}
      {!hasRecords && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 border border-blue-200/80 bg-gradient-to-r from-blue-50/90 via-sky-50/50 to-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">No Excel Spreadsheet Uploaded Yet</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Upload your company demand Excel spreadsheet (.xlsx / .xls) to populate live analytics.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('upload')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition flex-shrink-0"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Excel File</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </motion.div>
      )}

      {hasRecords && <FilterPanel />}

      {/* ── SECTION 1: Current Snapshot — based on Position Status ──────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-sky-500 to-blue-600 rounded-full" />
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Current Snapshot</h2>
            {snapshotWeek && (
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {snapshotWeek}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Based on Position Status</span>
        </div>

        {/* 4 KPI cards: Open / Identified / On Hold / Active Demand */}
        <motion.div
          variants={containerStaggerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
        >
          <KpiCard
            title="Open Demand"
            value={s.latestOpenFTE}
            valueRaw={s.latestOpenFTE}
            subtitle="Position Status = Open"
            badge={hasFilteredRecords && openPct > 0 ? `${openPct}% of active` : undefined}
            percentage={openPct}
            icon={Users}
            theme="blue"
          />

          <KpiCard
            title="Identified Demand"
            value={s.latestIdentifiedFTE}
            valueRaw={s.latestIdentifiedFTE}
            subtitle="Position Status = Identified / Offered"
            badge={hasFilteredRecords && identifiedPct > 0 ? `${identifiedPct}% of active` : undefined}
            percentage={identifiedPct}
            icon={UserCheck}
            theme="sky"
          />

          <KpiCard
            title="On Hold"
            value={s.latestHoldFTE}
            valueRaw={s.latestHoldFTE}
            subtitle="Position Status = Hold"
            badge={hasFilteredRecords && holdPct > 0 ? `${holdPct}% of active` : undefined}
            percentage={holdPct}
            icon={PauseCircle}
            theme="purple"
          />

          <KpiCard
            title="Active Demand"
            value={s.latestActiveDemandFTE}
            valueRaw={s.latestActiveDemandFTE}
            subtitle="Open + Identified + Hold"
            badge={hasFilteredRecords && s.latestTotalFTE > 0 ? `${Math.round((s.latestActiveDemandFTE / s.latestTotalFTE) * 100)}% of snapshot` : undefined}
            percentage={s.latestTotalFTE > 0 ? Math.round((s.latestActiveDemandFTE / s.latestTotalFTE) * 100) : 0}
            icon={TrendingUp}
            theme="emerald"
          />
        </motion.div>

        {/* Reconciliation card — shows full snapshot breakdown */}
        {hasFilteredRecords && s.latestTotalFTE > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl px-5 py-3.5 border border-white/60 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          >
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="p-1.5 rounded-lg bg-slate-100 border border-slate-200/60">
                <XCircle className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Snapshot Reconciliation</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span><span className="font-bold text-blue-600">{s.latestOpenFTE}</span> Open</span>
                <span className="text-slate-300 font-medium">+</span>
                <span><span className="font-bold text-sky-600">{s.latestIdentifiedFTE}</span> Identified</span>
                <span className="text-slate-300 font-medium">+</span>
                <span><span className="font-bold text-purple-600">{s.latestHoldFTE}</span> Hold</span>
                <span className="text-slate-300 font-medium">=</span>
                <span className="font-bold text-emerald-600">{s.latestActiveDemandFTE} Active</span>
              </div>
              <div className="hidden md:block w-px h-3.5 bg-slate-200" />
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span><span className="font-bold text-rose-500">{s.latestDroppedFTE}</span> Dropped</span>
                <span className="text-slate-300 font-medium">·</span>
                <span><span className="font-bold text-slate-700">{s.latestTotalFTE}</span> Total Snapshot</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── SECTION 2: Cumulative Performance Row ────────────────────────────── */}
      {hasFilteredRecords && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card rounded-2xl px-5 py-4 border border-white/60 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/60">
              <BarChart3 className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Cumulative · All Periods</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Sum across all reporting weeks</p>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resolved</span>
              <span className="text-xl font-extrabold text-slate-900">
                {s.cumulativeClosed}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cumulative Dropped</span>
              <span className="text-xl font-extrabold text-slate-900">
                {s.cumulativeDropped}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cumulative New</span>
              <span className="text-xl font-extrabold text-slate-900">
                {s.cumulativeNew}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── SECTION 3: WoW Charts ─────────────────────────────────────────────── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-indigo-600 rounded-full" />
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Week-Over-Week Performance</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Weekly event fields · verified ✓</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <WowDemandChart
            title="WoW Total Demand"
            subtitle="Total snapshot position demand by reporting week"
            dataKey="totalDemand"
            data={wowTrends}
            strokeColor="#0284c7"
            gradientId="wowTotalGrad"
          />

          <WowDemandChart
            title="WoW New Demand"
            subtitle="Newly added positions by week"
            dataKey="newDemand"
            data={wowTrends}
            strokeColor="#2563eb"
            gradientId="wowNewGrad"
          />

          <WowDemandChart
            title="WoW Dropped Demand"
            subtitle="Dropped or cancelled positions by week"
            dataKey="droppedDemand"
            data={wowTrends}
            strokeColor="#ef4444"
            gradientId="wowDroppedGrad"
          />

          <WowDemandChart
            title="WoW Open Positions (Weekly)"
            subtitle="Weekly Open Positions field — not current-status open count"
            dataKey="openDemand"
            data={wowTrends}
            strokeColor="#0ea5e9"
            gradientId="wowOpenGrad"
          />

          <WowDemandChart
            title="WoW Resolved"
            subtitle="Filled & closed positions by reporting week"
            dataKey="filledDemand"
            data={wowTrends}
            strokeColor="#10b981"
            gradientId="wowFilledGrad"
          />

          {/* Internal vs External: active demand only (excludes Dropped) */}
          <IntVsExtPieChart
            data={activeSnapshotIntVsExt}
            snapshotWeek={snapshotWeek}
          />
        </div>
      </div>

      {/* ── Client & Location Distributions ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        <DepartmentPieChart
          data={activeClientDistribution}
          rawRecords={activeSnapshotRecords}
          snapshotWeek={snapshotWeek}
        />
        <LocationPieChart
          data={activeSnapshotLocation}
          snapshotWeek={snapshotWeek}
        />
      </div>

      <RecentUploadCard
        uploadItem={latestUpload}
        onNavigateToUpload={() => setActiveTab('upload')}
      />
    </motion.div>
  );
};
