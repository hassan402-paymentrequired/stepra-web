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

  useEffect(() => {
    if (!needRefresh || toastShown.current) return;

    toastShown.current = true;
    toast('Update available', {
      description: 'A new version of Stepra is ready.',
      duration: Infinity,
      action: {
        label: 'Reload',
        onClick: () => {
          void updateServiceWorker(true);
        },
      },
    });
  }, [needRefresh, updateServiceWorker]);

  return null;
}
