import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router';
import { useVerifyOtp, useResendOtp } from '@/services/mutations/useAuth';
import { Button, Input } from '@/components/ui';
import { Mail, ArrowLeft } from 'lucide-react';
import { getApiErrorMessage } from '@/utils';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const verifyOtp = useVerifyOtp();
  const resendOtp = useResendOtp();
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState<{ otp?: string; email?: string }>({});
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // Get email from location state or use stored email
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

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp.trim()) {
      setErrors({ otp: 'OTP is required' });
      return;
    }

    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }

    try {
      const response = await verifyOtp.mutateAsync({
        email: email.trim(),
        otp: otp.trim(),
      });

      if (response.success) {
        // Redirect to login or home
        navigate('/authenticate/login', { 
          state: { message: 'Email verified successfully. Please login.' } 
        });
      }
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
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }

    try {
      await resendOtp.mutateAsync(email.trim());
      setCountdown(60); // 60 seconds countdown
      setErrors({});
    } catch (error: any) {
      const errorMessage = getApiErrorMessage(error);
      setErrors({ email: errorMessage });
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
            We've sent a verification code to <strong>{email || 'your email'}</strong>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
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
            disabled={!!location.state?.email}
          />

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
            className="w-full"
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
