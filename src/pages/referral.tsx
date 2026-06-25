import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import AppLayout from "@/components/layouts/app-layout";
import { Button, Input } from "@/components/ui";
import {
  getReferralData,
  requestWithdrawal,
  type ReferralData,
  type WithdrawalRequest,
} from "@/apis/referral";
import { getApiErrorMessage } from "@/utils";
import {
  Copy,
  Share2,
  Users,
  TrendingUp,
  Clock,
  Wallet,
  Phone,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { AxiosError } from "axios";
import { toast } from "sonner";

const NETWORKS = [
  { value: "mtn", label: "MTN" },
  { value: "airtel", label: "Airtel" },
  { value: "glo", label: "Glo" },
  { value: "9mobile", label: "9mobile" },
] as const;

const Referral = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [withdrawalForm, setWithdrawalForm] = useState<WithdrawalRequest>({
    phone_number: "",
    network: "mtn",
    amount: 0,
  });
  const [copied, setCopied] = useState(false);
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      const response = await getReferralData();
      if (response.success && response.data) {
        setReferralData(response.data);
      }
    } catch (error) {
      const errorMessage = getApiErrorMessage(error as AxiosError);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!referralData) return;

    try {
      await navigator.clipboard.writeText(referralData.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy referral code");
    }
  };

  const handleShare = async () => {
    if (!referralData) return;

    const shareText = `Join Exam Prep and earn rewards! Use my referral code: ${referralData.referral_code}\n\n${referralData.referral_url}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Referral Code",
          text: shareText,
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareText);
      toast.success("Referral code copied to clipboard!");
    }
  };

  const handleWithdrawal = async () => {
    if (!referralData) return;

    if (
      !withdrawalForm.phone_number ||
      withdrawalForm.phone_number.length < 10
    ) {
      toast.error("Please enter a valid phone number");
      return;
    }

    if (!withdrawalForm.amount || withdrawalForm.amount < 100) {
      toast.error("Minimum withdrawal amount is ₦100");
      return;
    }

    if (withdrawalForm.amount > referralData.credit_balance) {
      toast.error("Insufficient credit balance");
      return;
    }

    try {
      setWithdrawing(true);
      const response = await requestWithdrawal(withdrawalForm);

      if (response.success) {
        setWithdrawalSuccess(true);
        setShowWithdrawalForm(false);
        setWithdrawalForm({
          phone_number: "",
          network: "mtn",
          amount: 0,
        });
        // Refresh referral data to update balance
        await fetchReferralData();
        setTimeout(() => setWithdrawalSuccess(false), 5000);
      } else {
        toast.error(response.message || "Failed to process withdrawal");
      }
    } catch (error) {
      const errorMessage = getApiErrorMessage(error as AxiosError);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setWithdrawing(false);
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

  if (!referralData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-destructive mb-4">
              Failed to load referral data
            </p>
            <Button onClick={() => navigate("/dashboard")}>Go Back</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="w-full">
        <div className="max-w-5xl mx-auto">
          {/* Success Message */}
          {withdrawalSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-green-800">
                Withdrawal request submitted successfully! Your credit will be
                credited to your phone number shortly.
              </p>
            </div>
          )}

          {/* Credit Balance Card */}
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Wallet className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Credit Balance
                  </p>
                  <p className="text-3xl font-bold">
                    ₦{referralData?.credit_balance?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
              {referralData.credit_balance >= 100 && (
                <Button
                  onClick={() => setShowWithdrawalForm(true)}
                  variant="outline"
                >
                  Withdraw
                </Button>
              )}
            </div>
            {referralData.credit_balance < 100 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    Minimum withdrawal amount is ₦100. Refer more friends to
                    increase your balance!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Referral Code Card */}
          <div className="bg-card border rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Your Referral Code</h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 border-2 border-primary rounded-lg p-4 bg-primary/5">
                <p className="text-2xl font-bold text-center tracking-wider">
                  {referralData?.referral_code || ""}
                </p>
              </div>
              <Button
                onClick={handleCopyCode}
                variant="outline"
                size="sm"
                className="h-12"
              >
                {copied ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </Button>
            </div>
            <Button onClick={handleShare} className="w-full" variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Share Referral Code
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card border rounded-lg p-4 text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {referralData?.statistics?.total_referrals || 0}
              </p>
              <p className="text-sm text-muted-foreground">Total Referrals</p>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">
                {referralData?.statistics?.active_referrals || 0}
              </p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-600">
                {referralData?.statistics?.pending_referrals || 0}
              </p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <div className="bg-card border rounded-lg p-4 text-center">
              <Wallet className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">
                ₦{referralData?.statistics?.total_rewards?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-muted-foreground">Total Rewards</p>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-card border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">How It Works</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium">Share your referral code</p>
                  <p className="text-sm text-muted-foreground">
                    Share your unique referral code with friends and family
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium">They sign up using your code</p>
                  <p className="text-sm text-muted-foreground">
                    When they register using your referral code, you both
                    benefit
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium">Earn ₦500 per referral</p>
                  <p className="text-sm text-muted-foreground">
                    You get ₦500 worth of credit for each successful referral
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <p className="font-medium">Withdraw your credits</p>
                  <p className="text-sm text-muted-foreground">
                    Withdraw your credits to your phone number (minimum ₦100)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Referrals */}
          {referralData.recent_referrals.length > 0 && (
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Referrals</h3>
              <div className="space-y-4">
                {referralData.recent_referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold">
                          {referral.referred_user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {referral.referred_user.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {referral.referred_user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Signed up:{" "}
                          {new Date(
                            referral.referred_user.signed_up_at
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          referral.status === "rewarded"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {referral.status === "rewarded"
                          ? "Rewarded"
                          : "Pending"}
                      </span>
                      {referral.reward_amount > 0 && (
                        <p className="text-sm font-semibold text-primary mt-1">
                          ₦{referral.reward_amount.toLocaleString() || 0}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawalForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Withdraw Credits</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Available Balance
                </label>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">
                    ₦{referralData.credit_balance.toLocaleString()}
                  </p>
                </div>
              </div>

              <Input
                label="Phone Number"
                type="tel"
                placeholder="08012345678"
                value={withdrawalForm.phone_number}
                onChange={(e) =>
                  setWithdrawalForm({
                    ...withdrawalForm,
                    phone_number: e.target.value,
                  })
                }
                leftIcon={<Phone className="h-4 w-4" />}
              />

              <div>
                <label className="block text-sm font-medium mb-2">
                  Network Provider
                </label>
                <select
                  value={withdrawalForm.network}
                  onChange={(e) =>
                    setWithdrawalForm({
                      ...withdrawalForm,
                      network: e.target.value as WithdrawalRequest["network"],
                    })
                  }
                  className="w-full border rounded-md p-3 bg-background"
                >
                  {NETWORKS.map((network) => (
                    <option key={network.value} value={network.value}>
                      {network.label}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Amount (₦)"
                type="number"
                placeholder="100"
                min={100}
                max={referralData.credit_balance}
                value={withdrawalForm.amount || ""}
                onChange={(e) =>
                  setWithdrawalForm({
                    ...withdrawalForm,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
              />

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowWithdrawalForm(false);
                    setWithdrawalForm({
                      phone_number: "",
                      network: "mtn",
                      amount: 0,
                    });
                  }}
                  className="flex-1"
                  disabled={withdrawing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleWithdrawal}
                  className="flex-1"
                  disabled={withdrawing}
                >
                  {withdrawing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Withdraw"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Referral;
