import React, { useEffect, useState } from 'react';
import { Folder, FolderCheck, FolderPlus, Search, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { syncService, FolderStatusCheck } from '../services/syncService';
import { driveService } from '../services/driveService';
import { StorageService } from '../services/storageService';
import { getStoredAccessToken } from '../services/authService';

interface FolderSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmAndSync: (folderId?: string) => Promise<void>;
  accessToken: string;
}

export const FolderSetupModal: React.FC<FolderSetupModalProps> = ({
  isOpen,
  onClose,
  onConfirmAndSync,
  accessToken,
}) => {
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState<FolderStatusCheck | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && accessToken) {
      checkFolder();
    }
  }, [isOpen, accessToken]);

  const checkFolder = async () => {
    setChecking(true);
    setErrorMsg(null);
    try {
      const customId = StorageService.getCustomSyncFolderId() || undefined;
      const res = await syncService.checkFolderStatus(customId);
      setStatus(res);
    } catch (err: any) {
      console.error('Failed to check folder status:', err);
      setErrorMsg('Failed to check Google Drive folders. Please check your network or try again.');
    } finally {
      setChecking(false);
    }
  };

  if (!isOpen) return null;

  // 1. Proceed with existing folder
  const handleProceedExisting = async () => {
    setActionLoading(true);
    try {
      if (status?.folderId) {
        StorageService.setCustomSyncFolderId(status.folderId);
      }
      StorageService.setFolderSetupConfirmed(true);
      await onConfirmAndSync(status?.folderId);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize sync with selected folder.');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Create default folder (.AppData.SmartTrack / Plan2Milestone)
  const handleCreateDefaultFolder = async () => {
    setActionLoading(true);
    try {
      const localData = StorageService.loadLocalData();
      const structure = await syncService.ensureFolderStructure(localData.appName);
      if (structure?.appFolderId) {
        StorageService.setCustomSyncFolderId(structure.appFolderId);
        StorageService.setFolderSetupConfirmed(true);
        await onConfirmAndSync(structure.appFolderId);
        onClose();
      } else {
        throw new Error('Could not create default folder structure in Google Drive.');
      }
    } catch (err: any) {
      console.error('Error creating default folder:', err);
      setErrorMsg(err.message || 'Failed to create default folder in Google Drive.');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Browse custom folder using Google Drive Picker
  const handleBrowseCustomFolder = async () => {
    const token = accessToken || getStoredAccessToken();
    if (!token) {
      setErrorMsg('Google access token is missing. Please sign in again.');
      return;
    }

    try {
      setActionLoading(true);
      await driveService.showFolderPicker(token, async (folderId, _folderName) => {
        try {
          StorageService.setCustomSyncFolderId(folderId);
          StorageService.setFolderSetupConfirmed(true);
          await onConfirmAndSync(folderId);
          onClose();
        } catch (err: any) {
          setErrorMsg(err.message || 'Error configuring selected folder.');
        } finally {
          setActionLoading(false);
        }
      });
    } catch (err: any) {
      console.error('Folder picker error:', err);
      setErrorMsg('Could not open Google Drive Folder Picker.');
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl p-6 my-6 flex flex-col">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <FolderCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Google Drive Folder Setup</h3>
              <p className="text-xs text-slate-400">Verify storage location before enabling sync</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
            title="Cancel Setup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="py-5 space-y-4">
          
          {checking ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
              <p className="text-xs font-semibold text-slate-300">Checking Google Drive folder path...</p>
            </div>
          ) : status?.exists ? (
            
            /* CASE A: Folder EXISTS */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Folder Exists
                  </span>
                  <h4 className="text-sm font-bold text-slate-100">
                    {status.folderPath || '.AppData.SmartTrack / Plan2Milestone'}
                  </h4>
                  <p className="text-xs text-slate-300">
                    Found existing sync folder in your Google Drive. Would you like to proceed with using this folder for synchronization?
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleProceedExisting}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Enabling Sync...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Proceed & Enable Sync</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleBrowseCustomFolder}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Search className="h-4 w-4 text-cyan-400" />
                  <span>Choose Different Folder</span>
                </button>
              </div>
            </div>

          ) : (

            /* CASE B: Folder DOES NOT EXIST */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Folder Not Found
                  </span>
                  <h4 className="text-sm font-bold text-slate-100">
                    Default: .AppData.SmartTrack / Plan2Milestone
                  </h4>
                  <p className="text-xs text-slate-300">
                    No sync folder was found in your Google Drive. Choose where to create or select your sync location before enabling synchronization.
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Options */}
              <div className="space-y-2.5 pt-1">
                <button
                  onClick={handleCreateDefaultFolder}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-emerald-500/40 hover:border-emerald-500/80 hover:bg-slate-850 text-left transition-all cursor-pointer disabled:opacity-50 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
                      <FolderPlus className="h-5 w-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">Create Default Folder</h5>
                      <p className="text-[11px] text-slate-400">/.AppData.SmartTrack/Plan2Milestone</p>
                    </div>
                  </div>
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 text-emerald-400 animate-spin" />
                  ) : (
                    <span className="text-xs font-bold text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                      Create & Sync →
                    </span>
                  )}
                </button>

                <button
                  onClick={handleBrowseCustomFolder}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/60 hover:bg-slate-850 text-left transition-all cursor-pointer disabled:opacity-50 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20">
                      <Folder className="h-5 w-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">Browse & Select Folder</h5>
                      <p className="text-[11px] text-slate-400">Choose a custom location in Google Drive</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                    Browse →
                  </span>
                </button>
              </div>
            </div>

          )}

        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            Cancel (Keep Sync Disabled)
          </button>
        </div>

      </div>
    </div>
  );
};
