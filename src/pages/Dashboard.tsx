import React, { useState } from 'react';
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
import { InfoTooltip } from '../components/common/InfoTooltip';
import { ChartDetailsModal, formatWeekToIsoDate } from '../components/dashboard/ChartDetailsModal';
import { WowDemandChart } from '../components/charts/WowDemandChart';
import { IntVsExtPieChart } from '../components/charts/IntVsExtPieChart';
import { DepartmentPieChart } from '../components/charts/DepartmentPieChart';
import { LocationPieChart } from '../components/charts/LocationPieChart';
import { CompanyAgeingChart } from '../components/charts/CompanyAgeingChart';
import { AgeingDistributionChart } from '../components/charts/AgeingDistributionChart';
import { RecentUploadCard } from '../components/cards/RecentUploadCard';
import { pageVariants, containerStaggerVariants } from '../lib/animations';
import { DemandRecord, WowTrendPoint, IntVsExtDistributionData } from '../types';

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

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    records: DemandRecord[];
  }>({
    isOpen: false,
    title: '',
    records: []
  });

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

  // Drilldown handler when clicking any point on the line charts
  const handleWowPointClick = (
    point: WowTrendPoint,
    chartTitle: string,
    dataKey: keyof Omit<WowTrendPoint, 'week'>
  ) => {
    const weekIso = formatWeekToIsoDate(point.week);
    const pool = filteredRecords.length > 0 ? filteredRecords : records;

    const weekRecords = pool.filter((r) => {
      if (!r.week) return false;
      return (
        r.week.trim().toLowerCase() === point.week.trim().toLowerCase() ||
        formatWeekToIsoDate(r.week) === weekIso
      );
    });

    let modalTitle = '';
    let matchingRecords: DemandRecord[] = [];

    if (dataKey === 'totalDemand') {
      modalTitle = `Total Positions - Week ${weekIso}`;
      matchingRecords = weekRecords;
    } else if (dataKey === 'newDemand') {
      modalTitle = `New Positions - Week ${weekIso}`;
      matchingRecords = weekRecords.filter(r => (r.newCount && r.newCount > 0) || (r.status && r.status.toLowerCase().includes('new')));
      if (matchingRecords.length === 0) matchingRecords = weekRecords;
    } else if (dataKey === 'droppedDemand') {
      modalTitle = `Dropped Positions - Week ${weekIso}`;
      matchingRecords = weekRecords.filter(r => (r.droppedCount && r.droppedCount > 0) || (r.status && r.status.toLowerCase().includes('drop')));
      if (matchingRecords.length === 0) matchingRecords = weekRecords;
    } else if (dataKey === 'openDemand') {
      modalTitle = `Active Positions - Week ${weekIso}`;
      matchingRecords = weekRecords.filter(r => (r.openCount && r.openCount > 0) || r.status === 'Open' || r.status === 'Identified' || r.status === 'Hold');
      if (matchingRecords.length === 0) matchingRecords = weekRecords;
    } else if (dataKey === 'filledDemand') {
      modalTitle = `Fulfilled Positions - Week ${weekIso}`;
      matchingRecords = weekRecords.filter(r => (r.closedCount && r.closedCount > 0) || r.status === 'Filled' || r.status === 'Closed');
      if (matchingRecords.length === 0) matchingRecords = weekRecords;
    } else {
      modalTitle = `${chartTitle} - Week ${weekIso}`;
      matchingRecords = weekRecords;
    }

    setModalState({
      isOpen: true,
      title: modalTitle,
      subtitle: `${matchingRecords.length} records found for this selection.`,
      records: matchingRecords
    });
  };

  // Drilldown handler for Internal vs External pie slices
  const handleIntVsExtClick = (slice: IntVsExtDistributionData) => {
    const isInternal = slice.name.toLowerCase().includes('internal');
    const matchingRecords = activeSnapshotRecords.filter(r => 
      isInternal
        ? (r.internalExternal?.toLowerCase().includes('internal') || r.status?.toLowerCase().includes('bench'))
        : (r.internalExternal?.toLowerCase().includes('external') || !r.internalExternal)
    );

    setModalState({
      isOpen: true,
      title: `${slice.name} Positions - Week ${formatWeekToIsoDate(s.latestSnapshotWeek)}`,
      subtitle: `${matchingRecords.length} records found for this selection.`,
      records: matchingRecords
    });
  };

  // Drilldown handler for Location pie slices
  const handleLocationClick = (loc: { name: string; value: number }) => {
    const matchingRecords = activeSnapshotRecords.filter(r => 
      (r.location || 'offshore').trim().toLowerCase() === loc.name.trim().toLowerCase()
    );

    setModalState({
      isOpen: true,
      title: `${loc.name} Location Positions - Week ${formatWeekToIsoDate(s.latestSnapshotWeek)}`,
      subtitle: `${matchingRecords.length} records found for this selection.`,
      records: matchingRecords
    });
  };

  // Drilldown handler for Client pie slices / list
  const handleClientClick = (clientName: string) => {
    const pool = filteredRecords.length > 0 ? filteredRecords : records;
    const inactive = new Set(['Dropped', 'Filled', 'Closed']);
    const matchingRecords = pool
      .filter(r => !inactive.has((r.status || '').trim()))
      .filter(r => (r.client || r.department || 'Delivery').trim().toLowerCase() === clientName.trim().toLowerCase());

    setModalState({
      isOpen: true,
      title: `${clientName} Positions - Week ${formatWeekToIsoDate(s.latestSnapshotWeek)}`,
      subtitle: `${matchingRecords.length} records found for this selection.`,
      records: matchingRecords
    });
  };

  // Drilldown handler when clicking any of the snapshot KPI cards
  const handleKpiCardClick = (type: 'total_active' | 'open' | 'identified' | 'hold') => {
    const weekIso = formatWeekToIsoDate(s.latestSnapshotWeek);
    let modalTitle = '';
    let matchingRecords: DemandRecord[] = [];

    if (type === 'total_active') {
      modalTitle = `Total Active Demand - Week ${weekIso}`;
      matchingRecords = activeSnapshotRecords;
    } else if (type === 'open') {
      modalTitle = `Active Demand - Week ${weekIso}`;
      matchingRecords = activeSnapshotRecords.filter(
        r => r.status === 'Open' || r.status === 'Active' || (r.openCount !== undefined && r.openCount > 0)
      );
      if (matchingRecords.length === 0) matchingRecords = activeSnapshotRecords;
    } else if (type === 'identified') {
      modalTitle = `Identified Demand - Week ${weekIso}`;
      matchingRecords = activeSnapshotRecords.filter(
        r => r.status === 'Identified' || r.status === 'Offered' || (r.status && r.status.toLowerCase().includes('identified')) || (r.identifiedCount !== undefined && r.identifiedCount > 0)
      );
      if (matchingRecords.length === 0) matchingRecords = activeSnapshotRecords;
    } else if (type === 'hold') {
      modalTitle = `On Hold Demand - Week ${weekIso}`;
      matchingRecords = activeSnapshotRecords.filter(
        r => r.status === 'Hold' || (r.status && r.status.toLowerCase().includes('hold')) || (r.holdCount !== undefined && r.holdCount > 0)
      );
      if (matchingRecords.length === 0) matchingRecords = activeSnapshotRecords;
    }

    setModalState({
      isOpen: true,
      title: modalTitle,
      subtitle: `${matchingRecords.length} records found for this selection.`,
      records: matchingRecords
    });
  };

  // Drilldown handler for cumulative performance metrics
  const handleCumulativeClick = (type: 'fulfilled' | 'dropped' | 'new') => {
    const pool = filteredRecords.length > 0 ? filteredRecords : records;
    let modalTitle = '';
    let matchingRecords: DemandRecord[] = [];

    if (type === 'fulfilled') {
      modalTitle = 'Cumulative Fulfilled Positions - All Periods';
      matchingRecords = pool.filter(r => (r.closedCount && r.closedCount > 0) || r.status === 'Filled' || r.status === 'Closed');
    } else if (type === 'dropped') {
      modalTitle = 'Cumulative Dropped Positions - All Periods';
      matchingRecords = pool.filter(r => (r.droppedCount && r.droppedCount > 0) || (r.status && r.status.toLowerCase().includes('drop')));
    } else if (type === 'new') {
      modalTitle = 'Cumulative New Positions - All Periods';
      matchingRecords = pool.filter(r => (r.newCount && r.newCount > 0) || (r.status && r.status.toLowerCase().includes('new')));
    }

    setModalState({
      isOpen: true,
      title: modalTitle,
      subtitle: `${matchingRecords.length} records found across all periods.`,
      records: matchingRecords
    });
  };

  // Drilldown handler for Ageing duration bucket slices
  const handleAgeingBucketClick = (bucketName: string, activePool: DemandRecord[]) => {
    setModalState({
      isOpen: true,
      title: `${bucketName} Positions - Week ${formatWeekToIsoDate(s.latestSnapshotWeek)}`,
      subtitle: `${activePool.length} active records in pipeline.`,
      records: activePool
    });
  };

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
          <span className="text-[11px] text-slate-400 font-medium">Click any card to view records · Based on Position Status</span>
        </div>

        {/* 4 KPI cards: Total Active Demand / Active / Identified / On Hold */}
        <motion.div
          variants={containerStaggerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
        >
          <KpiCard
            title="Total Active Demand"
            value={s.latestActiveDemandFTE}
            valueRaw={s.latestActiveDemandFTE}
            icon={TrendingUp}
            theme="emerald"
            infoTooltip="Total active demand pipeline (Active + Identified + Hold), excluding dropped."
            onClick={() => handleKpiCardClick('total_active')}
          />

          <KpiCard
            title="Active Demand"
            value={s.latestOpenFTE}
            valueRaw={s.latestOpenFTE}
            percentage={openPct}
            icon={Users}
            theme="blue"
            infoTooltip="Active talent demand positions in latest snapshot (Position Status = Active)."
            onClick={() => handleKpiCardClick('open')}
          />

          <KpiCard
            title="Identified Demand"
            value={s.latestIdentifiedFTE}
            valueRaw={s.latestIdentifiedFTE}
            percentage={identifiedPct}
            icon={UserCheck}
            theme="sky"
            infoTooltip="Demand positions with candidates identified or offer extended."
            onClick={() => handleKpiCardClick('identified')}
          />

          <KpiCard
            title="On Hold"
            value={s.latestHoldFTE}
            valueRaw={s.latestHoldFTE}
            percentage={holdPct}
            icon={PauseCircle}
            theme="purple"
            infoTooltip="Demand positions temporarily paused or on hold."
            onClick={() => handleKpiCardClick('hold')}
          />
        </motion.div>
      </div>

      {/* ── SECTION 2: Cumulative Performance Row ────────────────────────────── */}
      {/* {hasFilteredRecords && (
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
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Click any metric to view records</p>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-3">
            <div 
              onClick={() => handleCumulativeClick('fulfilled')}
              className="flex flex-col gap-0.5 p-2 rounded-xl hover:bg-slate-50/80 cursor-pointer transition-all border border-transparent hover:border-slate-200/60"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fulfilled</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold text-slate-900">
                  {s.cumulativeClosed}
                </span>
                <InfoTooltip text="Total positions fulfilled or closed across all reporting periods." position="top" iconSize={13} />
              </div>
            </div>
            <div 
              onClick={() => handleCumulativeClick('dropped')}
              className="flex flex-col gap-0.5 p-2 rounded-xl hover:bg-slate-50/80 cursor-pointer transition-all border border-transparent hover:border-slate-200/60"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cumulative Dropped</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold text-slate-900">
                  {s.cumulativeDropped}
                </span>
                <InfoTooltip text="Total positions dropped or cancelled across all reporting periods." position="top" iconSize={13} />
              </div>
            </div>
            <div 
              onClick={() => handleCumulativeClick('new')}
              className="flex flex-col gap-0.5 p-2 rounded-xl hover:bg-slate-50/80 cursor-pointer transition-all border border-transparent hover:border-slate-200/60"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cumulative New</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold text-slate-900">
                  {s.cumulativeNew}
                </span>
                <InfoTooltip text="Total newly added demand positions across all reporting periods." position="top" iconSize={13} />
              </div>
            </div>
          </div>
        </motion.div>
      )} */}

      {/* ── SECTION 3: WoW Charts ─────────────────────────────────────────────── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-indigo-600 rounded-full" />
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Week-Over-Week Performance</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Click any chart point to view detailed records</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <WowDemandChart
            title="WoW Total Demand"
            subtitle="Total snapshot position demand"
            dataKey="totalDemand"
            data={wowTrends}
            strokeColor="#0284c7"
            gradientId="wowTotalGrad"
            onPointClick={handleWowPointClick}
          />

          <WowDemandChart
            title="WoW New Demand"
            subtitle="Newly added positions by week"
            dataKey="newDemand"
            data={wowTrends}
            strokeColor="#2563eb"
            gradientId="wowNewGrad"
            onPointClick={handleWowPointClick}
          />

          <WowDemandChart
            title="WoW Dropped Demand"
            subtitle="Dropped or cancelled positions"
            dataKey="droppedDemand"
            data={wowTrends}
            strokeColor="#ef4444"
            gradientId="wowDroppedGrad"
            onPointClick={handleWowPointClick}
          />

          <WowDemandChart
            title="WoW Active Demand"
            subtitle="Active talent positions by week"
            dataKey="openDemand"
            data={wowTrends}
            strokeColor="#0ea5e9"
            gradientId="wowOpenGrad"
            onPointClick={handleWowPointClick}
          />

          <WowDemandChart
            title="WoW Fulfilled"
            subtitle="Fulfilled positions by week"
            dataKey="filledDemand"
            data={wowTrends}
            strokeColor="#10b981"
            gradientId="wowFilledGrad"
            onPointClick={handleWowPointClick}
          />

          {/* Internal vs External: active demand only (excludes Dropped) */}
          <IntVsExtPieChart
            data={activeSnapshotIntVsExt}
            rawRecords={filteredRecords.length > 0 ? filteredRecords : records}
            snapshotWeek={snapshotWeek}
            onSelectSlice={handleIntVsExtClick}
          />
        </div>
      </div>

      {/* ── Client & Location Distributions ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        <DepartmentPieChart
          data={activeClientDistribution}
          rawRecords={filteredRecords.length > 0 ? filteredRecords : records}
          snapshotWeek={snapshotWeek}
          onSelectClient={handleClientClick}
        />
        <LocationPieChart
          data={activeSnapshotLocation}
          rawRecords={filteredRecords.length > 0 ? filteredRecords : records}
          snapshotWeek={snapshotWeek}
          onSelectLocation={handleLocationClick}
        />
      </div>

      <RecentUploadCard
        uploadItem={latestUpload}
        onNavigateToUpload={() => setActiveTab('upload')}
      />

      {/* Drilldown Details Modal on Chart Point Click */}
      <ChartDetailsModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        title={modalState.title}
        subtitle={modalState.subtitle}
        records={modalState.records}
      />
    </motion.div>
  );
};
