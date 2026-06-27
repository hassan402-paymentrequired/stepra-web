import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type BeforeInstallPromptEvent,
  dismissInstallPrompt,
  getVisitCount,
  incrementVisitCount,
  isStandaloneDisplay,
  shouldOfferInstall,
} from '@/lib/pwa';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';

export function InstallBanner() {
  const [visible, setVisible] = useState(false);
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    incrementVisitCount();

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      const installEvent = event as BeforeInstallPromptEvent;
      setPrompt(installEvent);

      if (shouldOfferInstall(getVisitCount())) {
        setVisible(true);
        trackEvent('pwa_install_prompt');
      }
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;

    await prompt.prompt();
    const { outcome } = await prompt.userChoice;

    setVisible(false);
    setPrompt(null);

    if (outcome === 'dismissed') {
      dismissInstallPrompt();
      trackEvent('pwa_install_dismissed');
    } else if (outcome === 'accepted') {
      trackEvent('pwa_install_accepted');
    }
  };

  const handleDismiss = () => {
    dismissInstallPrompt();
    setVisible(false);
  };

  if (!visible || !prompt || isStandaloneDisplay()) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed inset-x-4 z-[60] rounded-xl border border-border bg-card p-4 shadow-lg',
        'bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-4 md:left-auto md:right-4 md:max-w-sm'
      )}
      role="region"
      aria-label="Install app"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm">Add Stepra to Home Screen</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Install for quick access and an app-like experience.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={handleInstall}>
              Install
            </Button>
            <Button size="sm" variant="outline" onClick={handleDismiss}>
              Not now
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
