import { api } from './client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: string[];
}

export interface GenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export const aiApi = {
  // Conversational & Core Utilities
  async sendMessage(history: ChatMessage[], options?: GenerationOptions): Promise<{ content: string; memoryState?: string }> {
    const { data } = await api.post('/ai/chat', { history, options });
    return data;
  },

  async processVoice(audioBlob: Blob): Promise<{ text: string }> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice.wav');
    const { data } = await api.post('/ai/voice-to-text', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  async generateSpeech(text: string, voiceId?: string): Promise<Blob> {
    const { data } = await api.post('/ai/text-to-speech', { text, voiceId }, { responseType: 'blob' });
    return data;
  },

  // Multimodal & Visual Modules
  async generateImage(prompt: string, options?: Record<string, any>): Promise<{ url: string }> {
    const { data } = await api.post('/ai/image-generate', { prompt, options });
    return data;
  },

  async editImage(imageFile: File, maskFile: File, prompt: string): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('mask', maskFile);
    formData.append('prompt', prompt);
    const { data } = await api.post('/ai/image-edit', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data;
  },

  async analyzeVision(imageFile: File, prompt: string): Promise<{ text: string }> {
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('prompt', prompt);
    const { data } = await api.post('/ai/vision-analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data;
  },

  async processOcr(file: File): Promise<{ structuredText: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/ai/ocr', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data;
  },

  // Advanced Synthesizers
  async generateVideo(prompt: string, options?: Record<string, any>): Promise<{ videoUrl: string }> {
    const { data } = await api.post('/ai/video-generate', { prompt, options });
    return data;
  },

  async generateMusic(prompt: string, duration?: number): Promise<{ audioUrl: string }> {
    const { data } = await api.post('/ai/music-generate', { prompt, duration });
    return data;
  },

  // Document Processing Units
  async uploadAndAnalyzeDocument(file: File, operation: 'chat' | 'summarize' | 'analyze'): Promise<{ id: string; results: string }> {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('operation', operation);
    const { data } = await api.post('/ai/document-process', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data;
  },

  // Task-Specific Workspaces
  async executeTask(module: string, payload: Record<string, any>): Promise<{ output: string }> {
    const { data } = await api.post(`/ai/task/${module}`, payload);
    return data;
  }
};
