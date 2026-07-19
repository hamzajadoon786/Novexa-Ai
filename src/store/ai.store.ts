import { create } from 'zustand';
import { aiApi, ChatMessage, GenerationOptions } from '../api/ai';

interface AiState {
  conversations: Record<string, ChatMessage[]>;
  currentChatId: string | null;
  activeModel: string;
  isProcessing: boolean;
  aiMemoryState: string;
  setChatId: (id: string) => void;
  setModel: (model: string) => void;
  createNewChat: () => string;
  sendChatMessage: (content: string, options?: GenerationOptions) => Promise<void>;
  clearConversation: (id: string) => void;
}

export const useAiStore = create<AiState>((set, get) => ({
  conversations: {},
  currentChatId: null,
  activeModel: 'novexa-ultra-v2',
  isProcessing: false,
  aiMemoryState: '',

  setChatId: (id) => set({ currentChatId: id }),
  setModel: (model) => set({ activeModel: model }),

  createNewChat() {
    const id = `chat_${Date.now()}`;
    set((state) => ({
      currentChatId: id,
      conversations: { ...state.conversations, [id]: [] }
    }));
    return id;
  },

  async sendChatMessage(content, options) {
    const { currentChatId, conversations, activeModel } = get();
    let chatId = currentChatId;
    if (!chatId) {
      chatId = get().createNewChat();
    }

    const newUserMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    const currentHistory = [...(conversations[chatId] || []), newUserMessage];
    set((state) => ({
      isProcessing: true,
      conversations: { ...state.conversations, [chatId!]: currentHistory }
    }));

    try {
      const response = await aiApi.sendMessage(currentHistory, { model: activeModel, ...options });
      const newAssistantMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString()
      };
      set((state) => ({
        isProcessing: false,
        aiMemoryState: response.memoryState || state.aiMemoryState,
        conversations: {
          ...state.conversations,
          [chatId!]: [...currentHistory, newAssistantMessage]
        }
      }));
    } catch (err) {
      set({ isProcessing: false });
      throw err;
    }
  },

  clearConversation(id) {
    set((state) => {
      const nextConversations = { ...state.conversations };
      delete nextConversations[id];
      return {
        conversations: nextConversations,
        currentChatId: state.currentChatId === id ? null : state.currentChatId
      };
    });
  }
}));
