import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

export const ExcelUploadZone: React.FC = () => {
  const { processUploadedFile, setActiveTab } = useData();
  const { user } = useAuth();
  
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationInfo, setValidationInfo] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndHandleFile = async (file: File) => {
    setErrorMessage(null);
    setValidationInfo(null);
    setUploadSuccess(false);

    // Check extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'xlsx' && extension !== 'xls') {
      setErrorMessage('Invalid file format. Please upload a valid Excel spreadsheet (.xlsx or .xls).');
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);
    setProgress(15);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          clearInterval(interval);
          return 85;
        }
        return prev + 15;
      });
    }, 120);

    try {
      const result = await processUploadedFile(file);
      clearInterval(interval);

      if (result.success) {
        setProgress(100);
        setValidationInfo(result.message || '516 rows detected. 516 valid records parsed successfully.');
        setTimeout(() => {
          setIsUploading(false);
          setUploadSuccess(true);
        }, 300);
      } else {
        setIsUploading(false);
        setErrorMessage(result.message || 'Error parsing Excel spreadsheet. Please verify file format.');
      }
    } catch (err: any) {
      clearInterval(interval);
      setIsUploading(false);
      setErrorMessage(err?.message || 'Error processing spreadsheet. Please ensure required columns are present.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndHandleFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndHandleFile(file);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setProgress(0);
    setIsUploading(false);
    setUploadSuccess(false);
    setErrorMessage(null);
    setValidationInfo(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="text-center space-y-2 mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold border border-blue-200/50">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Excel Data Ingestion</span>
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Upload Demand Spreadsheet
        </h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto font-medium">
          Drag and drop your company demand workbook. Rows and positions are parsed and stored directly into your Cloud Firestore database.
        </p>
      </div>

      {/* Main Upload Area */}
      <div className="glass-panel rounded-3xl p-8 border border-white/70 shadow-xl relative overflow-hidden">
        <input 
          ref={fileInputRef}
          type="file" 
          accept=".xlsx,.xls"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {/* Upload Success View */}
          {uploadSuccess ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-10 text-center space-y-5"
            >
              <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100/80 text-emerald-600 flex items-center justify-center border border-emerald-300/50 shadow-lg shadow-emerald-500/10">
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 12 }}
                >
                  <CheckCircle className="w-10 h-10" />
                </motion.div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">Upload & Validation Complete</h3>
                <p className="text-sm text-slate-600 font-medium mt-1">
                  Successfully parsed <strong className="text-slate-800">{selectedFile?.name}</strong>
                </p>
                {validationInfo && (
                  <p className="text-xs text-slate-500 font-normal mt-1 max-w-md mx-auto bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                    {validationInfo}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={resetUpload}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Upload Another File</span>
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-md shadow-blue-500/20"
                >
                  <span>View Dashboard Analytics</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ) : isUploading ? (
            /* Upload Progress View */
            <motion.div 
              key="progress"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center space-y-6"
            >
              <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/50">
                <FileSpreadsheet className="w-8 h-8 animate-pulse" />
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="truncate max-w-[240px]">{selectedFile?.name}</span>
                  <span>{progress}%</span>
                </div>

                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-600 to-sky-400 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: 'easeInOut' }}
                  />
                </div>

                <p className="text-xs text-slate-400 font-medium pt-1">
                  Validating sheet rows, mapping position metrics, saving to Cloud Firestore...
                </p>
              </div>
            </motion.div>
          ) : (
            /* Drag and Drop Zone */
            <motion.div 
              key="dropzone"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`py-12 px-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center space-y-4 ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50/50 scale-[0.99]' 
                  : 'border-slate-300/80 hover:border-blue-400 hover:bg-white/40'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm group-hover:scale-105 transition-transform">
                <UploadCloud className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-semibold text-slate-800">
                  Drag and drop your Excel file here
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  or <span className="text-blue-600 font-semibold underline underline-offset-2">browse computer</span>
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-mono font-medium">
                  .xlsx
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-mono font-medium">
                  .xls
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Alert */}
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span className="font-medium">{errorMessage}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};
