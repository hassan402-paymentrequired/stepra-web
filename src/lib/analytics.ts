export type AnalyticsEvent =
  | 'theme_change'
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
