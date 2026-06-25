import { useNavigate } from "react-router";
import AppLayout from "@/components/layouts/app-layout";
import { FileText, BookOpen, ArrowRight } from "lucide-react";

import { useExamSelection } from "@/contexts/ExamSelectionContext";

const JAMBModeSelection = () => {
  const navigate = useNavigate();
  const { selection, setQuestionMode } = useExamSelection();
  const examLabel = selection.examTypeName || "JAMB";

  const handleSelectMode = (mode: "past_question" | "practice") => {
    setQuestionMode(mode);
    if (mode === "past_question") {
      navigate("/jamb/past-questions");
    } else {
      navigate("/jamb/practice-questions");
    }
  };

  return (
    <AppLayout>
      <div className="w-full max-w-7xl mx-auto space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Select Question Mode</h1>
          <p className="text-muted-foreground text-sm">
            Choose how you want to practice {examLabel} questions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Past Questions Card */}
          <div
            onClick={() => handleSelectMode("past_question")}
            className="group relative overflow-hidden rounded-lg bg-card border border-border p-4 cursor-pointer transition-all duration-300 hover:shadow-md hover:border-primary"
          >
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <FileText className="h-5 w-5 text-primary-foreground" />
                </div>
                <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                Past Questions
              </h2>
              <p className="text-muted-foreground text-xs leading-relaxed mb-3">
                Practice with previous JAMB exam questions
              </p>
              <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                <span>Start practicing</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Practice Questions Card */}
          <div
            onClick={() => handleSelectMode("practice")}
            className="group relative overflow-hidden rounded-lg bg-card border border-border p-4 cursor-pointer transition-all duration-300 hover:shadow-md hover:border-primary"
          >
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <BookOpen className="h-5 w-5 text-primary-foreground" />
                </div>
                <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                Practice Questions
              </h2>
              <p className="text-muted-foreground text-xs leading-relaxed mb-3">
                Practice with random questions (max 4 sessions per subject)
              </p>
              <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                <span>Start practicing</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default JAMBModeSelection;
