import React, { useState, useEffect } from 'react';
import { 
  Milestone, 
  MilestoneType, 
  MilestoneCategory, 
  RepeatInterval, 
  ChecklistTask 
} from '../types';
import { 
  X, 
  Clock, 
  Repeat, 
  Target, 
  Calendar, 
  Plus, 
  Trash2, 
  Sparkles,
  Tag,
  AlertCircle
} from 'lucide-react';

interface MilestoneFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (milestone: Milestone) => void;
  initialData?: Milestone | null;
}

const CATEGORIES: { id: MilestoneCategory; label: string }[] = [
  { id: 'career', label: 'Career' },
  { id: 'celebration', label: 'Celebration' },
  { id: 'finance', label: 'Finance' },
  { id: 'habit', label: 'Habit' },
  { id: 'health', label: 'Health' },
  { id: 'home', label: 'Home' },
  { id: 'personal', label: 'Personal' },
  { id: 'project', label: 'Project' },
  { id: 'travel', label: 'Travel' },
];

export const MilestoneFormModal: React.FC<MilestoneFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<MilestoneType>('days_since');
  const [category, setCategory] = useState<MilestoneCategory>('health');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [repeatInterval, setRepeatInterval] = useState<RepeatInterval>('monthly');
  const [customRepeatDays, setCustomRepeatDays] = useState<number>(30);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [syncToGoogleCalendar, setSyncToGoogleCalendar] = useState(true);
  const [checklist, setChecklist] = useState<ChecklistTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setType(initialData.type);
      setCategory(initialData.category);
      setStartDate(initialData.startDate.split('T')[0]);
      setTargetDate(
        initialData.targetDate 
          ? initialData.targetDate.split('T')[0] 
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      );
      setRepeatInterval(initialData.repeatInterval || 'monthly');
      setCustomRepeatDays(initialData.customRepeatDays || 30);
      setPriority(initialData.priority);
      setSyncToGoogleCalendar(initialData.syncToGoogleCalendar);
      setChecklist(initialData.checklist || []);
    } else {
      // Defaults for new
      setTitle('');
      setDescription('');
      setType('days_since');
      setCategory('health');
      setStartDate(new Date().toISOString().split('T')[0]);
      setTargetDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setRepeatInterval('monthly');
      setCustomRepeatDays(30);
      setPriority('medium');
      setSyncToGoogleCalendar(true);
      setChecklist([]);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newOrUpdatedMilestone: Milestone = {
      id: initialData ? initialData.id : 'ms-' + Date.now(),
      title: title.trim(),
      description: description.trim(),
      type,
      category,
      startDate: new Date(startDate).toISOString(),
      targetDate: type === 'days_since' ? undefined : new Date(targetDate).toISOString(),
      repeatInterval: type === 'repeating' ? repeatInterval : undefined,
      customRepeatDays: type === 'repeating' && repeatInterval === 'custom' ? customRepeatDays : undefined,
      completedCycles: initialData ? initialData.completedCycles : 0,
      resetHistory: initialData ? initialData.resetHistory : [],
      checklist,
      color: initialData ? initialData.color : '#10b981',
      priority,
      pinned: initialData ? initialData.pinned : false,
      archived: initialData ? initialData.archived : false,
      syncToGoogleCalendar,
      googleCalendarEventId: initialData?.googleCalendarEventId,
      createdAt: initialData ? initialData.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newOrUpdatedMilestone);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl my-8 transition-all duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-medium text-slate-100 leading-snug">
                {initialData ? 'Edit milestone' : 'New milestone tracker'}
              </h2>
              <p className="text-xs text-slate-400 font-normal">
                Configure tracking mode, category & target date
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Milestone Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
              1. Choose Tracking Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              
              <button
                type="button"
                onClick={() => setType('days_since')}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                  type === 'days_since'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Clock className="h-5 w-5 text-emerald-400" />
                <span className="text-xs font-bold">Days Since</span>
                <span className="text-[10px] text-slate-400 line-clamp-1">Elapsed streak</span>
              </button>

              <button
                type="button"
                onClick={() => setType('repeating')}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                  type === 'repeating'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/30'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Repeat className="h-5 w-5 text-indigo-400" />
                <span className="text-xs font-bold">Recurrence</span>
                <span className="text-[10px] text-slate-400 line-clamp-1">Recurring reminder</span>
              </button>

              <button
                type="button"
                onClick={() => setType('event_countdown')}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                  type === 'event_countdown'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/30'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Target className="h-5 w-5 text-cyan-400" />
                <span className="text-xs font-bold">Countdown</span>
                <span className="text-[10px] text-slate-400 line-clamp-1">Future event</span>
              </button>

            </div>
          </div>

          {/* Title & Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Title <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Days Since Quitting Caffeine / Quarterly Oil Change / Product Launch"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              placeholder="Add key objectives, motivation, or instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Category & Priority Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MilestoneCategory)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          {/* Dates & Scheduling Section */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-3">
            
            {type === 'days_since' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Start Date (Date when timer started)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}

            {type === 'repeating' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Next Target Date
                    </label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Repeat Interval
                    </label>
                    <select
                      value={repeatInterval}
                      onChange={(e) => setRepeatInterval(e.target.value as RepeatInterval)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly (90 Days)</option>
                      <option value="yearly">Yearly</option>
                      <option value="custom">Custom Days</option>
                    </select>
                  </div>
                </div>

                {repeatInterval === 'custom' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Repeat Every X Days
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={customRepeatDays}
                      onChange={(e) => setCustomRepeatDays(parseInt(e.target.value) || 1)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {type === 'event_countdown' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Event Date
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}

          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-800/80 pt-4 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-all shadow-sm"
            >
              {initialData ? 'Save changes' : 'Create tracker'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
