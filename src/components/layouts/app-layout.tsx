import { Breadcrumb, Layout, theme, Dropdown } from "antd";
import { Link } from "react-router";
import type { PropsWithChildren } from "react";
import { useUser, useLogout } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { LogOut, User, CreditCard, Users, Flame, Coins } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { useMemo, useState, useEffect, useCallback } from "react";
import { getStreaks, type StreakData } from "@/apis/streak";
import { getCreditBalance } from "@/apis/referral";

const { Header, Content, Footer } = Layout;

// Helper function to get current week days (7 days)
const getCurrentWeekDays = () => {
  const today = new Date();
  const days: Array<{
    date: Date;
    dayName: string;
    dayAbbr: string;
  }> = [];

  // Get the start of the week (Sunday = 0, but we'll start from today and go back 6 days)
  // Show the last 7 days including today
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    days.push({
      date,
      dayName: date.toLocaleDateString("en-US", { weekday: "long" }),
      dayAbbr: date.toLocaleDateString("en-US", { weekday: "short" }),
    });
  }

  return days;
};

const AppLayout: React.FC<PropsWithChildren> = ({ children }) => {
  const {
    token: { colorBgContainer, borderRadiusLG, colorBorder, colorText },
  } = theme.useToken();

  const { data: user } = useUser();
  const logout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [creditBalance, setCreditBalance] = useState<number>(0);

  const fetchStreak = useCallback(async () => {
    try {
      const response = await getStreaks();
      if (response.success) {
        setStreakData(response.data);
      }
    } catch (error) {
      // Silently fail - streak is not critical
      console.error("Error fetching streak:", error);
    }
  }, []);

  const fetchCreditBalance = useCallback(async () => {
    try {
      const response = await getCreditBalance();
      if (response.success && response.data) {
        setCreditBalance(response.data.credit_balance || 0);
      }
    } catch (error) {
      // Silently fail - credit balance is not critical
      console.error("Error fetching credit balance:", error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchStreak();
      fetchCreditBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleLogout = async () => {
    await logout.mutateAsync(undefined);
    navigate("/authenticate/login");
  };

  const profileMenuItems = [
    {
      key: "profile",
      label: (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>Profile</span>
        </div>
      ),
      onClick: () => navigate("/profile"),
    },
    {
      type: "divider" as const,
    },
    {
      key: "subscription",
      label: (
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          <span>Subscribe</span>
        </div>
      ),
      onClick: () => navigate("/subscription"),
    },
    {
      key: "referral",
      label: (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>Refer & Earn</span>
        </div>
      ),
      onClick: () => navigate("/referral"),
    },
    {
      type: "divider" as const,
    },
    {
      key: "logout",
      label: (
        <div className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </div>
      ),
      onClick: handleLogout,
      danger: true,
    },
  ];

  // Generate breadcrumb items based on current route
  const breadcrumbItems = useMemo(() => {
    const pathname = location.pathname;
    const items: Array<{ title: string; href?: string }> = [];

    // Always start with Home
    items.push({ title: "Home", href: "/dashboard" });

    if (pathname === "/dashboard") {
      items.push({ title: "Dashboard" });
      return items;
    }

    // Handle JAMB routes
    if (pathname.startsWith("/jamb/")) {
      items.push({ title: "JAMB" });
      if (pathname === "/jamb/mode-selection") {
        items.push({ title: "Mode Selection" });
      } else if (pathname === "/jamb/past-questions") {
        items.push({ title: "Past Questions" });
      } else if (pathname === "/jamb/practice-questions") {
        items.push({ title: "Practice Questions" });
      }
    }
    // Handle DLI routes
    else if (pathname.startsWith("/dli/")) {
      items.push({ title: "DLI" });
      if (pathname === "/dli/practice") {
        items.push({ title: "Practice" });
      }
    }
    // Handle Unilag routes
    else if (pathname.startsWith("/unilag/")) {
      items.push({ title: "Unilag" });
      if (pathname === "/unilag/departments") {
        items.push({ title: "Departments" });
      } else if (pathname.startsWith("/unilag/departments/") && pathname.includes("/subjects")) {
        // Extract department ID from path
        //const departmentMatch = pathname.match(/\/unilag\/departments\/(\d+)\/subjects/);
        items.push({ title: "Departments", href: "/unilag/departments" });
        items.push({ title: "Subjects" });
      }
    }
    // Handle Exam routes
    else if (pathname.startsWith("/exam/")) {
      items.push({ title: "Exam" });
      if (pathname === "/exam/screen") {
        // Just "Exam" is fine, no additional level
      } else if (pathname === "/exam/results") {
        items.push({ title: "Results" });
      } else if (pathname === "/exam/corrections") {
        items.push({ title: "Corrections" });
      }
    }
    // Handle Referral route
    else if (pathname === "/referral") {
      items.push({ title: "Refer & Earn" });
    }
    // Handle Subscription route
    else if (pathname === "/subscription") {
      items.push({ title: "Subscription" });
    }
    // Handle Profile route
    else if (pathname === "/profile") {
      items.push({ title: "Profile" });
    }
    // Handle authentication routes (shouldn't show breadcrumb, but just in case)
    else if (pathname.startsWith("/authenticate/")) {
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

  return (
    <Layout>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: colorBgContainer,
          borderBottom: `1px solid ${colorBorder}`,
          padding: "0 24px",
        }}
      >
        <div
          className="flex items-center gap-6 lg:gap-8"
          style={{ display: "flex", alignItems: "center" }}
        >
          <Logo to="/dashboard" variant="logo" height={24} width={24} />
        </div>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Credit Balance */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: colorText,
                padding: "4px 12px",
                borderRadius: "6px",
                background: colorBgContainer,
                border: `1px solid ${colorBorder}`,
              }}
            >
              <Coins size={18} className="text-yellow-500" />
              <span style={{ fontSize: "14px", fontWeight: 600 }}>
                {creditBalance.toLocaleString()}
              </span>
            </div>

            {/* Profile Dropdown */}
            <Dropdown
              menu={{ items: profileMenuItems }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: colorText,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: "4px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colorBgContainer;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <User size={16} />
                <span>{user.name}</span>
              </button>
            </Dropdown>
          </div>
        )}
      </Header>
      
      <Content
        className="px-4 sm:px-8 lg:px-12 xl:px-16"
        style={{
          minHeight: "calc(100vh - 64px - 70px)",
          display: "flex",
          flexDirection: "column",
          paddingTop: "24px",
          paddingBottom: "24px",
        }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <Breadcrumb
            items={breadcrumbItems.map((item, index) => {
              const isLast = index === breadcrumbItems.length - 1;
              return {
                title: isLast ? (
                  item.title
                ) : item.href ? (
                  <Link
                    to={item.href}
                    style={{ color: "inherit" }}
                    className="hover:text-primary transition-colors"
                  >
                    {item.title}
                  </Link>
                ) : (
                  item.title
                ),
              };
            })}
          />
          {user && streakData && (
            <>
              {/* Mobile View: Simple number display */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border md:hidden"
                style={{
                  background: colorBgContainer,
                  borderColor: colorBorder,
                }}
              >
                <Flame
                  size={16}
                  style={{
                    color:
                      streakData.current_streak > 0 ? "#f59e0b" : "#9ca3af",
                  }}
                />
                <span className="text-sm font-medium whitespace-nowrap">
                  {streakData.current_streak} day
                  {streakData.current_streak !== 1 ? "s" : ""} streak
                </span>
              </div>

              {/* Web View: Week calendar display */}
              <div
                className="hidden md:flex items-center gap-3 px-4 py-2 rounded-lg border"
                style={{
                  background: colorBgContainer,
                  borderColor: colorBorder,
                }}
              >
                <Flame
                  size={18}
                  style={{
                    color:
                      streakData.current_streak > 0 ? "#f59e0b" : "#9ca3af",
                  }}
                />
                <div className="flex items-center gap-1.5">
                  {getCurrentWeekDays().map((day, index) => {
                    const dayStr = day.date.toISOString().split("T")[0];
                    const hasStreak = streakData.all_streaks.includes(dayStr);
                    const isToday =
                      day.date.toDateString() === new Date().toDateString();

                    return (
                      <div
                        key={index}
                        className="flex flex-col items-center gap-1 px-2 py-1 rounded-md transition-colors"
                        style={{
                          background: hasStreak
                            ? streakData.current_streak > 0
                              ? "rgba(245, 158, 11, 0.15)"
                              : "rgba(156, 163, 175, 0.15)"
                            : "transparent",
                          border: isToday
                            ? "2px solid #f59e0b"
                            : hasStreak
                            ? "1px solid rgba(245, 158, 11, 0.3)"
                            : "1px solid transparent",
                        }}
                        title={`${day.dayName} ${day.date.getDate()}${
                          hasStreak ? " - Practiced" : ""
                        }`}
                      >
                        {/* <span
                          className="text-xs font-medium"
                          style={{
                            color: isToday
                              ? "#f59e0b"
                              : hasStreak
                              ? "#f59e0b"
                              : "#9ca3af",
                          }}
                        >
                          {day.dayAbbr}
                        </span> */}
                        <span
                          className="text-xs font-semibold"
                          style={{
                            color: isToday
                              ? "#f59e0b"
                              : hasStreak
                              ? "#f59e0b"
                              : "#9ca3af",
                          }}
                        >
                          {day.date.getDate()}
                        </span>
                        {hasStreak && (
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              background:
                                streakData.current_streak > 0
                                  ? "#f59e0b"
                                  : "#9ca3af",
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="ml-2 pl-3 border-l">
                  <span className="text-sm font-semibold">
                    {streakData.current_streak} day
                    {streakData.current_streak !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
        <div
          className="w-full"
          style={{
            background: colorBgContainer,
            padding: "32px",
            borderRadius: borderRadiusLG,
            minHeight: "calc(100vh - 15rem)",
          }}
        >
          {children}
        </div>
      </Content>
      <Footer style={{ textAlign: "center" }}>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span>Stepra ©{new Date().getFullYear()} All rights reserved.</span>
          <Link to="/privacy-policy" className="hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          <Link to="/delete-account" className="hover:text-primary transition-colors">
            Delete account &amp; data
          </Link>
        </div>
      </Footer>
    </Layout>
  );
};

export default AppLayout;
