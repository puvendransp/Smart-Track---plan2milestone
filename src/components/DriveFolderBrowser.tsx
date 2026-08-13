import React, { useState, useEffect } from 'react';
import { driveService, DriveFileItem } from '../services/driveService';
import { Folder, FolderPlus, ChevronRight, Check, Loader2, HardDrive, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectFolder: (folderId: string, folderName: string) => void;
  initialFolderId?: string;
}

export const DriveFolderBrowser: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectFolder,
  initialFolderId,
}) => {
  const [currentFolder, setCurrentFolder] = useState<DriveFileItem>({
    id: 'root',
    name: 'My Drive',
    mimeType: 'application/vnd.google-apps.folder',
  });
  const [breadcrumbs, setBreadcrumbs] = useState<DriveFileItem[]>([]);
  const [folders, setFolders] = useState<DriveFileItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadFolder(initialFolderId || 'root');
    }
  }, [isOpen, initialFolderId]);

  const loadFolder = async (folderId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      let folderMeta: DriveFileItem = {
        id: 'root',
        name: 'My Drive',
        mimeType: 'application/vnd.google-apps.folder',
      };
      if (folderId !== 'root') {
        folderMeta = await driveService.getFolderMetadata(folderId);
      }

      setCurrentFolder(folderMeta);
      const subFolders = await driveService.listFolders(folderId);
      setFolders(subFolders);

      // Build Breadcrumb path
      if (folderId === 'root') {
        setBreadcrumbs([{ id: 'root', name: 'My Drive', mimeType: '' }]);
      } else {
        const path: DriveFileItem[] = [folderMeta];
        let parentId = folderMeta.parents?.[0];
        while (parentId && parentId !== 'root') {
          try {
            const parent = await driveService.getFolderMetadata(parentId);
            path.unshift(parent);
            parentId = parent.parents?.[0];
          } catch {
            break;
          }
        }
        path.unshift({ id: 'root', name: 'My Drive', mimeType: '' });
        setBreadcrumbs(path);
      }
    } catch (err: any) {
      console.error('Failed to load drive folders', err);
      setError(err.message || 'Failed to fetch Drive folders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setIsCreatingFolder(true);
    try {
      await driveService.findOrCreateFolder(newFolderName.trim(), currentFolder.id);
      setNewFolderName('');
      await loadFolder(currentFolder.id);
    } catch (err: any) {
      console.error('Folder creation failed', err);
      setError('Folder creation failed: ' + err.message);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[85vh] text-slate-100">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <HardDrive className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base sm:text-lg">Select Storage Folder</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Breadcrumb Hierarchy */}
        <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center space-x-1 overflow-x-auto text-xs">
          {breadcrumbs.map((b, idx) => (
            <React.Fragment key={b.id}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />}
              <button
                onClick={() => loadFolder(b.id)}
                className={`whitespace-nowrap hover:text-sky-400 font-medium transition-colors ${
                  b.id === currentFolder.id ? 'text-sky-400 font-semibold' : 'text-slate-400'
                }`}
              >
                {b.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Sub-Folder List View */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 min-h-[220px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mb-2 text-sky-400" />
              <span className="text-xs">Fetching Google Drive Folders...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 px-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              {error}
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No subfolders inside "{currentFolder.name}". Create one below or select this folder.
            </div>
          ) : (
            folders.map((f) => (
              <div
                key={f.id}
                onClick={() => loadFolder(f.id)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/60 border border-transparent hover:border-slate-700/50 cursor-pointer transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <Folder className="w-5 h-5 text-amber-400 fill-amber-400/20 group-hover:scale-110 transition-transform" />
                  <span className="text-xs sm:text-sm font-medium text-slate-200">{f.name}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-sky-400 transition-colors" />
              </div>
            ))
          )}
        </div>

        {/* Inline Folder Creation Form */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 flex items-center space-x-2">
          <input
            type="text"
            placeholder="New folder name..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
          <button
            onClick={handleCreateFolder}
            disabled={isCreatingFolder || !newFolderName.trim()}
            className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs px-3 py-2 rounded-lg font-medium text-slate-200 transition-all shrink-0"
          >
            {isCreatingFolder ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
            ) : (
              <FolderPlus className="w-3.5 h-3.5 text-sky-400" />
            )}
            <span>Create</span>
          </button>
        </div>

        {/* Confirm Selection Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900 rounded-b-2xl">
          <div className="text-xs text-slate-400">
            Selected Target: <span className="text-white font-semibold">{currentFolder.name}</span>
          </div>
          <button
            onClick={() => {
              onSelectFolder(currentFolder.id, currentFolder.name);
              onClose();
            }}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all active:scale-95"
          >
            <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
            <span>Select This Folder</span>
          </button>
        </div>

      </div>
    </div>
  );
};
