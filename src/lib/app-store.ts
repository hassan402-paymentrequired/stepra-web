import api from '@/lib/api';

export const APP_STORE_URL =
  'https://apps.apple.com/us/app/stepra-prep/id6789680121';

export type MobilePlatform = 'ios' | 'android' | 'other';

export function getMobilePlatform(userAgent = navigator.userAgent): MobilePlatform {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
  if (/Android/i.test(userAgent)) return 'android';
  return 'other';
}

export function isMobileUserAgent(userAgent = navigator.userAgent): boolean {
  return getMobilePlatform(userAgent) !== 'other';
}

export function buildAppRegisterDeepLink(referralCode: string): string {
  const params = new URLSearchParams();
  if (referralCode) {
    params.set('ref', referralCode);
  }
  const query = params.toString();
  return `stepra://authenticate/register${query ? `?${query}` : ''}`;
}

export interface AppAvailability {
  iosAvailable: boolean;
  androidAvailable: boolean;
  iosStoreUrl: string | null;
  androidStoreUrl: string | null;
}

/**
 * Optimistic defaults while the backend call below is in flight — iOS is
 * reliably live so its store link is safe to assume; Android stays gated
 * (no store link) until the backend confirms it's available.
 */
const DEFAULT_AVAILABILITY: AppAvailability = {
  iosAvailable: true,
  androidAvailable: false,
  iosStoreUrl: APP_STORE_URL,
  androidStoreUrl: null,
};

let cachedAvailability: Promise<AppAvailability> | null = null;

/**
 * Single source of truth for store availability, backed by GET /api/app-version
 * (config/mobile_app.php on the backend). Flip MOBILE_ANDROID_AVAILABLE there
 * once the Android app is live — no web redeploy needed.
 */
export function fetchAppAvailability(): Promise<AppAvailability> {
  if (!cachedAvailability) {
    cachedAvailability = api
      .get('/app-version')
      .then((response) => {
        const data = response.data?.data ?? {};
        return {
          iosAvailable: Boolean(data.ios_available),
          androidAvailable: Boolean(data.android_available),
          iosStoreUrl: data.ios_store_url ?? null,
          androidStoreUrl: data.android_store_url ?? null,
        } satisfies AppAvailability;
      })
      .catch(() => DEFAULT_AVAILABILITY);
  }
  return cachedAvailability;
}

export function getStoreUrlForPlatform(
  platform: MobilePlatform,
  availability: AppAvailability = DEFAULT_AVAILABILITY
): string | null {
  if (platform === 'ios') return availability.iosStoreUrl;
  if (platform === 'android') return availability.androidStoreUrl;
  return null;
}
