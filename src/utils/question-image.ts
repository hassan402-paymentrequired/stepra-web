/** Laravel API origin without the `/api` suffix (where `/storage/...` is served). */
export function getStorageBaseUrl(): string {
  const apiBase = import.meta.env.VITE_BASE_URL || 'http://localhost:8000/api';
  return apiBase.replace(/\/api\/?$/, '');
}

export interface QuestionImageFields {
  image?: string | null;
  image_url?: string | null;
  image_path?: string | null;
}

export function getQuestionImageUrl(question: QuestionImageFields | null | undefined): string | null {
  if (!question) return null;

  const baseUrl = getStorageBaseUrl();

  if (question.image_url) {
    if (question.image_url.startsWith('http')) {
      return question.image_url;
    }
    return question.image_url.startsWith('/')
      ? `${baseUrl}${question.image_url}`
      : `${baseUrl}/${question.image_url}`;
  }

  if (question.image) {
    if (question.image.startsWith('http')) {
      return question.image;
    }
    return `${baseUrl}/storage/${question.image.replace(/^\//, '')}`;
  }

  if (question.image_path) {
    return `${baseUrl}/storage/${question.image_path.replace(/^\//, '')}`;
  }

  return null;
}
