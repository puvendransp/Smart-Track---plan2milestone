import { Milestone } from '../types';

export const INITIAL_MILESTONES: Milestone[] = [
  {
    id: 'ms-1',
    title: 'Days Since Quitting Caffeine',
    description: 'Tracking clean days without coffee or energy drinks for better sleep and focus.',
    type: 'days_since',
    category: 'health',
    startDate: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString(), // 42 days ago
    color: '#10b981', // emerald
    icon: 'coffee',
    priority: 'high',
    pinned: true,
    archived: false,
    syncToGoogleCalendar: false,
    resetHistory: [
      {
        id: 'rh-1',
        date: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString(),
        note: 'Fresh start after vacation reset',
        durationDays: 14
      }
    ],
    checklist: [
      { id: 'cl-1', title: 'Replace morning espresso with green tea', completed: true },
      { id: 'cl-2', title: 'Drink 3L of water daily', completed: true },
      { id: 'cl-3', title: 'Reach 30-day streak milestone', completed: true }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ms-2',
    title: 'Quarterly Vehicle Maintenance',
    description: 'Check oil level, tire pressure, air filters, and fluid levels every 90 days.',
    type: 'repeating',
    category: 'personal',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days remaining
    repeatInterval: 'quarterly',
    completedCycles: 3,
    color: '#6366f1', // indigo
    icon: 'car',
    priority: 'medium',
    pinned: true,
    archived: false,
    syncToGoogleCalendar: true,
    resetHistory: [],
    checklist: [
      { id: 'cl-201', title: 'Check engine oil level', completed: false },
      { id: 'cl-202', title: 'Inspect tire tread & PSI', completed: false },
      { id: 'cl-203', title: 'Replace cabin air filter', completed: false }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ms-3',
    title: 'SmartTrack - Plan2Milestone Launch',
    description: 'Major software release with Google Calendar & Google Drive sync capabilities.',
    type: 'event_countdown',
    category: 'project',
    startDate: new Date().toISOString(),
    targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
    color: '#06b6d4', // cyan
    icon: 'rocket',
    priority: 'high',
    pinned: true,
    archived: false,
    syncToGoogleCalendar: true,
    resetHistory: [],
    checklist: [
      { id: 'cl-301', title: 'Implement Days Since counter logic', completed: true },
      { id: 'cl-302', title: 'Integrate Google Drive .AppData folder sync', completed: true },
      { id: 'cl-303', title: 'Add Apple Calendar .ics export', completed: true },
      { id: 'cl-304', title: 'Final UI polish & responsive design testing', completed: false }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ms-4',
    title: 'Days Since Last Medical Checkup',
    description: 'General annual health review and comprehensive blood test.',
    type: 'days_since',
    category: 'health',
    startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 180 days ago
    color: '#f59e0b', // amber
    icon: 'heart-pulse',
    priority: 'medium',
    pinned: false,
    archived: false,
    syncToGoogleCalendar: false,
    resetHistory: [],
    checklist: [
      { id: 'cl-401', title: 'Schedule next appointment in 6 months', completed: true }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ms-5',
    title: 'Monthly Savings & Investment Milestone',
    description: 'Transfer fixed allocation into high-yield savings and portfolio every 30 days.',
    type: 'repeating',
    category: 'finance',
    startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    targetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    repeatInterval: 'monthly',
    completedCycles: 8,
    color: '#10b981', // emerald
    icon: 'wallet',
    priority: 'high',
    pinned: false,
    archived: false,
    syncToGoogleCalendar: true,
    resetHistory: [],
    checklist: [
      { id: 'cl-501', title: 'Review budget statement', completed: true },
      { id: 'cl-502', title: 'Execute automatic investment transfer', completed: false }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ms-6',
    title: 'Japan Autumn Discovery Trip',
    description: '10-day trip across Kyoto, Tokyo, and Hakone during foliage peak season.',
    type: 'event_countdown',
    category: 'travel',
    startDate: new Date().toISOString(),
    targetDate: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000).toISOString(),
    color: '#ec4899', // pink/rose
    icon: 'plane',
    priority: 'medium',
    pinned: false,
    archived: false,
    syncToGoogleCalendar: true,
    resetHistory: [],
    checklist: [
      { id: 'cl-601', title: 'Book flight tickets and JR Pass', completed: true },
      { id: 'cl-602', title: 'Reserve ryokan in Hakone', completed: true },
      { id: 'cl-603', title: 'Pack luggage & travel insurance', completed: false }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
