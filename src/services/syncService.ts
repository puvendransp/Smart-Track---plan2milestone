/**
 * Differential 2-Way Synchronization service for SmartTrack / Plan2Milestone
 */

import { SmartTrackAppData, Milestone } from '../types';
import { driveService } from './driveService';

export const ROOT_FOLDER_NAME = '.AppData.SmartTrack';
export const APP_FOLDER_NAME = 'smart-track-plan2milestone';
export const DEFAULT_FILE_NAME = 'smart_track_plan2milestone.json';

export interface SyncFolderStructure {
  rootFolderId: string;
  appFolderId: string;
  appFolderName: string;
  fileId?: string;
}

class SyncService {
  /**
   * Ensures default structure (.AppData.SmartTrack/Plan2Milestone) or returns custom sync folder
   */
  public async ensureFolderStructure(
    appName: string = 'smart-track-plan2milestone',
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
          rootFolderId: customFolderMeta.parents?.[0] || 'root',
          appFolderId: customSyncFolderId,
          appFolderName: customFolderMeta.name,
          fileId: dataFile?.id,
        };
      }

      // Default 2-tier folder hierarchy
      const rootFolder = await driveService.findOrCreateFolder(ROOT_FOLDER_NAME, 'root');
      const appFolder = await driveService.findOrCreateFolder(appName || APP_FOLDER_NAME, rootFolder.id);
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
