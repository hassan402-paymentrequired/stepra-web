import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui";
import { setHasSeenOnboarding } from "@/lib/onboarding-storage";
import { GraduationCap, BookOpen, BarChart3, ChevronRight } from "lucide-react";

const slides = [
  {
    title: "Welcome to Stepra",
    description:
      "Your comprehensive platform for JAMB and UNILAG exam preparation. Practice with thousands of questions and track your progress.",
    icon: GraduationCap,
  },
  {
    title: "Practice Anytime",
    description:
      "Access practice exams and past questions from any device. Study at your own pace with detailed explanations for every answer.",
    icon: BookOpen,
  },
  {
    title: "Track Your Progress",
    description:
      "Monitor your performance with detailed analytics. Identify your strengths and areas for improvement.",
    icon: BarChart3,
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  const finish = () => {
    setHasSeenOnboarding();
    navigate("/authenticate/login", { replace: true });
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      finish();
    }
  };

  const slide = slides[currentIndex];
  const Icon = slide.icon;
  const isLast = currentIndex === slides.length - 1;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex justify-end p-4">
        {!isLast && (
          <button
            type="button"
            onClick={finish}
            className="text-sm font-medium text-primary hover:underline"
          >
            Skip
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 text-center max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-8">
          <Icon className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-4">{slide.title}</h1>
        <p className="text-muted-foreground leading-relaxed">{slide.description}</p>

        <div className="flex gap-2 mt-10">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex ? "w-8 bg-primary" : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="p-6 max-w-lg mx-auto w-full">
        <Button onClick={handleNext} className="w-full" size="lg">
          {isLast ? "Get Started" : "Next"}
          {!isLast && <ChevronRight className="h-4 w-4 ml-1" />}
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
