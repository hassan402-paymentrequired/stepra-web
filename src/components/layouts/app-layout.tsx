import { Link, useNavigate, useLocation } from "react-router";
import { Fragment, type PropsWithChildren, useMemo, useState, useEffect, useCallback } from "react";
import { useUser, useLogout } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { LogOut, User, CreditCard, Users, Flame } from "lucide-react";
import { getStreaks, type StreakData } from "@/apis/streak";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { shouldShowBottomNav } from "@/lib/mobile-shell";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const getCurrentWeekDays = () => {
  const today = new Date();
  const days: Array<{
    date: Date;
    dayName: string;
  }> = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    days.push({
      date,
      dayName: date.toLocaleDateString("en-US", { weekday: "long" }),
    });
  }

  return days;
};

const AppLayout: React.FC<PropsWithChildren> = ({ children }) => {
  const { data: user } = useUser();
  const logout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const [streakData, setStreakData] = useState<StreakData | null>(null);

  const showBottomNav = shouldShowBottomNav(location.pathname);

  const fetchStreak = useCallback(async () => {
    try {
      const response = await getStreaks();
      if (response.success) {
        setStreakData(response.data);
      }
    } catch (error) {
      console.error("Error fetching streak:", error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchStreak();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleLogout = async () => {
    await logout.mutateAsync(undefined);
    navigate("/authenticate/login");
  };

  const breadcrumbItems = useMemo(() => {
    const pathname = location.pathname;
    const items: Array<{ title: string; href?: string }> = [];

    items.push({ title: "Home", href: "/dashboard" });

    if (pathname === "/dashboard") {
      items.push({ title: "Dashboard" });
      return items;
    }

    if (pathname.startsWith("/exam/") && !pathname.startsWith("/exam/screen") && pathname !== "/exam/results" && pathname !== "/exam/corrections") {
      const examRouteMatch = pathname.match(/^\/exam\/([^/]+)\/(.+)$/);
      if (examRouteMatch) {
        const examSlug = examRouteMatch[1].toUpperCase();
        items.push({ title: examSlug });
        const segment = examRouteMatch[2];
        if (segment === "mode-selection") {
          items.push({ title: "Mode Selection" });
        } else if (segment === "past-questions") {
          items.push({ title: "Past Questions" });
        } else if (segment === "practice-questions") {
          items.push({ title: "Practice Questions" });
        }
        return items;
      }
    }

    if (pathname.startsWith("/jamb/")) {
      items.push({ title: "JAMB" });
      if (pathname === "/jamb/mode-selection") {
        items.push({ title: "Mode Selection" });
      } else if (pathname === "/jamb/past-questions") {
        items.push({ title: "Past Questions" });
      } else if (pathname === "/jamb/practice-questions") {
        items.push({ title: "Practice Questions" });
      }
    } else if (pathname.startsWith("/dli/")) {
      items.push({ title: "DLI" });
      if (pathname === "/dli/practice") {
        items.push({ title: "Practice" });
      }
    } else if (pathname.startsWith("/unilag/")) {
      items.push({ title: "Unilag" });
      if (pathname === "/unilag/departments") {
        items.push({ title: "Departments" });
      } else if (pathname.startsWith("/unilag/departments/") && pathname.includes("/subjects")) {
        items.push({ title: "Departments", href: "/unilag/departments" });
        items.push({ title: "Subjects" });
      }
    } else if (pathname.startsWith("/exam/")) {
      items.push({ title: "Exam" });
      if (pathname === "/exam/results") {
        items.push({ title: "Results" });
      } else if (pathname === "/exam/corrections") {
        items.push({ title: "Corrections" });
      }
    } else if (pathname === "/referral") {
      items.push({ title: "Refer & Earn" });
    } else if (pathname === "/subscription") {
      items.push({ title: "Subscription" });
    } else if (pathname === "/profile") {
      items.push({ title: "Profile" });
    } else if (pathname === "/leaderboard") {
      items.push({ title: "Leaderboard" });
    } else if (pathname.startsWith("/authenticate/")) {
      if (pathname === "/authenticate/login") {
        items.push({ title: "Login" });
      } else if (pathname === "/authenticate/register") {
        items.push({ title: "Register" });
      } else if (pathname === "/authenticate/verify-email") {
        items.push({ title: "Verify Email" });
      } else if (pathname === "/authenticate/forgot-password") {
        items.push({ title: "Forgot Password" });
      }
    }

    return items;
  }, [location.pathname]);

  const streakPill = streakData ? (
    <div className="flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1">
      <Flame
        size={16}
        className={streakData.current_streak > 0 ? "text-amber-500" : "text-muted-foreground"}
      />
      <span className="text-sm font-semibold tabular-nums">{streakData.current_streak}</span>
    </div>
  ) : null;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 pt-[env(safe-area-inset-top)] md:h-16 md:px-6">
        <Logo to="/dashboard" variant="logo" height={24} width={24} />

        {user && (
          <div className="flex items-center gap-1 md:gap-2">
            <div className="md:hidden">{streakPill}</div>

            <ThemeToggle variant="compact" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted md:min-w-0 md:gap-2 md:rounded-md md:px-2"
                  aria-label="Account menu"
                >
                  <User size={18} />
                  <span className="hidden text-sm md:inline">{user.name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/subscription")}>
                  <CreditCard className="h-4 w-4" />
                  Subscribe
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/referral")}>
                  <Users className="h-4 w-4" />
                  Refer &amp; Earn
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </header>

      <main
        className={cn(
          "flex flex-1 flex-col px-4 pt-4 md:px-8 md:pt-6 lg:px-12 xl:px-16",
          showBottomNav ? "pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-6" : "pb-6"
        )}
      >
        <div className="mb-6 hidden items-center justify-between gap-4 md:flex">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbItems.map((item, index) => (
                <Fragment key={`${item.title}-${index}`}>
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {index === breadcrumbItems.length - 1 || !item.href ? (
                      <BreadcrumbPage>{item.title}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={item.href}>{item.title}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          {streakData && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2">
              <Flame
                size={18}
                className={streakData.current_streak > 0 ? "text-amber-500" : "text-muted-foreground"}
              />
              <div className="flex items-center gap-1.5">
                {getCurrentWeekDays().map((day, index) => {
                  const dayStr = day.date.toISOString().split("T")[0];
                  const hasStreak = streakData.all_streaks.includes(dayStr);
                  const isToday = day.date.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-md px-2 py-1 transition-colors",
                        hasStreak && streakData.current_streak > 0 && "bg-amber-500/15",
                        hasStreak && streakData.current_streak === 0 && "bg-muted",
                        isToday && "border-2 border-amber-500",
                        hasStreak && !isToday && "border border-amber-500/30"
                      )}
                      title={`${day.dayName} ${day.date.getDate()}${hasStreak ? " - Practiced" : ""}`}
                    >
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          isToday || hasStreak ? "text-amber-500" : "text-muted-foreground"
                        )}
                      >
                        {day.date.getDate()}
                      </span>
                      {hasStreak && (
                        <div
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            streakData.current_streak > 0 ? "bg-amber-500" : "bg-muted-foreground"
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="ml-2 border-l border-border pl-3">
                <span className="text-sm font-semibold">
                  {streakData.current_streak} day
                  {streakData.current_streak !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}
        </div>

        <div
          className={cn(
            "w-full flex-1 bg-background",
            "md:min-h-[calc(100dvh-15rem)] md:rounded-lg md:border md:border-border md:bg-card md:p-8"
          )}
        >
          {children}
        </div>
      </main>

      <footer className="hidden border-t border-border py-4 md:block">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span>Stepra ©{new Date().getFullYear()} All rights reserved.</span>
          <Link to="/privacy-policy" className="transition-colors hover:text-primary">
            Privacy Policy
          </Link>
          <Link to="/delete-account" className="transition-colors hover:text-primary">
            Delete account &amp; data
          </Link>
        </div>
      </footer>

      {showBottomNav && <BottomNav />}
    </div>
  );
};

export default AppLayout;
