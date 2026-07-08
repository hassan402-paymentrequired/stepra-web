import { Suspense } from 'react';
import { RouterProvider } from 'react-router';
import AppProvider from './provider';
import router from './router';
import { Toaster } from '@/components/ui/sonner';
import { ThemeColorMeta } from '@/components/theme/theme-color-meta';
import { PwaManager } from '@/components/pwa/pwa-manager';

function App() {
  return (
    <AppProvider>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          </div>
        }
      >
        <RouterProvider router={router} />
      </Suspense>
      <ThemeColorMeta />
      <PwaManager />
      <Toaster position="top-right" richColors closeButton />
    </AppProvider>
  );
}

export default App;
