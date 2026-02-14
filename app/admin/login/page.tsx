"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2, Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 60;

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type View = "login" | "signup" | "forgot" | "forgot-sent" | "signup-done";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [view, setView] = useState<View>("login");

  // Handle redirect messages from OAuth callback
  useEffect(() => {
    const message = searchParams.get("message");
    const error = searchParams.get("error");
    if (message === "pending_approval") {
      toast({
        title: "Account Pending Approval",
        description: "Your account has been created and is awaiting admin approval. You'll be notified once approved.",
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/admin/login");
    }
    if (message === "session_expired") {
      toast({
        title: "Session Expired",
        description: "You have been logged out due to inactivity. Please sign in again.",
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/admin/login");
    }
    if (error === "auth_failed") {
      toast({
        title: "Authentication Failed",
        description: "Something went wrong during sign in. Please try again.",
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/admin/login");
    }
  }, [searchParams, toast]);
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginTouched, setLoginTouched] = useState({ email: false, password: false });

  // Signup state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);
  const [signupTouched, setSignupTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirm: false,
  });

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");

  // Rate limiting
  const [attempts, setAttempts] = useState(0);
  const [lockoutEnd, setLockoutEnd] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Auto-focus
  const loginEmailRef = useRef<HTMLInputElement>(null);
  const signupNameRef = useRef<HTMLInputElement>(null);
  const forgotEmailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (view === "login") loginEmailRef.current?.focus();
    if (view === "signup") signupNameRef.current?.focus();
    if (view === "forgot") forgotEmailRef.current?.focus();
  }, [view]);

  // Lockout countdown
  useEffect(() => {
    if (!lockoutEnd) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockoutEnd - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutEnd(null);
        setLockoutRemaining(0);
        setAttempts(0);
      } else {
        setLockoutRemaining(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutEnd]);

  const isLockedOut = lockoutEnd !== null && Date.now() < lockoutEnd;

  // Validation helpers
  const loginEmailError = loginTouched.email && !validateEmail(loginEmail) && loginEmail.length > 0;
  const loginEmailEmpty = loginTouched.email && loginEmail.length === 0;
  const loginPasswordEmpty = loginTouched.password && loginPassword.length === 0;

  const signupNameEmpty = signupTouched.name && signupName.length === 0;
  const signupEmailError = signupTouched.email && !validateEmail(signupEmail) && signupEmail.length > 0;
  const signupEmailEmpty = signupTouched.email && signupEmail.length === 0;
  const signupPasswordShort = signupTouched.password && signupPassword.length > 0 && signupPassword.length < 6;
  const signupPasswordEmpty = signupTouched.password && signupPassword.length === 0;
  const signupConfirmMismatch = signupTouched.confirm && signupConfirm.length > 0 && signupConfirm !== signupPassword;
  const signupConfirmEmpty = signupTouched.confirm && signupConfirm.length === 0;

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginTouched({ email: true, password: true });

    if (!validateEmail(loginEmail) || !loginPassword) return;
    if (isLockedOut) return;

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          setLockoutEnd(Date.now() + LOCKOUT_DURATION * 1000);
          setLockoutRemaining(LOCKOUT_DURATION);
          toast({
            title: "Too many attempts",
            description: `Account temporarily locked. Try again in ${LOCKOUT_DURATION} seconds.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Invalid email or password",
            description: `Please check your credentials and try again. (${MAX_ATTEMPTS - newAttempts} attempts remaining)`,
            variant: "destructive",
          });
        }
        return;
      }

      // Check admin_users table
      const { data: adminUser } = await supabase
        .from("admin_users")
        .select("is_approved")
        .eq("auth_id", data.user.id)
        .single();

      if (!adminUser) {
        await supabase.auth.signOut();
        toast({
          title: "Account not found",
          description: "No admin profile exists for this account. Please sign up first.",
          variant: "destructive",
        });
        return;
      }

      if (!adminUser.is_approved) {
        await supabase.auth.signOut();
        toast({
          title: "Pending approval",
          description: "Your account is awaiting admin approval. You'll be notified once approved.",
          variant: "destructive",
        });
        return;
      }

      setAttempts(0);
      toast({
        title: "Welcome back!",
        description: "Redirecting to dashboard...",
      });

      router.push("/admin");
      router.refresh();
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [loginEmail, loginPassword, attempts, isLockedOut, router, toast]);

  const handleSignup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupTouched({ name: true, email: true, password: true, confirm: true });

    if (!signupName || !validateEmail(signupEmail) || signupPassword.length < 6 || signupPassword !== signupConfirm) return;

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: { data: { full_name: signupName } },
      });

      if (error) {
        toast({
          title: "Signup failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        await supabase.from("admin_users").insert({
          auth_id: data.user.id,
          email: signupEmail,
          full_name: signupName,
          is_approved: false,
          is_super_admin: false,
        });
      }

      await supabase.auth.signOut();
      setView("signup-done");
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [signupName, signupEmail, signupPassword, signupConfirm, toast]);

  const handleForgotPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(forgotEmail)) return;

    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/admin/reset-password`,
      });
      setView("forgot-sent");
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [forgotEmail, toast]);

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback?next=/admin` },
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="Mad Monkey eBike Tours"
            width={120}
            height={120}
            className="h-24 w-auto mx-auto mb-2"
            priority
          />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-foreground">
            {view === "login" && "Welcome back"}
            {view === "signup" && "Create an account"}
            {view === "forgot" && "Reset your password"}
            {view === "forgot-sent" && "Check your email"}
            {view === "signup-done" && "Account created"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1">
            {view === "login" && "Sign in to access the admin dashboard"}
            {view === "signup" && "New accounts require admin approval"}
            {view === "forgot" && "We'll send you a reset link"}
            {view === "forgot-sent" && "A password reset link has been sent"}
            {view === "signup-done" && "Your account is pending approval"}
          </p>
        </div>

        <Card className="shadow-sm">
          <CardContent className="pt-6">
            {/* ─── LOGIN VIEW ─── */}
            {view === "login" && (
              <>
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="text-sm font-medium">
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        ref={loginEmailRef}
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        onBlur={() => setLoginTouched((p) => ({ ...p, email: true }))}
                        className={`pl-10 ${loginEmailError || loginEmailEmpty ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                        autoComplete="email"
                        required
                      />
                    </div>
                    {loginEmailError && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Please enter a valid email address
                      </p>
                    )}
                    {loginEmailEmpty && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Email is required
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-sm font-medium">
                        Password
                      </Label>
                      <button
                        type="button"
                        onClick={() => { setForgotEmail(loginEmail); setView("forgot"); }}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        onBlur={() => setLoginTouched((p) => ({ ...p, password: true }))}
                        className={`pl-10 pr-10 ${loginPasswordEmpty ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        tabIndex={-1}
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {loginPasswordEmpty && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Password is required
                      </p>
                    )}
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <label htmlFor="remember-me" className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                      Remember me
                    </label>
                  </div>

                  {/* Lockout Warning */}
                  {isLockedOut && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                      <p className="text-sm text-red-600">
                        Too many failed attempts. Try again in <strong>{lockoutRemaining}s</strong>
                      </p>
                    </div>
                  )}

                  {/* Submit */}
                  <Button type="submit" className="w-full h-10" disabled={loading || isLockedOut}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-card px-3 text-xs text-gray-400 dark:text-muted-foreground">
                    or continue with
                  </span>
                </div>

                {/* Social Login */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10"
                  onClick={handleGoogleLogin}
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </Button>

                {/* Switch to Signup */}
                <p className="text-center text-sm text-gray-500 dark:text-muted-foreground mt-6">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setView("signup")}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              </>
            )}

            {/* ─── SIGNUP VIEW ─── */}
            {view === "signup" && (
              <>
                <form onSubmit={handleSignup} className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        ref={signupNameRef}
                        id="signup-name"
                        placeholder="John Doe"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        onBlur={() => setSignupTouched((p) => ({ ...p, name: true }))}
                        className={`pl-10 ${signupNameEmpty ? "border-red-400" : ""}`}
                        autoComplete="name"
                        required
                      />
                    </div>
                    {signupNameEmpty && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Full name is required
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="text-sm font-medium">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        onBlur={() => setSignupTouched((p) => ({ ...p, email: true }))}
                        className={`pl-10 ${signupEmailError || signupEmailEmpty ? "border-red-400" : ""}`}
                        autoComplete="email"
                        required
                      />
                    </div>
                    {signupEmailError && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Please enter a valid email address
                      </p>
                    )}
                    {signupEmailEmpty && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Email is required
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="Min 6 characters"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        onBlur={() => setSignupTouched((p) => ({ ...p, password: true }))}
                        className={`pl-10 pr-10 ${signupPasswordShort || signupPasswordEmpty ? "border-red-400" : ""}`}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {signupPasswordShort && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Password must be at least 6 characters
                      </p>
                    )}
                    {signupPasswordEmpty && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Password is required
                      </p>
                    )}
                    {signupTouched.password && signupPassword.length >= 6 && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Password strength: OK
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-confirm" className="text-sm font-medium">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-confirm"
                        type={showSignupConfirm ? "text" : "password"}
                        placeholder="Re-enter password"
                        value={signupConfirm}
                        onChange={(e) => setSignupConfirm(e.target.value)}
                        onBlur={() => setSignupTouched((p) => ({ ...p, confirm: true }))}
                        className={`pl-10 pr-10 ${signupConfirmMismatch || signupConfirmEmpty ? "border-red-400" : ""}`}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupConfirm(!showSignupConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {showSignupConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {signupConfirmMismatch && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Passwords do not match
                      </p>
                    )}
                    {signupConfirmEmpty && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Please confirm your password
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full h-10" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>

                <p className="text-center text-sm text-gray-500 dark:text-muted-foreground mt-6">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </>
            )}

            {/* ─── FORGOT PASSWORD VIEW ─── */}
            {view === "forgot" && (
              <>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="forgot-email" className="text-sm font-medium">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        ref={forgotEmailRef}
                        id="forgot-email"
                        type="email"
                        placeholder="you@example.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="pl-10"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-10" disabled={loading || !validateEmail(forgotEmail)}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </form>
                <p className="text-center text-sm text-gray-500 dark:text-muted-foreground mt-6">
                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className="text-primary font-medium hover:underline"
                  >
                    Back to sign in
                  </button>
                </p>
              </>
            )}

            {/* ─── FORGOT PASSWORD SENT ─── */}
            {view === "forgot-sent" && (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  If an account exists for <strong>{forgotEmail}</strong>, you&apos;ll receive a password reset link shortly.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setView("login")}
                >
                  Back to sign in
                </Button>
              </div>
            )}

            {/* ─── SIGNUP DONE ─── */}
            {view === "signup-done" && (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Your account has been created and is <strong>pending admin approval</strong>.
                  You&apos;ll be able to sign in once an administrator approves your request.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setView("login")}
                >
                  Back to sign in
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer / Legal */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-xs text-gray-400 dark:text-muted-foreground">
            &copy; {new Date().getFullYear()} Mad Monkey eBike Tours. All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-3 text-xs text-gray-400 dark:text-muted-foreground">
            <a href="https://madmonkeycnx.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 dark:hover:text-gray-300 hover:underline">
              Privacy Policy
            </a>
            <span>&middot;</span>
            <a href="https://madmonkeycnx.com/terms-of-service" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 dark:hover:text-gray-300 hover:underline">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
