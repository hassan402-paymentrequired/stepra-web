import { ChevronRight, BookOpen, GraduationCap, School } from "lucide-react";
import type { ExamCategory } from "@/apis/exam-categories";

interface QuickActionCardsProps {
  categories: ExamCategory[];
  onCategoryPress: (category: ExamCategory) => void;
}

const iconMap: Record<string, typeof BookOpen> = {
  school: GraduationCap,
  "menu-book": BookOpen,
};

const iconThemes = [
  { bg: "bg-violet-100", color: "text-violet-700" },
  { bg: "bg-orange-100", color: "text-orange-700" },
  { bg: "bg-blue-100", color: "text-blue-700" },
  { bg: "bg-green-100", color: "text-green-700" },
];

export function QuickActionCards({ categories, onCategoryPress }: QuickActionCardsProps) {
  if (!categories.length) return null;

  return (
    <div>
      <h3 className="text-base font-bold mb-3">Practice Subjects</h3>
      <div className="rounded-lg border bg-card overflow-hidden divide-y">
        {categories.map((category, index) => {
          const theme = iconThemes[index % iconThemes.length];
          const Icon = iconMap[category.icon_name] ?? School;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategoryPress(category)}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/50 transition-colors"
            >
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${theme.bg}`}>
                <Icon className={`h-5 w-5 ${theme.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{category.name}</p>
                <p className="text-xs text-muted-foreground truncate">{category.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
