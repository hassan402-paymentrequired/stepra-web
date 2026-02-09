import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button, Input } from '@/components/ui';
import { Mail, ArrowLeft } from 'lucide-react';
import { useSendPasswordResetOtp } from '@/services/mutations/useAuth';
import { getApiErrorMessage } from '@/utils';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const sendOtp = useSendPasswordResetOtp();
  const [email, setEmail] = useState('');
  const [_, setErrors] = useState<{ email?: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validate = () => {
    const newErrors: { email?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const response = await sendOtp.mutateAsync({ email: email.trim() });

      if (response.success) {
        setIsSubmitted(true);
        toast.success('Reset code sent', {
          description: 'Check your email for the password reset code.',
        });
      }
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(error);
      setErrors({ email: errorMessage });
      toast.error('Error', {
        description: errorMessage || 'Failed to send reset code. Please try again.',
      });
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Check your email</h1>
          <p className="text-muted-foreground mb-6">
            We've sent a password reset code to <strong>{email}</strong>
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/authenticate/reset-password', { state: { email } })}
              className="flex-1"
            >
              Enter Reset Code
            </Button>
            <Link to="/authenticate/login" className="flex-1">
              <Button variant="outline" className="w-full">Back to login</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold mb-2">Forgot Password?</h1>
          <p className="text-muted-foreground">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="h-4 w-4" />}
            autoComplete="email"
            autoCapitalize="none"
            required
          />

          <Button
            type="submit"
            className="w-full"
            disabled={sendOtp.isPending || !email.trim()}
          >
            {sendOtp.isPending ? 'Sending...' : 'Send Reset Instructions'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
