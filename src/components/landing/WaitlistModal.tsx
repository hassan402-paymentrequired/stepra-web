import { useEffect, useState } from 'react';
import { X, Loader2, Smartphone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { joinWaitlist, type WaitlistPlatform } from '@/apis/waitlist';
import { getApiErrorMessage } from '@/utils';
import type { AxiosError } from 'axios';
import { toast } from 'sonner';

interface WaitlistModalProps {
  open: boolean;
  platform: WaitlistPlatform | null;
  onClose: () => void;
}

const platformLabel: Record<WaitlistPlatform, string> = {
  ios: 'App Store',
  android: 'Google Play',
};

export function WaitlistModal({ open, platform, onClose }: WaitlistModalProps) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!open) {
      setEmail('');
      setJoined(false);
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open || !platform) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = email.trim();
    if (!trimmed) {
      toast.error('Please enter your email address.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await joinWaitlist({ email: trimmed, platform });
      if (response.success) {
        setJoined(true);
        toast.success(response.message || 'You are on the waitlist!');
      } else {
        toast.error('Could not join the waitlist. Please try again.');
      }
    } catch (error) {
      const err = error as AxiosError;
      const emailError = (err as { data?: { errors?: { email?: string[] } } }).data?.errors?.email?.[0];
      toast.error(emailError || getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="waitlist-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />

      <div className="relative w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Smartphone className="h-6 w-6" />
        </div>

        {joined ? (
          <div className="space-y-3 pr-6">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <h2 id="waitlist-title" className="text-xl font-semibold">
                You&apos;re on the list!
              </h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We&apos;ll email you as soon as Stepra launches on {platformLabel[platform]}.
              Practice on the web in the meantime.
            </p>
            <Button onClick={onClose} className="mt-2 w-full">
              Got it
            </Button>
          </div>
        ) : (
          <>
            <h2 id="waitlist-title" className="text-xl font-semibold pr-6">
              Mobile app coming soon
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Stepra for {platformLabel[platform]} is almost ready. Join the waitlist
              and we&apos;ll notify you on launch day.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Input
                type="email"
                label="Email address"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={submitting}
              />
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining waitlist...
                  </>
                ) : (
                  'Join waitlist'
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
