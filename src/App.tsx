import { RouterProvider } from 'react-router';
import AppProvider from './provider';
import router from './router';
import { Toaster } from 'sonner';

function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton />
    </AppProvider>
  );
}

export default App;
