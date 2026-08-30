import { Outlet, useLocation } from 'react-router';
import { WhatsAppFloat } from '@/components/whatsapp-float';
import { GetAppPopup } from '@/components/get-app-popup';

export function AppShell() {
  const { pathname } = useLocation();
  const hideWhatsApp = pathname.startsWith('/exam/screen');
  // Skip the app-download popup during auth (register already has its own
  // dedicated referral-to-app flow) and during an active exam attempt.
  const hideGetAppPopup =
    pathname.startsWith('/authenticate') || pathname.startsWith('/exam/screen');

  return (
    <>
      <Outlet />
      {!hideWhatsApp && <WhatsAppFloat />}
      {!hideGetAppPopup && <GetAppPopup />}
    </>
  );
}
