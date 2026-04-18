import { useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/cognito";
import { apiPost } from "@/lib/api";

interface LoginViewProps {
  onBack: () => void;
  onSuccess: () => void;
  onGoToSignup: () => void;
}

export function LoginView({ onBack, onSuccess, onGoToSignup }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) return setError("Please enter your email.");
    if (!password) return setError("Please enter your password.");

    setIsSubmitting(true);
    try {
      await login(email, password);
      
      // Bootstrap to ensure their DB profile exists/loads
      await apiPost("/me/bootstrap", {});
      
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#10120f]">
      <header className="w-full">
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="flex items-center gap-3 text-sm font-semibold tracking-[0.04em] text-[#10120f]"
            onClick={onBack}
          >
            <span className="brand-pill">
              <Heart className="h-4 w-4" />
            </span>
            PantryPal
          </button>
          <button type="button" className="text-sm font-semibold text-[#10120f]" onClick={onGoToSignup}>
            Create Account
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1180px] justify-center px-4 pb-20 pt-2 sm:px-6 lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: "easeOut" }}
          className="w-full max-w-[440px]"
        >
          <div className="auth-stack">
            <div>
              <h1 className="page-title text-[#10120f]">
                Welcome Back
              </h1>
              <p className="mt-4 text-[0.96rem] text-[rgba(16,18,15,0.62)]">
                Log in to access your PantryPal workspace and continue where you left off.
              </p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="auth-label">
                Email address
                <Input
                  className="auth-input"
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <label className="auth-label">
                Password
                <div className="relative">
                  <Input
                    className="auth-input pr-16"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button className="auth-inline-action" type="button" onClick={() => setShowPassword((current) => !current)}>
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              <div className="flex items-center justify-between gap-4 text-sm">
                <label className="auth-check">
                  <input type="checkbox" />
                  <span>Keep me signed in</span>
                </label>
                <button type="button" className="font-semibold text-[#10120f]">Forgot password?</button>
              </div>

              {error && (
                <div className="rounded-[8px] border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <button className="auth-submit auth-submit--primary" disabled={isSubmitting} type="submit">
                {isSubmitting ? "Logging in..." : "Log in"}
              </button>
            </form>

            <div className="flex items-center justify-between gap-3 text-sm text-[rgba(16,18,15,0.62)] mt-6">
              <span>New to PantryPal?</span>
              <button type="button" className="font-semibold text-[#10120f]" onClick={onGoToSignup}>
                Create an Account
              </button>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
