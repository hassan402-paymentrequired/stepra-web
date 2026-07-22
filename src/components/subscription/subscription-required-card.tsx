import { useNavigate } from 'react-router';
import { Button } from '@/components/ui';
import { AlertCircle } from 'lucide-react';

interface SubscriptionRequiredCardProps {
  description: string;
  otherDevicesActive?: boolean;
}

export function SubscriptionRequiredCard({
  description,
  otherDevicesActive = false,
}: SubscriptionRequiredCardProps) {
  const navigate = useNavigate();

  if (otherDevicesActive) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-6 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-600 dark:text-amber-400" />
        <h2 className="text-xl font-bold mb-2">Subscription on another browser</h2>
        <p className="text-muted-foreground mb-6">
          Your subscription is active, but it is linked to a different browser or
          device. Open Stepra in the browser you used to subscribe, or go to
          Subscription for help.
        </p>
        <Button onClick={() => navigate('/subscription')}>View subscription</Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-6 text-center">
      <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-600 dark:text-amber-400" />
      <h2 className="text-xl font-bold mb-2">Subscription Required</h2>
      <p className="text-muted-foreground mb-6">{description}</p>
      <Button onClick={() => navigate('/subscription')}>Subscribe Now</Button>
    </div>
  );
}
