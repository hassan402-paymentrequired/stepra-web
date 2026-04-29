import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useLogin } from "@/lib/auth";
import { Button, Input } from "@/components/ui";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { getApiErrorMessage } from "@/utils";
import type { AxiosError } from "axios";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [rememberMe, setRememberMe] = useState(false);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    try {
      const user = await login.mutateAsync({
        email: email.trim(),
        password,
      });
      
      toast.success('Login successful');

      if (!user?.email_verified_at) {
        navigate("/authenticate/verify-email", {
          state: { email: email.trim() },
        });
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      const error = err as AxiosError<{ errors?: Record<string, string[]>; message?: string }>;
      const errorMessage = getApiErrorMessage(error);
      toast.error(errorMessage);
      
      if (error?.response?.data?.errors) {
        const apiErrors = error.response.data.errors;
        setErrors({
          email: apiErrors.email?.[0],
          password: apiErrors.password?.[0] || errorMessage,
        });
      } else {
        setErrors({ password: errorMessage });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground">
            Hello, you must login first to be able to use the application and
            enjoy all the features
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            leftIcon={<Mail className="h-4 w-4" />}
            autoComplete="email"
            autoCapitalize="none"
          />

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )
            }
            onRightIconPress={() => setShowPassword(!showPassword)}
            autoComplete="current-password"
            autoCapitalize="none"
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded"
              />
              <span>Remember me</span>
            </label>
            <Link
              to="/authenticate/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          <Button type="submit" className="w-full text-white" disabled={login.isPending}>
            {login.isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Link
            to="/authenticate/register"
            className="text-primary hover:underline font-medium"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
