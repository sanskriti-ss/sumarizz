import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ProjectState, PaperSummary, EnrichmentSnippet, StoryConfig, StorySchema } from '@/types'

interface ProjectStore extends ProjectState {
  // Actions
  setPaper: (paper: PaperSummary) => void
  setEnrichmentSnippets: (snippets: EnrichmentSnippet[]) => void
  toggleSnippetIncluded: (snippetId: string) => void
  setConfig: (config: StoryConfig) => void
  setStory: (story: StorySchema) => void
  setCurrentStep: (step: ProjectState['currentStep']) => void
  resetProject: () => void
}

const initialState: ProjectState = {
  enrichmentSnippets: [],
  currentStep: 'new',
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setPaper: (paper) => set({ paper }),
      
      setEnrichmentSnippets: (snippets) => set({ enrichmentSnippets: snippets }),
      
      toggleSnippetIncluded: (snippetId) => {
        const { enrichmentSnippets } = get()
        set({
          enrichmentSnippets: enrichmentSnippets.map(snippet =>
            snippet.id === snippetId
              ? { ...snippet, included: !snippet.included }
              : snippet
          )
        })
      },
      
      setConfig: (config) => set({ config }),
      
      setStory: (story) => set({ story }),
      
      setCurrentStep: (step) => set({ currentStep: step }),
      
      resetProject: () => set(initialState),
    }),
    {
      name: 'sumarizz-project-storage',
      partialize: (state) => ({
        paper: state.paper,
        enrichmentSnippets: state.enrichmentSnippets,
        config: state.config,
        story: state.story,
        currentStep: state.currentStep,
      }),
    }
  )
)
