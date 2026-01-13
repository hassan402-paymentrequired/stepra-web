import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useUser } from '@/lib/auth';
import { Button } from '@/components/ui';
import { useLogout } from '@/lib/auth';

const Home = () => {
  const navigate = useNavigate();
  const { data: user, isLoading } = useUser();
  const logout = useLogout();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/authenticate/login');
    }
  }, [user, isLoading, navigate]);

  const handleLogout = async () => {
    await logout.mutateAsync();
    navigate('/authenticate/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user.name}!</h1>
            <p className="text-muted-foreground mt-2">{user.email}</p>
          </div>
          <Button variant="outline" onClick={handleLogout} disabled={logout.isPending}>
            {logout.isPending ? 'Logging out...' : 'Logout'}
          </Button>
        </div>
        
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
          <p className="text-muted-foreground">
            Your dashboard content will go here. This is a placeholder for the main application.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;