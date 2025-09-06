import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Types
interface StoryPage {
  id: number;
  title: string;
  content: string;
  imageUrl?: string | null;
  imageLoading?: boolean;
}

interface SessionState {
  currentStorybook: StoryPage[];
  currentTopic: string;
  currentSummary: string;
  currentStep: number;
  setCurrentStorybook: (storybook: StoryPage[]) => void;
  setCurrentTopic: (topic: string) => void;
  setCurrentSummary: (summary: string) => void;
  setCurrentStep: (step: number) => void;
  updatePageImage: (pageId: number, imageUrl: string) => void;
  clearSession: () => void;
}

// Custom session storage with error handling and SSR safety
const createSafeSessionStorage = () => ({
  getItem: (name: string) => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
        return null;
      }
      return sessionStorage.getItem(name);
    } catch (error) {
      console.warn('Failed to read from sessionStorage:', error);
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
        return;
      }
      sessionStorage.setItem(name, value);
    } catch (error) {
      console.warn('Failed to write to sessionStorage:', error);
    }
  },
  removeItem: (name: string) => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
        return;
      }
      sessionStorage.removeItem(name);
    } catch (error) {
      console.warn('Failed to remove from sessionStorage:', error);
    }
  },
});

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      currentStorybook: [],
      currentTopic: '',
      currentSummary: '',
      currentStep: 1,
      
      setCurrentStorybook: (storybook) => {
        set({ currentStorybook: storybook });
      },
      
      setCurrentTopic: (topic) => {
        set({ currentTopic: topic });
      },
      
      setCurrentSummary: (summary) => {
        set({ currentSummary: summary });
      },
      
      setCurrentStep: (step) => {
        set({ currentStep: step });
      },
      
      updatePageImage: (pageId, imageUrl) => {
        set((state) => ({
          currentStorybook: state.currentStorybook.map((page) =>
            page.id === pageId
              ? { ...page, imageUrl, imageLoading: false }
              : page
          ),
        }));
      },
      
      clearSession: () => {
        set({
          currentStorybook: [],
          currentTopic: '',
          currentSummary: '',
          currentStep: 1,
        });
      },
    }),
    {
      name: 'storybook-session-storage',
      storage: createJSONStorage(() => createSafeSessionStorage()), // Use safe sessionStorage
    }
  )
);

export type { StoryPage as SessionStoryPage };
