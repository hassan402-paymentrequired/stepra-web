/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router';
import { Button, Input } from '@/components/ui';
import { Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useVerifyPasswordResetOtp, useResetPassword, useResendPasswordResetOtp } from '@/services/mutations/useAuth';
import { getApiErrorMessage } from '@/utils';
import { toast } from 'sonner';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const verifyOtp = useVerifyPasswordResetOtp();
  const resetPassword = useResetPassword();
  const resendOtp = useResendPasswordResetOtp();
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [step, setStep] = useState<'otp' | 'password'>('otp');
//   const [otpVerified, setOtpVerified] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    otp?: string;
    password?: string;
    passwordConfirmation?: string;
  }>({});
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // Get email from location state
    const stateEmail = location.state?.email;
    if (stateEmail) {
      setEmail(stateEmail);
    }
  }, [location.state]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validateOtp = () => {
    const newErrors: { email?: string; otp?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!otp.trim()) {
      newErrors.otp = 'OTP is required';
    } else if (otp.trim().length !== 6) {
      newErrors.otp = 'OTP must be 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors: { password?: string; passwordConfirmation?: string } = {};

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!passwordConfirmation) {
      newErrors.passwordConfirmation = 'Please confirm your password';
    } else if (password !== passwordConfirmation) {
      newErrors.passwordConfirmation = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateOtp()) return;

    try {
      const response = await verifyOtp.mutateAsync({
        email: email.trim(),
        otp: otp.trim(),
      });

      if (response.success) {
        // setOtpVerified(true);
        setStep('password');
        setErrors({});
        toast.success('Code verified', {
          description: 'You can now reset your password.',
        });
      }
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(error);
      if ((error as any)?.response?.data?.errors) {
        const apiErrors = (error as any).response.data.errors;
        setErrors({
          otp: apiErrors.otp?.[0] || errorMessage,
        });
      } else {
        setErrors({ otp: errorMessage });
      }
      toast.error('Verification Failed', {
        description: errorMessage || 'Invalid or expired code. Please try again.',
      });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;

    try {
      const response = await resetPassword.mutateAsync({
        email: email.trim(),
        otp: otp.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });

      if (response.success) {
        toast.success('Password reset successful', {
          description: 'You can now login with your new password.',
        });
        navigate('/authenticate/login', {
          state: { message: 'Password reset successfully. Please login with your new password.' },
        });
      }
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(error);
      if ((error as any)?.response?.data?.errors) {
        const apiErrors = (error as any).response.data.errors;
        setErrors({
          password: apiErrors.password?.[0],
          passwordConfirmation: apiErrors.password_confirmation?.[0] || errorMessage,
        });
      } else {
        setErrors({ password: errorMessage });
      }
      toast.error('Reset Failed', {
        description: errorMessage || 'Failed to reset password. Please try again.',
      });
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }

    if (countdown > 0) {
      return;
    }

    try {
      await resendOtp.mutateAsync({ email: email.trim() });
      setCountdown(60); // 60 seconds countdown
      setErrors({});
      toast.success('Code resent', {
        description: 'Check your email for the new reset code.',
      });
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(error);
      setErrors({ email: errorMessage });
      toast.error('Error', {
        description: errorMessage || 'Failed to resend code. Please try again.',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Link
          to="/authenticate/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">
            {step === 'otp' ? 'Enter Reset Code' : 'Reset Your Password'}
          </h1>
          <p className="text-muted-foreground">
            {step === 'otp'
              ? 'Enter the 6-digit code sent to your email'
              : 'Enter your new password'}
          </p>
        </div>

        {step === 'otp' ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors({});
              }}
              error={errors.email}
              leftIcon={<Lock className="h-4 w-4" />}
              autoComplete="email"
              autoCapitalize="none"
              disabled={!!location.state?.email}
            />

            <Input
              label="Reset Code"
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                setErrors({});
              }}
              error={errors.otp}
              maxLength={6}
              className="text-center text-2xl tracking-widest"
              autoComplete="one-time-code"
              autoFocus
            />

            <Button
              type="submit"
              className="w-full"
              disabled={verifyOtp.isPending || !otp.trim() || otp.trim().length !== 6}
            >
              {verifyOtp.isPending ? 'Verifying...' : 'Verify Code'}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Didn't receive the code?
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleResend}
                disabled={resendOtp.isPending || countdown > 0}
                className="w-full"
              >
                {countdown > 0
                  ? `Resend code in ${countdown}s`
                  : resendOtp.isPending
                  ? 'Sending...'
                  : 'Resend Code'}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Input
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your new password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors({});
              }}
              error={errors.password}
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              onRightIconPress={() => setShowPassword(!showPassword)}
              autoComplete="new-password"
              autoCapitalize="none"
            />

            <Input
              label="Confirm Password"
              type={showPasswordConfirmation ? 'text' : 'password'}
              placeholder="Confirm your new password"
              value={passwordConfirmation}
              onChange={(e) => {
                setPasswordConfirmation(e.target.value);
                setErrors({});
              }}
              error={errors.passwordConfirmation}
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                showPasswordConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />
              }
              onRightIconPress={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
              autoComplete="new-password"
              autoCapitalize="none"
            />

            <Button
              type="submit"
              className="w-full"
              disabled={resetPassword.isPending || !password || !passwordConfirmation}
            >
              {resetPassword.isPending ? 'Resetting...' : 'Reset Password'}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStep('otp');
                // setOtpVerified(false);
              }}
              className="w-full"
            >
              Back to Code Entry
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
