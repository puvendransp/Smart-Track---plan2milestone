import React, { useState, useEffect, useMemo } from 'react';
import { 
  Milestone, 
  SyncStatus, 
  FilterOptions, 
  SmartTrackAppData 
} from './types';
import { StorageService } from './services/storageService';
import { driveService } from './services/driveService';
import { syncService, ROOT_FOLDER_NAME } from './services/syncService';
import { googleSignIn, getStoredAccessToken, clearStoredAccessToken, fetchUserProfile } from './services/authService';
import { GoogleCalendarService } from './services/googleCalendarService';
import { DriveFolderBrowser } from './components/DriveFolderBrowser';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { FilterBar } from './components/FilterBar';
import { CondensedListView } from './components/CondensedListView';
import { MilestoneCard } from './components/MilestoneCard';
import { TimelineView } from './components/TimelineView';
import { MilestoneFormModal } from './components/MilestoneFormModal';
import { MilestoneDetailModal } from './components/MilestoneDetailModal';
import { ResetModal } from './components/ResetModal';
import { AdvanceCycleModal } from './components/AdvanceCycleModal';
import { SettingsModal } from './components/SettingsModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { FolderSetupModal } from './components/FolderSetupModal';
import { Plus, Sparkles, List, LayoutGrid, Clock } from 'lucide-react';

export default function App() {
  // 1. Core State & Storage Token
  const [appData, setAppData] = useState<SmartTrackAppData>(() => StorageService.loadLocalData());
  const [viewMode, setViewMode] = useState<'list' | 'cards' | 'timeline'>('list');
  const [token, setToken] = useState<string | null>(() => getStoredAccessToken());
  const [syncFolderId, setSyncFolderId] = useState<string>(() => StorageService.getCustomSyncFolderId() || localStorage.getItem('custom_sync_folder_id') || '');
  const [syncFolderName, setSyncFolderName] = useState<string>(() => localStorage.getItem('custom_sync_folder_name') || 'smart-track-plan2milestone');
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  
  // 2. Sync Status
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isConnected: !!token,
    accessToken: token || undefined,
    isSyncing: false,
    driveFolderPath: `${ROOT_FOLDER_NAME}/${syncFolderName}`,
    googleCalendarConnected: !!token,
  });

  // 3. Filters State
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    type: 'all',
    category: 'all',
    status: 'active',
    sortBy: 'date',
    sortOrder: 'desc',
  });

  // 4. Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resettingMilestone, setResettingMilestone] = useState<Milestone | null>(null);

  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advancingMilestone, setAdvancingMilestone] = useState<Milestone | null>(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [deletingMilestone, setDeletingMilestone] = useState<Milestone | null>(null);
  const [isFolderSetupModalOpen, setIsFolderSetupModalOpen] = useState(false);

  // Auto-save local data on change
  useEffect(() => {
    StorageService.saveLocalData(appData);
  }, [appData]);

  // Keep driveService token in sync, fetch profile, and verify folder setup on startup
  useEffect(() => {
    driveService.setToken(token);
    if (token) {
      setSyncStatus(prev => ({
        ...prev,
        isConnected: true,
        accessToken: token,
        googleCalendarConnected: true,
      }));

      // Fetch user profile (email, name, picture)
      fetchUserProfile(token).then(profile => {
        if (profile.email || profile.picture || profile.name) {
          setSyncStatus(prev => ({
            ...prev,
            userEmail: profile.email || prev.userEmail,
            userName: profile.name || prev.userName,
            userPicture: profile.picture || prev.userPicture,
          }));
        }
      });

      // Step 1 & 4: Only auto-sync if folder setup has been confirmed by user
      if (StorageService.isFolderSetupConfirmed()) {
        const savedFolderId = StorageService.getCustomSyncFolderId() || syncFolderId || undefined;
        const localData = StorageService.loadLocalData();
        syncService.syncAppData(localData, savedFolderId)
          .then(result => {
            if (result?.appData) {
              setAppData(result.appData);
              setSyncStatus(prev => ({
                ...prev,
                driveFileId: result.fileId,
                lastSyncedAt: result.syncedAt,
              }));
            }
          })
          .catch(err => console.warn('Startup auto-sync error:', err));
      } else {
        // Account connected, but folder path not confirmed yet -> show folder setup modal
        setIsFolderSetupModalOpen(true);
      }
    }
  }, [token]);

  // Execute 2-way differential sync
  const runSync = async () => {
    if (!driveService.hasToken()) return;
    try {
      setSyncStatus(prev => ({ ...prev, isSyncing: true }));
      const savedFolderId = StorageService.getCustomSyncFolderId() || syncFolderId || undefined;
      const localData = StorageService.loadLocalData();
      const result = await syncService.syncAppData(localData, savedFolderId);
      setAppData(result.appData);
      setSyncStatus(prev => ({
        ...prev,
        isConnected: true,
        isSyncing: false,
        driveFileId: result.fileId,
        lastSyncedAt: result.syncedAt,
      }));
      return result;
    } catch (err: any) {
      console.error('Drive 2-way sync error:', err);
      setSyncStatus(prev => ({ ...prev, isSyncing: false, syncError: err.message }));
    }
  };

  // Google Login Handler: resets folder setup confirmation so user is asked to verify folder path
  const handleConnectDrive = async () => {
    const res = await googleSignIn();
    if (res?.accessToken) {
      setToken(res.accessToken);
      driveService.setToken(res.accessToken);
      setSyncStatus(prev => ({
        ...prev,
        isConnected: true,
        accessToken: res.accessToken,
        googleCalendarConnected: true,
        userEmail: res.userEmail,
        userName: res.userName,
        userPicture: res.userPicture,
      }));
      
      // Step 1: Account connected -> trigger folder path check modal
      StorageService.setFolderSetupConfirmed(false);
      setIsFolderSetupModalOpen(true);
    }
  };

  // Handler once user confirms/creates/selects folder in FolderSetupModal
  const handleFolderConfirmAndSync = async (confirmedFolderId?: string) => {
    if (confirmedFolderId) {
      setSyncFolderId(confirmedFolderId);
    }
    StorageService.setFolderSetupConfirmed(true);
    await runSync();
  };

  // Disconnect Drive Handler
  const handleDisconnectDrive = () => {
    clearStoredAccessToken();
    setToken(null);
    driveService.setToken(null);
    StorageService.setFolderSetupConfirmed(false);
    setSyncStatus(prev => ({
      ...prev,
      isConnected: false,
      accessToken: undefined,
      googleCalendarConnected: false,
      userEmail: undefined,
      userName: undefined,
      userPicture: undefined,
    }));
  };

  // Push to Drive
  const handlePushToDrive = async () => {
    if (!driveService.hasToken()) {
      await handleConnectDrive();
      return;
    }
    await runSync();
    alert('Successfully pushed and synchronized milestones with Google Drive!');
  };

  // Pull from Drive
  const handlePullFromDrive = async () => {
    if (!driveService.hasToken()) {
      await handleConnectDrive();
      return;
    }
    try {
      setSyncStatus(prev => ({ ...prev, isSyncing: true }));
      const savedFolderId = StorageService.getCustomSyncFolderId() || syncFolderId || undefined;
      const pulled = await syncService.pullFromDrive(savedFolderId);
      if (pulled && pulled.appData && Array.isArray(pulled.appData.milestones)) {
        setAppData(pulled.appData);
        setSyncStatus(prev => ({
          ...prev,
          isSyncing: false,
          lastSyncedAt: pulled.syncedAt,
        }));
        alert('Successfully pulled data from Google Drive!');
      } else {
        alert('No data file found in the selected Drive location yet.');
        setSyncStatus(prev => ({ ...prev, isSyncing: false }));
      }
    } catch (err: any) {
      alert('Drive pull failed: ' + err.message);
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  };

  // CRUD Operations
  const handleSaveMilestone = (milestone: Milestone) => {
    const existingIndex = appData.milestones.findIndex(m => m.id === milestone.id);
    let updatedList: Milestone[];

    if (existingIndex >= 0) {
      updatedList = [...appData.milestones];
      updatedList[existingIndex] = milestone;
    } else {
      updatedList = [milestone, ...appData.milestones];
    }

    setAppData(prev => ({
      ...prev,
      milestones: updatedList,
      lastUpdated: new Date().toISOString(),
    }));

    // Auto-sync event to Google Calendar API if enabled & token exists
    if (milestone.syncToGoogleCalendar && syncStatus.accessToken) {
      GoogleCalendarService.createOrUpdateCalendarEvent(syncStatus.accessToken, milestone)
        .then(eventId => {
          // Store event ID
          setAppData(prev => ({
            ...prev,
            milestones: prev.milestones.map(m => m.id === milestone.id ? { ...m, googleCalendarEventId: eventId } : m),
          }));
        })
        .catch(err => console.warn('GCal auto sync error:', err));
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    if (!id) return;

    const target = appData.milestones.find(m => m.id === id);

    // 1. Immediately remove from local state and localStorage
    let updatedAppData: SmartTrackAppData | null = null;
    setAppData(prev => {
      const updatedMilestones = prev.milestones.filter(m => m.id !== id);
      updatedAppData = {
        ...prev,
        milestones: updatedMilestones,
        lastUpdated: new Date().toISOString(),
      };
      StorageService.saveLocalData(updatedAppData);
      return updatedAppData;
    });

    if (selectedMilestone?.id === id) {
      setSelectedMilestone(null);
    }

    // 2. Delete Google Calendar event if synced
    if (target?.googleCalendarEventId && syncStatus.accessToken) {
      GoogleCalendarService.deleteCalendarEvent(syncStatus.accessToken, target.googleCalendarEventId)
        .catch(err => console.warn('Google Calendar deletion warning:', err));
    }

    // 3. Save directly to Google Drive if connected
    if (driveService.hasToken() && updatedAppData) {
      try {
        await syncService.saveAppDataDirect(updatedAppData, syncFolderId || undefined);
      } catch (err) {
        console.warn('Could not sync deletion to Google Drive immediately:', err);
      }
    }
  };

  const handleTogglePin = (milestone: Milestone, e: React.MouseEvent) => {
    e.stopPropagation();
    handleSaveMilestone({ ...milestone, pinned: !milestone.pinned });
  };

  // Reset Counter for "Days Since"
  const handleOpenResetModal = (milestone: Milestone, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setResettingMilestone(milestone);
    setIsResetModalOpen(true);
  };

  const handleConfirmReset = (milestoneId: string, note: string) => {
    const target = appData.milestones.find(m => m.id === milestoneId);
    if (!target) return;

    const elapsedDays = Math.floor(
      (Date.now() - new Date(target.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    const newHistoryItem = {
      id: 'rh-' + Date.now(),
      date: new Date().toISOString(),
      note,
      durationDays: elapsedDays,
    };

    const updated: Milestone = {
      ...target,
      startDate: new Date().toISOString(),
      resetHistory: [newHistoryItem, ...(target.resetHistory || [])],
      updatedAt: new Date().toISOString(),
    };

    handleSaveMilestone(updated);

    // Keep detail modal updated if open
    if (selectedMilestone?.id === milestoneId) {
      setSelectedMilestone(updated);
    }
  };

  // Advance Cycle for "Repeating"
  const handleOpenAdvanceModal = (milestone: Milestone, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAdvancingMilestone(milestone);
    setIsAdvanceModalOpen(true);
  };

  const handleConfirmAdvance = (milestoneId: string, note: string) => {
    const target = appData.milestones.find(m => m.id === milestoneId);
    if (!target) return;

    const currentTarget = new Date(target.targetDate || target.startDate);
    
    // Calculate next target date
    let nextTarget = new Date(currentTarget);
    switch (target.repeatInterval) {
      case 'daily':
        nextTarget.setDate(nextTarget.getDate() + 1);
        break;
      case 'weekly':
        nextTarget.setDate(nextTarget.getDate() + 7);
        break;
      case 'monthly':
        nextTarget.setMonth(nextTarget.getMonth() + 1);
        break;
      case 'quarterly':
        nextTarget.setMonth(nextTarget.getMonth() + 3);
        break;
      case 'yearly':
        nextTarget.setFullYear(nextTarget.getFullYear() + 1);
        break;
      case 'custom':
        nextTarget.setDate(nextTarget.getDate() + (target.customRepeatDays || 30));
        break;
      default:
        nextTarget.setMonth(nextTarget.getMonth() + 1);
    }

    const completedCycleNum = (target.completedCycles || 0) + 1;

    const newHistoryItem = {
      id: 'ch-' + Date.now(),
      date: new Date().toISOString(),
      note: note ? note : `Completed Cycle #${completedCycleNum}`,
      durationDays: 0,
    };

    const updated: Milestone = {
      ...target,
      targetDate: nextTarget.toISOString(),
      completedCycles: completedCycleNum,
      resetHistory: [newHistoryItem, ...(target.resetHistory || [])],
      updatedAt: new Date().toISOString(),
    };

    handleSaveMilestone(updated);

    // Keep detail modal updated if open
    if (selectedMilestone?.id === milestoneId) {
      setSelectedMilestone(updated);
    }
  };

  // Checklist Actions
  const handleToggleTask = (milestoneId: string, taskId: string) => {
    setAppData(prev => ({
      ...prev,
      milestones: prev.milestones.map(m => {
        if (m.id !== milestoneId) return m;
        return {
          ...m,
          checklist: m.checklist.map(c => c.id === taskId ? { ...c, completed: !c.completed } : c),
        };
      }),
    }));

    if (selectedMilestone?.id === milestoneId) {
      setSelectedMilestone(prev => prev ? {
        ...prev,
        checklist: prev.checklist.map(c => c.id === taskId ? { ...c, completed: !c.completed } : c),
      } : null);
    }
  };

  const handleAddTask = (milestoneId: string, title: string) => {
    const newTask = { id: 'cl-' + Date.now(), title, completed: false };
    setAppData(prev => ({
      ...prev,
      milestones: prev.milestones.map(m => {
        if (m.id !== milestoneId) return m;
        return {
          ...m,
          checklist: [...m.checklist, newTask],
        };
      }),
    }));

    if (selectedMilestone?.id === milestoneId) {
      setSelectedMilestone(prev => prev ? {
        ...prev,
        checklist: [...prev.checklist, newTask],
      } : null);
    }
  };

  const handleResetDefaultData = () => {
    if (confirm('Reset to default sample milestones? This will overwrite your current list.')) {
      const defaultData = StorageService.resetToDefault();
      setAppData(defaultData);
    }
  };

  // Filtered & Sorted Milestones
  const filteredMilestones = useMemo(() => {
    return appData.milestones.filter(m => {
      // Type Filter
      if (filters.type === 'upcoming') {
        if (!m.targetDate) return false;
        const diff = new Date(m.targetDate).getTime() - Date.now();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days < 0 || days > 14) return false;
      } else if (filters.type !== 'all' && m.type !== filters.type) {
        return false;
      }
      // Category Filter
      if (filters.category !== 'all' && m.category !== filters.category) return false;
      // Search Filter
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchTitle = m.title.toLowerCase().includes(query);
        const matchDesc = m.description?.toLowerCase().includes(query);
        const matchCat = m.category.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }
      return true;
    }).sort((a, b) => {
      // Pinned items always on top
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      // Trackers with a counter of 0 (recently reset) are sorted to the bottom
      const getCounterValue = (m: Milestone) => {
        if (m.type === 'days_since') {
          return Math.max(0, Math.floor((Date.now() - new Date(m.startDate).getTime()) / (1000 * 60 * 60 * 24)));
        }
        return null;
      };

      const cValA = getCounterValue(a);
      const cValB = getCounterValue(b);

      if (cValA === 0 && cValB !== null && cValB > 0) return 1;
      if (cValB === 0 && cValA !== null && cValA > 0) return -1;

      if (filters.sortBy === 'category') {
        return filters.sortOrder === 'asc'
          ? a.category.localeCompare(b.category)
          : b.category.localeCompare(a.category);
      }

      if (filters.sortBy === 'title') {
        return filters.sortOrder === 'asc' 
          ? a.title.localeCompare(b.title) 
          : b.title.localeCompare(a.title);
      }

      if (filters.sortBy === 'priority') {
        const pWeight = { high: 3, medium: 2, low: 1 };
        const pA = pWeight[a.priority] || 0;
        const pB = pWeight[b.priority] || 0;
        return filters.sortOrder === 'asc' ? pA - pB : pB - pA;
      }

      if (filters.sortBy === 'days_count') {
        const getCount = (m: Milestone) => {
          if (m.type === 'days_since') {
            return Math.floor((Date.now() - new Date(m.startDate).getTime()) / (1000 * 60 * 60 * 24));
          }
          const t = m.targetDate ? new Date(m.targetDate).getTime() : new Date(m.startDate).getTime();
          return Math.ceil((t - Date.now()) / (1000 * 60 * 60 * 24));
        };
        const cA = getCount(a);
        const cB = getCount(b);
        return filters.sortOrder === 'asc' ? cA - cB : cB - cA;
      }
      
      const dateA = new Date(a.targetDate || a.startDate).getTime();
      const dateB = new Date(b.targetDate || b.startDate).getTime();

      return filters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [appData.milestones, filters]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Header Bar */}
      <Header
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        syncStatus={syncStatus}
        userEmail={syncStatus.userEmail}
        userName={syncStatus.userName}
        userPicture={syncStatus.userPicture}
      />

      {/* Main Content Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-5 pb-8 sm:px-6 lg:px-8">
        
        {/* View Type Switcher (above Due In frame) & New Tracker Button */}
        <div className="flex w-full items-center justify-between gap-2 mb-4">
          
          {/* View Mode Switcher Box with explicit "View Toggle" Label */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">
              View Toggle:
            </span>
            <div 
              className="flex h-9 items-center rounded-xl bg-slate-900/90 p-1 border border-slate-800 shadow-sm shrink-0"
              title="View Toggle - Switch layout between List, Cards, and Timeline"
              aria-label="View Toggle"
            >
              <button
                id="view-list-btn"
                onClick={() => setViewMode('list')}
                className={`flex h-full items-center gap-1.5 rounded-lg px-2.5 sm:px-3 text-xs font-semibold transition-all ${
                  viewMode === 'list'
                    ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/80'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="View Toggle: List View"
              >
                <List className="h-3.5 w-3.5" />
                <span className="inline">List</span>
              </button>

              <button
                id="view-cards-btn"
                onClick={() => setViewMode('cards')}
                className={`flex h-full items-center gap-1.5 rounded-lg px-2.5 sm:px-3 text-xs font-semibold transition-all ${
                  viewMode === 'cards'
                    ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/80'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="View Toggle: Cards View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="inline">Cards</span>
              </button>

              <button
                id="view-timeline-btn"
                onClick={() => setViewMode('timeline')}
                className={`flex h-full items-center gap-1.5 rounded-lg px-2.5 sm:px-3 text-xs font-semibold transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/80'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="View Toggle: Timeline View"
              >
                <Clock className="h-3.5 w-3.5" />
                <span className="inline">Timeline</span>
              </button>
            </div>
          </div>

          {/* Add New Action Button - ml-auto & shrink-0 ensures flush right alignment on mobile */}
          <button
            onClick={() => {
              setEditingMilestone(null);
              setIsFormModalOpen(true);
            }}
            className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 sm:px-4 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-all shadow-sm active:scale-95 shrink-0 ml-auto"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Add New</span>
          </button>

        </div>

        {/* Minimized / Expandable Filter Bar (Right below View Switcher) */}
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          totalCount={appData.milestones.length}
        />

        {/* High-level Metrics Overview ("Due in" frame) */}
        <StatsOverview
          milestones={appData.milestones}
          onFilterClick={(type) => setFilters(f => ({ ...f, type: type as any, search: '' }))}
        />

        {/* View Switcher Output */}
        {viewMode === 'list' && (
          <CondensedListView
            milestones={filteredMilestones}
            onSelect={(m) => setSelectedMilestone(m)}
            onEdit={(m, e) => {
              e.stopPropagation();
              setEditingMilestone(m);
              setIsFormModalOpen(true);
            }}
            onResetCounter={(m, e) => handleOpenResetModal(m, e)}
            onAdvanceCycle={(m, e) => handleOpenAdvanceModal(m, e)}
            onTogglePin={handleTogglePin}
            onDelete={(m, e) => {
              if (e) e.stopPropagation();
              setDeletingMilestone(m);
            }}
          />
        )}

        {viewMode === 'cards' && (
          <div>
            {filteredMilestones.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMilestones.map((ms) => (
                  <MilestoneCard
                    key={ms.id}
                    milestone={ms}
                    onSelect={(m) => setSelectedMilestone(m)}
                    onEdit={(m, e) => {
                      e.stopPropagation();
                      setEditingMilestone(m);
                      setIsFormModalOpen(true);
                    }}
                    onResetCounter={(m, e) => handleOpenResetModal(m, e)}
                    onAdvanceCycle={(m, e) => handleOpenAdvanceModal(m, e)}
                    onTogglePin={handleTogglePin}
                    onDelete={(m, e) => {
                      if (e) e.stopPropagation();
                      setDeletingMilestone(m);
                    }}
                    accessToken={syncStatus.accessToken}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
                <Sparkles className="mx-auto h-10 w-10 text-slate-600 mb-3" />
                <h3 className="text-base font-bold text-slate-300">No Trackers Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  No trackers match your current filters. Try resetting the search or add a new tracker.
                </p>
                <button
                  onClick={() => {
                    setEditingMilestone(null);
                    setIsFormModalOpen(true);
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:brightness-110"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Tracker</span>
                </button>
              </div>
            )}
          </div>
        )}

        {viewMode === 'timeline' && (
          <TimelineView
            milestones={filteredMilestones}
            onSelectMilestone={(m) => setSelectedMilestone(m)}
          />
        )}

      </main>

      {/* Modals */}
      <MilestoneFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveMilestone}
        initialData={editingMilestone}
      />

      <MilestoneDetailModal
        isOpen={!!selectedMilestone}
        milestone={selectedMilestone}
        onClose={() => setSelectedMilestone(null)}
        onEdit={(m) => {
          setSelectedMilestone(null);
          setEditingMilestone(m);
          setIsFormModalOpen(true);
        }}
        onDelete={(id) => {
          const target = appData.milestones.find(m => m.id === id);
          if (target) {
            setSelectedMilestone(null);
            setDeletingMilestone(target);
          }
        }}
        onOpenResetModal={(m) => handleOpenResetModal(m)}
        onOpenAdvanceModal={(m) => handleOpenAdvanceModal(m)}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingMilestone}
        milestone={deletingMilestone}
        onClose={() => setDeletingMilestone(null)}
        onConfirm={handleDeleteMilestone}
      />

      <ResetModal
        isOpen={isResetModalOpen}
        milestone={resettingMilestone}
        onClose={() => setIsResetModalOpen(false)}
        onConfirmReset={handleConfirmReset}
      />

      <AdvanceCycleModal
        isOpen={isAdvanceModalOpen}
        milestone={advancingMilestone}
        onClose={() => setIsAdvanceModalOpen(false)}
        onConfirmAdvance={handleConfirmAdvance}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        syncStatus={syncStatus}
        onConnectDrive={handleConnectDrive}
        onDisconnectDrive={handleDisconnectDrive}
        onPushToDrive={handlePushToDrive}
        onPullFromDrive={handlePullFromDrive}
        appData={appData}
        onImportLocalJson={(data) => setAppData(data)}
        onResetDefaultData={handleResetDefaultData}
        onOpenFolderBrowser={() => setIsBrowserOpen(true)}
        syncFolderName={syncFolderName}
      />

      <DriveFolderBrowser
        isOpen={isBrowserOpen}
        onClose={() => setIsBrowserOpen(false)}
        initialFolderId={syncFolderId || 'root'}
        onSelectFolder={(folderId, folderName) => {
          setSyncFolderId(folderId);
          setSyncFolderName(folderName);
          localStorage.setItem('custom_sync_folder_id', folderId);
          localStorage.setItem('custom_sync_folder_name', folderName);
          runSync();
        }}
      />

      <FolderSetupModal
        isOpen={isFolderSetupModalOpen}
        onClose={() => setIsFolderSetupModalOpen(false)}
        onConfirmAndSync={handleFolderConfirmAndSync}
        accessToken={token || ''}
      />

      {/* Simple Footer */}
      <footer className="mt-12 border-t border-slate-800/80 bg-slate-950/60 py-4 text-center">
        <div className="mx-auto max-w-7xl px-4 text-xs text-slate-500 font-medium">
          Plan2Milestone Ecosystem
        </div>
      </footer>



    </div>
  );
}
