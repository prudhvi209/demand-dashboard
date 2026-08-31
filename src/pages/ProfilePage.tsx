import React from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { pageVariants } from '../lib/animations';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const initialLetter = (user?.displayName || user?.email || 'A').charAt(0).toUpperCase();

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-xl mx-auto space-y-6 py-6"
    >
      <div className="glass-panel rounded-3xl p-8 border border-white/70 shadow-xl space-y-8 relative overflow-hidden">
        {/* Background accent */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br from-blue-400/20 to-sky-300/10 rounded-full blur-3xl pointer-events-none" />

        {/* User Identity Header */}
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white text-3xl font-bold border-2 border-white shadow-md flex-shrink-0">
            {initialLetter}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.displayName || user?.email?.split('@')[0] || 'Agivant User'}</h2>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-1.5 text-[11px] text-emerald-600 font-semibold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Active Authenticated Session</span>
            </div>
          </div>
        </div>

        {/* Details Card - Email Only */}
        <div className="pt-4 border-t border-slate-200/50">
          <div className="p-4 rounded-2xl bg-white/40 border border-white/60 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>Email Address</span>
            </div>
            <p className="text-sm font-medium text-slate-800 truncate">{user?.email || 'N/A'}</p>
          </div>
        </div>

        {/* Logout Button */}
        <div className="pt-2">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition border border-rose-200/60 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Agivant Analytics</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
