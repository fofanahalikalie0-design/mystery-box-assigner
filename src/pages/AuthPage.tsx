import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { dbUpsertProfile, dbAssignAdminRole, dbAssignSuperAdminRole } from "@/lib/db";

// Shared credentials gate
const ADMIN_USERNAME = "MEGA";
const ADMIN_GATE_PASSWORD = "ODDS"; // 4-char gate code admins type
const ADMIN_AUTH_PASSWORD = "ODDS_MegaOdds_2024!"; // internal Supabase auth password (never shown)
const SUPER_ADMIN_USERNAME = "Megaodds";
const SUPER_ADMIN_PASSWORD = "Megaodds";
const SUPER_ADMIN_EMAIL = "megaodds@megaodds.admin";

type Step = "gate" | "register";

export default function AuthPage() {
  const [step, setStep] = useState<Step>("gate");
  const [gateUsername, setGateUsername] = useState("");
  const [gatePassword, setGatePassword] = useState("");
  const [showGatePassword, setShowGatePassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Personal info (register step)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const handleGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Super admin path
    if (
      gateUsername.toLowerCase() === SUPER_ADMIN_USERNAME.toLowerCase() &&
      gatePassword === SUPER_ADMIN_PASSWORD
    ) {
      setLoading(true);
      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: SUPER_ADMIN_EMAIL,
          password: SUPER_ADMIN_PASSWORD,
        });
        if (signInError) {
          toast.error("Super admin account not set up. Please contact support.");
        }
      } finally {
        setLoading(false);
      }
      return;
    }

  // Regular admin gate
  if (gateUsername === ADMIN_USERNAME && gatePassword === ADMIN_GATE_PASSWORD) {
      setStep("register");
      return;
    }

    toast.error("Invalid credentials. Please check your username and password.");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      // Try sign in first (returning user)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: ADMIN_AUTH_PASSWORD,
      });

      if (!signInError && signInData.user) {
        // Returning user – upsert profile with updated name
        await dbUpsertProfile(
          signInData.user.id,
          firstName.trim(),
          lastName.trim(),
          email.toLowerCase().trim(),
          whatsapp.trim() || null
        );
        return;
      }

      // New user – sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password: ADMIN_AUTH_PASSWORD,
        options: { emailRedirectTo: window.location.origin },
      });

      if (signUpError) {
        toast.error(signUpError.message);
        return;
      }

      if (signUpData.user) {
        await dbUpsertProfile(
          signUpData.user.id,
          firstName.trim(),
          lastName.trim(),
          email.toLowerCase().trim(),
          whatsapp.trim() || null
        );
        await dbAssignAdminRole(signUpData.user.id);

        // Sign in immediately
        await supabase.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password: ADMIN_AUTH_PASSWORD,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 float-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground glow-primary mb-4">
            <span className="text-3xl font-black select-none">M</span>
          </div>
          <h1 className="text-3xl font-bold text-glow text-primary">MegaOdds</h1>
          <p className="text-muted-foreground mt-1 text-sm">Category Assignment Portal</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          {/* Step: Gate */}
          {step === "gate" && (
            <>
              <div className="flex items-center gap-2 mb-6">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Access Portal</h2>
              </div>
              <form onSubmit={handleGateSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gate-username">Username</Label>
                  <Input
                    id="gate-username"
                    placeholder="Enter username"
                    value={gateUsername}
                    onChange={(e) => setGateUsername(e.target.value)}
                    required
                    autoComplete="off"
                    className="bg-muted border-border focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gate-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="gate-password"
                      type={showGatePassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={gatePassword}
                      onChange={(e) => setGatePassword(e.target.value)}
                      required
                      className="bg-muted border-border focus:border-primary pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGatePassword(!showGatePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showGatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary"
                >
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Authenticating...</> : "Enter Portal"}
                </Button>
              </form>
            </>
          )}

          {/* Step: Personal Info */}
          {step === "register" && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <User className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Your Details</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-6">
                MegaOdds is happy to have you as admin. Please fill in your information.
              </p>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="first-name"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="bg-muted border-border focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="last-name"
                      placeholder="Smith"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="bg-muted border-border focus:border-primary"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-muted border-border focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp Number</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="bg-muted border-border focus:border-primary"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold glow-primary"
                >
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Entering...</> : "Enter Dashboard"}
                </Button>
                <button
                  type="button"
                  onClick={() => setStep("gate")}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center pt-1"
                >
                  ← Back to login
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
