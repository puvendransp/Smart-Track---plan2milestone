import React from 'react';
import { Milestone } from '../types';
import { formatDate } from '../utils/dateUtils';
import { Clock, Repeat, Target, Calendar, CheckCircle2 } from 'lucide-react';

interface TimelineViewProps {
  milestones: Milestone[];
  onSelectMilestone: (milestone: Milestone) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  milestones,
  onSelectMilestone,
}) => {
  // Sort all milestones by effective date (targetDate or startDate)
  const sortedMilestones = [...milestones].sort((a, b) => {
    const dateA = new Date(a.targetDate || a.startDate).getTime();
    const dateB = new Date(b.targetDate || b.startDate).getTime();
    return dateA - dateB;
  });

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-100">Chronological Timeline</h2>
          <p className="text-xs text-slate-400">Baseline dates and future target milestones</p>
        </div>
      </div>

      <div className="relative pl-5 border-l-2 border-slate-800 space-y-3 my-2">
        {sortedMilestones.map((ms) => {
          const effectiveDate = new Date(ms.targetDate || ms.startDate);
          const isPast = effectiveDate.getTime() < Date.now();

          return (
            <div
              key={ms.id}
              onClick={() => onSelectMilestone(ms)}
              className="relative group cursor-pointer"
            >
              {/* Node dot on line */}
              <div
                className={`absolute -left-[27px] top-2 h-3.5 w-3.5 rounded-full border-2 bg-slate-950 transition-transform group-hover:scale-125 ${
                  ms.type === 'days_since'
                    ? 'border-emerald-500 bg-emerald-500/20'
                    : ms.type === 'repeating'
                    ? 'border-violet-500 bg-violet-500/20'
                    : 'border-blue-500 bg-blue-500/20'
                }`}
              />

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-2.5 px-3.5 transition-all group-hover:border-slate-700 group-hover:bg-slate-900/90">
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-slate-300">
                      {formatDate(ms.targetDate || ms.startDate)}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="shrink-0">
                        {ms.type === 'days_since' && <Clock className="h-3 w-3 text-emerald-400" />}
                        {ms.type === 'repeating' && <Repeat className="h-3 w-3 text-violet-400" />}
                        {ms.type === 'event_countdown' && <Target className="h-3 w-3 text-blue-400" />}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {ms.category}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    isPast ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {isPast ? 'Past Baseline' : 'Upcoming Target'}
                  </span>
                </div>

                <h3 className={`text-sm font-bold text-slate-100 transition-colors ${
                  ms.type === 'days_since' ? 'group-hover:text-emerald-300' :
                  ms.type === 'repeating' ? 'group-hover:text-violet-300' :
                  'group-hover:text-blue-300'
                }`}>
                  {ms.title}
                </h3>
                {ms.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{ms.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
