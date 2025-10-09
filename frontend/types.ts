// types.ts
export interface BookData {
  bookId: string;
  readingId: string;
  totalPages: number;
  currentPage: number;
  endPage: number;
  hasMore: boolean;
  progress: number;
}

export interface Voice {
  id: string;
  name: string;
  type: string;
}

export interface QuotaInfo {
  characterCount: number;
  characterLimit: number;
  remainingCharacters: number;
  tier: string;
}

export interface ErrorInfo {
  type: 'error' | 'warning' | 'info';
  message: string;
  details?: string;
  remainingCredits?: number;
  requiredCredits?: number;
}
