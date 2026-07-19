export interface InvexaClientConfig {
  baseUrl?: string;
  apiKey: string;
  timeout?: number;
}

export class InvexaApiError extends Error {
  status: number;
  statusText: string;
  details?: any;

  constructor(status: number, statusText: string, details?: any) {
    super(`Invexa AI Error [${status}]: ${statusText}`);
    this.name = 'InvexaApiError';
    this.status = status;
    this.statusText = statusText;
    this.details = details;
  }
}

// Global types for Invexa AI Core Engines
export interface DocumentJobResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  extractedData?: Record<string, any>;
}

export interface FraudAnalysisResponse {
  riskScore: number; // 0 to 100
  flags: string[];
  verdict: 'low_risk' | 'medium_risk' | 'high_risk';
}

export interface InsightResponse {
  summary: string;
  keyTakeaways: string[];
  anomaliesDetected: boolean;
}

export class InvexaClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(config: InvexaClientConfig) {
    this.baseUrl = config.baseUrl?.replace(/\/$/, '') || 'https://api.invexa.ai/v1';
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000; // Default 30s timeout for AI model inference
  }

  /**
   * Internal core fetch request wrapper
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), this.timeout);

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Invexa-Client-Sdk': 'ts-v1',
        ...options.headers,
      },
      signal: controller.signal,
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timerId);

      const isJson = response.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await response.json() : null;

      if (!response.ok) {
        throw new InvexaApiError(response.status, response.statusText, data);
      }

      return data as T;
    } catch (error: any) {
      clearTimeout(timerId);
      if (error.name === 'AbortError') {
        throw new Error(`Invexa AI request timed out after ${this.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * 1. Document Understanding Engine
   * Upload a file (PDF, Image) for schema parsing and financial data extraction
   */
  async uploadDocument(file: File | Blob, options?: { documentType?: string }): Promise<DocumentJobResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.documentType) formData.append('type', options.documentType);

    // Multi-part form data handles headers internally, delete standard JSON header
    return this.request<DocumentJobResponse>('/documents/async-upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Fetch auto-assigns Content-Type with boundary markers for FormData
        'Content-Type': undefined as any, 
      },
    });
  }

  async checkDocumentStatus(jobId: string): Promise<DocumentJobResponse> {
    return this.request<DocumentJobResponse>(`/documents/jobs/${jobId}`, { method: 'GET' });
  }

  /**
   * 2. Fraud & Compliance Evaluation
   * Analyze financial data, transactions, or parsed summaries for fraud signals
   */
  async analyzeFraudRisk(payload: { transactionData: any; entityId?: string }): Promise<FraudAnalysisResponse> {
    return this.request<FraudAnalysisResponse>('/fraud/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * 3. Financial Insight Generation
   * Generates AI synthesized notes or insights on complex raw financial data sets
   */
  async generateInsights(payload: { contextData: any; focusAreas?: string[] }): Promise<InsightResponse> {
    return this.request<InsightResponse>('/insights/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
  }
