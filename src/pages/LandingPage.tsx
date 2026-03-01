import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowRight, Gift, ShieldCheck, Users, Zap, Vote } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Loader2 } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const { settings, loading } = useSiteSettings();

  const siteName = settings?.site_name || "MegaOdds";
  const siteMode = settings?.site_mode || "mystery_boxes";
  const initial = siteName[0] || "M";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-black text-lg tracking-tight select-none">
              {initial}
            </div>
            <span className="font-bold text-lg text-foreground">{siteName}</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {siteMode === "elections" && (
              <Button onClick={() => navigate("/vote")} variant="ghost" size="sm">
                Vote
              </Button>
            )}
            <Button onClick={() => navigate("/login")} variant="outline" size="sm">
              Admin Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 pt-24 pb-20 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            {siteMode === "elections" ? "Fair & Transparent Voting" : "Fair & Transparent Category Assignment"}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl mx-auto leading-tight">
            {siteMode === "elections" ? (
              <>
                <span className="text-primary text-glow">Election</span>{" "}Voting Portal
              </>
            ) : (
              <>
                Mystery Box{" "}
                <span className="text-primary text-glow">Category</span>{" "}
                Selection
              </>
            )}
          </h1>

          <p className="mt-6 text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            {siteMode === "elections"
              ? "Vote for your preferred candidates in active elections. Fair, secure, and transparent."
              : "Each admin picks two mystery boxes to reveal their assigned categories. Fair, random, and exciting."
            }
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {siteMode === "elections" ? (
              <>
                <Button
                  size="lg"
                  onClick={() => navigate("/vote")}
                  className="font-semibold gap-2 glow-primary px-8"
                >
                  <Vote className="w-5 h-5" />
                  Vote Now
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/login")}
                  className="font-semibold gap-2 px-8"
                >
                  Admin Portal
                </Button>
              </>
            ) : (
              <Button
                size="lg"
                onClick={() => navigate("/login")}
                className="font-semibold gap-2 glow-primary px-8"
              >
                Enter Portal
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <h2 className="text-center text-2xl font-bold text-foreground mb-12">
            How It Works
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {siteMode === "elections" ? (
              <>
                {[
                  { icon: ShieldCheck, title: "Get Approved", desc: "Request voter access for an active election and wait for admin approval." },
                  { icon: Vote, title: "Cast Your Vote", desc: "Browse candidates and vote for your preferred choice. One vote per election." },
                  { icon: Users, title: "Transparent Results", desc: "All votes are recorded securely. Fair and tamper-proof voting." },
                ].map((f) => (
                  <div key={f.title} className="text-center p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                      <f.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </>
            ) : (
              <>
                {[
                  { icon: ShieldCheck, title: "Secure Access", desc: "Enter with your admin credentials to access the selection portal securely." },
                  { icon: Gift, title: "Pick Your Boxes", desc: "Choose 2 mystery boxes from the grid. Each box hides a unique category." },
                  { icon: Users, title: "Fair Assignment", desc: "Once picked, the category is yours. No duplicates, no conflicts." },
                ].map((f) => (
                  <div key={f.title} className="text-center p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                      <f.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center font-black text-xs select-none">
              {initial}
            </div>
            <span>{siteName}</span>
          </div>
          <span>&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
