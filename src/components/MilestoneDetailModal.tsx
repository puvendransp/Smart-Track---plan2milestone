import React, { useState, useEffect } from 'react';
import { Milestone } from '../types';
import { formatDate } from '../utils/dateUtils';
import { 
  X, 
  Clock, 
  Repeat, 
  Target, 
  Trash2, 
  History, 
  RotateCcw,
  Edit3
} from 'lucide-react';

interface MilestoneDetailModalProps {
  isOpen: boolean;
  milestone: Milestone | null;
  onClose: () => void;
  onEdit: (milestone: Milestone) => void;
  onDelete: (milestoneId: string) => void;
  onOpenResetModal: (milestone: Milestone) => void;
  onOpenAdvanceModal?: (milestone: Milestone) => void;
}

export const MilestoneDetailModal: React.FC<MilestoneDetailModalProps> = ({
  isOpen,
  milestone,
  onClose,
  onEdit,
  onDelete,
  onOpenResetModal,
  onOpenAdvanceModal,
}) => {
  const [daysCount, setDaysCount] = useState(0);

  useEffect(() => {
    if (!milestone) return;

    const updateDays = () => {
      const now = Date.now();
      const startMs = new Date(milestone.startDate).getTime();
      const targetMs = milestone.targetDate ? new Date(milestone.targetDate).getTime() : startMs;

      let diff = 0;
      if (milestone.type === 'days_since') {
        diff = Math.max(0, now - startMs);
        setDaysCount(Math.floor(diff / (1000 * 60 * 60 * 24)));
      } else {
        diff = targetMs - now;
        setDaysCount(Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }
    };

    updateDays();
    const interval = setInterval(updateDays, 60000);
    return () => clearInterval(interval);
  }, [milestone]);

  if (!isOpen || !milestone) return null;

  const displayDays = Math.max(0, daysCount);
  const weeks = Math.floor(displayDays / 7);
  const remainingDaysInWeek = displayDays % 7;
  const years = (displayDays / 365.25).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl my-8 transition-all duration-200">
        
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-slate-800/80 pb-3.5 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-slate-800/70 border border-slate-700/60 px-2 py-0.5 text-[11px] font-medium text-slate-300 capitalize">
                {milestone.category}
              </span>
              <span className="text-slate-600 text-xs">•</span>
              <span className="text-xs text-slate-400 font-normal">
                {milestone.type === 'days_since' && 'days since'}
                {milestone.type === 'repeating' && 'recurrence'}
                {milestone.type === 'event_countdown' && 'countdown'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-medium text-slate-100 tracking-normal leading-snug">
              {milestone.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Day-Based Counter Display */}
        <div className="my-4 rounded-xl bg-slate-950/60 p-4 border border-slate-800/80 text-center shadow-inner">
          <p className={`text-[11px] font-medium uppercase tracking-wider mb-2 ${
            milestone.type === 'days_since' ? 'text-emerald-400/90' :
            milestone.type === 'repeating' ? 'text-violet-400/90' :
            'text-blue-400/90'
          }`}>
            {milestone.type === 'days_since' && 'Elapsed time since start'}
            {milestone.type === 'repeating' && 'Time remaining to next milestone'}
            {milestone.type === 'event_countdown' && 'Countdown to target event'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 my-2.5">
            {/* Primary Days Card */}
            <div className="rounded-xl bg-slate-900 px-5 py-2.5 border border-slate-800 shadow-sm flex flex-col items-center min-w-[130px]">
              <div className={`text-3xl font-bold font-mono tracking-tight ${
                milestone.type === 'days_since' ? 'text-emerald-400' :
                milestone.type === 'repeating' ? 'text-violet-400' :
                'text-blue-400'
              }`}>{displayDays}</div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Overall Days</div>
            </div>

            {/* Equivalent Breakdown Cards (Weeks / Years) */}
            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto font-mono">
              <div className="rounded-xl bg-slate-900 px-3.5 py-2 border border-slate-800 text-center">
                <div className="text-base font-semibold text-slate-200">{weeks}w {remainingDaysInWeek}d</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Weeks</div>
              </div>
              <div className="rounded-xl bg-slate-900 px-3.5 py-2 border border-slate-800 text-center">
                <div className="text-base font-semibold text-slate-200">{years} yrs</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Years</div>
              </div>
            </div>
          </div>

          {milestone.type === 'days_since' && (
            <button
              onClick={() => onOpenResetModal(milestone)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset counter & save streak</span>
            </button>
          )}

          {milestone.type === 'repeating' && onOpenAdvanceModal && (
            <button
              onClick={() => onOpenAdvanceModal(milestone)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-violet-500/25 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-all"
            >
              <Repeat className="h-3.5 w-3.5" />
              <span>Complete cycle & advance next target</span>
            </button>
          )}
        </div>

        {/* Description & Notes */}
        {milestone.description && (
          <div className="mb-4">
            <h4 className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Description</h4>
            <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 leading-relaxed">
              {milestone.description}
            </p>
          </div>
        )}

        {/* Activity & History Log */}
        {milestone.resetHistory && milestone.resetHistory.length > 0 && (
          <div className="mb-4">
            <h4 className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">
              <History className="h-3.5 w-3.5 text-violet-400" />
              <span>Activity & History log</span>
            </h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {milestone.resetHistory.map((log) => (
                <div key={log.id} className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>{formatDate(log.date)}</span>
                    <span className="font-semibold text-slate-300 font-mono">
                      {milestone.type === 'repeating' 
                        ? `Cycle Completed`
                        : `${log.durationDays} days streak`}
                    </span>
                  </div>
                  {log.note && <p className="text-slate-300 text-[11px] italic mt-0.5">"{log.note}"</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 mt-5">
          <button
            onClick={() => {
              onDelete(milestone.id);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3.5 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/15 hover:border-rose-500/30 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </button>

          <button
            onClick={() => onEdit(milestone)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-all shadow-sm"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit</span>
          </button>
        </div>

      </div>
    </div>
  );
};
