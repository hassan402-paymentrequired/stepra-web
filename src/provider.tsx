import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AuthLoader } from '@/lib/auth';
import { queryConfig } from '@/lib/react-query';
import { ThemeProvider } from 'next-themes';
import { ExamSelectionProvider } from '@/contexts/ExamSelectionContext';

const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

interface AppProviderProps {
  children: ReactNode;
}

const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey="stepra-theme">
        <AuthLoader
          renderLoading={() => (
            <div className="flex items-center justify-center min-h-screen">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
            </div>
          )}
          renderError={() => <div>Error loading authentication</div>}
        >
          <ExamSelectionProvider>{children}</ExamSelectionProvider>
        </AuthLoader>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default AppProvider;
