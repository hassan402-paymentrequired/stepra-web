import { useEffect, useState } from "react";
import { useUser } from "@/lib/auth";
import { Flame } from "lucide-react";

interface StreakCarouselProps {
  currentStreak: number;
}

export function StreakCarousel({ currentStreak }: StreakCarouselProps) {
  const { data: user } = useUser();
  const [greeting, setGreeting] = useState("Good day");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const firstName = user?.name?.split(" ")[0] || "Student";

  return (
    <div className="flex items-end justify-between px-1 py-2">
      <div>
        <p className="text-xs text-muted-foreground mb-1">{greeting}, {firstName}</p>
        <h2 className="text-xl font-bold text-primary">Ready to level up?</h2>
      </div>
      <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-semibold">
        <span>{currentStreak} Day Streak</span>
        <Flame className="h-4 w-4" />
      </div>
    </div>
  );
}
