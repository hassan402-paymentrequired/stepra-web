import { RouterProvider } from 'react-router';
import AppProvider from './provider';
import router from './router';

function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}

export default App;
