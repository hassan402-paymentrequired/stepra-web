import { Breadcrumb, Layout, Menu, theme } from "antd";
import type { PropsWithChildren } from "react";
import { useUser, useLogout } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { LogOut, User } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui";

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

  const handleLogout = async () => {
    await logout.mutateAsync();
    navigate("/authenticate/login");
  };

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
          items={[{ title: "Home" }, { title: "Dashboard" }]}
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
