import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useRegister } from '@/lib/auth';
import { Button, Input } from '@/components/ui';
import { Mail, Lock, User, Gift, Eye, EyeOff } from 'lucide-react';
import { getApiErrorMessage } from '@/utils';

const Register = () => {
  const navigate = useNavigate();
  const register = useRegister();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    passwordConfirmation?: string;
    referralCode?: string;
    terms?: string;
  }>({});

  const validate = () => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      passwordConfirmation?: string;
      terms?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

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

    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await register.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
        referral_code: referralCode.trim() || undefined,
      });

      // Redirect to email verification
      navigate('/authenticate/verify-email', { state: { email: email.trim() } });
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { errors?: Record<string, string[]> } } };
      const errorMessage = getApiErrorMessage(error);
      if (axiosError?.response?.data?.errors) {
        const apiErrors = axiosError.response.data.errors;
        setErrors({
          name: apiErrors.name?.[0],
          email: apiErrors.email?.[0],
          password: apiErrors.password?.[0],
          passwordConfirmation: apiErrors.password_confirmation?.[0],
        });
      } else {
        setErrors({ email: errorMessage });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Register your account!</h1>
          <p className="text-muted-foreground">
            Hello, you must register first to be able to use the application and enjoy all the features
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            label="Name"
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            leftIcon={<User className="h-4 w-4" />}
            autoCapitalize="words"
          />

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
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            placeholder="Confirm your password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            error={errors.passwordConfirmation}
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              showPasswordConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />
            }
            onRightIconPress={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
            autoComplete="new-password"
            autoCapitalize="none"
          />

          <Input
            label="Referral Code (Optional)"
            type="text"
            placeholder="Enter referral code if you have one"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            error={errors.referralCode}
            leftIcon={<Gift className="h-4 w-4" />}
            autoCapitalize="characters"
          />

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="mt-1 rounded"
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="text-primary hover:underline">
                Terms and Conditions
              </Link>
            </label>
          </div>
          {errors.terms && (
            <p className="text-sm text-destructive">{errors.terms}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={register.isPending || !agreeToTerms}
          >
            {register.isPending ? 'Creating account...' : 'Sign up'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link to="/authenticate/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
