import { useEffect, useState } from 'react';
import { getExamCategories } from '@/apis/exam-categories';
import { useExamSelection } from '@/contexts/ExamSelectionContext';
import { normalizeExamSlug } from '@/lib/exam-routes';
import type { ExamFlowType } from '@/types/exam';

type ResolveOptions = {
  slug?: string;
  flowType?: ExamFlowType;
};

/**
 * Ensures exam selection context has a category UUID resolved from slug or flow type.
 * Used on pages that are not under /exam/:slug/* routes (e.g. /dli/practice, /unilag/*).
 */
export function useResolveExamCategory(options: ResolveOptions = {}) {
  const normalizedSlug = options.slug ? normalizeExamSlug(options.slug) : null;
  const { selection, setExamType } = useExamSelection();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const slugMatches =
      normalizedSlug &&
      selection.examTypeSlug?.toUpperCase() === normalizedSlug &&
      !!selection.examCategoryUuid;

    const flowMatches =
      options.flowType &&
      selection.flowType === options.flowType &&
      !!selection.examCategoryUuid;

    if (slugMatches || flowMatches || (!normalizedSlug && !options.flowType && selection.examCategoryUuid)) {
      setReady(true);
      return;
    }

    let cancelled = false;

    getExamCategories().then((response) => {
      if (cancelled || !response.success) {
        setReady(false);
        return;
      }

      let category = normalizedSlug
        ? response.data.find((item) => item.slug.toUpperCase() === normalizedSlug)
        : undefined;

      if (!category && options.flowType) {
        category = response.data.find((item) => item.flow_type === options.flowType);
      }

      if (category) {
        setExamType(category.uuid, category.slug, category.name, category.flow_type);
        setReady(true);
      } else {
        setReady(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    normalizedSlug,
    options.flowType,
    selection.examCategoryUuid,
    selection.examTypeSlug,
    selection.flowType,
    setExamType,
  ]);

  return {
    ready,
    examCategoryUuid: selection.examCategoryUuid,
    examLabel: selection.examTypeName || normalizedSlug || 'Exam',
    examTypeSlug: selection.examTypeSlug,
  };
}
