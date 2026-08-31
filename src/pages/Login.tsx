import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const { loginWithEmailPassword } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    if (errorMsg) {
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedEmail = email.trim();
    const trimmedPass = password.trim();

    if (!trimmedEmail && !trimmedPass) {
      setErrorMsg('Please enter your work email and password.');
      return;
    }

    if (!trimmedEmail) {
      setErrorMsg('Please enter your work email.');
      return;
    }

    if (!trimmedPass) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginWithEmailPassword(trimmedEmail, trimmedPass);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid credentials. Please verify your email and password.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-6 overflow-hidden">
      {/* Ambient Background Blobs */}
      <div className="bg-ambient-blobs">
        <div className="blob-blue" />
        <div className="blob-red" />
        <div className="blob-lavender" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md glass-panel rounded-3xl p-8 md:p-10 border border-white/80 shadow-2xl space-y-7 text-left"
      >
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <img 
            src="/agivant-logo.png" 
            alt="Agivant Analytics" 
            className="h-11 mx-auto object-contain"
          />
          <p className="text-xs text-slate-500 font-medium">
            Demand Dashboard
          </p>
        </div>

        {/* Animated Error Alert */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div 
              key="error-alert"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 shadow-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
              <span className="font-semibold leading-relaxed flex-1">{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block ml-1">
              Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => handleInputChange(setEmail, e.target.value)}
                placeholder="name@agivant.com"
                className={`w-full pl-10 pr-4 py-3 rounded-2xl glass-input text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all ${
                  errorMsg ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' : ''
                }`}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block ml-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => handleInputChange(setPassword, e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-10 pr-10 py-3 rounded-2xl glass-input text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all ${
                  errorMsg ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Sign In Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all duration-200 mt-2 disabled:opacity-70 cursor-pointer active:scale-[0.99]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-200/50 text-center">
          <p className="text-[11px] text-slate-400 font-medium">
            Protected by Agivant Enterprise Security.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
