import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui";
import { Logo } from "@/components/logo";
import { StoreBadge } from "@/components/landing/StoreBadge";
import { WaitlistModal } from "@/components/landing/WaitlistModal";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { WaitlistPlatform } from "@/apis/waitlist";
import { APP_STORE_URL, fetchAppAvailability } from "@/lib/app-store";

const Landing = () => {
  const [waitlistPlatform, setWaitlistPlatform] = useState<WaitlistPlatform | null>(null);
  const [androidStoreUrl, setAndroidStoreUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAppAvailability().then((data) => {
      if (!cancelled) setAndroidStoreUrl(data.androidStoreUrl);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/60 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Logo to="/" variant="logo" height={28} width={28} />
          <Link to="/" className="font-semibold text-lg tracking-tight text-foreground no-underline hover:opacity-90">
            Stepra
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle variant="compact" />
          <Button variant="outline" asChild className="h-9">
            <Link to="/authenticate/login">Log in</Link>
          </Button>
          <Button asChild className="h-9">
            <Link to="/authenticate/register">Get started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 px-6 py-16 md:py-24 max-w-6xl mx-auto w-full">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <p className="text-primary font-medium text-sm uppercase tracking-wider">
            Exam preparation
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
            Practice smarter. Track progress. Aim higher.
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Stepra helps you prepare for EXAM. and more with past questions,
            timed practice, and performance insights—all in one place.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button size="lg" asChild>
              <Link to="/authenticate/register">Create free account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/authenticate/login">I already have an account</Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <StoreBadge platform="ios" href={APP_STORE_URL} />
            {androidStoreUrl ? (
              <StoreBadge platform="android" href={androidStoreUrl} />
            ) : (
              <StoreBadge platform="android" onClick={() => setWaitlistPlatform("android")} />
            )}
          </div>
        </div>

  
      </main>

      <footer className="border-t border-border/60 px-6 py-8 mt-auto">
        <div className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Stepra. All rights reserved.</span>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/delete-account" className="hover:text-foreground transition-colors">
              Delete account &amp; data
            </Link>
          </div>
        </div>
      </footer>

      <WaitlistModal
        open={waitlistPlatform !== null}
        platform={waitlistPlatform}
        onClose={() => setWaitlistPlatform(null)}
      />
    </div>
  );
};

export default Landing;
