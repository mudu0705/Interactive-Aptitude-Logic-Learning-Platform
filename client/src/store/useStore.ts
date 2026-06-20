import { create } from 'zustand';
import { UserProfile } from 'shared';

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  theme: 'dark' | 'light';
  setAuth: (user: UserProfile, accessToken: string, refreshToken?: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateXPAndCoins: (xpEarned: number, coinsEarned: number, newLevel?: number) => void;
  toggleTheme: () => void;
  logout: () => void;
}

export const useStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  isAuthenticated: !!localStorage.getItem('accessToken'),
  theme: 'dark',

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    set({ user, accessToken, isAuthenticated: true });
  },

  updateProfile: (updates) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...updates };
      return { user: updatedUser };
    });
  },

  updateXPAndCoins: (xpEarned, coinsEarned, newLevel) => {
    set((state) => {
      if (!state.user) return state;
      const currentLevel = newLevel || state.user.level;
      const updatedUser = {
        ...state.user,
        xp: state.user.xp + xpEarned,
        coins: state.user.coins + coinsEarned,
        level: currentLevel,
      };
      return { user: updatedUser };
    });
  },

  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { theme: nextTheme };
    });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
}));
