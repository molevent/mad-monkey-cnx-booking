"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [touched, setTouched] = useState({ password: false, confirm: false });

  const passwordShort = touched.password && password.length > 0 && password.length < 6;
  const passwordEmpty = touched.password && password.length === 0;
  const confirmMismatch = touched.confirm && confirm.length > 0 && confirm !== password;
  const confirmEmpty = touched.confirm && confirm.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ password: true, confirm: true });

    if (password.length < 6 || password !== confirm) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setDone(true);
      toast({
        title: "Password Updated",
        description: "Your password has been reset successfully.",
      });
    } catch {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-background px-4">
      <div className="w-full max-w-sm">
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
            {done ? "Password Updated" : "Set New Password"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1">
            {done ? "You can now sign in with your new password" : "Enter your new password below"}
          </p>
        </div>

        <Card className="shadow-sm">
          <CardContent className="pt-6">
            {done ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Your password has been successfully updated.
                </p>
                <Button className="w-full" onClick={() => router.push("/admin/login")}>
                  Go to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-sm font-medium">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                      className={`pl-10 pr-10 ${passwordShort || passwordEmpty ? "border-red-400" : ""}`}
                      autoComplete="new-password"
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordShort && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Password must be at least 6 characters
                    </p>
                  )}
                  {passwordEmpty && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Password is required
                    </p>
                  )}
                  {touched.password && password.length >= 6 && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Password strength: OK
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-sm font-medium">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      onBlur={() => setTouched((p) => ({ ...p, confirm: true }))}
                      className={`pl-10 pr-10 ${confirmMismatch || confirmEmpty ? "border-red-400" : ""}`}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmMismatch && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Passwords do not match
                    </p>
                  )}
                  {confirmEmpty && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Please confirm your password
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full h-10" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-xs text-gray-400 dark:text-muted-foreground">
            &copy; {new Date().getFullYear()} Mad Monkey eBike Tours. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
