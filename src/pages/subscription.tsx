import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router";
import AppLayout from "@/components/layouts/app-layout";
import { Button } from "@/components/ui";
import {
  getSubscriptionPlans,
  getSubscriptionStatus,
  initializePayment,
  verifyPayment,
  registerSubscriptionDevice,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from "@/apis/subscription";
import { useUser } from "@/lib/auth";
import { getApiErrorMessage } from "@/utils";
import {
  CheckCircle2,
  Loader2,
  CreditCard,
  Shield,
  Key,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AxiosError } from "axios";
import { toast } from "sonner";

const Subscription = () => {
  const { refetch: refetchUser } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);
  const [pin, setPin] = useState("");
  const [pinProcessing, setPinProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [planResponse, statusResponse] = await Promise.all([
        getSubscriptionPlans(),
        getSubscriptionStatus(),
      ]);

      if (planResponse.success) {
        setPlan(planResponse.data);
      }
      if (statusResponse.success) {
        setStatus(statusResponse.data);
      }
    } catch (error) {
      const errorMessage = getApiErrorMessage(error as AxiosError);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Legacy subscriptions may be active but unbound — link this device once on load.
  useEffect(() => {
    if (!status?.needs_device_binding || loading) {
      return;
    }

    registerSubscriptionDevice()
      .then(() => fetchData())
      .catch(() => {
        // Binding may fail if another device already claimed the subscription.
      });
  }, [status?.needs_device_binding, loading, fetchData]);

  const handlePaymentReference = useCallback(async (reference: string) => {
    try {
      setProcessing(true);
      const verifyResponse = await verifyPayment({ reference });

      if (verifyResponse.success) {
        await fetchData();
        await refetchUser();
        try {
          await registerSubscriptionDevice();
        } catch {
          // Ignore device binding errors
        }
        toast.success("Your subscription has been activated!");
      } else {
        toast.error(verifyResponse.message || "Payment verification failed.");
      }
    } catch (error) {
      const errorMessage = getApiErrorMessage(error as AxiosError);
      toast.error(`Payment verification failed: ${errorMessage}`);
    } finally {
      setProcessing(false);
      searchParams.delete("reference");
      searchParams.delete("trxref");
      setSearchParams(searchParams, { replace: true });
    }
  }, [refetchUser, searchParams, setSearchParams, fetchData]);

  // Handle Paystack redirect callback (?reference=xxx)
  useEffect(() => {
    const reference = searchParams.get("reference") || searchParams.get("trxref");
    if (reference) {
      handlePaymentReference(reference);
    }
  }, [searchParams, handlePaymentReference]);

  // Poll for payment completion when payment window is open
  useEffect(() => {
    if (!paymentWindow) return;

    const checkPayment = setInterval(async () => {
      if (paymentWindow.closed) {
        setPaymentWindow(null);
        await fetchData();
        await refetchUser();
        // Bind this device to the subscription so it only works on this device
        try {
          await registerSubscriptionDevice();
        } catch {
          // Ignore (e.g. 403 if already bound to another device)
        }
        clearInterval(checkPayment);
      }
    }, 2000);

    return () => clearInterval(checkPayment);
  }, [paymentWindow, refetchUser, fetchData]);

  const handleSubscribe = async () => {
    if (!plan) {
      toast.error("Subscription plan not available");
      return;
    }

    setProcessing(true);
    try {
      const response = await initializePayment({
        plan_id: plan.id,
      });

      if (response.success && response.data) {
        // Open Paystack payment page in a new window
        const paymentWindow = window.open(
          response.data.authorization_url,
          "paystack",
          "width=600,height=700,scrollbars=yes,resizable=yes"
        );

        if (paymentWindow) {
          setPaymentWindow(paymentWindow);

          // Listen for payment completion via message from Paystack callback
          const handleMessage = async (event: MessageEvent) => {
            // Verify the origin is from our backend
            if (
              event.origin !== window.location.origin &&
              !event.data?.reference
            ) {
              return;
            }

            if (event.data?.type === "payment_success") {
              try {
                const verifyResponse = await verifyPayment({
                  reference: event.data.reference,
                });

                if (verifyResponse.success) {
                  await fetchData();
                  await refetchUser();
                  await registerSubscriptionDevice();
                  toast.success("Your subscription has been activated!");
                }
              } catch (error) {
                console.error("Payment verification error:", error);
              }
            }

            window.removeEventListener("message", handleMessage);
          };

          window.addEventListener("message", handleMessage);

          // Fallback: Check URL for payment reference after window closes
          const checkClosed = setInterval(() => {
            if (paymentWindow.closed) {
              clearInterval(checkClosed);
              setPaymentWindow(null);
              // Refresh data to check if subscription was activated
              fetchData();
              refetchUser();
            }
          }, 1000);
        } else {
          // If popup was blocked, redirect to payment page
          window.location.href = response.data.authorization_url;
        }
      }
    } catch (error) {
      const errorMessage = getApiErrorMessage(error as AxiosError);
      toast.error(`Payment Error: ${errorMessage}`);
    } finally {
      setProcessing(false);
    }
  };

  const handlePinRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) {
      toast.error("PIN must be exactly 6 digits.");
      return;
    }

    setPinProcessing(true);
    try {
      // Import the dynamic function we just added via a quick require or we can make sure it's exported at the top
      const { redeemSubscriptionPin } = await import('@/apis/subscription');
      const response = await redeemSubscriptionPin(pin);

      if (response.success) {
        await fetchData();
        await refetchUser();
        try {
          // Bind this device to the newly activated subscription
          const { registerSubscriptionDevice } = await import('@/apis/subscription');
          await registerSubscriptionDevice();
        } catch {
          // Ignore
        }
        toast.success("Your subscription has been activated successfully via PIN!");
        setPin("");
      }
    } catch (error) {
      const errorMessage = getApiErrorMessage(error as AxiosError);
      toast.error(`PIN Error: ${errorMessage}`);
    } finally {
      setPinProcessing(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
        </div>
      </AppLayout>
    );
  }

  const hasActiveSubscription = status?.has_active_subscription || false;
  const subscriptionOnOtherDevice = !hasActiveSubscription && status?.other_devices_active;
  const needsDeviceBinding = !hasActiveSubscription && status?.needs_device_binding;

  return (
    <AppLayout>
      <div className="w-full">
        <div className="max-w-4xl mx-auto">
          {/* Subscription tied to another device */}
          {subscriptionOnOtherDevice && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-amber-800 mb-2">
                Multi-Device Subscription
              </h3>
              <p className="text-amber-700 text-sm">
                You have an active subscription on another device. Stepra subscriptions are bound per device.
                To use Stepra on this device as well, you can purchase a new plan below.
              </p>
            </div>
          )}

          {needsDeviceBinding && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Link This Device
              </h3>
              <p className="text-blue-700 text-sm">
                Your subscription is active but not yet linked to this device. We are linking it now so you can continue practicing here.
              </p>
            </div>
          )}

          {/* Error Message if no plan available */}
          {!plan && !loading && !hasActiveSubscription && (
            <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-6">
              <div className="mb-2 flex items-center gap-3">
                <Shield className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                <h3 className="text-xl font-semibold text-amber-950 dark:text-amber-100">
                  No Subscription Plan Available
                </h3>
              </div>
              <p className="text-amber-900/90 dark:text-amber-100/90">
                There are currently no active subscription plans. Please contact support or check back later.
              </p>
            </div>
          )}

          {/* Subscription Plan */}
          {plan && (
            <div className="bg-card border rounded-lg p-8 mb-6">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">{plan.name}</h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-primary">
                    ₦{plan.price.toLocaleString()}
                  </span>
                  <span className="text-lg text-muted-foreground">
                    /{plan.interval}
                  </span>
                </div>
              </div>

              <p className="text-muted-foreground mb-6">{plan.description}</p>

              {/* Features */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm">
                    Unlimited access to all exam questions
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm">
                    Practice questions for all subjects (up to 100 per subject)
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm">
                    Past questions from previous years
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm">
                    Detailed explanations and corrections
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm">
                    Performance tracking and analytics
                  </p>
                </div>
              </div>

              {!hasActiveSubscription && (
                <Tabs defaultValue="paystack" className="w-full mt-8">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="paystack">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay Online
                    </TabsTrigger>
                    <TabsTrigger value="pin">
                      <Key className="w-4 h-4 mr-2" />
                      Use PIN
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="paystack" className="mt-4">
                    <Button
                      onClick={handleSubscribe}
                      disabled={processing || pinProcessing}
                      className="w-full"
                      size="lg"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Subscribe for ₦{plan.price.toLocaleString()}/year
                        </>
                      )}
                    </Button>
                    <p className="text-sm text-muted-foreground text-center mt-3">
                      Secure payment powered by Paystack
                    </p>
                  </TabsContent>

                  <TabsContent value="pin" className="mt-4">
                    <Card>
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Activate via PIN</CardTitle>
                        <CardDescription>
                          If you received a 6-digit subscription PIN from an administrator, enter it below to activate your account instantly.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handlePinRedeem} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="pin">6-Digit PIN</Label>
                            <Input
                              id="pin"
                              type="text"
                              maxLength={6}
                              placeholder="e.g. 123456"
                              className="font-mono text-center tracking-widest text-lg"
                              value={pin}
                              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                              disabled={pinProcessing || processing}
                              required
                            />
                          </div>
                          <Button
                            type="submit"
                            className="w-full"
                            disabled={pinProcessing || processing || pin.length !== 6}
                          >
                            {pinProcessing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <Key className="w-4 h-4 mr-2" />
                                Activate Subscription
                              </>
                            )}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}

              {hasActiveSubscription && (
                <div className="bg-primary/10 border border-primary rounded-lg p-4 text-center">
                  <p className="text-primary font-semibold">
                    You have an active subscription
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Payment Information */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Payment Information
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Payments are processed securely through Paystack</p>
              <p>
                • Your subscription will be activated immediately after successful
                payment
              </p>
              <p>
                • All subscriptions are valid for 1 year from the date of purchase
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Subscription;
