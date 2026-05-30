"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { User as UserIcon, KeyRound, Mail, Phone, Loader2, ArrowRight } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRedirect = async () => {
    try {
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      
      if (session?.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push(callbackUrl);
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      router.push(callbackUrl);
      router.refresh();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !password || !confirmPassword) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!email && !phone) {
      toast.error("Please enter either an Email or Phone Number");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email || null,
          phone: phone || null,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create account");
        setLoading(false);
        return;
      }

      toast.success("Account created successfully!");

      // Auto login after sign up
      const identifier = email || phone;
      const loginRes = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
      });

      if (loginRes?.error) {
        router.push("/login");
      } else {
        toast.success("Logged in!");
        await handleRedirect();
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during registration. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
        toast.error("Google registration session sync failed.");
        setLoading(false);
      } else {
        toast.success("Successfully registered & logged in with Google!");
        await handleRedirect();
      }
    } catch (error: any) {
      console.error("Google signup error:", error);
      if (error.code === "auth/popup-closed-by-user") {
        toast.error("Google signup popup was closed.");
      } else {
        toast.error(error.message || "Google signup failed.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div 
        className="w-full max-w-md rounded-3xl p-8 sm:p-10 shadow-lg"
        style={{ backgroundColor: "#FDFCF8", border: "1px solid #DCE9CC" }}
      >
        <div className="text-center space-y-2 mb-8">
          <h2 className="font-playfair font-black text-3xl text-[#1a2c1a] uppercase tracking-tight">
            Create Account
          </h2>
          <p className="text-xs font-bold uppercase tracking-wider text-[#8a8a7a]">
            Join The Daily Bake selection
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a] block">
              Full Name *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#8a8a7a]">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d4d9b8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3d5a2e] focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a] block">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#8a8a7a]">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d4d9b8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3d5a2e] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a] block">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#8a8a7a]">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d4d9b8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3d5a2e] focus:border-transparent transition-all"
              />
            </div>
            <p className="text-[10px] text-[#8a8a7a] font-medium leading-none mt-1">
              * Enter either email, phone, or both to log in.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a] block">
              Password *
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

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a] block">
              Confirm Password *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#8a8a7a]">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d4d9b8] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3d5a2e] focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3d5a2e] hover:bg-[#1a2c1a] text-white py-3 rounded-xl font-bold uppercase tracking-widest text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Sign Up</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>

        {/* ── Social Login Section ── */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#d4d9b8]/50" />
          </div>
          <span className="relative px-3 bg-[#FDFCF8] text-[10px] font-bold uppercase tracking-widest text-[#8a8a7a]">
            or sign up with
          </span>
        </div>

        <button
          onClick={handleGoogleSignup}
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

        <div className="mt-6 pt-4 border-t border-[#d4d9b8]/50 text-center">
          <p className="text-xs font-medium text-[#4a4a4a]">
            Already have an account?{" "}
            <Link 
              href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="text-[#c8872a] hover:text-[#b07320] font-bold transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
