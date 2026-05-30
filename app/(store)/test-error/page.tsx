"use client";

import { useEffect } from "react";

export default function TestErrorPage() {
  useEffect(() => {
    // Deliberately throw an error on the client side after mounting to trigger the Next.js Error Boundary (app/error.tsx)
    // This prevents Next.js from failing the production build static prerender phase.
    throw new Error(
      "Simulated Server Error (505): This error was triggered by visiting the test-error route to verify your custom error boundary page."
    );
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2e4f3a]">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-4 border-[#E8C97A] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold uppercase tracking-wider text-[#dce9cc]">
          Simulating server error...
        </p>
      </div>
    </div>
  );
}
