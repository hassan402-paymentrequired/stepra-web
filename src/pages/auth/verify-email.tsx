/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate,  Link } from 'react-router';
import { useVerifyOtp, useResendOtp } from '@/services/mutations/useAuth';
import { Button, Input } from '@/components/ui';
import { Mail, ArrowLeft } from 'lucide-react';
import { getApiErrorMessage } from '@/utils';
import { useUser } from '@/lib/auth';

const VerifyEmail = () => {
   const { data: user, refetch: refetchUser } = useUser();
  const navigate = useNavigate();
  const verifyOtp = useVerifyOtp();
  const resendOtp = useResendOtp();
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState<{ otp?: string }>({});
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  

  if (!user) {
    navigate('/authenticate/login');
  }

  if (user?.email_verified_at) {
    navigate('/');
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp.trim()) {
      setErrors({ otp: 'OTP is required' });
      return;
    }

    try {
      await verifyOtp.mutateAsync({
        otp: otp.trim(),
        email: user?.email,
      });

      await refetchUser();
      navigate('/');
    } catch (error: any) {
      const errorMessage = getApiErrorMessage(error);
      if (error?.response?.data?.errors) {
        const apiErrors = error.response.data.errors;
        setErrors({
          otp: apiErrors.otp?.[0] || errorMessage,
        });
      } else {
        setErrors({ otp: errorMessage });
      }
    }
  };

  const handleResend = async () => {
    try {
      await resendOtp.mutateAsync(user?.email);
      setCountdown(60); // 60 seconds countdown
      setErrors({});
    } catch (error: any) {
      const errorMessage = getApiErrorMessage(error);
      setErrors({ otp: errorMessage });
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Verify your email</h1>
          <p className="text-muted-foreground">
            We've sent a verification code to <strong>{user?.email || 'your email'}</strong>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">

          <Input
            label="Verification Code"
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
            className="w-full mt-3 text-white"
            disabled={verifyOtp.isPending || !otp.trim()}
          >
            {verifyOtp.isPending ? 'Verifying...' : 'Verify Email'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Didn't receive the code?
          </p>
          <Button
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
      </div>
    </div>
  );
};

export default VerifyEmail;
