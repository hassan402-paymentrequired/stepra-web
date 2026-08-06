import { useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';

export function PwaManager() {
  const toastShown = useRef(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onOfflineReady() {
      toast.success('Ready to work offline', {
        description: 'Stepra can open without a connection.',
      });
    },
  });

  return null;
}
