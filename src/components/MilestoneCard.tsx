import React from 'react';
import { Milestone } from '../types';
import { formatDate } from '../utils/dateUtils';
import { 
  Clock, 
  Repeat, 
  Target, 
  RotateCcw, 
  CheckCircle, 
  Calendar, 
  Pin, 
  MoreVertical, 
  Trash2,
  Download, 
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Tag
} from 'lucide-react';
import { GoogleCalendarService } from '../services/googleCalendarService';

interface MilestoneCardProps {
  milestone: Milestone;
  onSelect: (milestone: Milestone) => void;
  onEdit: (milestone: Milestone, e: React.MouseEvent) => void;
  onResetCounter: (milestone: Milestone, e: React.MouseEvent) => void;
  onAdvanceCycle: (milestone: Milestone, e: React.MouseEvent) => void;
  onTogglePin: (milestone: Milestone, e: React.MouseEvent) => void;
  onDelete: (milestone: Milestone, e: React.MouseEvent) => void;
  accessToken?: string;
}

export const MilestoneCard: React.FC<MilestoneCardProps> = ({
  milestone,
  onSelect,
  onEdit,
  onResetCounter,
  onAdvanceCycle,
  onTogglePin,
  onDelete,
  accessToken,
}) => {

  // Calculate days elapsed or days remaining
  const now = Date.now();
  const startMs = new Date(milestone.startDate).getTime();
  const targetMs = milestone.targetDate ? new Date(milestone.targetDate).getTime() : startMs;

  const elapsedDays = Math.floor((now - startMs) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.ceil((targetMs - now) / (1000 * 60 * 60 * 24));

  // Category Colors
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'health': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'habit': return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case 'career': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'finance': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'project': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'travel': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'celebration': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'home': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const handleExportIcs = (e: React.MouseEvent) => {
    e.stopPropagation();
    GoogleCalendarService.downloadIcsFile(milestone);
  };

  const handleOpenGCalWeb = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = GoogleCalendarService.generateGoogleCalendarWebLink(milestone);
    window.open(link, '_blank');
  };

  return (
    <div
      onClick={() => onSelect(milestone)}
      className={`group relative flex flex-col justify-between rounded-xl border bg-slate-900/80 p-3.5 shadow-sm transition-all hover:border-slate-700 hover:shadow-lg cursor-pointer ${
        milestone.pinned 
          ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' 
          : 'border-slate-800'
      }`}
    >
      {/* Top Bar: Type, Category, Pin */}
      <div>
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <div className="flex items-center gap-1.5">
            {/* Minimalist Frameless Type Icon */}
            <span
              className="flex h-5 w-5 items-center justify-center shrink-0"
              title={
                milestone.type === 'days_since' ? 'Days Since' :
                milestone.type === 'repeating' ? 'Recurrence' : 'Countdown'
              }
            >
              {milestone.type === 'days_since' && <Clock className="h-3.5 w-3.5 text-emerald-400" />}
              {milestone.type === 'repeating' && <Repeat className="h-3.5 w-3.5 text-violet-400" />}
              {milestone.type === 'event_countdown' && <Target className="h-3.5 w-3.5 text-blue-400" />}
            </span>

            {/* Minimalist Category Tag */}
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {milestone.category}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => onTogglePin(milestone, e)}
              className={`rounded-md p-1 transition-colors ${
                milestone.pinned 
                  ? 'text-emerald-400 bg-emerald-500/10' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title={milestone.pinned ? 'Unpin milestone' : 'Pin to top'}
            >
              <Pin className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => onEdit(milestone, e)}
              className="rounded-md p-1 text-slate-500 hover:text-slate-200 transition-colors"
              title="Edit milestone"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => onDelete(milestone, e)}
              className="rounded-md p-1 text-slate-500 hover:text-rose-400 transition-colors"
              title="Delete milestone"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Milestone Title & Description */}
        <h3 className={`text-sm font-bold text-slate-100 transition-colors leading-tight ${
          milestone.type === 'days_since' ? 'group-hover:text-emerald-300' :
          milestone.type === 'repeating' ? 'group-hover:text-violet-300' :
          'group-hover:text-blue-300'
        }`}>
          {milestone.title}
        </h3>
        <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-1">
          {milestone.description || 'No notes provided.'}
        </p>

        {/* Counter Display Area */}
        <div className="my-2.5 rounded-lg bg-slate-950/80 p-2.5 border border-slate-800/80">
          
          {/* 1. DAYS SINCE COUNTER */}
          {milestone.type === 'days_since' && (
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-emerald-400 tracking-tight font-mono">
                    {Math.max(0, elapsedDays)}
                  </span>
                  <span className="text-xs font-semibold text-slate-300">Days</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Since {formatDate(milestone.startDate)}
                </p>
              </div>

              {/* Reset button */}
              <button
                onClick={(e) => onResetCounter(milestone, e)}
                className="flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 transition-all active:scale-95 shadow-sm"
                title="Reset counter & save history log"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            </div>
          )}

          {/* 2. REPEATING MILESTONE COUNTER */}
          {milestone.type === 'repeating' && (
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-2xl font-extrabold tracking-tight font-mono ${
                    remainingDays < 0 ? 'text-rose-400' : 'text-violet-400'
                  }`}>
                    {remainingDays < 0 ? `${Math.abs(remainingDays)}d Overdue` : `${remainingDays} Days`}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  <span className="capitalize text-slate-300">{milestone.repeatInterval}</span> • Cycle #{ (milestone.completedCycles || 0) + 1 }
                </p>
              </div>

              {/* Complete cycle button */}
              <button
                onClick={(e) => onAdvanceCycle(milestone, e)}
                className="flex items-center gap-1 rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-[11px] font-semibold text-violet-300 hover:bg-violet-500/20 transition-all active:scale-95 shadow-sm"
                title="Complete current cycle and advance to next"
              >
                <CheckCircle className="h-3 w-3 text-violet-400" />
                <span>Advance</span>
              </button>
            </div>
          )}

          {/* 3. EVENT COUNTDOWN COUNTER */}
          {milestone.type === 'event_countdown' && (
            <div>
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-2xl font-extrabold tracking-tight font-mono ${
                    remainingDays <= 0 ? 'text-emerald-400' : 'text-blue-400'
                  }`}>
                    {remainingDays <= 0 ? 'Reached!' : remainingDays}
                  </span>
                  {remainingDays > 0 && <span className="text-xs font-semibold text-slate-300">Days Left</span>}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Target: {formatDate(targetMs.toString())}
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Footer: Calendar Sync & Details CTA */}
      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
        
        {/* Calendar Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleOpenGCalWeb}
            className="flex items-center gap-1 rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            title="Add to Google Calendar"
          >
            <Calendar className="h-3 w-3 text-blue-400" />
            <span>GCal</span>
          </button>

          <button
            onClick={handleExportIcs}
            className="flex items-center gap-1 rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            title="Export .ics for Apple Calendar"
          >
            <Download className="h-3 w-3 text-emerald-400" />
            <span>.ics</span>
          </button>
        </div>

        {/* View Details Link */}
        <span className={`flex items-center gap-0.5 text-[10px] font-semibold group-hover:translate-x-0.5 transition-all ${
          milestone.type === 'days_since' ? 'text-emerald-400' :
          milestone.type === 'repeating' ? 'text-violet-400' :
          'text-blue-400'
        }`}>
          <span>Details</span>
          <ChevronRight className="h-3 w-3" />
        </span>

      </div>
    </div>
  );
};
