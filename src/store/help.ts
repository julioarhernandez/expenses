import { create } from 'zustand'

export type HelpTopic = 'voice' | 'expenses' | 'dashboard' | 'categories' | 'recurring'

interface HelpStore {
  isOpen: boolean
  activeTopic: HelpTopic
  openHelp: (topic?: HelpTopic) => void
  closeHelp: () => void
  setTopic: (topic: HelpTopic) => void
}

export const useHelpStore = create<HelpStore>((set) => ({
  isOpen: false,
  activeTopic: 'voice',
  openHelp: (topic = 'voice') => set({ isOpen: true, activeTopic: topic }),
  closeHelp: () => set({ isOpen: false }),
  setTopic: (activeTopic) => set({ activeTopic }),
}))
