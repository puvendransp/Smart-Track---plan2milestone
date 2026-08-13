export type MilestoneType = 'days_since' | 'repeating' | 'event_countdown';

export type MilestoneCategory = 
  | 'health' 
  | 'habit' 
  | 'career' 
  | 'personal' 
  | 'finance' 
  | 'project' 
  | 'travel' 
  | 'celebration'
  | 'home';

export type RepeatInterval = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

export interface ResetHistoryItem {
  id: string;
  date: string; // ISO string
  note?: string;
  durationDays: number;
}

export interface ChecklistTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  type: MilestoneType;
  category: MilestoneCategory;
  startDate: string; // ISO date string (when days_since started, or event start date)
  targetDate?: string; // ISO date string for event_countdown or repeating target
  repeatInterval?: RepeatInterval;
  customRepeatDays?: number;
  completedCycles?: number;
  resetHistory: ResetHistoryItem[];
  checklist: ChecklistTask[];
  color: string; // Hex or tailwind color identifier
  icon?: string;
  priority: 'low' | 'medium' | 'high';
  pinned: boolean;
  archived: boolean;
  syncToGoogleCalendar: boolean;
  googleCalendarEventId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncStatus {
  isConnected: boolean;
  accessToken?: string;
  userEmail?: string;
  userName?: string;
  userPicture?: string;
  lastSyncedAt?: string;
  isSyncing: boolean;
  syncError?: string;
  driveFolderPath: string;
  driveFolderId?: string;
  driveFileId?: string;
  googleCalendarConnected: boolean;
}

export interface FilterOptions {
  search: string;
  type: 'all' | 'upcoming' | MilestoneType;
  category: 'all' | MilestoneCategory;
  status: 'active' | 'archived' | 'pinned' | 'all';
  sortBy: 'date' | 'category' | 'days_count' | 'title' | 'priority';
  sortOrder: 'asc' | 'desc';
}

export interface SmartTrackAppData {
  version: string;
  lastUpdated: string;
  appName: string;
  milestones: Milestone[];
  userPreferences?: {
    theme: 'dark' | 'light';
    defaultView: 'cards' | 'timeline' | 'calendar';
  };
}
