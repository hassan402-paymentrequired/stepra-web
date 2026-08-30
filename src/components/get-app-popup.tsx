import { useEffect, useState } from 'react';
import { X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui';
import { WaitlistModal } from '@/components/landing/WaitlistModal';
import {
  APP_STORE_URL,
  fetchAppAvailability,
  getMobilePlatform,
  type MobilePlatform,
} from '@/lib/app-store';
import type { WaitlistPlatform } from '@/apis/waitlist';

const DISMISSED_STORAGE_KEY = 'stepra_get_app_popup_dismissed_at';
const DISMISS_COOLDOWN_DAYS = 7;
const SHOW_DELAY_MS = 1200;

function daysSince(dateString: string): number {
  const then = new Date(dateString).getTime();
  if (Number.isNaN(then)) return Infinity;
  return Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24));
}

function shouldOfferPopup(): boolean {
  try {
    const dismissedAt = localStorage.getItem(DISMISSED_STORAGE_KEY);
    return !dismissedAt || daysSince(dismissedAt) >= DISMISS_COOLDOWN_DAYS;
  } catch {
    // Private mode / blocked storage — default to showing rather than nagging every reload.
    return true;
  }
}

function recordDismissal(): void {
  try {
    localStorage.setItem(DISMISSED_STORAGE_KEY, new Date().toISOString());
  } catch {
    // Ignore — nothing to persist to, popup will just reappear next visit.
  }
}

export function GetAppPopup() {
  const [platform] = useState<MobilePlatform>(() => getMobilePlatform());
  const [visible, setVisible] = useState(false);
  const [androidStoreUrl, setAndroidStoreUrl] = useState<string | null>(null);
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  useEffect(() => {
    if (platform === 'other' || !shouldOfferPopup()) return;

    let cancelled = false;
    fetchAppAvailability().then((data) => {
      if (cancelled) return;
      setAndroidStoreUrl(data.androidStoreUrl);
      window.setTimeout(() => {
        if (!cancelled) setVisible(true);
      }, SHOW_DELAY_MS);
    });

    return () => {
      cancelled = true;
    };
  }, [platform]);

  const handleDismiss = () => {
    recordDismissal();
    setVisible(false);
  };

  useEffect(() => {
    if (!visible) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [visible]);

  if (!visible) {
    return (
      <WaitlistModal
        open={waitlistOpen}
        platform={'android' as WaitlistPlatform}
        onClose={() => setWaitlistOpen(false)}
      />
    );
  }

  const isAndroidAvailable = platform === 'android' && Boolean(androidStoreUrl);
  const message =
    platform === 'ios'
      ? 'Practice on the go — download the Stepra app for iPhone.'
      : isAndroidAvailable
        ? 'Practice on the go — download the Stepra app for Android.'
        : 'The Android app is coming soon. Join the waitlist to get notified, or keep using Stepra right here in your browser.';

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="get-app-title"
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleDismiss}
          aria-label="Close"
        />

        <div className="relative w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Smartphone className="h-6 w-6" />
          </div>

          <h2 id="get-app-title" className="text-xl font-semibold pr-6">
            Get the Stepra app
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{message}</p>

          <div className="mt-6 space-y-3">
            {platform === 'ios' && (
              <Button className="w-full" asChild>
                <a href={APP_STORE_URL}>Download on the App Store</a>
              </Button>
            )}
            {isAndroidAvailable && androidStoreUrl && (
              <Button className="w-full" asChild>
                <a href={androidStoreUrl}>Get it on Google Play</a>
              </Button>
            )}
            {platform === 'android' && !isAndroidAvailable && (
              <Button className="w-full" onClick={() => setWaitlistOpen(true)}>
                Notify me for Android
              </Button>
            )}

            <Button className="w-full" variant="outline" onClick={handleDismiss}>
              Not now
            </Button>
          </div>
        </div>
      </div>

      <WaitlistModal
        open={waitlistOpen}
        platform={'android' as WaitlistPlatform}
        onClose={() => setWaitlistOpen(false)}
      />
    </>
  );
}
