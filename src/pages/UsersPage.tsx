import React, { FormEvent, useState } from 'react';
import { CheckCircle2, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { pageVariants } from '../lib/animations';

export const UsersPage: React.FC = () => {
  const { createUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);

    if (password.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }

    setSubmitting(true);
    const result = await createUser(email.trim(), password);
    setSubmitting(false);

    if (result.success) {
      setEmail('');
      setPassword('');
      setStatus({ type: 'success', message: 'User account created successfully.' });
    } else {
      setStatus({ type: 'error', message: result.error || 'Could not create user.' });
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-xl mx-auto space-y-6 py-6"
    >
      <div className="glass-panel rounded-3xl p-8 border border-white/70 shadow-xl">
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Add User</h2>
            <p className="text-xs text-slate-500 mt-1">Create an email and password account for the dashboard.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block space-y-2">
            <span className="text-xs font-semibold text-slate-600">Email address</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs font-semibold text-slate-600">Temporary password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>

          {status && (
            <div className={`rounded-xl px-4 py-3 text-xs font-semibold ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {status.type === 'success' && <CheckCircle2 className="inline-block w-4 h-4 mr-2 -mt-0.5" />}
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Creating account...' : 'Create user account'}
          </button>
        </form>
      </div>
    </motion.div>
  );
};