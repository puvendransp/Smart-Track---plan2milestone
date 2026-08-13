import React, { useState } from 'react';
import { Milestone } from '../types';
import { RotateCcw, X, History, Sparkles } from 'lucide-react';

interface ResetModalProps {
  isOpen: boolean;
  milestone: Milestone | null;
  onClose: () => void;
  onConfirmReset: (milestoneId: string, note: string) => void;
}

export const ResetModal: React.FC<ResetModalProps> = ({
  isOpen,
  milestone,
  onClose,
  onConfirmReset,
}) => {
  const [note, setNote] = useState('');

  if (!isOpen || !milestone) return null;

  const elapsedDays = Math.floor(
    (Date.now() - new Date(milestone.startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmReset(milestone.id, note.trim());
    setNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <RotateCcw className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-100">
              Reset "Days Since" Counter
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 mb-4 text-center">
          <p className="text-xs text-slate-400">Current Active Streak Duration</p>
          <div className="my-1 flex items-baseline justify-center gap-2">
            <span className="text-4xl font-extrabold text-amber-400 font-mono">{elapsedDays}</span>
            <span className="text-sm font-semibold text-slate-300">Days</span>
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            {milestone.title}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Log Reflection / Reason for Reset (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g., Vacation slip-up, system restart, or fresh baseline start..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <p className="text-[11px] text-slate-400 bg-amber-500/5 border border-amber-500/15 rounded-lg p-2.5">
            💡 Resetting will start your counter at Day 0 from today, and save this {elapsedDays}-day streak into your permanent Reset History log.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-110"
            >
              Confirm Reset
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
