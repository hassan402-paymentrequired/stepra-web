import { Breadcrumb, Layout, Menu, theme } from "antd";
import type { PropsWithChildren } from "react";
import { useUser, useLogout } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { LogOut, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { Button } from "@/components/ui";
import { useMemo } from "react";

const { Header, Content, Footer } = Layout;

const menuItems = [
  {
    key: "1",
    label: "Home",
  },
  {
    key: "2",
    label: "Practice",
  },
  {
    key: "3",
    label: "Exams",
  },
];

const AppLayout: React.FC<PropsWithChildren> = ({ children }) => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const { data: user } = useUser();
  const logout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout.mutateAsync();
    navigate("/authenticate/login");
  };

  // Generate breadcrumb items based on current route
  const breadcrumbItems = useMemo(() => {
    const pathname = location.pathname;
    const items: Array<{ title: string; href?: string }> = [];

    // Always start with Home
    items.push({ title: "Home", href: "/" });

    // Handle root path
    if (pathname === "/") {
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
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <Logo to="/" variant="logo" height={20} width={20} />
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={["1"]}
            items={menuItems}
            style={{ flex: 1, minWidth: 0 }}
          />
        </div>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "white",
              }}
            >
              <User size={16} />
              <span>{user.name}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={logout.isPending}
              style={{
                background: "transparent",
                borderColor: "rgba(255, 255, 255, 0.3)",
                color: "white",
              }}
            >
              <LogOut className="h-4 w-4" />
              {logout.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        )}
      </Header>
      <Content
        style={{
          padding: "0 48px",
          height: "calc(100vh - 64px - 70px)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Breadcrumb
          style={{ margin: "16px 0" }}
          items={breadcrumbItems.map((item, index) => ({
            title:
              index === breadcrumbItems.length - 1 ? (
                item.title
              ) : (
                <a
                  href={item.href || "#"}
                  onClick={(e) => {
                    if (item.href) {
                      e.preventDefault();
                      navigate(item.href);
                    }
                  }}
                >
                  {item.title}
                </a>
              ),
          }))}
        />
        <div
          style={{
            background: colorBgContainer,
            padding: 24,
            borderRadius: borderRadiusLG,
            flex: 1,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {children}
        </div>
      </Content>
      <Footer style={{ textAlign: "center" }}>
        Learning Platform ©{new Date().getFullYear()} All rights reserved.
      </Footer>
    </Layout>
  );
};

export default AppLayout;
