import React, { useState } from 'react';
import { Milestone } from '../types';
import { Repeat, X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

interface AdvanceCycleModalProps {
  isOpen: boolean;
  milestone: Milestone | null;
  onClose: () => void;
  onConfirmAdvance: (milestoneId: string, note: string) => void;
}

export const AdvanceCycleModal: React.FC<AdvanceCycleModalProps> = ({
  isOpen,
  milestone,
  onClose,
  onConfirmAdvance,
}) => {
  const [note, setNote] = useState('');

  if (!isOpen || !milestone) return null;

  const currentCycleNumber = (milestone.completedCycles || 0) + 1;
  const currentTarget = new Date(milestone.targetDate || milestone.startDate);

  // Calculate next target date
  let nextTarget = new Date(currentTarget);
  switch (milestone.repeatInterval) {
    case 'daily':
      nextTarget.setDate(nextTarget.getDate() + 1);
      break;
    case 'weekly':
      nextTarget.setDate(nextTarget.getDate() + 7);
      break;
    case 'monthly':
      nextTarget.setMonth(nextTarget.getMonth() + 1);
      break;
    case 'quarterly':
      nextTarget.setMonth(nextTarget.getMonth() + 3);
      break;
    case 'yearly':
      nextTarget.setFullYear(nextTarget.getFullYear() + 1);
      break;
    case 'custom':
      nextTarget.setDate(nextTarget.getDate() + (milestone.customRepeatDays || 30));
      break;
    default:
      nextTarget.setMonth(nextTarget.getMonth() + 1);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmAdvance(milestone.id, note.trim());
    setNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Repeat className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-100">
              Complete Cycle #{currentCycleNumber}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Target Shift Banner */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 mb-4">
          <p className="text-[11px] font-semibold text-violet-400 uppercase tracking-wider mb-2">
            {milestone.title}
          </p>
          
          <div className="flex items-center justify-between bg-slate-900/90 rounded-lg p-3 border border-slate-800/80">
            <div>
              <div className="text-[10px] text-slate-400 font-medium uppercase">Current Target</div>
              <div className="text-xs font-bold text-slate-200 font-mono mt-0.5">
                {formatDate(currentTarget.toISOString())}
              </div>
            </div>

            <ArrowRight className="h-4 w-4 text-violet-400 shrink-0" />

            <div>
              <div className="text-[10px] text-violet-400 font-medium uppercase">Next Target</div>
              <div className="text-xs font-bold text-violet-300 font-mono mt-0.5">
                {formatDate(nextTarget.toISOString())}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Log Completion Note / Reflections (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g., Finished weekly review on time, completed all items..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <p className="text-[11px] text-slate-400 bg-violet-500/5 border border-violet-500/15 rounded-lg p-2.5">
            💡 Completing Cycle #{currentCycleNumber} will increment your cycle count, advance the target date to {formatDate(nextTarget.toISOString())}, and save this note in your completion history.
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
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-violet-500/20 hover:brightness-110"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Confirm & Advance</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
