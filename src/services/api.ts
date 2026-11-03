import axios from 'axios';

export interface SiteContentData { values: Record<string, string>; revision: number; updatedAt?: string | null }
export const fetchSiteContent = async (): Promise<SiteContentData> => (await api.get('/site-content')).data;
export const saveSiteContent = async (data: SiteContentData): Promise<SiteContentData> => (await api.put('/admin/site-content', data)).data;

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 || error.response?.data?.code === 'ACCOUNT_SUSPENDED') {
    if (!['/auth/login', '/auth/register'].includes(error.config?.url)) window.dispatchEvent(new Event('sellipi:unauthorized'));
  }
  return Promise.reject(error);
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
export type UserRole = 'user' | 'academic' | 'admin';
export interface SessionUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: 'active' | 'suspended';
  institution: string;
  createdAt?: string;
}
export interface AuthResponse { token: string; user: SessionUser; }

export const loginAdmin = async (email: string, password: string): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  return data;
};

export const registerAdmin = async (
  username: string,
  email: string,
  password: string,
  role: 'user' | 'academic' = 'user',
  institution = ''
): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/register', { username, email, password, role, institution });
  return data;
};

export async function fetchCurrentUser(): Promise<SessionUser> {
  const { data } = await api.get<SessionUser>('/auth/me');
  return data;
}

export interface PageInfo { total: number; page: number; limit: number; pages: number; }
export type NoteStatus = 'pending' | 'approved' | 'rejected';
export interface PublicNote {
  _id: string;
  text: string;
  authorName: string;
  authorInstitution: string;
  createdAt: string;
  reviewedAt: string | null;
}
export interface ReviewNote extends PublicNote {
  status: NoteStatus;
  inscription: { _id: string; title: string } | null;
  author?: { _id: string; username: string; email: string; institution?: string; role?: UserRole; status?: string } | null;
  reviewedBy?: { _id: string; username: string } | null;
  moderationReason: string;
}
export interface NotesResponse<T> { notes: T[]; pagination: PageInfo; }
export async function fetchPublicNotes(id: string, page = 1): Promise<NotesResponse<PublicNote>> {
  const { data } = await api.get<NotesResponse<PublicNote>>(`/inscriptions/${id}/notes`, { params: { page, limit: 20 } }); return data;
}
export async function submitAcademicNote(id: string, text: string): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(`/inscriptions/${id}/notes`, { text }); return data;
}
export async function fetchMyNotes(page = 1): Promise<NotesResponse<ReviewNote>> {
  const { data } = await api.get<NotesResponse<ReviewNote>>('/notes/mine', { params: { page, limit: 20 } }); return data;
}
export interface AdminStats { users: number; academics: number; administrators: number; normalUsers: number; suspended: number; inscriptions: number; pending: number; approved: number; rejected: number; }
export async function fetchAdminStats(): Promise<AdminStats> {
  const { data } = await api.get<AdminStats>('/admin/stats'); return data;
}
export async function fetchUsers(params: { page: number; search: string; role: string; status: string }): Promise<{ users: SessionUser[]; pagination: PageInfo }> {
  const { data } = await api.get<{ users: SessionUser[]; pagination: PageInfo }>('/admin/users', { params: { ...params, limit: 20 } }); return data;
}
export async function updateUserAccess(id: string, changes: { role?: 'user' | 'academic'; status?: 'active' | 'suspended'; username?: string; email?: string; institution?: string }): Promise<{ user: SessionUser }> {
  const { data } = await api.patch<{ user: SessionUser }>(`/admin/users/${id}`, changes); return data;
}
export async function fetchReviewNotes(status: NoteStatus, page = 1): Promise<NotesResponse<ReviewNote>> {
  const { data } = await api.get<NotesResponse<ReviewNote>>('/admin/notes', { params: { status, page, limit: 20 } }); return data;
}
export async function reviewAcademicNote(id: string, status: 'approved' | 'rejected', expectedStatus: NoteStatus, moderationReason: string): Promise<{ message: string }> {
  const { data } = await api.patch<{ message: string }>(`/admin/notes/${id}`, { status, expectedStatus, moderationReason }); return data;
}
