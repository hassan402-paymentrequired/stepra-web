import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { getExamCategories } from '@/apis/exam-categories';
import { useExamSelection } from '@/contexts/ExamSelectionContext';
import { normalizeExamSlug } from '@/lib/exam-routes';

export function useExamRouteSlug() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { selection, setExamType } = useExamSelection();

  const routeSlug = slug ? normalizeExamSlug(slug) : null;

  useEffect(() => {
    if (!routeSlug) return;
    if (selection.examTypeSlug?.toUpperCase() === routeSlug) return;

    let cancelled = false;

    getExamCategories().then((response) => {
      if (cancelled || !response.success) return;

      const category = response.data.find(
        (item) => item.slug.toUpperCase() === routeSlug
      );

      if (category) {
        setExamType(category.uuid, category.slug, category.name, category.flow_type);
      } else {
        navigate('/dashboard', { replace: true });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [routeSlug, selection.examTypeSlug, setExamType, navigate]);

  return {
    routeSlug,
    examCategoryUuid: selection.examCategoryUuid,
    examTypeSlug: selection.examTypeSlug || routeSlug || 'JAMB',
    examLabel: selection.examTypeName || routeSlug || 'JAMB',
  };
}
