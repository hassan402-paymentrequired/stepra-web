import { Link } from "react-router";
import { Logo } from "@/components/logo";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/60 px-6 py-4 max-w-3xl mx-auto w-full flex items-center gap-6">
        <div className="flex items-center gap-2 shrink-0">
          <Logo to="/" variant="logo" height={28} width={28} />
          <Link to="/" className="font-semibold text-foreground no-underline hover:opacity-90">
            Stepra
          </Link>
        </div>
        <span className="text-muted-foreground text-sm hidden sm:inline">Privacy Policy</span>
      </header>

      <main className="flex-1 px-6 py-12 max-w-3xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <p className="text-foreground/90 leading-relaxed mb-6">
          Stepra (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the Stepra application and related
          websites. This Privacy Policy describes how we collect, use, and protect your information when you use our
          services. By using Stepra, you agree to this policy.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">1. Information we collect</h2>
        <ul className="list-disc pl-6 space-y-2 text-foreground/90">
          <li>
            <strong className="text-foreground">Account data:</strong> name, email address, and credentials you provide
            when you register or sign in.
          </li>
          <li>
            <strong className="text-foreground">Exam activity:</strong> answers, scores, streaks, and related metadata
            needed to operate practice and exam features.
          </li>
          <li>
            <strong className="text-foreground">Device and technical data:</strong> device identifiers used for subscription
            or security limits where applicable, plus standard diagnostic data such as app version.
          </li>
          <li>
            <strong className="text-foreground">Payment-related data:</strong> when you subscribe, our payment processor
            may receive payment details; we do not store full card numbers on our servers.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">2. How we use your information</h2>
        <ul className="list-disc pl-6 space-y-2 text-foreground/90">
          <li>To provide and improve Stepra&apos;s educational features.</li>
          <li>To authenticate your account and send important notices (e.g. verification, password reset).</li>
          <li>To enforce subscription limits and prevent abuse.</li>
          <li>To comply with legal obligations where required.</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">3. Sharing</h2>
        <p className="text-foreground/90 leading-relaxed mb-4">
          We do not sell your personal information. We may share data with service providers who help us run the platform
          (e.g. hosting, email delivery, analytics, payment processing) under strict contractual terms.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">4. Security</h2>
        <p className="text-foreground/90 leading-relaxed mb-4">
          We implement reasonable administrative, technical, and organizational safeguards. No online service can guarantee
          absolute security; please use a strong password and protect your credentials.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">5. Your choices</h2>
        <ul className="list-disc pl-6 space-y-2 text-foreground/90">
          <li>You may review or update profile information inside the app or website where available.</li>
          <li>You may opt out of non-essential notifications where we offer preferences.</li>
          <li>
            To request deletion of your account and associated data, follow the instructions on our{' '}
            <Link to="/delete-account" className="text-primary underline-offset-4 hover:underline">
              account and data deletion
            </Link>{' '}
            page.
          </li>
          <li>
            For other privacy requests (including data export where applicable under local law), contact us using the email
            below.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">6. Children</h2>
        <p className="text-foreground/90 leading-relaxed mb-4">
          Stepra is not directed at children under the minimum age required by your region. If you believe we collected
          information from a child inappropriately, please contact us.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">7. Changes</h2>
        <p className="text-foreground/90 leading-relaxed mb-4">
          We may update this policy periodically. Continued use of Stepra after changes constitutes acceptance of the revised
          policy unless otherwise required by law.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">8. Contact</h2>
        <p className="text-foreground/90 leading-relaxed mb-8">
          For privacy questions or requests, contact us at{' '}
          <a href="mailto:support@stepra.com" className="text-primary underline-offset-4 hover:underline">
            support@stepra.com
          </a>
          . Replace this address with your production support email before submitting to stores.
        </p>

        <p className="text-sm text-muted-foreground border-t border-border pt-8">
          <Link to="/" className="text-primary underline-offset-4 hover:underline">
            Back to home
          </Link>
        </p>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
