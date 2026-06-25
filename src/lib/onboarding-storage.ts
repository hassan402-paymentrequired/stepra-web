const ONBOARDING_KEY = 'hasSeenOnboarding';

export const hasSeenOnboarding = (): boolean => {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
};

export const setHasSeenOnboarding = () => {
  localStorage.setItem(ONBOARDING_KEY, 'true');
};
