import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateUser } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Mountain, Eye, EyeOff, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "At least 6 characters", pass: password.length >= 6 },
    { label: "Contains a number", pass: /\d/.test(password) },
    { label: "Contains a letter", pass: /[a-zA-Z]/.test(password) },
  ];
  const passed = checks.filter(c => c.pass).length;
  const strength = passed === 0 ? null : passed === 1 ? "weak" : passed === 2 ? "fair" : "strong";
  const barColor = strength === "weak" ? "bg-red-500" : strength === "fair" ? "bg-amber-500" : "bg-emerald-500";

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1 h-1.5">
        {[1, 2, 3].map(n => (
          <div key={n} className={`flex-1 rounded-full transition-colors ${n <= passed ? barColor : "bg-muted"}`} />
        ))}
      </div>
      <div className="space-y-1">
        {checks.map(({ label, pass }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs">
            {pass
              ? <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
              : <XCircle className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />}
            <span className={pass ? "text-emerald-700" : "text-muted-foreground"}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const registerMutation = useCreateUser();

  function validate() {
    const e: Record<string, string> = {};
    if (!username.trim()) e.username = "Username is required";
    else if (username.length < 3) e.username = "Must be at least 3 characters";
    else if (!/^[a-zA-Z0-9_]+$/.test(username)) e.username = "Only letters, numbers, and underscores";

    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Must be at least 6 characters";

    if (!confirmPassword) e.confirm = "Please confirm your password";
    else if (password !== confirmPassword) e.confirm = "Passwords do not match";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const user = await registerMutation.mutateAsync({
        data: { username: username.trim(), password, role: "user" }
      });
      login(user);
      toast({ title: "Welcome to Trail Connect!", description: "Your account has been created." });
      setLocation("/explore");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "";
      if (msg.toLowerCase().includes("taken") || msg.includes("409") || msg.includes("already")) {
        setErrors(prev => ({ ...prev, username: "This username is already taken" }));
      } else {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: "Something went wrong. Please try again.",
        });
      }
    }
  };

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <Layout>
      <div className="flex-1 flex min-h-[calc(100vh-4rem)]">
        {/* Left panel — visual */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=80"
            alt="Nepal trek"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-transparent" />
          <div className="relative z-10 flex flex-col justify-end p-12 text-white">
            <div className="flex items-center gap-2 mb-8">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                <Mountain className="h-6 w-6" />
              </div>
              <span className="font-bold text-xl">Trail Connect</span>
            </div>
            <h2 className="text-4xl font-bold leading-tight mb-4">
              Your Himalayan adventure starts here
            </h2>
            <p className="text-white/80 text-base leading-relaxed mb-8">
              Join thousands of trekkers planning epic Nepal expeditions — from Everest Base Camp to the Annapurna Circuit.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Routes", value: "15+" },
                { label: "Trekkers", value: "2k+" },
                { label: "Summits", value: "8" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold">{value}</div>
                  <div className="text-white/70 text-xs mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
                <Mountain className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl text-primary">Trail Connect</span>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight mb-2">Create your account</h1>
              <p className="text-muted-foreground">
                Already have one?{" "}
                <button
                  onClick={() => setLocation("/login")}
                  className="text-primary font-medium hover:underline"
                >
                  Sign in instead
                </button>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Username */}
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="e.g. trekker_sam"
                  value={username}
                  onChange={e => {
                    setUsername(e.target.value);
                    if (errors.username) setErrors(prev => ({ ...prev, username: "" }));
                  }}
                  className={errors.username ? "border-destructive focus-visible:ring-destructive" : ""}
                  autoComplete="username"
                />
                {errors.username && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <XCircle className="h-3 w-3" />{errors.username}
                  </p>
                )}
                {!errors.username && username.length >= 3 && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />Looks good!
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors(prev => ({ ...prev, password: "" }));
                    }}
                    className={`pr-10 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <XCircle className="h-3 w-3" />{errors.password}
                  </p>
                )}
                <PasswordStrength password={password} />
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Type your password again"
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirm) setErrors(prev => ({ ...prev, confirm: "" }));
                    }}
                    className={`pr-10 ${
                      errors.confirm
                        ? "border-destructive focus-visible:ring-destructive"
                        : passwordsMatch
                        ? "border-emerald-500 focus-visible:ring-emerald-500"
                        : ""
                    }`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirm && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <XCircle className="h-3 w-3" />{errors.confirm}
                  </p>
                )}
                {passwordsMatch && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />Passwords match
                  </p>
                )}
                {passwordMismatch && !errors.confirm && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />Passwords don't match yet
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold gap-2"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  "Creating your account…"
                ) : (
                  <>Create account <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By creating an account you agree to use Trail Connect responsibly
                and respect local trekking regulations in Nepal.
              </p>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
