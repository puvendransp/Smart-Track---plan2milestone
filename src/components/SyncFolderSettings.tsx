import React, { useState } from 'react';
import { driveService } from '../services/driveService';
import { getStoredAccessToken } from '../services/authService';
import { StorageService } from '../services/storageService';
import { syncService } from '../services/syncService';

export const SyncFolderSettings: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleBrowseDriveFolder = async () => {
    const token = getStoredAccessToken();
    if (!token) {
      alert('Please sign in to Google Drive first.');
      return;
    }

    try {
      // 1. Open standard Google Drive folder picker dialog
      await driveService.showFolderPicker(token, async (folderId, _folderName) => {
        setIsSyncing(true);

        // 2. Quietly store the selected parent folder ID
        StorageService.setCustomSyncFolderId(folderId);

        // 3. Automatically create/find /Plan2Milestone and sync data inside it
        const localData = StorageService.loadLocalData();
        await syncService.syncAppData(localData, folderId);

        setIsSyncing(false);
      });
    } catch (err: any) {
      console.error('Folder selection error:', err);
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-slate-800 rounded-2xl border border-slate-700">
      <div>
        <h4 className="text-sm font-bold text-white">Google Drive Storage</h4>
        <p className="text-xs text-slate-400">Choose where to store your sync data</p>
      </div>

      <button
        onClick={handleBrowseDriveFolder}
        disabled={isSyncing}
        className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-all cursor-pointer disabled:opacity-50"
      >
        {isSyncing ? 'Syncing...' : 'Browse Folders'}
      </button>
    </div>
  );
};
