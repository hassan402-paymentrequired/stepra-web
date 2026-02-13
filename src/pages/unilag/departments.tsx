import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import AppLayout from "@/components/layouts/app-layout";
import { Button } from "@/components/ui";
import { getDepartments, type Department } from "@/apis/exam";
import { useUser } from "@/lib/auth";
import { GraduationCap, ArrowRight, Loader2 } from "lucide-react";
import { getApiErrorMessage } from "@/utils";
import type { AxiosError } from "axios";

const UnilagDepartments = () => {
  const navigate = useNavigate();
  const { data: user } = useUser();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/authenticate/login");
      return;
    }

    loadDepartments();
  }, [user, navigate]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDepartments();

      if (response.success && response.data) {
        setDepartments(response.data);
        if (response.data.length === 0) {
          setError("No departments are available at the moment.");
        }
      }
    } catch (err) {
      const errorMessage = getApiErrorMessage(err as AxiosError);
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDepartment = (departmentId: number) => {
    navigate(`/unilag/departments/${departmentId}/subjects`);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="w-full flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading departments...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="w-full max-w-3xl mx-auto">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
            <Button
              onClick={loadDepartments}
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="w-full">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Select Department</h1>
            <p className="text-muted-foreground">
              Choose your department to practice Unilag questions
            </p>
          </div>

          {/* Departments Grid */}
          {departments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((department) => (
                <div
                  key={department.id}
                  onClick={() => handleSelectDepartment(department.id)}
                  className="group relative p-6 bg-card border border-border rounded-lg hover:shadow-lg transition-all cursor-pointer hover:border-primary"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                        {department.name}
                      </h3>
                      {department.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {department.description}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No departments available.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default UnilagDepartments;
