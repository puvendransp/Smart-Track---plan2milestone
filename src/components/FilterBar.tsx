import React, { useState } from 'react';
import { FilterOptions, MilestoneCategory, MilestoneType } from '../types';
import { Search, Filter, SlidersHorizontal, ArrowUpDown, ChevronDown, ChevronUp, Clock, Repeat, Target, Tag, Layers, X } from 'lucide-react';

interface FilterBarProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  totalCount: number;
}

const CATEGORIES: { id: MilestoneCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Categories' },
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

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  totalCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveExtraFilters = filters.category !== 'all' || filters.sortBy !== 'date' || filters.sortOrder !== 'asc';

  const resetAllFilters = () => {
    setFilters({
      type: 'all',
      category: 'all',
      sortBy: 'date',
      sortOrder: 'asc',
      search: '',
    });
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-2.5 mb-6 backdrop-blur-sm shadow-sm transition-all">
      
      {/* Minimized Main Bar */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search trackers..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-7 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          {filters.search && (
            <button
              onClick={() => setFilters(f => ({ ...f, search: '' }))}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-200"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Quick Type Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setFilters(f => ({ ...f, type: 'all' }))}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${
              filters.type === 'all'
                ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3 w-3 text-emerald-400" />
            <span>All Active ({totalCount})</span>
          </button>
          
          <button
            type="button"
            onClick={() => setFilters(f => ({ ...f, type: 'days_since' }))}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${
              filters.type === 'days_since'
                ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="h-3 w-3 text-emerald-400" />
            <span className="hidden xs:inline">Days Since</span>
          </button>

          <button
            type="button"
            onClick={() => setFilters(f => ({ ...f, type: 'repeating' }))}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${
              filters.type === 'repeating'
                ? 'bg-violet-500/15 text-violet-300 font-semibold border border-violet-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Repeat className="h-3 w-3 text-violet-400" />
            <span className="hidden xs:inline">Recurrence</span>
          </button>

          <button
            type="button"
            onClick={() => setFilters(f => ({ ...f, type: 'event_countdown' }))}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${
              filters.type === 'event_countdown'
                ? 'bg-blue-500/15 text-blue-300 font-semibold border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Target className="h-3 w-3 text-blue-400" />
            <span className="hidden xs:inline">Countdown</span>
          </button>
        </div>

        {/* Expand / Minimize Filters Button */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`relative flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-all shrink-0 ${
            isExpanded || hasActiveExtraFilters
              ? 'border-slate-700 bg-slate-800 text-slate-100'
              : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveExtraFilters && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          )}
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

      </div>

      {/* Expanded Sub-Panel */}
      {isExpanded && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs animate-fadeIn">
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Select */}
            <div className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-400 text-[11px]">Category:</span>
              <select
                value={filters.category}
                onChange={e => setFilters(f => ({ ...f, category: e.target.value as any }))}
                className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-400 text-[11px]">Sort:</span>
              <select
                value={filters.sortBy}
                onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value as any }))}
                className="rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="date">Date</option>
                <option value="category">Category</option>
                <option value="title">Title</option>
                <option value="days_count">Days / Count</option>
                <option value="priority">Priority</option>
              </select>
            </div>

            {/* Sort Direction Toggle */}
            <button
              type="button"
              onClick={() => setFilters(f => ({ ...f, sortOrder: f.sortOrder === 'asc' ? 'desc' : 'asc' }))}
              className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-800"
            >
              {filters.sortOrder === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
            </button>
          </div>

          {/* Reset Filters */}
          <button
            type="button"
            onClick={resetAllFilters}
            className="text-[11px] text-slate-400 hover:text-rose-400 underline transition-colors ml-auto sm:ml-0"
          >
            Reset filters
          </button>

        </div>
      )}

    </div>
  );
};

