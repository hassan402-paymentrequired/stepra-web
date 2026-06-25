import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import AppLayout from "@/components/layouts/app-layout";
import { Button, Input } from "@/components/ui";
import { useUser, updateUserSessionData } from "@/lib/auth";
import {
  updateProfile,
  type UpdateProfilePayload,
} from "@/apis/profile";
import { getApiErrorMessage } from "@/utils";
import {
  Loader2,
  User,
  Mail,
  Lock,
  CheckCircle2,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import type { AxiosError } from "axios";
import { useTheme } from "next-themes";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();
  const { data: user, refetch: refetchUser } = useUser();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        current_password: "",
        password: "",
        password_confirmation: "",
      });
      setLoading(false);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setErrors({});
    setUpdating(true);

    try {
      const payload: UpdateProfilePayload = {};

      // Only include fields that have been changed
      if (formData.name && formData.name !== user?.name) {
        payload.name = formData.name;
      }

      if (formData.email && formData.email !== user?.email) {
        payload.email = formData.email;
      }

      // Only update password if password fields are filled
      if (formData.password) {
        if (!formData.current_password) {
          setErrors({
            current_password: "Current password is required to change password",
          });
          setUpdating(false);
          return;
        }
        if (formData.password !== formData.password_confirmation) {
          setErrors({ password_confirmation: "Passwords do not match" });
          setUpdating(false);
          return;
        }
        payload.current_password = formData.current_password;
        payload.password = formData.password;
        payload.password_confirmation = formData.password_confirmation;
      }

      const response = await updateProfile(payload);

      if (response.success) {
        setSuccess(true);
        // Update user session data
        if (response.data?.user) {
          updateUserSessionData(response.data.user);
          await refetchUser();
        }
        // Clear password fields
        setFormData((prev) => ({
          ...prev,
          current_password: "",
          password: "",
          password_confirmation: "",
        }));
        setTimeout(() => setSuccess(false), 3000);
      } else {
        // Handle validation errors
        if (response.errors) {
          setErrors(response.errors);
        }
      }
    } catch (error) {
      const errorMessage = getApiErrorMessage(error as AxiosError);
      const errorData = (
        error as AxiosError<{ errors?: Record<string, string[]> }>
      ).response?.data;

      if (errorData?.errors) {
        // Convert array errors to string
        const formattedErrors: Record<string, string> = {};
        Object.keys(errorData.errors).forEach((key) => {
          formattedErrors[key] = Array.isArray(errorData.errors![key])
            ? errorData.errors![key][0]
            : errorData.errors![key];
        });
        setErrors(formattedErrors);
      } else {
        toast.error(`Error: ${errorMessage}`);
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="w-full max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account information and password
          </p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">
              Profile updated successfully!
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </h2>

            <div className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                leftIcon={<User className="h-4 w-4" />}
                required
              />

              <Input
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                leftIcon={<Mail className="h-4 w-4" />}
                required
              />
            </div>
          </div>

          {/* Change Password Section */}
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Change Password
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Leave password fields empty if you don't want to change your
              password.
            </p>

            <div className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                name="current_password"
                value={formData.current_password}
                onChange={handleChange}
                error={errors.current_password}
                leftIcon={<Lock className="h-4 w-4" />}
                placeholder="Enter current password to change"
              />

              <Input
                label="New Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                leftIcon={<Lock className="h-4 w-4" />}
                placeholder="Enter new password (min 8 characters)"
              />

              <Input
                label="Confirm New Password"
                type="password"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                error={errors.password_confirmation}
                leftIcon={<Lock className="h-4 w-4" />}
                placeholder="Confirm new password"
              />
            </div>
          </div>

          {/* Appearance */}
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="text-xl font-semibold mb-4">Appearance</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Choose how Stepra looks on your device.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "light", label: "Light", icon: Sun },
                { value: "dark", label: "Dark", icon: Moon },
                { value: "system", label: "Auto", icon: Monitor },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                    theme === value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Account Information */}
          <div className="border rounded-lg p-6 bg-card">
            <h2 className="text-xl font-semibold mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Email Verified:</span>
                <span
                  className={`font-medium ${
                    user?.email_verified_at
                      ? "text-green-600"
                      : "text-yellow-600"
                  }`}
                >
                  {user?.email_verified_at ? "Verified" : "Not Verified"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Member Since:</span>
                <span className="font-medium">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={updating}
              className="flex-1"
              size="lg"
            >
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Profile"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard")}
              size="lg"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default Profile;
