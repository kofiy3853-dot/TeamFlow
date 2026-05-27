import { create } from 'zustand';

interface User {
  id: string;
  fullname: string;
  email: string;
  role: string;
  subscriptionStatus: string;
}

interface AppState {
  user: User | null;
  initialized: boolean;
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  setUser: (user: User | null) => void;
  setInitialized: (v: boolean) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  initialized: false,
  theme: 'dark',
  sidebarOpen: true,
  setUser: (user) => set({ user }),
  setInitialized: (initialized) => set({ initialized }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
