export type ExamFlowSegment =
  | 'mode-selection'
  | 'past-questions'
  | 'practice-questions';

export function normalizeExamSlug(slug: string): string {
  return slug.toUpperCase();
}

export function isJambExamSlug(slug: string | null | undefined): boolean {
  return slug?.toLowerCase() === 'jamb';
}

export function examPath(slug: string, segment: ExamFlowSegment): string {
  return `/exam/${slug.toLowerCase()}/${segment}`;
}
