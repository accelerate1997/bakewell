"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Search, 
  Loader2, 
  Check, 
  Pause, 
  Play, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Mail, 
  Phone, 
  User 
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "PAUSED" | "CANCELLED">("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [dispatchDate, setDispatchDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [isDispatching, setIsDispatching] = useState(false);

  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/subscriptions");
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data);
      } else {
        toast.error("Failed to fetch subscriptions directory");
      }
    } catch (err) {
      console.error("Fetch admin subscriptions error:", err);
      toast.error("An error occurred loading subscriptions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDispatchDeliveries = async () => {
    if (!dispatchDate) {
      toast.error("Please select a date for dispatch");
      return;
    }
    setIsDispatching(true);
    try {
      const res = await fetch(`/api/admin/subscriptions/dispatch-cron?date=${dispatchDate}`, {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok) {
        if (data.dispatched > 0) {
          toast.success(`Successfully dispatched ${data.dispatched} delivery order(s) for ${dispatchDate}!`);
          fetchSubscriptions();
        } else {
          toast(`No pending deliveries found for ${dispatchDate}.`);
        }
      } else {
        toast.error(data.error || "Failed to dispatch deliveries");
      }
    } catch (err) {
      console.error("Dispatch deliveries error:", err);
      toast.error("An error occurred during dispatch execution");
    } finally {
      setIsDispatching(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleUpdateStatus = async (subscriptionId: string, newStatus: "ACTIVE" | "PAUSED" | "CANCELLED") => {
    const confirmationMessages = {
      ACTIVE: "Are you sure you want to reactivate this subscription? Deliveries will be generated on schedule.",
      PAUSED: "Are you sure you want to pause this subscription? Deliveries will be suspended until resumed.",
      CANCELLED: "Are you sure you want to cancel this subscription? This will stop all future deliveries permanently.",
    };

    if (!confirm(confirmationMessages[newStatus])) return;

    setUpdatingId(subscriptionId);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId, status: newStatus }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Subscription status successfully updated to ${newStatus}!`);
        fetchSubscriptions();
      } else {
        toast.error(data.error || "Failed to update subscription status");
      }
    } catch (error) {
      console.error("Admin update subscription status error:", error);
      toast.error("Something went wrong");
    } finally {
      setUpdatingId(null);
    }
  };

  // Filters logic
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch = 
      sub.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.user?.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.items?.some((item: any) => item.variant?.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    ACTIVE: "bg-emerald-100 text-emerald-800 border-emerald-200",
    PAUSED: "bg-amber-100 text-amber-800 border-amber-200",
    CANCELLED: "bg-rose-100 text-rose-800 border-rose-200",
    EXPIRED: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#d4d9b8] pb-6">
        <div>
          <h1 className="font-playfair font-black text-2xl uppercase tracking-wider text-[#1a2c1a]">
            Subscription Directory
          </h1>
          <p className="text-xs text-[#8a8a7a] font-bold uppercase tracking-wider mt-1">
            Manage system-wide customer recurring orders and delivery schedules
          </p>
        </div>

        {/* Dispatch Controls */}
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={dispatchDate}
            onChange={(e) => setDispatchDate(e.target.value)}
            className="w-40 bg-white border-[#d4d9b8] text-xs font-bold text-[#1a2c1a]"
          />
          <Button
            onClick={handleDispatchDeliveries}
            disabled={isDispatching}
            className="bg-[#c8872a] hover:bg-[#a97020] text-white text-xs font-bold uppercase tracking-widest px-4 py-2 cursor-pointer rounded-xl h-10 flex items-center gap-2"
          >
            {isDispatching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Dispatching...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" /> Dispatch Deliveries
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Summary statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-[#d4d9b8] shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-[#8a8a7a]">Total Subscriptions</CardDescription>
            <CardTitle className="font-playfair font-black text-3xl text-[#1a2c1a]">{subscriptions.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#d4d9b8] shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Active Plans</CardDescription>
            <CardTitle className="font-playfair font-black text-3xl text-emerald-800">
              {subscriptions.filter((s) => s.status === "ACTIVE").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#d4d9b8] shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Paused Plans</CardDescription>
            <CardTitle className="font-playfair font-black text-3xl text-amber-800">
              {subscriptions.filter((s) => s.status === "PAUSED").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#d4d9b8] shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-rose-700">Cancelled Plans</CardDescription>
            <CardTitle className="font-playfair font-black text-3xl text-rose-800">
              {subscriptions.filter((s) => s.status === "CANCELLED").length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters bar */}
      <div className="bg-white border border-[#d4d9b8] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8a7a]" />
          <Input
            placeholder="Search by customer name, email, ID, or variant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white"
          />
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {(["ALL", "ACTIVE", "PAUSED", "CANCELLED"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === filter
                  ? "bg-[#1a2c1a] text-white"
                  : "bg-[#f0f2e8] text-[#1a2c1a] hover:bg-[#d4d9b8]/40"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Main content directory list */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a2c1a]" />
          <p className="text-xs font-bold uppercase tracking-wider text-[#8a8a7a]">Loading directories...</p>
        </div>
      ) : filteredSubscriptions.length === 0 ? (
        <div className="bg-white border border-[#d4d9b8] rounded-2xl p-16 text-center text-xs text-[#8a8a7a] font-bold uppercase py-24 shadow-sm">
          No subscriptions matched the chosen search filter parameters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredSubscriptions.map((sub) => (
            <div 
              key={sub.id} 
              className="bg-white border border-[#d4d9b8] rounded-2xl overflow-hidden shadow-sm flex flex-col"
            >
              {/* Top status bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-[#f0f2e8]/40 border-b border-[#d4d9b8] gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#8a8a7a] uppercase tracking-wider">Plan: #{sub.id.substring(sub.id.length - 8)}</span>
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${statusColors[sub.status as keyof typeof statusColors] || "bg-gray-100"}`}>
                      {sub.status}
                    </span>
                  </div>
                  <div className="text-sm font-extrabold text-[#1a2c1a] uppercase tracking-wide">
                    {sub.frequency === "DAILY" && "Every Single Day (Daily)"}
                    {sub.frequency === "ALTERNATING" && "Every Alternate Day"}
                    {sub.frequency === "WEEKLY" && "Once a Week (Weekly)"}
                    {sub.frequency === "CUSTOM_DAYS" && "Custom Weekdays schedule"}
                  </div>
                </div>

                <div className="flex flex-col sm:items-end text-xs">
                  <span className="font-bold text-[#8a8a7a] uppercase tracking-wider">Delivery Time Slot</span>
                  <span className="font-extrabold text-[#1a2c1a] uppercase mt-0.5">{sub.deliverySlot?.label || "Flexible Time"}</span>
                </div>
              </div>

              {/* Central grid */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-[#d4d9b8]/50">
                {/* Col 1: Customer Contact info */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-[#8a8a7a] uppercase tracking-widest border-b border-[#f0f2e8] pb-1">
                    Customer Details
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-[#c8872a]" />
                      <span className="font-bold text-[#1a2c1a]">{sub.user?.name || "Guest Account"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#c8872a]" />
                      <span className="font-medium text-[#4a4a4a] truncate">{sub.user?.email || "No Email"}</span>
                    </div>
                    {sub.user?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#c8872a]" />
                        <span className="font-medium text-[#4a4a4a]">{sub.user?.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Col 2: Date Bounds & Custom Days */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-[#8a8a7a] uppercase tracking-widest border-b border-[#f0f2e8] pb-1">
                    Timeline Details
                  </h4>
                  <div className="space-y-2 text-xs text-[#4a4a4a]">
                    <div>
                      <span className="font-bold text-[#1a2c1a]">Start:</span>{" "}
                      {new Date(sub.startDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    <div>
                      <span className="font-bold text-[#1a2c1a]">End:</span>{" "}
                      {sub.endDate 
                        ? new Date(sub.endDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Ongoing (Open-ended)"}
                    </div>
                    {sub.frequency === "CUSTOM_DAYS" && sub.customDays && sub.customDays.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {sub.customDays.map((d: string) => (
                          <span key={d} className="bg-[#f0f2e8] text-[#1a2c1a] text-[9px] font-bold px-2 py-0.5 rounded border border-[#d4d9b8]">
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Col 3: Subscribed Items */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-[#8a8a7a] uppercase tracking-widest border-b border-[#f0f2e8] pb-1">
                    Items Enrolled
                  </h4>
                  <div className="space-y-2 text-xs">
                    {sub.items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center text-xs">
                        <span className="text-gray-600 font-medium truncate max-w-[180px]">
                          {item.variant?.product?.name} ({item.variant?.label})
                        </span>
                        <span className="font-bold text-[#1a2c1a]">
                          {item.quantity}x &bull; ₹{item.pricePerUnit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lower Section: Pending Deliveries Logs Preview */}
              {sub.deliveries && sub.deliveries.length > 0 && (
                <div className="p-5 bg-gray-50/50 border-b border-[#d4d9b8]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h5 className="text-[10px] font-bold text-[#8a8a7a] uppercase tracking-wider">
                      Upcoming Delivery Schedule Preview
                    </h5>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {sub.deliveries
                        .filter((d: any) => d.status === "PENDING")
                        .slice(0, 5)
                        .map((d: any) => (
                          <div key={d.id} className="bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-[10px] font-bold text-gray-500 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                            {new Date(d.deliveryDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </div>
                        ))}
                      {sub.deliveries.filter((d: any) => d.status === "PENDING").length === 0 && (
                        <span className="text-xs text-gray-400 font-medium">No pending schedules.</span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs">
                    <span className="font-bold text-[#8a8a7a]">Processed Deliveries:</span>{" "}
                    <span className="font-extrabold text-[#1a2c1a]">
                      {sub.deliveries.filter((d: any) => d.status === "GENERATED").length} total
                    </span>
                  </div>
                </div>
              )}

              {/* Footer action bar */}
              <div className="p-4 bg-white flex justify-end gap-3 flex-wrap">
                {sub.status === "ACTIVE" && (
                  <>
                    <Button
                      variant="outline"
                      disabled={updatingId !== null}
                      onClick={() => handleUpdateStatus(sub.id, "PAUSED")}
                      className="border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100 text-xs font-bold uppercase tracking-wider h-10 px-4 cursor-pointer"
                    >
                      {updatingId === sub.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Pause className="w-3.5 h-3.5 mr-1" /> Pause Plan
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={updatingId !== null}
                      onClick={() => handleUpdateStatus(sub.id, "CANCELLED")}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold uppercase tracking-wider h-10 px-4 cursor-pointer"
                    >
                      {updatingId === sub.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel Plan
                        </>
                      )}
                    </Button>
                  </>
                )}
                {sub.status === "PAUSED" && (
                  <>
                    <Button
                      variant="outline"
                      disabled={updatingId !== null}
                      onClick={() => handleUpdateStatus(sub.id, "ACTIVE")}
                      className="border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold uppercase tracking-wider h-10 px-4 cursor-pointer"
                    >
                      {updatingId === sub.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 mr-1" /> Resume Plan
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={updatingId !== null}
                      onClick={() => handleUpdateStatus(sub.id, "CANCELLED")}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold uppercase tracking-wider h-10 px-4 cursor-pointer"
                    >
                      {updatingId === sub.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel Plan
                        </>
                      )}
                    </Button>
                  </>
                )}
                {sub.status === "CANCELLED" && (
                  <span className="text-xs text-[#8a8a7a] font-bold uppercase tracking-wider py-2">
                    Cancelled &bull; No actions available
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
