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

interface BookshelfItem {
  id: number;
  topic: string;
  summary: string;
  storybook: StoryPage[];
}

interface BookshelfState {
  bookshelf: BookshelfItem[];
  addBook: (book: Omit<BookshelfItem, 'id'>) => void;
  removeBook: (id: number) => void;
  clearBookshelf: () => void;
  getBook: (id: number) => BookshelfItem | undefined;
  updateBookImages: (id: number, storybook: StoryPage[]) => void;
}

// Custom storage with error handling and SSR safety
const createSafeStorage = () => ({
  getItem: (name: string) => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return null;
      }
      return localStorage.getItem(name);
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }
      localStorage.setItem(name, value);
    } catch (error) {
      console.warn('Failed to write to localStorage (quota exceeded):', error);
      // Optionally clear old data or show user notification
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded. Consider clearing old stories.');
      }
    }
  },
  removeItem: (name: string) => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }
      localStorage.removeItem(name);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  },
});

export const useBookshelfStore = create<BookshelfState>()(
  persist(
    (set, get) => ({
      bookshelf: [],
      
      addBook: (book) => {
        const newBook: BookshelfItem = {
          ...book,
          id: Date.now(), // Generate unique ID
          // Keep original storybook data for current session
          storybook: book.storybook.map(page => ({
            ...page,
            // Images will be stripped during serialization, not here
          }))
        };
        set((state) => {
          const updatedBookshelf = [...state.bookshelf, newBook];
          // Limit to 10 books to prevent storage issues
          const limitedBookshelf = updatedBookshelf.slice(-10);
          return {
            bookshelf: limitedBookshelf,
          };
        });
      },
      
      removeBook: (id) => {
        set((state) => ({
          bookshelf: state.bookshelf.filter((book) => book.id !== id),
        }));
      },
      
      clearBookshelf: () => {
        set({ bookshelf: [] });
        // Also clear localStorage to prevent quota issues
        try {
          // Check if we're in a browser environment
          if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            localStorage.removeItem('bookshelf-storage');
          }
        } catch (error) {
          console.warn('Failed to clear localStorage:', error);
        }
      },
      
      getBook: (id) => {
        return get().bookshelf.find((book) => book.id === id);
      },
      
      updateBookImages: (id, updatedStorybook) => {
        set((state) => ({
          bookshelf: state.bookshelf.map((book) =>
            book.id === id
              ? { ...book, storybook: updatedStorybook }
              : book
          ),
        }));
      },
    }),
    {
      name: 'bookshelf-storage', // name of the item in localStorage
      storage: createJSONStorage(() => createSafeStorage()), // use safe localStorage
      partialize: (state) => ({
        bookshelf: state.bookshelf.map(book => ({
          ...book,
          // Remove image data to prevent storage quota issues
          storybook: book.storybook.map(page => ({
            id: page.id,
            title: page.title,
            content: page.content,
            // Don't persist imageUrl and imageLoading
          }))
        }))
      }),
    }
  )
);

// Export types for use in components
export type { StoryPage, BookshelfItem };

// Utility function to clear corrupted storage
export const clearCorruptedStorage = () => {
  try {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('bookshelf-storage');
      console.log('Cleared potentially corrupted bookshelf storage');
    }
  } catch (error) {
    console.warn('Failed to clear storage:', error);
  }
};
