import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowRight, Gift, ShieldCheck, Users, Zap } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-black text-lg tracking-tight select-none">
              M
            </div>
            <span className="font-bold text-lg text-foreground">MegaOdds</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={() => navigate("/vote")} variant="ghost" size="sm">
              Vote
            </Button>
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
            Fair &amp; Transparent Category Assignment
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl mx-auto leading-tight">
            Mystery Box{" "}
            <span className="text-primary text-glow">Category</span>{" "}
            Selection
          </h1>

          <p className="mt-6 text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            Each admin picks two mystery boxes to reveal their assigned categories.
            Fair, random, and exciting.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/login")}
              className="font-semibold gap-2 glow-primary px-8"
            >
              Enter Portal
              <ArrowRight className="w-4 h-4" />
            </Button>
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
            {[
              {
                icon: ShieldCheck,
                title: "Secure Access",
                desc: "Enter with your admin credentials to access the selection portal securely.",
              },
              {
                icon: Gift,
                title: "Pick Your Boxes",
                desc: "Choose 2 mystery boxes from the grid. Each box hides a unique category.",
              },
              {
                icon: Users,
                title: "Fair Assignment",
                desc: "Once picked, the category is yours. No duplicates, no conflicts.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="text-center p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center font-black text-xs select-none">
              M
            </div>
            <span>MegaOdds</span>
          </div>
          <span>&copy; {new Date().getFullYear()} MegaOdds. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
