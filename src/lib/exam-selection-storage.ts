export interface StoredExamSelection {
  id: number;
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
    return JSON.parse(raw) as StoredExamSelection;
  } catch {
    return null;
  }
};

export const getStoredExamType = (): string | null => {
  return getStoredExamSelection()?.slug ?? null;
};

export const clearStoredExamSelection = () => {
  sessionStorage.removeItem(STORAGE_KEY);
};
