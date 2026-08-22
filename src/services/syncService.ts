/**
 * Differential 2-Way Synchronization service for SmartTrack / Plan2Milestone
 */

import { SmartTrackAppData, Milestone } from '../types';
import { driveService } from './driveService';

export const ROOT_FOLDER_NAME = '.AppData.SmartTrack';
export const DEFAULT_FILE_NAME = 'smart_track_plan2milestone.json';

export interface SyncFolderStructure {
  rootFolderId: string;
  appFolderId: string;
  appFolderName: string;
  fileId?: string;
}

export interface FolderStatusCheck {
  exists: boolean;
  folderId?: string;
  folderName?: string;
  folderPath?: string;
  isDefaultLocation?: boolean;
}

class SyncService {
  /**
   * Checks if the target folder exists in Google Drive without automatically creating it.
   */
  public async checkFolderStatus(customFolderId?: string): Promise<FolderStatusCheck> {
    if (!driveService.hasToken()) {
      return { exists: false, folderPath: `${ROOT_FOLDER_NAME} / Plan2Milestone`, isDefaultLocation: true };
    }

    try {
      // 1. If custom folder ID provided/saved, inspect it
      if (customFolderId && customFolderId !== 'root') {
        try {
          const customMeta = await driveService.getFolderMetadata(customFolderId);
          if (customMeta && customMeta.id) {
            return {
              exists: true,
              folderId: customMeta.id,
              folderName: customMeta.name,
              folderPath: customMeta.name,
              isDefaultLocation: false,
            };
          }
        } catch (e) {
          console.warn('Custom sync folder ID not accessible or deleted:', e);
        }
      }

      // 2. Check if default folder structure exists (.AppData.SmartTrack / Plan2Milestone)
      const parentFolder = await driveService.findParentFolder(ROOT_FOLDER_NAME);
      if (parentFolder) {
        const appFolder = await driveService.findFolder('Plan2Milestone', parentFolder.id);
        if (appFolder) {
          return {
            exists: true,
            folderId: appFolder.id,
            folderName: 'Plan2Milestone',
            folderPath: `${ROOT_FOLDER_NAME} / Plan2Milestone`,
            isDefaultLocation: true,
          };
        }
      }

      return {
        exists: false,
        folderPath: `${ROOT_FOLDER_NAME} / Plan2Milestone`,
        isDefaultLocation: true,
      };
    } catch (err) {
      console.error('Error checking folder status:', err);
      return {
        exists: false,
        folderPath: `${ROOT_FOLDER_NAME} / Plan2Milestone`,
        isDefaultLocation: true,
      };
    }
  }
  /**
   * Identifies and connects directly to the parent folder .AppData.SmartTrack in Google Drive
   */
  public async ensureFolderStructure(
    _appName?: string,
    customSyncFolderId?: string
  ): Promise<SyncFolderStructure | null> {
    if (!driveService.hasToken()) {
      return null;
    }

    try {
      if (customSyncFolderId && customSyncFolderId !== 'root') {
        const customFolderMeta = await driveService.getFolderMetadata(customSyncFolderId);
        const dataFile = await driveService.findFile(DEFAULT_FILE_NAME, customSyncFolderId);
        return {
          rootFolderId: customFolderMeta.parents?.[0] || customFolderMeta.id,
          appFolderId: customSyncFolderId,
          appFolderName: customFolderMeta.name,
          fileId: dataFile?.id,
        };
      }

// 1. Connect or find parent folder .AppData.SmartTrack
      const rootFolder = await driveService.findOrCreateParentFolder(ROOT_FOLDER_NAME);
      
      // 2. Connect or create app-specific child folder "Plan2Milestone" inside .AppData.SmartTrack
      const appFolderName = _appName || 'Plan2Milestone';
      const appFolder = await driveService.findOrCreateFolder(appFolderName, rootFolder.id);

      // 3. Find the data file inside the Plan2Milestone subfolder
      const dataFile = await driveService.findFile(DEFAULT_FILE_NAME, appFolder.id);

      return {
        rootFolderId: rootFolder.id,
        appFolderId: appFolder.id,
        appFolderName: appFolder.name,
        fileId: dataFile?.id,
      };
      
    } catch (err) {
      console.error('Error ensuring Drive folder structure:', err);
      throw err;
    }
  }

  /**
   * Performs differential 2-way merge between local milestone dataset and remote Drive dataset
   */
  public mergeMilestones(localList: Milestone[], remoteList: Milestone[]): Milestone[] {
    const milestoneMap = new Map<string, Milestone>();

    // Add local milestones first
    localList.forEach((item) => {
      milestoneMap.set(item.id, item);
    });

    // Merge remote milestones
    remoteList.forEach((remoteItem) => {
      const localItem = milestoneMap.get(remoteItem.id);
      if (!localItem) {
        // New item from remote cloud
        milestoneMap.set(remoteItem.id, remoteItem);
      } else {
        // Compare updatedAt timestamps
        const localTime = new Date(localItem.updatedAt || localItem.createdAt || 0).getTime();
        const remoteTime = new Date(remoteItem.updatedAt || remoteItem.createdAt || 0).getTime();

        if (remoteTime > localTime) {
          milestoneMap.set(remoteItem.id, remoteItem);
        }
      }
    });

    return Array.from(milestoneMap.values());
  }

  /**
   * Executes 2-way sync with Google Drive
   */
  public async syncAppData(
    localData: SmartTrackAppData,
    customFolderId?: string
  ): Promise<{ appData: SmartTrackAppData; syncedAt: string; fileId: string }> {
    const structure = await this.ensureFolderStructure(localData.appName, customFolderId);
    if (!structure) {
      throw new Error('Drive not connected');
    }

    let mergedData: SmartTrackAppData = { ...localData };
    let targetFileId = structure.fileId;

    // 1. Try reading existing cloud file if present
    if (targetFileId) {
      try {
        const remoteData = await driveService.readFile<SmartTrackAppData>(targetFileId);
        if (remoteData && Array.isArray(remoteData.milestones)) {
          const mergedMilestones = this.mergeMilestones(localData.milestones, remoteData.milestones);
          mergedData = {
            ...localData,
            milestones: mergedMilestones,
            lastUpdated: new Date().toISOString(),
          };
        }
      } catch (err) {
        console.warn('Could not read remote file for merge, proceeding with local push:', err);
      }
    }

    // 2. Save merged dataset back to Drive
    const saveResult = await driveService.saveFile(
      DEFAULT_FILE_NAME,
      mergedData,
      structure.appFolderId,
      targetFileId
    );

    return {
      appData: mergedData,
      syncedAt: saveResult.modifiedTime,
      fileId: saveResult.fileId,
    };
  }

  /**
   * Overwrites app data directly to Drive (e.g. when an item is deleted or forcefully updated locally)
   */
  public async saveAppDataDirect(
    localData: SmartTrackAppData,
    customFolderId?: string
  ): Promise<{ syncedAt: string; fileId: string }> {
    const structure = await this.ensureFolderStructure(localData.appName, customFolderId);
    if (!structure) {
      throw new Error('Drive not connected');
    }

    const saveResult = await driveService.saveFile(
      DEFAULT_FILE_NAME,
      localData,
      structure.appFolderId,
      structure.fileId
    );

    return {
      syncedAt: saveResult.modifiedTime,
      fileId: saveResult.fileId,
    };
  }

  /**
   * Pulls latest dataset from Google Drive
   */
  public async pullFromDrive(
    customFolderId?: string
  ): Promise<{ appData: SmartTrackAppData; syncedAt: string } | null> {
    const structure = await this.ensureFolderStructure('smart-track-plan2milestone', customFolderId);
    if (!structure || !structure.fileId) {
      return null;
    }

    const remoteData = await driveService.readFile<SmartTrackAppData>(structure.fileId);
    return {
      appData: remoteData,
      syncedAt: new Date().toISOString(),
    };
  }
}

export const syncService = new SyncService();
