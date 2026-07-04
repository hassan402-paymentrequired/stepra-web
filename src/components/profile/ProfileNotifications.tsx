import { useEffect, useState } from 'react';
import { Bell, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { getBrowserTimezone } from '@/lib/push-subscribe';

export function ProfileNotifications() {
  const {
    supported,
    settings,
    notificationsEnabled,
    loading,
    updating,
    enable,
    disable,
    saveSettings,
    saveEmailPreferences,
  } = usePushNotifications();
  const [reminderTime, setReminderTime] = useState('07:00');
  const [subscriptionReminders, setSubscriptionReminders] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  useEffect(() => {
    if (settings?.morning_reminder_time) {
      setReminderTime(settings.morning_reminder_time);
    }
  }, [settings?.morning_reminder_time]);

  useEffect(() => {
    if (settings) {
      setSubscriptionReminders(settings.subscription_reminder_emails_enabled);
      setMarketingEmails(settings.marketing_emails_enabled);
    }
  }, [settings?.subscription_reminder_emails_enabled, settings?.marketing_emails_enabled, settings]);

  const subscribing = updating && notificationsEnabled && !settings?.has_push_subscription;

  return (
    <div className="space-y-6">
      {supported && (
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Push reminders</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Morning streak reminders are on by default. Turn them off here if you prefer not to be notified.
          </p>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading notification settings...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {notificationsEnabled ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={updating}
                    onClick={() => void disable()}
                  >
                    {updating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Please wait...
                      </>
                    ) : (
                      'Turn off reminders'
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={updating}
                    onClick={() => void enable()}
                  >
                    {updating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Please wait...
                      </>
                    ) : (
                      'Turn on reminders'
                    )}
                  </Button>
                )}
                {permissionLabel()}
              </div>

              {subscribing && (
                <p className="text-xs text-muted-foreground">
                  Setting up browser notifications...
                </p>
              )}

              {notificationsEnabled && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="morning_reminder_time">Reminder time</Label>
                    <Input
                      id="morning_reminder_time"
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      disabled={updating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      value={settings?.timezone ?? getBrowserTimezone()}
                      readOnly
                      disabled
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={updating}
                      onClick={() =>
                        saveSettings({
                          morning_reminder_time: reminderTime,
                          timezone: getBrowserTimezone(),
                        })
                      }
                    >
                      Save reminder time
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Email preferences</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Account and security emails (verification, password reset, receipts) are always sent. Choose what else you receive below.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading email preferences...
          </div>
        ) : (
          <div className="space-y-4">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={subscriptionReminders}
                disabled={updating}
                onChange={(e) => setSubscriptionReminders(e.target.checked)}
                className="mt-0.5 rounded"
              />
              <span>
                <span className="font-medium">Subscription reminders</span>
                <span className="mt-1 block text-muted-foreground">
                  Get a heads-up 7 days and 1 day before your subscription expires.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={marketingEmails}
                disabled={updating}
                onChange={(e) => setMarketingEmails(e.target.checked)}
                className="mt-0.5 rounded"
              />
              <span>
                <span className="font-medium">Product updates and tips</span>
                <span className="mt-1 block text-muted-foreground">
                  Occasional study tips and gentle reminders when you've been away. Unsubscribe anytime from any email.
                </span>
              </span>
            </label>

            <Button
              type="button"
              variant="secondary"
              disabled={updating}
              onClick={() =>
                saveEmailPreferences({
                  subscription_reminder_emails_enabled: subscriptionReminders,
                  marketing_emails_enabled: marketingEmails,
                })
              }
            >
              Save email preferences
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  function permissionLabel() {
    if (typeof Notification === 'undefined') return null;

    if (Notification.permission === 'denied') {
      return (
        <span className="text-xs text-amber-600 dark:text-amber-400">
          Notifications blocked in browser settings — allow them to receive reminders.
        </span>
      );
    }

    if (notificationsEnabled && settings?.has_push_subscription) {
      return <span className="text-xs text-muted-foreground">Reminders active</span>;
    }

    if (notificationsEnabled) {
      return <span className="text-xs text-muted-foreground">Reminders on</span>;
    }

    return <span className="text-xs text-muted-foreground">Reminders off</span>;
  }
}
