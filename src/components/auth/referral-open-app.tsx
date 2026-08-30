import { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { Button } from '@/components/ui';
import { WaitlistModal } from '@/components/landing/WaitlistModal';
import {
  APP_STORE_URL,
  buildAppRegisterDeepLink,
  fetchAppAvailability,
  getMobilePlatform,
  getStoreUrlForPlatform,
  type AppAvailability,
  type MobilePlatform,
} from '@/lib/app-store';
import type { WaitlistPlatform } from '@/apis/waitlist';

const OPEN_APP_TIMEOUT_MS = 1600;

interface ReferralOpenAppProps {
  referralCode: string;
  onContinueOnWeb: () => void;
}

export function ReferralOpenApp({
  referralCode,
  onContinueOnWeb,
}: ReferralOpenAppProps) {
  const [platform] = useState<MobilePlatform>(() => getMobilePlatform());
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [availability, setAvailability] = useState<AppAvailability | undefined>();

  useEffect(() => {
    let cancelled = false;
    fetchAppAvailability().then((data) => {
      if (!cancelled) setAvailability(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const storeUrl = getStoreUrlForPlatform(platform, availability);
  const androidAvailable = availability?.androidAvailable ?? false;

  useEffect(() => {
    const deepLink = buildAppRegisterDeepLink(referralCode);
    // Custom scheme: if the app is installed this usually backgrounds the tab.
    // Universal Links already open the app before this page loads when verified.
    window.location.href = deepLink;

    const timer = window.setTimeout(() => {
      if (document.hidden) return;
      if (storeUrl) {
        window.location.href = storeUrl;
      }
    }, OPEN_APP_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [referralCode, storeUrl]);

  const handleGetApp = () => {
    if (storeUrl) {
      window.location.href = storeUrl;
      return;
    }
    if (platform === 'android') {
      setWaitlistOpen(true);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Get Stepra</h1>
            <p className="text-muted-foreground">
              You were invited with referral code{' '}
              <span className="font-semibold text-foreground">{referralCode}</span>.
              {platform === 'ios' || (platform === 'android' && androidAvailable)
                ? ' Opening the app if it’s not already installed…'
                : ' The Android app is coming soon — join the waitlist or continue in your browser.'}
            </p>
          </div>

          <div className="space-y-3">
            {platform === 'ios' ? (
              <Button className="w-full" size="lg" asChild>
                <a href={APP_STORE_URL}>Download on the App Store</a>
              </Button>
            ) : (
              <Button className="w-full" size="lg" onClick={handleGetApp}>
                {storeUrl ? 'Get it on Google Play' : 'Notify me for Android'}
              </Button>
            )}

            <Button
              className="w-full"
              size="lg"
              variant="outline"
              onClick={onContinueOnWeb}
            >
              Continue in browser
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
