import { Link } from "react-router";
import { Button } from "@/components/ui";
import { Logo } from "@/components/logo";
import { GraduationCap, BookOpen, Shield } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/60 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Logo to="/" variant="logo" height={28} width={28} />
          <Link to="/" className="font-semibold text-lg tracking-tight text-foreground no-underline hover:opacity-90">
            Stepra
          </Link>
        </div>
        <div className="flex items-center gap-3">
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
            Stepra helps you prepare for JAMB and more with past questions,
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
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-20 max-w-4xl mx-auto">
          <div className="rounded-xl border border-border bg-card p-6 text-left">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground mb-2">Past & practice questions</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Work through structured sets with instant feedback after each session.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 text-left">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground mb-2">Built for Nigerian exams</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Flows tuned for typical exam bundles and departmental practice paths.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 text-left">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground mb-2">Privacy-conscious</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Read how we handle your data on our{' '}
              <Link to="/privacy-policy" className="text-primary underline-offset-4 hover:underline">
                privacy policy
              </Link>
              .
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/60 px-6 py-8 mt-auto">
        <div className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Stepra. All rights reserved.</span>
          <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
