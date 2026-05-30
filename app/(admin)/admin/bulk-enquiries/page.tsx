"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  Mail,
  Phone,
  User,
  Trash2,
  Inbox,
  AlertCircle,
  CheckCircle,
  Clock,
  Layers,
  ShoppingBag
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminBulkEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "CONTACTED" | "RESOLVED">("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchEnquiries = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/bulk-enquiry");
      if (res.ok) {
        const data = await res.json();
        setEnquiries(data);
      } else {
        toast.error("Failed to fetch bulk enquiries");
      }
    } catch (err) {
      console.error("Fetch bulk enquiries error:", err);
      toast.error("An error occurred loading bulk enquiries");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleUpdateStatus = async (enquiryId: string, newStatus: "PENDING" | "CONTACTED" | "RESOLVED") => {
    setUpdatingId(enquiryId);
    try {
      const res = await fetch(`/api/admin/bulk-enquiry/${enquiryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Enquiry status successfully updated to ${newStatus}!`);
        // Update local state directly
        setEnquiries((prev) =>
          prev.map((e) => (e.id === enquiryId ? { ...e, status: newStatus } : e))
        );
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Update status error:", error);
      toast.error("Something went wrong");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteEnquiry = async (enquiryId: string) => {
    if (!confirm("Are you sure you want to delete this enquiry permanently?")) return;

    try {
      const res = await fetch(`/api/admin/bulk-enquiry/${enquiryId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Enquiry deleted successfully!");
        setEnquiries((prev) => prev.filter((e) => e.id !== enquiryId));
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete enquiry");
      }
    } catch (error) {
      console.error("Delete enquiry error:", error);
      toast.error("An error occurred during deletion");
    }
  };

  const filteredEnquiries = enquiries.filter((enq) => {
    const matchesSearch =
      enq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (enq.email && enq.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      enq.phone.includes(searchTerm) ||
      (enq.message && enq.message.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || enq.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    PENDING: "bg-rose-100 text-rose-800 border-rose-200",
    CONTACTED: "bg-blue-100 text-blue-800 border-blue-200",
    RESOLVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };

  const pendingCount = enquiries.filter((e) => e.status === "PENDING").length;
  const contactedCount = enquiries.filter((e) => e.status === "CONTACTED").length;
  const resolvedCount = enquiries.filter((e) => e.status === "RESOLVED").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#d4d9b8] pb-6">
        <div>
          <h1 className="font-playfair font-black text-2xl uppercase tracking-wider text-[#1a2c1a]">
            Bulk Purchase Enquiries
          </h1>
          <p className="text-xs text-[#8a8a7a] font-bold uppercase tracking-wider mt-1">
            Manage wholesale requests, catering enquiries, and corporate bulk leads
          </p>
        </div>
      </div>

      {/* Summary statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-[#d4d9b8] shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-[#8a8a7a]">Total Enquiries</CardDescription>
            <CardTitle className="font-playfair font-black text-3xl text-[#1a2c1a]">{enquiries.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#d4d9b8] shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-rose-700">Pending</CardDescription>
            <CardTitle className="font-playfair font-black text-3xl text-rose-800">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#d4d9b8] shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-blue-700">Contacted</CardDescription>
            <CardTitle className="font-playfair font-black text-3xl text-blue-800">{contactedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#d4d9b8] shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Resolved</CardDescription>
            <CardTitle className="font-playfair font-black text-3xl text-emerald-800">{resolvedCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-[#d4d9b8] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8a7a]" />
          <Input
            placeholder="Search by customer name, email, phone, or requirements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white"
          />
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {(["ALL", "PENDING", "CONTACTED", "RESOLVED"] as const).map((filter) => (
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

      {/* Main Content List */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a2c1a]" />
          <p className="text-xs font-bold uppercase tracking-wider text-[#8a8a7a]">Loading enquiries...</p>
        </div>
      ) : filteredEnquiries.length === 0 ? (
        <div className="bg-white border border-[#d4d9b8] rounded-2xl p-16 text-center text-xs text-[#8a8a7a] font-bold uppercase py-24 shadow-sm">
          No bulk enquiries found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredEnquiries.map((enq) => (
            <div
              key={enq.id}
              className="bg-white border border-[#d4d9b8] rounded-2xl overflow-hidden shadow-sm flex flex-col"
            >
              {/* Top status bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-[#f0f2e8]/40 border-b border-[#d4d9b8] gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#8a8a7a] uppercase tracking-wider">
                      Enquiry ID: #{enq.id.substring(enq.id.length - 8).toUpperCase()}
                    </span>
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${statusColors[enq.status as keyof typeof statusColors] || "bg-gray-100"}`}>
                      {enq.status}
                    </span>
                  </div>
                  <div className="text-xs text-[#8a8a7a] font-bold uppercase tracking-wide">
                    Submitted: {new Date(enq.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#8a8a7a] uppercase">Set Status:</span>
                  <select
                    value={enq.status}
                    disabled={updatingId === enq.id}
                    onChange={(e) => handleUpdateStatus(enq.id, e.target.value as any)}
                    className="bg-white border border-[#d4d9b8] text-xs font-extrabold uppercase rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#c8872a] text-[#1a2c1a] cursor-pointer"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="RESOLVED">RESOLVED</option>
                  </select>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteEnquiry(enq.id)}
                    className="h-8 w-8 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    title="Delete Enquiry"
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>

              {/* Central grid details */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-[#d4d9b8]/50">
                {/* Col 1: Customer Contact info */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-[#8a8a7a] uppercase tracking-widest border-b border-[#f0f2e8] pb-1">
                    Customer Details
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-[#c8872a] flex-shrink-0" />
                      <span className="font-bold text-[#1a2c1a]">{enq.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#c8872a] flex-shrink-0" />
                      <a href={`tel:${enq.phone}`} className="font-medium text-[#4a4a4a] hover:underline">
                        {enq.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#c8872a] flex-shrink-0" />
                      {enq.email ? (
                        <a href={`mailto:${enq.email}`} className="font-medium text-[#4a4a4a] hover:underline truncate">
                          {enq.email}
                        </a>
                      ) : (
                        <span className="font-medium text-gray-400 italic">No email provided</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Col 2: Categories and Quantity */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-[#8a8a7a] uppercase tracking-widest border-b border-[#f0f2e8] pb-1">
                    Requested Categories & volume
                  </h4>
                  <div className="space-y-2 text-xs text-[#4a4a4a]">
                    <div className="flex flex-wrap gap-1.5">
                      {enq.categories && enq.categories.length > 0 ? (
                        enq.categories.map((c: any) => (
                          <Badge
                            key={c.id}
                            variant="outline"
                            className="bg-[#f9faf6] border-[#d4d9b8] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5"
                          >
                            <Layers className="w-2.5 h-2.5 mr-1" />
                            {c.category?.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-400 italic font-medium">No specific categories checked</span>
                      )}
                    </div>
                    <div className="pt-1.5">
                      <span className="font-bold text-[#1a2c1a] uppercase tracking-wider text-[10px]">
                        Expected Volume:
                      </span>{" "}
                      <span className="font-extrabold text-[#c8872a] text-sm ml-1">
                        {enq.quantity ? `${enq.quantity} units` : "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Col 3: Selected Products */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-[#8a8a7a] uppercase tracking-widest border-b border-[#f0f2e8] pb-1">
                    Specific Products
                  </h4>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {enq.products && enq.products.length > 0 ? (
                      enq.products.map((p: any) => (
                        <Badge
                          key={p.id}
                          className="bg-[#eaf3de] text-[#1a2c1a] hover:bg-[#eaf3de] border-none text-[9px] font-extrabold uppercase px-2 py-0.5 flex items-center gap-1"
                        >
                          <ShoppingBag className="w-2.5 h-2.5 flex-shrink-0" />
                          {p.product?.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-400 italic font-medium">No specific products selected</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Requirements Message Details */}
              {enq.message && (
                <div className="p-5 bg-gray-50/50 border-t border-[#d4d9b8]/10">
                  <h5 className="text-[10px] font-bold text-[#8a8a7a] uppercase tracking-widest mb-1.5">
                    Customer Requirements & Custom Specs
                  </h5>
                  <p className="text-xs text-gray-700 bg-white border border-gray-100 rounded-xl p-3 leading-relaxed whitespace-pre-wrap font-medium">
                    {enq.message}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
