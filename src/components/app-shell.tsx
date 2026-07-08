import { Outlet, useLocation } from 'react-router';
import { WhatsAppFloat } from '@/components/whatsapp-float';

export function AppShell() {
  const { pathname } = useLocation();
  const hideWhatsApp = pathname.startsWith('/exam/screen');

  return (
    <>
      <Outlet />
      {!hideWhatsApp && <WhatsAppFloat />}
    </>
  );
}
