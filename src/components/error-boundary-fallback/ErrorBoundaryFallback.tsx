import { useRouteError, isRouteErrorResponse, useNavigate, useLocation } from 'react-router';
import { Button } from '../ui';
import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

const ErrorBoundaryFallback = () => {
  const error: any = useRouteError();
  const navigate = useNavigate();
  const location = useLocation();

  const reloadPage = () => {
    navigate(location.pathname, { replace: true });
  };

  useEffect(() => {
    if (
      error?.message?.toLowerCase().includes('failed to parse source') ||
      error?.message?.toLowerCase().includes('failed to fetch dynamically imported module') ||
      error.message?.toLowerCase().includes('importing a module script failed')
    ) {
      window.location.reload();
    }
  }, [error?.message]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center flex flex-col items-center gap-4 max-w-md">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <div className="h-12 w-px bg-border" />
          <div className="text-left">
            {isRouteErrorResponse(error) && (
              <div>
                <p className="text-lg font-semibold">{error.status}</p>
                <code className="text-sm text-muted-foreground">{error.statusText}</code>
              </div>
            )}

            {!isRouteErrorResponse(error) && (
              <div>
                <p className="text-lg font-semibold">Something went wrong.</p>
                <code className="text-sm text-muted-foreground">{error?.message || String(error)}</code>
              </div>
            )}
          </div>
        </div>

        <Button onClick={reloadPage} className="mt-4">
          Reload Page
        </Button>
      </div>
    </div>
  );
};

export default ErrorBoundaryFallback;
