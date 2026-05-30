"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Truck, ShieldAlert, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface PincodeCheckResult {
  serviceable: boolean;
  city?: string;
  state?: string;
  deliveryDays?: number;
  deliveryCharge?: number;
  codAvailable?: boolean;
  isFallback?: boolean;
}

export function PincodeChecker() {
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PincodeCheckResult | null>(null);
  const [checkedPincode, setCheckedPincode] = useState("");

  // Check localStorage on mount
  useEffect(() => {
    const savedPincode = localStorage.getItem("db_pincode");
    if (savedPincode && savedPincode.trim().length === 6) {
      setPincode(savedPincode);
      runCheck(savedPincode);
    }
  }, []);

  const runCheck = async (pinToCheck: string) => {
    if (!pinToCheck || pinToCheck.length !== 6 || isNaN(Number(pinToCheck))) {
      toast.error("Please enter a valid 6-digit pincode");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/store/pincode/${pinToCheck}`);
      if (!res.ok) {
        throw new Error("Failed to check pincode");
      }
      const data: PincodeCheckResult = await res.json();
      setResult(data);
      setCheckedPincode(pinToCheck);

      if (data.serviceable) {
        localStorage.setItem("db_pincode", pinToCheck);
      } else {
        localStorage.removeItem("db_pincode");
      }
    } catch (error) {
      console.error("Pincode check error:", error);
      toast.error("Unable to verify pincode. Please try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    runCheck(pincode);
  };

  const handleReset = () => {
    setResult(null);
    setPincode("");
    setCheckedPincode("");
    localStorage.removeItem("db_pincode");
  };

  return (
    <div className="bg-[#f0f2e8]/40 border border-[#d4d9b8] rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-[#3d5a2e]" />
        <h4 className="font-playfair font-black text-sm uppercase tracking-wider text-[#1a2c1a]">
          Delivery Availability
        </h4>
      </div>

      {!result ? (
        <form onSubmit={handleCheck} className="flex gap-2">
          <div className="relative flex-grow">
            <Input
              type="text"
              maxLength={6}
              placeholder="Enter Pincode (e.g. 560001)"
              value={pincode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setPincode(val);
              }}
              className="bg-white border-[#d4d9b8] focus:border-[#c8872a] focus:ring-0 text-sm font-semibold tracking-wider h-11"
            />
          </div>
          <Button
            type="submit"
            disabled={loading || pincode.length !== 6}
            className="bg-[#3d5a2e] hover:bg-[#1a2c1a] text-white px-6 font-bold uppercase tracking-widest text-xs h-11 shadow-sm transition-all"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Check"
            )}
          </Button>
        </form>
      ) : (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {result.serviceable ? (
            <div className="space-y-2">
              <div className="flex items-start gap-2.5 text-xs text-[#3d5a2e]">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="font-semibold leading-relaxed">
                  Delivery is available to{" "}
                  <span className="font-extrabold uppercase">
                    {result.city}
                    {result.state ? `, ${result.state}` : ""}
                  </span>{" "}
                  ({checkedPincode})
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] font-bold uppercase tracking-wide border-t border-[#d4d9b8]/50">
                <div className="flex items-center gap-1.5 text-[#4a4a4a]">
                  <Truck className="w-4 h-4 text-[#3d5a2e]" />
                  <span>
                    In {result.deliveryDays} Day{result.deliveryDays !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[#4a4a4a]">
                  <CheckCircle2 className={`w-4 h-4 ${result.codAvailable ? "text-[#3d5a2e]" : "text-red-500"}`} />
                  <span>
                    {result.codAvailable ? "COD Available" : "Online Pay Only"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-xs text-red-600 font-semibold leading-relaxed">
              <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                Sorry, we do not deliver to pincode <span className="font-extrabold">{checkedPincode}</span> yet.
              </div>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              onClick={handleReset}
              className="text-[10px] font-bold uppercase tracking-widest text-[#8a8a7a] hover:text-[#c8872a] flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Change Pincode</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
