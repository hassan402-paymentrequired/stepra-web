import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import AppLayout from "@/components/layouts/app-layout";
import { Button, Input } from "@/components/ui";
import {
  getReferralData,
  requestWithdrawal,
  formatWithdrawalDestination,
  type ReferralData,
  type WithdrawalRequest,
} from "@/apis/referral";
import { getApiErrorMessage } from "@/utils";
import { trackEvent } from "@/lib/analytics";
import {
  Copy,
  Share2,
  Users,
  TrendingUp,
  Clock,
  Wallet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
} from "lucide-react";
import type { AxiosError } from "axios";
import { toast } from "sonner";

const emptyWithdrawalForm = (): WithdrawalRequest => ({
  account_name: "",
  account_number: "",
  bank_name: "",
  amount: 0,
});

const Referral = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [withdrawalForm, setWithdrawalForm] = useState<WithdrawalRequest>(
    emptyWithdrawalForm()
  );
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
    } catch {
      toast.error("Failed to copy referral code");
    }
  };

  const handleShare = async () => {
    if (!referralData) return;

    const shareUrl = `${window.location.origin}/authenticate/register?ref=${referralData.referral_code}`;
    const shareText = `Join Stepra and earn rewards! Use my referral code: ${referralData.referral_code}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Stepra",
          text: shareText,
          url: shareUrl,
        });
        trackEvent("referral_share", { method: "web_share" });
      } catch {
        // User cancelled or error occurred
      }
    } else {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      trackEvent("referral_share", { method: "clipboard" });
      toast.success("Referral link copied to clipboard!");
    }
  };

  const handleWithdrawal = async () => {
    if (!referralData) return;

    const accountName = withdrawalForm.account_name.trim();
    const bankName = withdrawalForm.bank_name.trim();
    const accountNumber = withdrawalForm.account_number.trim();
    const minAmount = referralData.min_withdrawal_amount || 1000;

    if (!accountName || accountName.length < 2) {
      toast.error("Please enter the account name");
      return;
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      toast.error("Account number must be exactly 10 digits");
      return;
    }

    if (!bankName || bankName.length < 2) {
      toast.error("Please enter your bank name");
      return;
    }

    if (!withdrawalForm.amount || withdrawalForm.amount < minAmount) {
      toast.error(
        `Minimum withdrawal amount is ₦${minAmount.toLocaleString()}`
      );
      return;
    }

    if (withdrawalForm.amount > referralData.credit_balance) {
      toast.error("Insufficient balance");
      return;
    }

    try {
      setWithdrawing(true);
      const response = await requestWithdrawal({
        account_name: accountName,
        account_number: accountNumber,
        bank_name: bankName,
        amount: withdrawalForm.amount,
      });

      if (response.success) {
        setWithdrawalSuccess(true);
        setShowWithdrawalForm(false);
        setWithdrawalForm(emptyWithdrawalForm());
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
            <p className="text-destructive mb-4">Failed to load referral data</p>
            <Button onClick={() => navigate("/dashboard")}>Go Back</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const minWithdrawal = referralData.min_withdrawal_amount || 1000;
  const rewardAmount = referralData.reward_amount || 500;

  return (
    <AppLayout>
      <div className="w-full">
        <div className="max-w-5xl mx-auto">
          {withdrawalSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-green-800">
                Withdrawal request submitted. We will pay into your bank account
                once an admin processes it.
              </p>
            </div>
          )}

          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Wallet className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Available Balance
                  </p>
                  <p className="text-3xl font-bold">
                    ₦{referralData?.credit_balance?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
              {referralData.credit_balance >= minWithdrawal && (
                <Button
                  onClick={() => setShowWithdrawalForm(true)}
                  variant="outline"
                >
                  Withdraw
                </Button>
              )}
            </div>
            {referralData.credit_balance < minWithdrawal && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    Minimum withdrawal amount is ₦
                    {minWithdrawal.toLocaleString()}. Refer more friends to
                    increase your balance!
                  </p>
                </div>
              </div>
            )}
          </div>

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
                ₦
                {referralData?.statistics?.total_rewards?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-muted-foreground">Total Rewards</p>
            </div>
          </div>

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
                  <p className="font-medium">
                    Earn ₦{rewardAmount.toLocaleString()} per referral
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You earn ₦{rewardAmount.toLocaleString()} when they
                    subscribe
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <p className="font-medium">Withdraw to your bank</p>
                  <p className="text-sm text-muted-foreground">
                    Submit your bank details once you reach ₦
                    {minWithdrawal.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {referralData.recent_withdrawals?.length > 0 && (
            <div className="bg-card border rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Recent Withdrawals</h3>
              <div className="space-y-3">
                {referralData.recent_withdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.uuid}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-semibold">
                        ₦{withdrawal.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatWithdrawalDestination(withdrawal)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        withdrawal.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : withdrawal.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {withdrawal.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {referralData.recent_referrals.length > 0 && (
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Referrals</h3>
              <div className="space-y-4">
                {referralData.recent_referrals.map((referral) => (
                  <div
                    key={referral.uuid}
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

      {showWithdrawalForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Withdraw to Bank</h3>
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
                label="Account Name"
                type="text"
                placeholder="Name on the account"
                value={withdrawalForm.account_name}
                onChange={(e) =>
                  setWithdrawalForm({
                    ...withdrawalForm,
                    account_name: e.target.value,
                  })
                }
              />

              <Input
                label="Account Number"
                type="text"
                inputMode="numeric"
                maxLength={10}
                placeholder="0123456789"
                value={withdrawalForm.account_number}
                onChange={(e) =>
                  setWithdrawalForm({
                    ...withdrawalForm,
                    account_number: e.target.value.replace(/\D/g, "").slice(0, 10),
                  })
                }
              />

              <Input
                label="Bank Name"
                type="text"
                placeholder="e.g. GTBank, Access Bank"
                value={withdrawalForm.bank_name}
                onChange={(e) =>
                  setWithdrawalForm({
                    ...withdrawalForm,
                    bank_name: e.target.value,
                  })
                }
                leftIcon={<Building2 className="h-4 w-4" />}
              />

              <Input
                label="Amount (₦)"
                type="number"
                placeholder={`${minWithdrawal}`}
                min={minWithdrawal}
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
                    setWithdrawalForm(emptyWithdrawalForm());
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
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
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
