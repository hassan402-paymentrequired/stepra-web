import { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/app-layout";
import { Button } from "@/components/ui";
import {
  getSubscriptionPlans,
  getSubscriptionStatus,
  initializePayment,
  verifyPayment,
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
} from "lucide-react";
import type { AxiosError } from "axios";

const Subscription = () => {
  const { refetch: refetchUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Poll for payment completion when payment window is open
  useEffect(() => {
    if (!paymentWindow) return;

    const checkPayment = setInterval(async () => {
      if (paymentWindow.closed) {
        setPaymentWindow(null);
        // Check if payment was successful by verifying with backend
        await fetchData();
        await refetchUser();
        clearInterval(checkPayment);
      }
    }, 2000);

    return () => clearInterval(checkPayment);
  }, [paymentWindow, refetchUser]);

  const fetchData = async () => {
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
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!plan) {
      alert("Subscription plan not available");
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
              // Verify payment with backend
              try {
                const verifyResponse = await verifyPayment({
                  reference: event.data.reference,
                });

                if (verifyResponse.success) {
                  await fetchData();
                  await refetchUser();
                  alert("Your subscription has been activated!");
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
      alert(`Payment Error: ${errorMessage}`);
    } finally {
      setProcessing(false);
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

  return (
    <AppLayout>
      <div className="w-full">
        <div className="max-w-4xl mx-auto">
          {/* Current Status */}
          {hasActiveSubscription && status?.subscription && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <h3 className="text-xl font-semibold text-green-800">
                  Active Subscription
                </h3>
              </div>
              <div className="space-y-2">
                <p className="text-green-700">
                  <span className="font-medium">Plan:</span>{" "}
                  {status.subscription.plan.name}
                </p>
                <p className="text-green-700">
                  <span className="font-medium">Expires:</span>{" "}
                  {new Date(
                    status.subscription.expires_at
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Error Message if no plan available */}
          {!plan && !loading && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-6 w-6 text-yellow-600" />
                <h3 className="text-xl font-semibold text-yellow-800">
                  No Subscription Plan Available
                </h3>
              </div>
              <p className="text-yellow-700">
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
                <Button
                    onClick={handleSubscribe}
                    disabled={processing}
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
