const VISIT_COUNT_KEY = 'stepra-visit-count';
const INSTALL_DISMISSED_KEY = 'stepra-install-dismissed';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function incrementVisitCount(): number {
  const count = Number.parseInt(localStorage.getItem(VISIT_COUNT_KEY) ?? '0', 10) + 1;
  localStorage.setItem(VISIT_COUNT_KEY, String(count));
  return count;
}

export function getVisitCount(): number {
  return Number.parseInt(localStorage.getItem(VISIT_COUNT_KEY) ?? '0', 10);
}

export function isInstallDismissed(): boolean {
  return localStorage.getItem(INSTALL_DISMISSED_KEY) === '1';
}

export function dismissInstallPrompt(): void {
  localStorage.setItem(INSTALL_DISMISSED_KEY, '1');
}

export function shouldOfferInstall(visitCount: number): boolean {
  return visitCount >= 2 && !isInstallDismissed() && !isStandaloneDisplay();
}
