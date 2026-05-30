"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { KeyRound, Mail, Phone, Loader2, ArrowRight, Smartphone, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/firebase";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult
} from "firebase/auth";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  // Auth Modes: "password" or "otp"
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [loading, setLoading] = useState(false);

  // Password Login Fields
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // OTP Login Fields
  const [phoneNum, setPhoneNum] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Clean up recaptcha verifier on unmount
  useEffect(() => {
    return () => {
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (e) {
          // ignore
        }
        (window as any).recaptchaVerifier = null;
      }
    };
  }, []);

  const handleRedirect = async () => {
    try {
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      
      if (session?.user?.role === "ADMIN" || session?.user?.role === "STAFF") {
        router.push("/admin");
      } else {
        router.push(callbackUrl);
      }
      router.refresh();
    } catch (err) {
      console.error("Redirect check failed:", err);
      router.push(callbackUrl);
      router.refresh();
    }
  };

  // Standard Password Auth
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error("Please enter all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
      });

      if (res?.error) {
        toast.error("Invalid email, phone, or password");
        setLoading(false);
      } else {
        toast.success("Logged in successfully!");
        await handleRedirect();
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  // Google Sign-In
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();

      const res = await signIn("firebase", {
        token,
        redirect: false,
      });

      if (res?.error) {
        toast.error("Failed to sync Google account session.");
        setLoading(false);
      } else {
        toast.success("Successfully logged in with Google!");
        await handleRedirect();
      }
    } catch (error: any) {
      console.error("Google login error:", error);
      if (error.code === "auth/popup-closed-by-user") {
        toast.error("Google sign-in popup was closed.");
      } else if (error.code === "auth/configuration-not-found") {
        toast.error("Google Auth is not configured in Firebase console yet.");
      } else {
        toast.error(error.message || "Google sign-in failed.");
      }
      setLoading(false);
    }
  };

  // SMS Recaptcha configuration
  const setupRecaptcha = () => {
    if ((window as any).recaptchaVerifier) {
      return (window as any).recaptchaVerifier;
    }
    
    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {},
      "expired-callback": () => {
        toast.error("reCAPTCHA expired. Please try again.");
      }
    });
    
    (window as any).recaptchaVerifier = verifier;
    return verifier;
  };

  // Request SMS OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNum) {
      toast.error("Please enter your phone number");
      return;
    }

    setLoading(true);
    try {
      let formattedPhone = phoneNum.trim();
      if (!formattedPhone.startsWith("+")) {
        if (formattedPhone.length === 10) {
          formattedPhone = `+91${formattedPhone}`;
        } else {
          toast.error("Please enter a valid 10-digit number or prefix with country code (e.g. +91)");
          setLoading(false);
          return;
        }
      }

      const appVerifier = setupRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      
      setConfirmationResult(confirmation);
      setOtpSent(true);
      toast.success("Verification code sent via SMS!");
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast.error(error.message || "Failed to send SMS. Make sure phone auth is enabled in Firebase.");
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (e) {}
        (window as any).recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify SMS OTP Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !confirmationResult) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const token = await result.user.getIdToken();

      const res = await signIn("firebase", {
        token,
        redirect: false,
      });

      if (res?.error) {
        toast.error("Failed to sync OTP session.");
        setLoading(false);
      } else {
        toast.success("Successfully verified and logged in!");
        await handleRedirect();
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast.error("Invalid verification code. Please try again.");
      setLoading(false);
    }
  };

  // Dev Mock Logins (to test UI routes when Firebase key values are omitted)
  const handleDevMockLogin = async (isAdmin: boolean) => {
    setLoading(true);
    try {
      const mockToken = isAdmin ? "mock-admin" : "mock-customer";
      const res = await signIn("firebase", {
        token: mockToken,
        redirect: false,
      });

      if (res?.error) {
        toast.error("Mock login session failed.");
      } else {
        toast.success(`Dev Mock Login: Logged in as ${isAdmin ? "Admin" : "Customer"}`);
        await handleRedirect();
      }
    } catch (err) {
      console.error(err);
      toast.error("Mock login error.");
    } finally {
      setLoading(false);
    }
  };

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div 
        className="w-full max-w-md rounded-3xl p-8 sm:p-10 shadow-lg relative overflow-hidden"
        style={{ backgroundColor: "#FDFCF8", border: "1px solid #DCE9CC" }}
      >
        {/* Invisible ReCAPTCHA widget anchor */}
        <div id="recaptcha-container"></div>

        <div className="text-center space-y-2 mb-6">
          <h2 className="font-playfair font-black text-3xl text-[#1a2c1a] uppercase tracking-tight">
            Sign In
          </h2>
          <p className="text-xs font-bold uppercase tracking-wider text-[#8a8a7a]">
            Access your Daily Bake account
          </p>
        </div>

        {/* Toggle tabs for password vs OTP login */}
        <div className="flex border-b border-[#d4d9b8]/50 mb-6">
          <button
            onClick={() => { setMode("password"); setOtpSent(false); }}
            className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-2 ${
              mode === "password" 
                ? "border-[#3d5a2e] text-[#3d5a2e]" 
                : "border-transparent text-[#8a8a7a] hover:text-[#4a4a4a]"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Password
          </button>
          <button
            onClick={() => setMode("otp")}
            className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-2 ${
              mode === "otp" 
                ? "border-[#3d5a2e] text-[#3d5a2e]" 
                : "border-transparent text-[#8a8a7a] hover:text-[#4a4a4a]"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            SMS OTP
          </button>
        </div>

        {/* ── Mode 1: Password Login Form ── */}
        {mode === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a] block">
                Email or Phone Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#8a8a7a]">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter email or phone number"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d4d9b8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3d5a2e] focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a] block">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#8a8a7a]">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d4d9b8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3d5a2e] focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3d5a2e] hover:bg-[#1a2c1a] text-white py-3 rounded-xl font-bold uppercase tracking-widest text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        )}

        {/* ── Mode 2: Phone SMS OTP Form ── */}
        {mode === "otp" && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a] block">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#8a8a7a]">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="tel"
                      value={phoneNum}
                      onChange={(e) => setPhoneNum(e.target.value)}
                      placeholder="e.g. 9876543210"
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d4d9b8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3d5a2e] focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-[#8a8a7a] mt-1 font-medium leading-none">
                    OTP will be sent to this number. Enter with country code if outside India (e.g. +1 for US).
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#3d5a2e] hover:bg-[#1a2c1a] text-white py-3 rounded-xl font-bold uppercase tracking-widest text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending SMS...</span>
                    </>
                  ) : (
                    <>
                      <span>Send OTP Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a] block">
                      Enter Verification Code
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-[10px] font-bold text-[#c8872a] hover:underline"
                    >
                      Change Number
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#8a8a7a]">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="6-digit code"
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d4d9b8] bg-white text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-[#3d5a2e] focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#3d5a2e] hover:bg-[#1a2c1a] text-white py-3 rounded-xl font-bold uppercase tracking-widest text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm & Login</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        )}

        {/* ── Social Login Section ── */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#d4d9b8]/50" />
          </div>
          <span className="relative px-3 bg-[#FDFCF8] text-[10px] font-bold uppercase tracking-widest text-[#8a8a7a]">
            or continue with
          </span>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white hover:bg-neutral-50 text-[#4a4a4a] py-2.5 border border-[#d4d9b8] rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
          <span>Google Account</span>
        </button>

        {/* ── Developer Mock Sandbox Option (Only shown locally in development mode) ── */}
        {isDev && (
          <div 
            className="mt-6 p-4 rounded-xl text-center space-y-2 border border-dashed border-[#c8872a]/40 bg-[#c8872a]/5"
          >
            <p className="text-[10px] font-black uppercase tracking-wider text-[#c8872a]">
              🛠️ Developer Sandbox Bypass
            </p>
            <p className="text-[9px] text-[#8a8a7a] leading-tight">
              Test auth routing flows instantly in development mode without active Firebase Console credentials.
            </p>
            <div className="flex gap-2 justify-center pt-1">
              <button
                type="button"
                onClick={() => handleDevMockLogin(true)}
                disabled={loading}
                className="text-[9px] font-bold bg-[#3d5a2e]/10 text-[#3d5a2e] hover:bg-[#3d5a2e]/20 px-2.5 py-1.5 rounded-lg transition-all"
              >
                Mock Admin
              </button>
              <button
                type="button"
                onClick={() => handleDevMockLogin(false)}
                disabled={loading}
                className="text-[9px] font-bold bg-[#c8872a]/10 text-[#c8872a] hover:bg-[#c8872a]/20 px-2.5 py-1.5 rounded-lg transition-all"
              >
                Mock Customer
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-[#d4d9b8]/50 text-center">
          <p className="text-xs font-medium text-[#4a4a4a]">
            Don't have an account?{" "}
            <Link 
              href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="text-[#c8872a] hover:text-[#b07320] font-bold transition-colors"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
