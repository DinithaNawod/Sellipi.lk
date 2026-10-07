import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---- Types ----
export interface InscriptionLocation {
  name: string;
  district: string;
  province: string;
  coordinates: { lat: number | null; lng: number | null };
}

export interface Inscription {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageProcessedUrl: string;
  location: InscriptionLocation;
  historicalPeriod: string;
  scriptType: string;
  contentRaw: string;
  contentTranslated: string;
  createdAt: string;
  updatedAt: string;
}

export type InscriptionFormData = Omit<Inscription, '_id' | 'createdAt' | 'updatedAt' | 'imageProcessedUrl'>;

export interface FilterParams {
  search?: string;
  location?: string;
  historicalPeriod?: string;
  scriptType?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse {
  inscriptions: Inscription[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface FilterOptions {
  locations: string[];
  periods: string[];
  scripts: string[];
}

export interface OcrResult {
  text: string;
  confidence: number;
}

export interface UploadResult {
  imageUrl: string;
  imageProcessedUrl: string;
  message: string;
}

export interface ImageTranslateResult {
  imageUrl: string;
  imageProcessedUrl: string;
  text: string;
  confidence: number;
  translation: string;
  translationError: string;
}

// Extracts the human-readable message the API returns in `{ message }`,
// falling back to the axios/network error text.
export const getApiErrorMessage = (err: unknown, fallback = 'Something went wrong'): string => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message ?? err.message ?? fallback;
  }
  return err instanceof Error ? err.message : fallback;
};

// ---- API Calls ----
export const fetchInscriptions = async (params: FilterParams = {}): Promise<PaginatedResponse> => {
  const { data } = await api.get<PaginatedResponse>('/inscriptions', { params });
  return data;
};

export const fetchInscriptionById = async (id: string): Promise<Inscription> => {
  const { data } = await api.get<Inscription>(`/inscriptions/${id}`);
  return data;
};

export const createInscription = async (payload: InscriptionFormData): Promise<Inscription> => {
  const { data } = await api.post<Inscription>('/inscriptions', payload);
  return data;
};

export const updateInscription = async (id: string, payload: InscriptionFormData): Promise<Inscription> => {
  const { data } = await api.put<Inscription>(`/inscriptions/${id}`, payload);
  return data;
};

export const deleteInscription = async (id: string): Promise<{ message: string; id: string }> => {
  const { data } = await api.delete(`/inscriptions/${id}`);
  return data;
};

export const fetchFilterOptions = async (): Promise<FilterOptions> => {
  const { data } = await api.get<FilterOptions>('/inscriptions/filters');
  return data;
};

export const uploadInscriptionImage = async (id: string, file: File): Promise<UploadResult> => {
  const formData = new FormData();
  formData.append('image', file);
  const { data } = await api.post<UploadResult>(`/inscriptions/${id}/upload-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const runOcr = async (id: string): Promise<OcrResult> => {
  const { data } = await api.post<OcrResult>(`/inscriptions/${id}/ocr`);
  return data;
};

export const translateInscription = async (id: string, text?: string): Promise<{ translation: string }> => {
  const { data } = await api.post<{ translation: string }>(`/inscriptions/${id}/translate`, text ? { text } : {});
  return data;
};

// Public one-shot pipeline: upload an image and get back OCR text + translation.
// No auth, no saved inscription required.
export const translateImageFile = async (
  file: File,
  scriptType?: string
): Promise<ImageTranslateResult> => {
  const formData = new FormData();
  formData.append('image', file);
  if (scriptType) formData.append('scriptType', scriptType);
  const { data } = await api.post<ImageTranslateResult>('/tools/translate-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

// ---- Auth ----
export interface AuthResponse {
  token: string;
  username: string;
}

export const loginAdmin = async (email: string, password: string): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  return data;
};

export const registerAdmin = async (
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/register', { username, email, password });
  return data;
};
