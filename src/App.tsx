import { RouterProvider } from 'react-router';
import AppProvider from './provider';
import router from './router';
import { Toaster } from 'sonner';
import { WhatsAppFloat } from '@/components/whatsapp-float';

function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton />
      <WhatsAppFloat />
    </AppProvider>
  );
}

export default App;
