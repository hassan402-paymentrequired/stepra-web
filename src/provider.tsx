import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AuthLoader } from '@/lib/auth';
import { queryConfig } from '@/lib/react-query';

const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

interface AppProviderProps {
  children: ReactNode;
}

const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthLoader
        renderLoading={() => (
          <div className="flex items-center justify-center min-h-screen">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          </div>
        )}
        renderError={() => <div>Error loading authentication</div>}
      >
        {children}
      </AuthLoader>
    </QueryClientProvider>
  );
};

export default AppProvider;
