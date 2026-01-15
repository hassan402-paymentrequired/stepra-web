import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useUser } from "@/lib/auth";
import AppLayout from "@/components/layouts/app-layout";

const Home = () => {
  const navigate = useNavigate();
  const { data: user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/authenticate/login");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppLayout>
      <div className="w-full h-full flex items-center justify-center overflow-hidden">
        <div className="grid grid-cols-5 grid-rows-6 gap-4 w-full max-w-[1400px] h-full">
          {/* Practice JAMB Card */}
          <div
            onClick={() => navigate("/jamb/mode-selection")}
            className="col-span-2 row-span-3 border rounded-lg bg-card p-6 flex flex-col items-center justify-center hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
              Practice JAMB
            </h2>
            <p className="text-muted-foreground text-center">
              Practice with JAMB past questions and improve your scores
            </p>
          </div>

          {/* Banner Card */}
          <div className="col-span-3 row-span-5 col-start-3 border rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 flex flex-col items-center justify-center">
            <h2 className="text-3xl font-bold mb-4 text-center">
              Welcome to Learning Platform
            </h2>
            <p className="text-muted-foreground text-center max-w-md">
              Your one-stop platform for exam preparation and practice
            </p>
          </div>

          {/* Practice DLI Card */}
          <div
            onClick={() => navigate("/dli/practice")}
            className="col-span-2 row-span-3 row-start-4 border rounded-lg bg-card p-6 flex flex-col items-center justify-center hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
              Practice DLI
            </h2>
            <p className="text-muted-foreground text-center">
              Practice with DLI questions and enhance your skills
            </p>
          </div>

          {/* Leaderboard Section */}
          <div className="col-span-3 col-start-3 row-start-6 border rounded-lg bg-card p-3">
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="flex-shrink-0 w-48 border rounded-lg p-4 bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {item}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">Student {item}</p>
                      <p className="text-sm text-muted-foreground">
                        Score: {95 - item * 2}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Home;
