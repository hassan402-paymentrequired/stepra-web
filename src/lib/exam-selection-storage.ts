import type { PublicUuid } from '@/types/exam';

export interface StoredExamSelection {
  uuid: PublicUuid;
  slug: string;
  name: string;
  flow_type: 'standard' | 'departmental';
}

const STORAGE_KEY = 'exam_selection';

export const storeExamSelection = (selection: StoredExamSelection) => {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
};

export const getStoredExamSelection = (): StoredExamSelection | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredExamSelection & { id?: number };
    if (!parsed.uuid && parsed.id) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const getStoredExamCategoryUuid = (): PublicUuid | null => {
  return getStoredExamSelection()?.uuid ?? null;
};

export const clearStoredExamSelection = () => {
  sessionStorage.removeItem(STORAGE_KEY);
};
