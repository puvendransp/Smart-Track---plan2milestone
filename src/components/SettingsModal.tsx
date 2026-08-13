import React, { useState } from 'react';
import { SyncStatus, SmartTrackAppData } from '../types';
import { 
  X, 
  HardDrive, 
  Cloud, 
  Folder, 
  Upload, 
  Download, 
  Trash2, 
  HelpCircle, 
  RotateCw, 
  CloudUpload, 
  CloudDownload, 
  Check, 
  LogOut,
  Sliders
} from 'lucide-react';
import { DRIVE_FOLDER_NAME, APP_SUBFOLDER_NAME, FILE_NAME } from '../services/googleDriveService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncStatus: SyncStatus;
  onConnectDrive: () => void;
  onPushToDrive: () => void;
  onPullFromDrive: () => void;
  appData: SmartTrackAppData;
  onImportLocalJson: (data: SmartTrackAppData) => void;
  onResetDefaultData: () => void;
  onOpenFolderBrowser?: () => void;
  syncFolderName?: string;
  userEmail?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  syncStatus,
  onConnectDrive,
  onPushToDrive,
  onPullFromDrive,
  appData,
  onImportLocalJson,
  onResetDefaultData,
  onOpenFolderBrowser,
  syncFolderName = 'smart-track-plan2milestone',
  userEmail = 'puvendran@gmail.com',
}) => {
  const [activeTab, setActiveTab] = useState<'app' | 'sync'>('sync');
  const [importError, setImportError] = useState<string | null>(null);
  const [isEditingPath, setIsEditingPath] = useState(false);
  const [customFolder, setCustomFolder] = useState(APP_SUBFOLDER_NAME);

  if (!isOpen) return null;

  const handleExportLocalJson = () => {
    const content = JSON.stringify(appData, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smarttrack_plan2milestone_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.milestones)) {
          onImportLocalJson(parsed);
          setImportError(null);
          alert('Local JSON backup restored successfully!');
        } else {
          setImportError('Invalid JSON structure. Missing milestones array.');
        }
      } catch (err: any) {
        setImportError('Failed to parse JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const initials = userEmail
    ? userEmail.split('@')[0].substring(0, 2).toUpperCase()
    : 'PU';

  const userName = userEmail.includes('puvendran') 
    ? 'Puvendran Paramanantham' 
    : userEmail.split('@')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl my-6 flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-100">Settings</h2>
          </div>
        </div>

        {/* Navigation Tabs (App Settings vs Google Sync) */}
        <div className="flex border-b border-slate-800/80 px-4 shrink-0 bg-slate-950/60">
          <button
            onClick={() => setActiveTab('app')}
            className={`py-3 px-6 text-xs sm:text-sm font-semibold transition-all relative ${
              activeTab === 'app'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            App Settings
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`py-3 px-6 text-xs sm:text-sm font-semibold transition-all relative ${
              activeTab === 'sync'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Google Sync
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'sync' ? (
            <>
              {/* Card 1: Google Account Login */}
              <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden text-emerald-400 font-bold text-sm">
                        {initials}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-100">Google Account Login</h3>
                        <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                      <p className="text-xs font-semibold text-cyan-400 mt-0.5">
                        {syncStatus.isConnected ? `Connected as: ${userName}` : 'Not Connected'}
                      </p>
                      <p className="text-xs text-slate-400">{userEmail}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onConnectDrive}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-950 border border-slate-800/90 py-2.5 px-4 text-xs font-bold text-slate-200 hover:bg-slate-800/80 transition-all active:scale-[0.99]"
                >
                  <LogOut className="h-4 w-4 text-cyan-400" />
                  <span>{syncStatus.isConnected ? 'Disconnect / Re-authorize' : 'Connect Google Account'}</span>
                </button>
              </div>

              {/* Card 2: Cloud Synchronization */}
              <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-4 shadow-sm">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Cloud className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-slate-100">Cloud Synchronization</h3>
                    <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-2">
                  Synchronize local milestones, events, and trackers with your Google Drive.
                </p>

                <p className="text-[11px] text-slate-400 font-medium mb-3">
                  Last synced: {syncStatus.lastSyncedAt ? new Date(syncStatus.lastSyncedAt).toLocaleString() : '12/08/2026, 20:44:19'}
                </p>

                <div className="space-y-2">
                  <button
                    onClick={onPushToDrive}
                    disabled={syncStatus.isSyncing}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 py-3 px-4 text-xs font-bold text-white shadow-md shadow-cyan-500/10 transition-all active:scale-[0.99] disabled:opacity-50"
                  >
                    <RotateCw className={`h-4 w-4 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
                    <span>{syncStatus.isSyncing ? 'Syncing...' : 'Sync Now (Push to Drive)'}</span>
                  </button>

                  {syncStatus.isConnected && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={onPushToDrive}
                        disabled={syncStatus.isSyncing}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-xs font-semibold text-emerald-400 hover:bg-slate-800"
                      >
                        <CloudUpload className="h-3.5 w-3.5" />
                        <span>Push Data</span>
                      </button>
                      <button
                        onClick={onPullFromDrive}
                        disabled={syncStatus.isSyncing}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 py-2 px-3 text-xs font-semibold text-indigo-400 hover:bg-slate-800"
                      >
                        <CloudDownload className="h-3.5 w-3.5" />
                        <span>Pull Data</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 3: Google Drive Storage Path */}
              <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-4 shadow-sm">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Folder className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-slate-100">Google Drive Storage Path</h3>
                    <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-3">
                  Define where your app data is saved in your Google Drive. Choose a destination folder or create a custom app folder location.
                </p>

                <div className="space-y-2.5 mb-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Storage Location
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-cyan-300">
                      <Folder className="h-4 w-4 text-cyan-400 shrink-0" />
                      <span>{DRIVE_FOLDER_NAME}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Active Sync Folder / Destination
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-slate-200">
                      <Folder className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>{syncFolderName || 'Plan2Milestone'}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (onOpenFolderBrowser) {
                      onOpenFolderBrowser();
                    } else {
                      setIsEditingPath(!isEditingPath);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-950 border border-slate-800/90 py-2.5 px-4 text-xs font-bold text-cyan-400 hover:bg-slate-800/80 transition-all active:scale-[0.99]"
                >
                  <Folder className="h-4 w-4 text-cyan-400" />
                  <span>Browse / Change Drive Location</span>
                </button>
              </div>

              {/* Card 4: Local JSON Database Import */}
              <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-4 shadow-sm">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    <Upload className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-slate-100">Local JSON Database Import</h3>
                    <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-3">
                  Directly restore/import database JSON files (e.g., milestones, events) from your device. This integrates files into local storage so you can easily sync them up to Google Drive, bypassing cloud restrictions!
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-800 bg-slate-950 hover:border-cyan-500/50 cursor-pointer group transition-all">
                    <Upload className="h-6 w-6 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-200">Select JSON Files</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Choose specific .json files</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={handleExportLocalJson}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-800 bg-slate-950 hover:border-emerald-500/50 group transition-all"
                  >
                    <Download className="h-6 w-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-200">Export Backup JSON</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Download local database file</span>
                  </button>
                </div>

                {importError && (
                  <p className="text-xs text-rose-400 mt-2">{importError}</p>
                )}
              </div>

              {/* Card 5: Purge Data */}
              <div className="rounded-xl border border-slate-800/90 bg-slate-900/60 p-4 shadow-sm">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <Trash2 className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-rose-400">Purge Data</h3>
                    <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-3">
                  Purge all local tracker data or restore standard default sample milestones. Your local device's data can be re-synced to Google Drive at any time.
                </p>

                <button
                  onClick={() => {
                    if (confirm('Reset to standard sample milestones data?')) {
                      onResetDefaultData();
                      onClose();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 py-2.5 px-4 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Purge & Reset Local Sample Data</span>
                </button>
              </div>
            </>
          ) : (
            /* App Settings Tab */
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <Sliders className="h-4.5 w-4.5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-slate-100">Application Preferences</h3>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Manage display preferences, dataset themes, and regional date formats.
                </p>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="font-medium text-slate-300">Theme Atmosphere</span>
                    <span className="text-slate-400 font-semibold">Dark Obsidian</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-800">
                    <span className="font-medium text-slate-300">Default Date Format</span>
                    <span className="text-slate-400 font-semibold">DD-MMM-YYYY</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="font-medium text-slate-300">Auto-save Local Storage</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" />
                      <span>Active</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
