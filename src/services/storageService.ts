import { Milestone, SmartTrackAppData } from '../types';
import { INITIAL_MILESTONES } from '../data/initialData';

const LOCAL_STORAGE_KEY = 'smarttrack_plan2milestone_v1';

export class StorageService {
  /**
   * Reads data from localStorage or initializes with initial milestones
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
      appName: 'smart-track-plan2milestone',
      milestones: INITIAL_MILESTONES,
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
   * Resets local storage to default sample data
   */
  public static resetToDefault(): SmartTrackAppData {
    const defaultData: SmartTrackAppData = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      appName: 'smart-track-plan2milestone',
      milestones: INITIAL_MILESTONES,
      userPreferences: {
        theme: 'dark',
        defaultView: 'cards',
      },
    };
    this.saveLocalData(defaultData);
    return defaultData;
  }
}
