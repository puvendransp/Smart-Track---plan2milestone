import React from 'react';
import { Milestone } from '../types';
import { 
  CalendarClock, 
  AlertCircle, 
  ChevronRight
} from 'lucide-react';

interface StatsOverviewProps {
  milestones: Milestone[];
  onFilterClick?: (filterType: 'all' | 'upcoming' | 'days_since' | 'repeating' | 'event_countdown') => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  milestones,
  onFilterClick,
}) => {
  const activeMilestones = milestones.filter(m => !m.archived);

  // Overdue milestones count
  const overdueCount = activeMilestones.filter(m => {
    if (!m.targetDate) return false;
    const diff = new Date(m.targetDate).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days < 0;
  }).length;

  // Upcoming in next 14 days
  const upcomingCount = activeMilestones.filter(m => {
    if (!m.targetDate) return false;
    const diff = new Date(m.targetDate).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 14;
  }).length;

  return (
    <div 
      onClick={() => onFilterClick && onFilterClick('upcoming')}
      className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-sm shadow-sm hover:border-slate-700 cursor-pointer transition-all group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CalendarClock className="h-5 w-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                Due in Next 14 Days
              </span>

              {overdueCount > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                  <AlertCircle className="h-3 w-3 text-rose-400" />
                  <span>{overdueCount} Overdue</span>
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-slate-100">{upcomingCount}</span>
              <span className="text-xs text-slate-400">
                {upcomingCount === 1 ? 'Milestone approaching deadline' : 'Milestones approaching deadline'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-500 group-hover:text-blue-400 transition-colors font-medium shrink-0">
          <span className="hidden xs:inline">Click to view</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
};
