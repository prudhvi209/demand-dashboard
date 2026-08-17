import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileSpreadsheet, 
  Clock, 
  User, 
  CheckCircle2, 
  ArrowRight, 
  Building2 
} from 'lucide-react';
import { cardRevealVariants } from '../../lib/animations';
import { UploadHistoryItem } from '../../types';

interface RecentUploadCardProps {
  uploadItem?: UploadHistoryItem;
  onNavigateToUpload: () => void;
}

export const RecentUploadCard: React.FC<RecentUploadCardProps> = ({ 
  uploadItem, 
  onNavigateToUpload 
}) => {
  if (!uploadItem) {
    return (
      <motion.div 
        variants={cardRevealVariants}
        initial="initial"
        animate="animate"
        className="glass-card rounded-2xl p-6 border border-white/60 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/50">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">No Excel Upload History</h4>
            <p className="text-xs text-slate-500 font-medium">Upload a demand spreadsheet to view parsing history</p>
          </div>
        </div>

        <button
          onClick={onNavigateToUpload}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition flex-shrink-0"
        >
          <span>Upload Excel Spreadsheet</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={cardRevealVariants}
      initial="initial"
      animate="animate"
      className="glass-card rounded-2xl p-6 border border-white/60 space-y-4"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex-shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-900 truncate max-w-xs">{uploadItem.fileName}</h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                <span>Active Dataset</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Parsed <strong className="text-slate-800 font-bold">{uploadItem.recordCount} records</strong> from spreadsheet
              {uploadItem.skippedRows !== undefined && uploadItem.skippedRows > 0 && (
                <span className="text-slate-400 font-normal"> ({uploadItem.totalRows} rows detected, {uploadItem.skippedRows} skipped)</span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToUpload}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white text-slate-700 text-xs font-semibold border border-slate-200/80 transition shadow-2xs"
        >
          <span>Update Data</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200/60 text-xs font-medium text-slate-600">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span>Uploaded <strong className="text-slate-800">{uploadItem.uploadedAt}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span>Uploaded by <strong className="text-slate-800">{uploadItem.uploadedBy}</strong></span>
        </div>
        {uploadItem.summarySnippet?.topDepartment && (
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>Top Client: <strong className="text-slate-800">{uploadItem.summarySnippet.topDepartment}</strong></span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
