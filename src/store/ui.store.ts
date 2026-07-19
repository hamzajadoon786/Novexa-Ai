import { create } from 'zustand';

interface NotificationItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface UiState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: NotificationItem[];
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  dismissNotification: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  theme: 'dark',
  sidebarOpen: true,
  notifications: [],
  toggleTheme: () => set((state) => {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    const root = window.document.documentElement;
    if (nextTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    return { theme: nextTheme };
  }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  addNotification: (message, type) => set((state) => {
    const id = Math.random().toString(36).substring(7);
    setTimeout(() => {
      set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
    }, 4000);
    return { notifications: [...state.notifications, { id, message, type }] };
  }),
  dismissNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id)
  }))
}));
