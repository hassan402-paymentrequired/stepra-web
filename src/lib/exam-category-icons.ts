import { BookOpen, GraduationCap, School, type LucideIcon } from 'lucide-react';
import type { ExamCategory } from '@/types/exam';

const SLUG_ICONS: Record<string, LucideIcon> = {
  jamb: GraduationCap,
  'unilag-dli': BookOpen,
  'unilag-post-utme': School,
};

export function getExamCategoryIcon(
  category: Pick<ExamCategory, 'slug' | 'flow_type'>
): LucideIcon {
  const slugIcon = SLUG_ICONS[category.slug.toLowerCase()];
  if (slugIcon) {
    return slugIcon;
  }

  return category.flow_type === 'departmental' ? BookOpen : GraduationCap;
}
