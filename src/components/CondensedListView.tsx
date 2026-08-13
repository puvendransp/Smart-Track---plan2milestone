import React, { useState } from 'react';
import { Milestone } from '../types';
import { formatDate } from '../utils/dateUtils';
import { 
  Pin, 
  RotateCcw, 
  Calendar, 
  Sparkles, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Clock, 
  Repeat,
  CheckCircle2
} from 'lucide-react';

interface CondensedListViewProps {
  milestones: Milestone[];
  onSelect: (milestone: Milestone) => void;
  onEdit: (milestone: Milestone, e: React.MouseEvent) => void;
  onResetCounter: (milestone: Milestone, e: React.MouseEvent) => void;
  onAdvanceCycle: (milestone: Milestone, e: React.MouseEvent) => void;
  onTogglePin: (milestone: Milestone, e: React.MouseEvent) => void;
  onDelete: (milestone: Milestone, e: React.MouseEvent) => void;
}

export const CondensedListView: React.FC<CondensedListViewProps> = ({
  milestones,
  onSelect,
  onEdit,
  onResetCounter,
  onAdvanceCycle,
  onTogglePin,
  onDelete,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Helper to calculate days since
  const getDaysSince = (startDate: string) => {
    const diffMs = Date.now() - new Date(startDate).getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  };

  // Helper to calculate days remaining
  const getDaysRemaining = (targetDate?: string) => {
    if (!targetDate) return null;
    const diffMs = new Date(targetDate).getTime() - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  if (milestones.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-10 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-slate-600 mb-2" />
        <h3 className="text-sm font-bold text-slate-300">No Trackers Found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          No trackers match your current search or filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {milestones.map((item) => {
        const isDaysSince = item.type === 'days_since';
        const isRepeating = item.type === 'repeating';
        const daysSinceCount = getDaysSince(item.startDate);
        const daysRemaining = getDaysRemaining(item.targetDate);
        const isMenuOpen = activeMenuId === item.id;

        return (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3 transition-all cursor-pointer ${
              item.pinned
                ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-950/20 via-slate-900 to-slate-900 shadow-sm'
                : 'border-slate-800/80 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            {/* Left side: Badge & Main details */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              
              {/* Type Badge Box */}
              <div className="shrink-0">
                {isDaysSince ? (
                  <div className="flex flex-col items-center justify-center h-11 w-12 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-1 py-1 text-center">
                    <span className="text-base font-extrabold text-emerald-400 leading-none">
                      {daysSinceCount}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tight mt-0.5">
                      Days
                    </span>
                  </div>
                ) : (
                  <div className={`flex flex-col items-center justify-center h-11 w-12 rounded-lg border px-1 py-1 text-center ${
                    daysRemaining !== null && daysRemaining < 0
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      : daysRemaining !== null && daysRemaining <= 3
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : isRepeating
                      ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                      : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  }`}>
                    {daysRemaining !== null ? (
                      <>
                        <span className="text-base font-extrabold leading-none">
                          {Math.abs(daysRemaining)}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-tight mt-0.5">
                          {daysRemaining < 0 ? 'Over' : 'Left'}
                        </span>
                      </>
                    ) : (
                      <Clock className="h-4 w-4 text-blue-400" />
                    )}
                  </div>
                )}
              </div>

              {/* Title, Category & Dates */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {item.pinned && (
                      <Pin className="h-3 w-3 text-amber-400 fill-amber-400/20 shrink-0" />
                    )}
                    <h3 className={`text-xs font-bold text-slate-100 transition-colors truncate ${
                      isDaysSince ? 'group-hover:text-emerald-300' :
                      isRepeating ? 'group-hover:text-violet-300' :
                      'group-hover:text-blue-300'
                    }`}>
                      {item.title}
                    </h3>
                  </div>
                  
                  {/* Category Pill aligned on right */}
                  <span className="shrink-0 inline-flex items-center rounded-md bg-slate-800/90 px-2 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-700/80 uppercase tracking-wide">
                    {item.category}
                  </span>
                </div>

                {/* Subtext info */}
                <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                  {isDaysSince ? (
                    <span>Since: <strong className="text-slate-300 font-medium">{formatDate(item.startDate)}</strong></span>
                  ) : (
                    <span>Target: <strong className="text-slate-300 font-medium">{formatDate(item.targetDate)}</strong></span>
                  )}

                  {item.resetHistory && item.resetHistory.length > 0 && (
                    <span className="text-slate-500 text-[10px]">
                      ({item.resetHistory.length} resets)
                    </span>
                  )}

                  {item.completedCycles && item.completedCycles > 0 ? (
                    <span className="text-violet-400 text-[10px] font-medium">
                      ↻ {item.completedCycles} cycles
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Right side: Uniform Action Box & 3-Dot Options */}
            <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-slate-800/80 shrink-0">
              
              {/* Perfectly Aligned Primary Box across all types */}
              <div className="w-28 flex justify-center shrink-0">
                {isDaysSince ? (
                  <button
                    onClick={(e) => onResetCounter(item, e)}
                    className="w-full h-8 flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 active:scale-95 transition-all shadow-sm"
                    title="Reset Counter to Day 0"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Reset</span>
                  </button>
                ) : isRepeating ? (
                  <button
                    onClick={(e) => onAdvanceCycle(item, e)}
                    className="w-full h-8 flex items-center justify-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 text-xs font-bold text-violet-300 hover:bg-violet-500/20 active:scale-95 transition-all shadow-sm"
                    title="Advance to Next Cycle"
                  >
                    <Repeat className="h-3.5 w-3.5 text-violet-400" />
                    <span>Next Cycle</span>
                  </button>
                ) : (
                  <div className="w-full h-8 flex items-center justify-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 text-xs font-bold text-blue-300 shadow-sm">
                    <Calendar className="h-3.5 w-3.5 text-blue-400" />
                    <span>Countdown</span>
                  </div>
                )}
              </div>

              {/* 3-Dot Options Menu Button */}
              <div className="relative shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(isMenuOpen ? null : item.id);
                  }}
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200 transition-all"
                  title="Tracker Options"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {/* Dropdown Popover */}
                {isMenuOpen && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-8 z-40 min-w-[130px] rounded-xl border border-slate-800 bg-slate-950 p-1 shadow-2xl backdrop-blur-md"
                  >
                    <button
                      onClick={(e) => {
                        setActiveMenuId(null);
                        onTogglePin(item, e);
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition-all text-left"
                    >
                      <Pin className={`h-3.5 w-3.5 ${item.pinned ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
                      <span>{item.pinned ? 'Unpin' : 'Pin to top'}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        setActiveMenuId(null);
                        onEdit(item, e);
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition-all text-left"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={(e) => {
                        setActiveMenuId(null);
                        onDelete(item, e);
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 transition-all text-left"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>
        );
      })}
    </div>
  );
};

