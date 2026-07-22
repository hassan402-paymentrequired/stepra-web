import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router";
import AppLayout from "@/components/layouts/app-layout";
import { Button } from "@/components/ui";
import {
  getSubscriptionPlans,
  getSubscriptionStatus,
  initializePayment,
  verifyPayment,
  registerSubscriptionDevice,
  redeemSubscriptionPin,
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

const PENDING_PAYMENT_KEY = "pending_payment_reference";

function getApiOrigin(): string | null {
  try {
    const base = import.meta.env.VITE_BASE_URL;
    return base ? new URL(base).origin : null;
  } catch {
    return null;
  }
}

/** Display price before discount (2× current, rounded to nearest ₦500). */
function getCompareAtPrice(price: number): number {
  return Math.ceil((price * 2) / 500) * 400;
}

const Subscription = () => {
  const { refetch: refetchUser } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);
  const [pendingReference, setPendingReference] = useState<string | null>(
    () =>
      typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem(PENDING_PAYMENT_KEY)
        : null
  );
  const [pin, setPin] = useState("");
  const [pinProcessing, setPinProcessing] = useState(false);
  const finalizingRef = useRef(false);
  const resumedPendingRef = useRef(false);

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

  const clearPendingReference = useCallback(() => {
    sessionStorage.removeItem(PENDING_PAYMENT_KEY);
    setPendingReference(null);
  }, []);

  const storePendingReference = useCallback((reference: string) => {
    sessionStorage.setItem(PENDING_PAYMENT_KEY, reference);
    setPendingReference(reference);
  }, []);

  const finalizePayment = useCallback(
    async (reference: string, options?: { fromUrl?: boolean }) => {
      if (!reference || finalizingRef.current) {
        return;
      }

      finalizingRef.current = true;
      setProcessing(true);

      try {
        try {
          await verifyPayment({ reference });
        } catch {
          // Paystack callback may have already activated the subscription.
        }

        try {
          await registerSubscriptionDevice();
        } catch {
          // Ignore bind errors (already bound / race).
        }

        await refetchUser();

        let statusResponse = await getSubscriptionStatus();
        if (
          statusResponse.success &&
          !statusResponse.data?.has_active_subscription &&
          (statusResponse.data?.needs_device_binding ||
            statusResponse.data?.other_devices_active)
        ) {
          try {
            await registerSubscriptionDevice();
            statusResponse = await getSubscriptionStatus();
          } catch {
            // Another device may have claimed it, or reclaim window expired.
          }
        }

        if (statusResponse.success) {
          setStatus(statusResponse.data);
        }

        if (statusResponse.data?.has_active_subscription) {
          clearPendingReference();
          toast.success("Your subscription has been activated!");
          return;
        }

        toast.message(
          "If you completed payment, give it a moment and refresh this page."
        );
      } catch (error) {
        const errorMessage = getApiErrorMessage(error as AxiosError);
        toast.error(`Payment verification failed: ${errorMessage}`);
      } finally {
        finalizingRef.current = false;
        setProcessing(false);

        if (options?.fromUrl) {
          const next = new URLSearchParams(searchParams);
          next.delete("reference");
          next.delete("trxref");
          setSearchParams(next, { replace: true });
        }
      }
    },
    [clearPendingReference, refetchUser, searchParams, setSearchParams]
  );

  const deviceBindAttemptedRef = useRef(false);

  // Legacy / recently-lost-web-device subscriptions — link this browser once on load.
  useEffect(() => {
    if (
      loading ||
      processing ||
      status?.has_active_subscription ||
      deviceBindAttemptedRef.current
    ) {
      return;
    }

    const shouldTryBind =
      status?.needs_device_binding || status?.other_devices_active;

    if (!shouldTryBind) {
      return;
    }

    deviceBindAttemptedRef.current = true;
    registerSubscriptionDevice()
      .then(() => fetchData())
      .catch(() => {
        // Binding may fail if reclaim window expired or another device claimed it.
      });
  }, [
    status?.needs_device_binding,
    status?.other_devices_active,
    status?.has_active_subscription,
    loading,
    processing,
    fetchData,
  ]);

  // Handle Paystack redirect callback (?reference=xxx)
  useEffect(() => {
    const reference =
      searchParams.get("reference") || searchParams.get("trxref");
    if (!reference) {
      return;
    }

    storePendingReference(reference);
    void finalizePayment(reference, { fromUrl: true });
  }, [searchParams, finalizePayment, storePendingReference]);

  // Resume verification once after reload if a previous payment was left unfinished.
  useEffect(() => {
    if (loading || resumedPendingRef.current) {
      return;
    }

    if (status?.has_active_subscription) {
      clearPendingReference();
      resumedPendingRef.current = true;
      return;
    }

    const urlReference =
      searchParams.get("reference") || searchParams.get("trxref");
    if (urlReference) {
      // URL callback effect owns this reference.
      resumedPendingRef.current = true;
      return;
    }

    const stored = sessionStorage.getItem(PENDING_PAYMENT_KEY);
    resumedPendingRef.current = true;
    if (stored) {
      void finalizePayment(stored);
    }
  }, [
    loading,
    status?.has_active_subscription,
    searchParams,
    finalizePayment,
    clearPendingReference,
  ]);

  // When payment popup closes, always verify with the stored reference.
  useEffect(() => {
    if (!paymentWindow) return;

    const checkPayment = setInterval(() => {
      if (!paymentWindow.closed) return;

      clearInterval(checkPayment);
      setPaymentWindow(null);

      const reference =
        pendingReference || sessionStorage.getItem(PENDING_PAYMENT_KEY);
      if (reference) {
        void finalizePayment(reference);
      } else {
        void fetchData();
        void refetchUser();
      }
    }, 1000);

    return () => clearInterval(checkPayment);
  }, [
    paymentWindow,
    pendingReference,
    finalizePayment,
    fetchData,
    refetchUser,
  ]);

  // Listen for postMessage from Paystack callback page (popup opener).
  useEffect(() => {
    const apiOrigin = getApiOrigin();

    const handleMessage = (event: MessageEvent) => {
      const allowedOrigins = [window.location.origin, apiOrigin].filter(
        Boolean
      ) as string[];
      if (!allowedOrigins.includes(event.origin)) {
        return;
      }

      if (event.data?.type !== "payment_success" || !event.data?.reference) {
        return;
      }

      const reference = String(event.data.reference);
      storePendingReference(reference);
      void finalizePayment(reference);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [finalizePayment, storePendingReference]);

  const handleSubscribe = async () => {
    if (!plan) {
      toast.error("Subscription plan not available");
      return;
    }

    setProcessing(true);
    try {
      const response = await initializePayment({
        plan_uuid: plan.uuid,
      });

      if (response.success && response.data) {
        storePendingReference(response.data.reference);

        const nextWindow = window.open(
          response.data.authorization_url,
          "paystack",
          "width=600,height=700,scrollbars=yes,resizable=yes"
        );

        if (nextWindow) {
          setPaymentWindow(nextWindow);
        } else {
          window.location.href = response.data.authorization_url;
        }
      }
    } catch (error) {
      const errorMessage = getApiErrorMessage(error as AxiosError);
      toast.error(`Payment Error: ${errorMessage}`);
      clearPendingReference();
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
      const response = await redeemSubscriptionPin(pin);

      if (response.success) {
        try {
          await registerSubscriptionDevice();
        } catch {
          // Ignore
        }
        await fetchData();
        await refetchUser();
        toast.success(
          "Your subscription has been activated successfully via PIN!"
        );
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
  const subscriptionOnOtherDevice =
    !hasActiveSubscription && status?.other_devices_active;
  const needsDeviceBinding =
    !hasActiveSubscription && status?.needs_device_binding;
  const compareAtPrice = plan ? getCompareAtPrice(plan.price) : null;

  return (
    <AppLayout>
      <div className="w-full">
        <div className="max-w-4xl mx-auto">
          {subscriptionOnOtherDevice && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-amber-800 mb-2">
                Multi-Device Subscription
              </h3>
              <p className="text-amber-700 text-sm">
                You already have an active subscription, but it is linked to a
                different browser or device. Use the same browser you subscribed
                with. If you just paid and still see this, refresh this page —
                we will try to link this browser automatically.
              </p>
            </div>
          )}

          {needsDeviceBinding && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Link This Device
              </h3>
              <p className="text-blue-700 text-sm">
                Your subscription is active but not yet linked to this device. We
                are linking it now so you can continue practicing here.
              </p>
            </div>
          )}

          {!plan && !loading && !hasActiveSubscription && (
            <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-6">
              <div className="mb-2 flex items-center gap-3">
                <Shield className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                <h3 className="text-xl font-semibold text-amber-950 dark:text-amber-100">
                  No Subscription Plan Available
                </h3>
              </div>
              <p className="text-amber-900/90 dark:text-amber-100/90">
                There are currently no active subscription plans. Please contact
                support or check back later.
              </p>
            </div>
          )}

          {plan && (
            <div className="bg-card border rounded-lg p-8 mb-6">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">{plan.name}</h2>
                <div className="flex items-baseline gap-2 flex-wrap">
                  {compareAtPrice != null && compareAtPrice > plan.price && (
                    <span className="text-2xl text-muted-foreground line-through">
                      ₦{compareAtPrice.toLocaleString()}
                    </span>
                  )}
                  <span className="text-4xl font-bold text-primary">
                    ₦{plan.price.toLocaleString()}
                  </span>
                  <span className="text-lg text-muted-foreground">
                    /{plan.interval}
                  </span>
                </div>
              </div>

              <p className="text-muted-foreground mb-6">{plan.description}</p>

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
                  <p className="text-sm">Past questions from previous years</p>
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
                          <span className="inline-flex items-center gap-1.5">
                            Subscribe for
                            {compareAtPrice != null &&
                              compareAtPrice > plan.price && (
                                <span className="line-through opacity-70 font-normal">
                                  ₦{compareAtPrice.toLocaleString()}
                                </span>
                              )}
                            <span>₦{plan.price.toLocaleString()}</span>
                          </span>
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
                          If you received a 6-digit subscription PIN from an
                          administrator, enter it below to activate your account
                          instantly.
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
                              onChange={(e) =>
                                setPin(e.target.value.replace(/\D/g, ""))
                              }
                              disabled={pinProcessing || processing}
                              required
                            />
                          </div>
                          <Button
                            type="submit"
                            className="w-full"
                            disabled={
                              pinProcessing || processing || pin.length !== 6
                            }
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
