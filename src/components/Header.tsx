import React from 'react';
import { 
  Sparkles
} from 'lucide-react';
import { SyncStatus } from '../types';

interface HeaderProps {
  onOpenSettingsModal: () => void;
  syncStatus: SyncStatus;
  userEmail?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettingsModal,
  syncStatus,
  userEmail = 'Puvendran@gmail.com',
}) => {
  const initials = userEmail
    ? userEmail.split('@')[0].substring(0, 2).toUpperCase()
    : 'US';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-600 p-0.5 shadow-md shadow-emerald-500/10 shrink-0">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                <Sparkles className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white font-sans leading-tight">
                smart-track-plan2milestone
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Days Since & Milestone Tracker
              </p>
            </div>
          </div>

          {/* Right Controls: Profile Settings Avatar */}
          <div className="flex items-center gap-2.5">
            
            {/* Profile Picture Avatar (Top Right Corner -> opens Settings & Google Sync) */}
            <button
              id="profile-settings-btn"
              onClick={onOpenSettingsModal}
              className="group relative flex items-center gap-2 rounded-full p-0.5 border border-slate-700 bg-slate-900 hover:border-emerald-500/50 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              title="Profile Settings & Google Drive Sync"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 via-teal-600 to-indigo-600 p-0.5">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950 text-[11px] font-extrabold text-emerald-300 group-hover:text-emerald-200">
                  {initials}
                </div>
              </div>

              {/* Status Indicator Dot */}
              <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-950 ${
                syncStatus.isConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
              }`} />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
