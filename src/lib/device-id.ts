import Cookies from 'js-cookie';

const DEVICE_ID_KEY = 'device_id';
/** Keep device identity for at least one subscription year. */
const DEVICE_ID_COOKIE_DAYS = 400;

function createDeviceId(): string {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

function persistDeviceId(deviceId: string): void {
  try {
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  } catch {
    // Private mode / blocked storage — cookie may still work.
  }

  Cookies.set(DEVICE_ID_KEY, deviceId, {
    expires: DEVICE_ID_COOKIE_DAYS,
    sameSite: 'Lax',
    path: '/',
  });
}

/**
 * Stable browser device id for subscription binding.
 * Prefer cookie (survives many "clear cache" actions that wipe localStorage),
 * fall back to localStorage, then create and sync both.
 */
export function getDeviceId(): string {
  const fromCookie = Cookies.get(DEVICE_ID_KEY);
  let fromStorage: string | null = null;

  try {
    fromStorage = localStorage.getItem(DEVICE_ID_KEY);
  } catch {
    fromStorage = null;
  }

  const deviceId = fromCookie || fromStorage || createDeviceId();
  persistDeviceId(deviceId);
  return deviceId;
}
