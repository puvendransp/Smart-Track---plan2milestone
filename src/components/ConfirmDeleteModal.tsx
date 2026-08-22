import React from 'react';
import { Milestone } from '../types';
import { Trash2, X, AlertTriangle } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  milestone: Milestone | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  milestone,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !milestone) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Confirm Deletion</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="my-4 space-y-2 text-left">
          <p className="text-xs text-slate-300">
            Are you sure you want to delete <strong className="text-slate-100 font-semibold">"{milestone.title}"</strong>?
          </p>
          <p className="text-[11px] text-slate-400">
            This will permanently remove the tracker and its history log. This action cannot be undone.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-800/80 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800/60 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(milestone.id);
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-rose-400 transition-all shadow-md shadow-rose-500/20 active:scale-95"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Tracker</span>
          </button>
        </div>

      </div>
    </div>
  );
};
