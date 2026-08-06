export const APP_STORE_URL =
  'https://apps.apple.com/us/app/stepra-prep/id6789680121';

/** Set when Stepra is live on Google Play. Until then Android falls back to web / waitlist. */
export const PLAY_STORE_URL: string | null = null;

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

export function getStoreUrlForPlatform(platform: MobilePlatform): string | null {
  if (platform === 'ios') return APP_STORE_URL;
  if (platform === 'android') return PLAY_STORE_URL;
  return null;
}
