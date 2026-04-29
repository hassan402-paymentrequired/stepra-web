import { Link } from "react-router";
import { Logo } from "@/components/logo";

const SUPPORT_EMAIL = "support@stepra.com";

/**
 * Public URL for Play Console / Google requirements: users must be able to learn how to request
 * account and associated data deletion.
 */
const DeleteAccount = () => {
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    "Account and data deletion request",
  )}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/60 px-6 py-4 max-w-3xl mx-auto w-full flex items-center gap-6">
        <div className="flex items-center gap-2 shrink-0">
          <Logo to="/" variant="logo" height={28} width={28} />
          <Link to="/" className="font-semibold text-foreground no-underline hover:opacity-90">
            Stepra
          </Link>
        </div>
        <span className="text-muted-foreground text-sm hidden sm:inline">Delete account &amp; data</span>
      </header>

      <main className="flex-1 px-6 py-12 max-w-3xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-foreground mb-2">Delete your account and data</h1>
        <p className="text-sm text-muted-foreground mb-10">
          How to request removal of your Stepra account and associated personal data.
        </p>

        <p className="text-foreground/90 leading-relaxed mb-6">
          You may ask us to delete your account and the personal data linked to it. After verification,
          we will delete your account and associated data held by Stepra, except where we must keep
          certain information to meet legal or legitimate business requirements (for example, records we
          are required to retain).
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-3">How to request deletion</h2>
        <ol className="list-decimal pl-6 space-y-3 text-foreground/90 leading-relaxed mb-8">
          <li>
            Send an email from the address registered on your Stepra account to{' '}
            <a href={mailto} className="text-primary underline-offset-4 hover:underline">
              {SUPPORT_EMAIL}
            </a>
            .
          </li>
          <li>
            Use the subject line &quot;Account and data deletion request&quot; (or include those words in the body).
          </li>
          <li>
            If your account uses a different email, include the exact email address tied to your Stepra account so we can
            verify ownership.
          </li>
        </ol>

        <p className="text-foreground/90 leading-relaxed mb-8">
          We will confirm receipt when practical and process verified requests within a reasonable period. Some data may
          remain in encrypted backups for a limited time before automatic purge.
        </p>

        <p className="text-sm text-muted-foreground border-t border-border pt-8 flex flex-wrap gap-x-4 gap-y-2">
          <Link to="/privacy-policy" className="text-primary underline-offset-4 hover:underline">
            Privacy Policy
          </Link>
          <span aria-hidden="true" className="text-border">
            ·
          </span>
          <Link to="/" className="text-primary underline-offset-4 hover:underline">
            Back to home
          </Link>
        </p>
      </main>
    </div>
  );
};

export default DeleteAccount;
