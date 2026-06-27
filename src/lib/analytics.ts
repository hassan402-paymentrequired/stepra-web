export type AnalyticsEvent =
  | 'theme_change'
  | 'pwa_install_prompt'
  | 'pwa_install_accepted'
  | 'pwa_install_dismissed'
  | 'referral_share';

type AnalyticsPayload = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(event: AnalyticsEvent, properties?: AnalyticsPayload) {
  if (import.meta.env.DEV) {
    console.debug('[analytics]', event, properties);
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', event, properties);
  }
}
