export type EmptyStateKind =
  | 'load-error'
  | 'no-categories'
  | 'no-subjects'
  | 'no-departments'
  | 'no-department-subjects'
  | 'no-past-years'
  | 'no-questions';

export interface EmptyStateContext {
  examTypeName?: string;
  departmentName?: string;
  subjectName?: string;
  mode?: 'practice' | 'past_question';
}

export interface EmptyStateContent {
  title: string;
  description: string;
  hint?: string;
}

export function getEmptyStateContent(
  kind: EmptyStateKind,
  context: EmptyStateContext = {},
  errorMessage?: string
): EmptyStateContent {
  const exam = context.examTypeName || 'this exam type';
  const subject = context.subjectName || 'this subject';
  const department = context.departmentName || 'this department';
  const modeLabel =
    context.mode === 'past_question' ? 'past question' : 'practice';

  switch (kind) {
    case 'load-error':
      return {
        title: 'Could not load content',
        description:
          errorMessage ||
          'Something went wrong while loading. Check your connection and try again.',
        hint: 'If this keeps happening, try signing out and back in.',
      };

    case 'no-categories':
      return {
        title: 'No practice areas yet',
        description:
          'Practice categories are not available right now. They may still be being set up.',
        hint: 'If you expected to see JAMB, DLI, or other options here, check back later or contact support.',
      };

    case 'no-subjects':
      return {
        title: `No ${modeLabel} subjects for ${exam}`,
        description: `There are no subjects linked to ${exam} for ${modeLabel} yet. New content is added from time to time.`,
        hint: 'An active subscription is required to practice questions. Subscribe to get started once subjects are available.',
      };

    case 'no-departments':
      return {
        title: `No departments for ${exam}`,
        description:
          'Departmental practice needs departments to be configured. None are available for this exam type yet.',
        hint: 'Try another practice area from the dashboard, or check back later.',
      };

    case 'no-department-subjects':
      return {
        title: 'No courses in this department',
        description: `No subjects are linked to ${department} for ${exam} yet.`,
        hint: 'Pick a different department or return to the dashboard to try another practice area.',
      };

    case 'no-past-years':
      return {
        title: 'No past papers found',
        description: `No exam years match your selected subject(s) for ${exam}.`,
        hint: 'Try a different subject, or use Practice mode if past papers are not available yet.',
      };

    case 'no-questions':
      return {
        title: 'No questions available',
        description: `There are no questions for ${subject} under ${exam} right now.`,
        hint: 'Try another subject or course. If you recently subscribed, subscription unlocks more questions per session — it does not create new subjects.',
      };

    default:
      return {
        title: 'Nothing here yet',
        description: 'There is no content to show for this selection.',
      };
  }
}

/** Classify API list responses for empty vs error UI. */
export function classifyListLoad(params: {
  success?: boolean;
  count: number;
  caughtError?: string;
}): 'ready' | 'empty' | 'error' {
  if (params.caughtError) return 'error';
  if (params.success === false) return 'error';
  if (params.count === 0) return 'empty';
  return 'ready';
}
