import React, { Suspense } from "react";
import SignupForm from "@/components/store/SignupForm";

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center bg-[#f0f2e8]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-[#3d5a2e] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold uppercase tracking-wider text-[#8a8a7a]">Loading registration form...</p>
        </div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
