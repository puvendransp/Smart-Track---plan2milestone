import { Milestone, SmartTrackAppData } from '../types';

const LOCAL_STORAGE_KEY = 'smarttrack_plan2milestone_v1';

export class StorageService {
  /**
   * Reads data from localStorage or initializes with empty milestones
   */
  public static loadLocalData(): SmartTrackAppData {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.milestones)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load from local storage:', e);
    }

    const defaultData: SmartTrackAppData = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      appName: 'Plan2Milestone',
      milestones: [],
      userPreferences: {
        theme: 'dark',
        defaultView: 'cards',
      },
    };

    this.saveLocalData(defaultData);
    return defaultData;
  }

  /**
   * Saves data payload to localStorage
   */
  public static saveLocalData(data: SmartTrackAppData): void {
    try {
      data.lastUpdated = new Date().toISOString();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to local storage:', e);
    }
  }

  /**
   * Resets local storage to empty data
   */
  public static resetToDefault(): SmartTrackAppData {
    const defaultData: SmartTrackAppData = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      appName: 'Plan2Milestone',
      milestones: [],
      userPreferences: {
        theme: 'dark',
        defaultView: 'cards',
      },
    };
    this.saveLocalData(defaultData);
    return defaultData;
  }

  /**
   * Helper methods for custom Google Drive sync folder ID
   */
  public static getCustomSyncFolderId(): string | null {
    return localStorage.getItem('smarttrack_custom_sync_folder_id');
  }

  public static setCustomSyncFolderId(folderId: string): void {
    localStorage.setItem('smarttrack_custom_sync_folder_id', folderId);
  }

  public static isFolderSetupConfirmed(): boolean {
    return localStorage.getItem('smarttrack_folder_setup_confirmed') === 'true';
  }

  public static setFolderSetupConfirmed(confirmed: boolean): void {
    localStorage.setItem('smarttrack_folder_setup_confirmed', confirmed ? 'true' : 'false');
  }
}
