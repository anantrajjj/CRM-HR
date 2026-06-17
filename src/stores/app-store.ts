import { create } from 'zustand'

interface AppState {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  initMobile: () => void
  
  currentUser: {
    id: string
    email: string
    fullName: string
    role: string
  } | null
  setCurrentUser: (user: AppState['currentUser']) => void
  
  activeModule: 'masters' | 'crm' | 'hr' | 'reports' | 'settings'
  setActiveModule: (module: AppState['activeModule']) => void
  
  notifications: Array<{
    id: string
    title: string
    message: string
    type: 'info' | 'warning' | 'error' | 'success'
    read: boolean
  }>
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'read'>) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  initMobile: () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      set({ sidebarOpen: false })
    }
  },
  
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  
  activeModule: 'crm',
  setActiveModule: (module) => set({ activeModule: module }),
  
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        { ...notification, id: crypto.randomUUID(), read: false },
        ...state.notifications,
      ],
    })),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  clearNotifications: () => set({ notifications: [] }),
}))
