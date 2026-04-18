import { useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { signUp, confirmRegistration, login } from "@/lib/cognito";
import { apiPost } from "@/lib/api";

interface SignupViewProps {
  onBack: () => void;
  onSuccess: () => void;
  onGoToLogin: () => void;
}

export function SignupView({ onBack, onSuccess, onGoToLogin }: SignupViewProps) {
  const [step, setStep] = useState<"signup" | "verify">("signup");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Please enter your name.");
    if (!email.trim()) return setError("Please enter your email.");
    if (!password) return setError("Please create a password.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    setIsSubmitting(true);
    try {
      await signUp(email, password, name);
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!verificationCode.trim()) return setError("Please enter the verification code.");

    setIsSubmitting(true);
    try {
      await confirmRegistration(email, verificationCode);
      
      // Auto login after verification
      await login(email, password);
      
      // Bootstrap the user in our backend database
      await apiPost("/me/bootstrap", {});
      
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [firstName, ...rest] = name.trim().split(" ");
  const lastName = rest.join(" ");

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
          <button type="button" className="text-sm font-semibold text-[#10120f]" onClick={onGoToLogin}>
            Log in
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
          {step === "signup" ? (
            <div className="auth-stack">
              <div>
                <h1 className="page-title text-[#10120f]">Let&apos;s get started</h1>
                <p className="mt-4 text-[0.96rem] text-[rgba(16,18,15,0.62)]">
                  Create your PantryPal account, then move directly into your pantry workspace.
                </p>
              </div>

              <form className="auth-form" onSubmit={handleSignup}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="auth-label">
                    First Name
                    <Input
                      className="auth-input"
                      placeholder="Your first name"
                      value={firstName || ""}
                      onChange={(e) => setName(`${e.target.value} ${lastName}`.trim())}
                    />
                  </label>
                  <label className="auth-label">
                    Last Name
                    <Input
                      className="auth-input"
                      placeholder="Your last name"
                      value={lastName}
                      onChange={(e) => setName(`${firstName || ""} ${e.target.value}`.trim())}
                    />
                  </label>
                </div>

                <label className="auth-label">
                  Email Address
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
                      placeholder="Password (min. of 8 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button className="auth-inline-action" type="button" onClick={() => setShowPassword((current) => !current)}>
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>

                <label className="auth-label">
                  Confirm Password
                  <div className="relative">
                    <Input
                      className="auth-input pr-16"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button className="auth-inline-action" type="button" onClick={() => setShowConfirmPassword((current) => !current)}>
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>

                {error && (
                  <div className="rounded-[8px] border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <button className="auth-submit auth-submit--primary" disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Creating account..." : "Create account"}
                </button>
              </form>

              <div className="flex items-center justify-between gap-3 text-sm text-[rgba(16,18,15,0.62)]">
                <span>Already have an account?</span>
                <button type="button" className="font-semibold text-[#10120f]" onClick={onGoToLogin}>
                  Log In
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-stack">
              <div>
                <h1 className="page-title text-[#10120f]">Check your email</h1>
                <p className="mt-4 text-[0.96rem] text-[rgba(16,18,15,0.62)]">
                  We've sent a verification code to <strong>{email}</strong>. Please enter it below to confirm your account.
                </p>
              </div>

              <form className="auth-form" onSubmit={handleVerify}>
                <label className="auth-label">
                  Verification Code
                  <Input
                    className="auth-input text-center text-lg tracking-widest"
                    type="text"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                  />
                </label>

                {error && (
                  <div className="rounded-[8px] border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <button className="auth-submit auth-submit--primary" disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Verifying..." : "Verify and Log In"}
                </button>
                <button 
                  type="button" 
                  className="auth-submit mt-2 bg-transparent text-[#10120f] border border-[#e8eaec]" 
                  onClick={() => setStep("signup")}
                >
                  Back
                </button>
              </form>
            </div>
          )}
        </motion.section>
      </main>
    </div>
  );
}
