"use client";

import { useState, useEffect } from "react";
import {
  IndianRupee,
  ShoppingCart,
  TrendingUp,
  Percent,
  Download,
  Printer,
  Calendar,
  Loader2,
  AlertCircle,
  Package,
  Layers,
  CreditCard
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Predefined colors for charts
const COLORS = ["#3d5a2e", "#c8872a", "#534AB7", "#A32D2D"];

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  
  // Date states
  const [preset, setPreset] = useState<string>("30d");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  // Active Tab
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Track printing state so all tab sections render during print
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const handleBeforePrint = () => setIsPrinting(true);
    const handleAfterPrint = () => setIsPrinting(false);
    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  // Search filter for products/ledger
  const [productSearch, setProductSearch] = useState("");
  const [ledgerSearch, setLedgerSearch] = useState("");

  const getChartInterval = (dataLength: number) => {
    if (!dataLength) return 0;
    if (dataLength <= 8) return 0;
    if (dataLength <= 16) return 1;
    if (dataLength <= 31) return 4;
    if (dataLength <= 62) return 6;
    return Math.floor(dataLength / 8);
  };

  // Initialize dates on mount
  useEffect(() => {
    handlePresetChange("30d");
  }, []);

  // Fetch report data when start/end dates change
  useEffect(() => {
    if (startDate && endDate) {
      fetchReportData(startDate, endDate);
    }
  }, [startDate, endDate]);

  const fetchReportData = async (start: string, end: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/reports?startDate=${start}&endDate=${end}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        console.error("Failed to load reports");
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetChange = (selectedPreset: string) => {
    setPreset(selectedPreset);
    const now = new Date();
    let start = new Date();
    let end = new Date();

    // End date is always end of today for presets
    end.setHours(23, 59, 59, 999);

    if (selectedPreset === "today") {
      start.setHours(0, 0, 0, 0);
    } else if (selectedPreset === "yesterday") {
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    } else if (selectedPreset === "week") {
      // Start of current week (Sunday or Monday, let's say 7 days ago for ease or actual week)
      const day = now.getDay();
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
    } else if (selectedPreset === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (selectedPreset === "30d") {
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    } else if (selectedPreset === "custom") {
      // Keep existing inputs
      return;
    }

    // Convert to ISO string (local date part)
    const offset = start.getTimezoneOffset();
    const localStart = new Date(start.getTime() - offset * 60 * 1000).toISOString().split("T")[0];
    const localEnd = new Date(end.getTime() - offset * 60 * 1000).toISOString().split("T")[0];

    setStartDate(localStart);
    setEndDate(localEnd);
  };

  // CSV Exporter
  const exportToCSV = (filename: string, dataset: any[], headers: string[], keyMap: string[]) => {
    // Add header row
    let csvRows: string[] = [headers.join(",")];

    // Add data rows
    dataset.forEach((row) => {
      const rowData = keyMap.map(key => {
        let val = row[key];
        // Handle dates
        if (key === "date" && val) {
          val = new Date(val).toLocaleDateString("en-IN");
        }
        // Handle object nests (e.g. category)
        if (typeof val === "object" && val !== null) {
          val = JSON.stringify(val);
        }
        // Wrap in quotes if value contains comma, newline, or double-quote
        if (typeof val === "string" && (val.includes(",") || val.includes('"') || val.includes("\n"))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val !== undefined && val !== null ? val : "";
      });
      csvRows.push(rowData.join(","));
    });

    const csvContent = csvRows.join("\r\n");

    // Use Blob to avoid encodeURI size limits which truncate large reports
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // CSV exports handlers
  const handleExportProducts = () => {
    if (!data?.productSales) return;
    exportToCSV(
      "Product_Sales_Report",
      data.productSales,
      ["Product Name", "Variant", "Units Sold", "Revenue (INR)"],
      ["name", "variant", "quantity", "revenue"]
    );
  };

  const handleExportTaxLedger = () => {
    if (!data?.taxLedger) return;
    exportToCSV(
      "GST_Tax_Ledger",
      data.taxLedger,
      [
        "Order Date",
        "Order Number",
        "Customer Name",
        "Subtotal (INR)",
        "Coupon Discount (INR)",
        "Delivery Fees (INR)",
        "Packaging Fees (INR)",
        "CGST Amount (INR)",
        "SGST Amount (INR)",
        "IGST Amount (INR)",
        "Total GST (INR)",
        "Net Paid (INR)",
        "Payment Method"
      ],
      [
        "date",
        "orderNumber",
        "customerName",
        "subtotal",
        "couponDiscount",
        "deliveryCharge",
        "packagingFee",
        "cgst",
        "sgst",
        "igst",
        "totalTax",
        "totalAmount",
        "paymentMethod"
      ]
    );
  };

  // Filter products by search term
  const filteredProducts = data?.productSales?.filter((item: any) =>
    item.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    item.variant.toLowerCase().includes(productSearch.toLowerCase())
  ) || [];

  // Filter tax ledger by search term
  const filteredLedger = data?.taxLedger?.filter((item: any) =>
    item.orderNumber.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
    item.customerName.toLowerCase().includes(ledgerSearch.toLowerCase())
  ) || [];

  if (loading && !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#3d5a2e]" />
        <p className="text-xs font-bold uppercase tracking-widest text-[#8a8a7a]">Generating financial reports...</p>
      </div>
    );
  }

  const summary = data?.summary || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-300 print:space-y-4 print:p-0 print:bg-white">
      {/* CSS Override for Printing */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 12mm 10mm;
          }
          body {
            background-color: white !important;
            color: black !important;
            font-size: 10px !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Hide sidebar, topbar, and all interactive UI */
          .no-print,
          [class*="AdminSidebar"],
          [class*="AdminTopBar"] {
            display: none !important;
          }
          /* Remove left offset from content wrapper */
          [class*="md:pl-"] {
            padding-left: 0 !important;
          }
          /* Remove top padding from main */
          main {
            padding-top: 0 !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
          .card {
            border: 1px solid #ccc !important;
            box-shadow: none !important;
            background: white !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            white-space: normal !important;
          }
          th, td {
            border: 1px solid #ccc !important;
            padding: 3px 5px !important;
            font-size: 9px !important;
            white-space: normal !important;
            word-break: break-word;
          }
          thead tr {
            background-color: #e8ede0 !important;
            color: black !important;
          }
          /* Keep alternating row colors */
          tbody tr:nth-child(even) {
            background-color: #f9faf6 !important;
          }
        }
      `}</style>

      {/* Page Header (No Print button, date filters) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-[#1a2c1a] uppercase tracking-tight">Sales & Accounting Reports</h1>
          <p className="text-xs text-[#8a8a7a]">Configure date ranges, audit tax sheets, and analyze financial performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="border-[#d4d9b8] text-[#3d5a2e] hover:bg-[#3d5a2e] hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer h-10"
          >
            <Printer size={16} /> Print Report
          </Button>
        </div>
      </div>

      {/* Print Specific Header */}
      <div className="hidden print:block border-b-2 border-black pb-4 mb-4">
        <h1 className="text-xl font-bold uppercase tracking-wider text-black">BAKEWELL™ - FINANCIAL REPORT</h1>
        <p className="text-xs font-medium">
          Period: <span className="font-bold">{new Date(startDate).toLocaleDateString("en-IN")}</span> to <span className="font-bold">{new Date(endDate).toLocaleDateString("en-IN")}</span>
        </p>
        <p className="text-[10px] text-gray-500 mt-1">Generated on: {new Date().toLocaleString("en-IN")}</p>
      </div>

      {/* Date Preset Selector Card */}
      <Card className="p-4 border-[#d4d9b8] rounded-[8px] shadow-none bg-white no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "week", label: "This Week" },
              { id: "month", label: "This Month" },
              { id: "30d", label: "Last 30 Days" },
              { id: "custom", label: "Custom Range" }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handlePresetChange(p.id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded border transition-all cursor-pointer",
                  preset === p.id
                    ? "bg-[#3d5a2e] text-white border-[#3d5a2e]"
                    : "border-[#d4d9b8] text-[#8a8a7a] hover:border-[#3d5a2e] hover:text-[#3d5a2e]"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs */}
          <div className={cn("flex items-center gap-3 transition-opacity duration-200", preset !== "custom" && "opacity-60")}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#8a8a7a] uppercase">From</span>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  disabled={preset !== "custom"}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                  }}
                  className="pl-3 pr-3 py-1 text-xs font-bold border border-[#d4d9b8] rounded focus:outline-none focus:border-[#3d5a2e] text-[#1a2c1a] bg-white h-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#8a8a7a] uppercase">To</span>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  disabled={preset !== "custom"}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                  }}
                  className="pl-3 pr-3 py-1 text-xs font-bold border border-[#d4d9b8] rounded focus:outline-none focus:border-[#3d5a2e] text-[#1a2c1a] bg-white h-9"
                />
              </div>
            </div>
            {preset === "custom" && (
              <Button
                onClick={() => fetchReportData(startDate, endDate)}
                className="bg-[#3d5a2e] hover:bg-[#2f4422] text-white text-[11px] font-bold uppercase h-9 px-4 rounded cursor-pointer"
              >
                Apply
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* KPI Cards (Displays in both screen and print) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 border-[#d4d9b8] rounded-[8px] shadow-none bg-white flex flex-col justify-between card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8a8a7a]">Gross Sales</span>
            <div className="p-1.5 rounded bg-[#FAEEDA] text-[#854F0B] print:hidden">
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-black text-[#1a2c1a]">₹{(summary.grossSales || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h3>
            <p className="text-[9px] text-[#8a8a7a] mt-0.5">Sum of item retail totals</p>
          </div>
        </Card>

        <Card className="p-4 border-[#d4d9b8] rounded-[8px] shadow-none bg-white flex flex-col justify-between card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8a8a7a]">Coupon Deductions</span>
            <div className="p-1.5 rounded bg-[#EEEDFE] text-[#534AB7] print:hidden">
              <Percent size={14} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-black text-[#A32D2D]">-₹{(summary.totalCouponDiscount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h3>
            <p className="text-[9px] text-[#8a8a7a] mt-0.5">Total discounts given</p>
          </div>
        </Card>

        <Card className="p-4 border-[#d4d9b8] rounded-[8px] shadow-none bg-white flex flex-col justify-between card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8a8a7a]">GST Tax Collected</span>
            <div className="p-1.5 rounded bg-[#E6F1FB] text-[#185FA5] print:hidden">
              <IndianRupee size={14} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-black text-[#185FA5]">₹{(summary.totalTax || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h3>
            <p className="text-[9px] text-gray-500 mt-0.5">
              CGST: ₹{Math.round(summary.totalCgst || 0)} | SGST: ₹{Math.round(summary.totalSgst || 0)}
            </p>
          </div>
        </Card>

        <Card className="p-4 border-[#d4d9b8] rounded-[8px] shadow-none bg-white flex flex-col justify-between card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8a8a7a]">Net Sales (Revenue)</span>
            <div className="p-1.5 rounded bg-[#EAF3DE] text-[#3B6D11] print:hidden">
              <IndianRupee size={14} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-black text-[#3B6D11]">₹{(summary.netSales || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h3>
            <p className="text-[9px] text-[#8a8a7a] mt-0.5">Subtotal+Tax+Fees-Discount</p>
          </div>
        </Card>

        <Card className="p-4 border-[#d4d9b8] rounded-[8px] shadow-none bg-white flex flex-col justify-between card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8a8a7a]">Completed Orders</span>
            <div className="p-1.5 rounded bg-[#f0f2e8] text-[#3d5a2e] print:hidden">
              <ShoppingCart size={14} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-black text-[#3d5a2e]">{summary.totalOrdersCount} Orders</h3>
            <p className="text-[9px] text-[#8a8a7a] mt-0.5">AOV: ₹{Math.round(summary.avgOrderValue || 0)}</p>
          </div>
        </Card>
      </div>

      {/* Tabs Navigation (Screen only) */}
      <div className="flex gap-2 bg-[#f0f2e8] p-1 rounded-lg max-w-2xl no-print">
        {[
          { id: "overview", label: "Overview", icon: TrendingUp },
          { id: "products", label: "Products & Categories", icon: Package },
          { id: "gst", label: "GST Ledger", icon: Layers },
          { id: "payments", label: "Payment Stats", icon: CreditCard }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-white text-[#3d5a2e] shadow-sm"
                  : "text-[#8a8a7a] hover:text-[#1a2c1a]"
              )}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & CHARTS */}
      {(activeTab === "overview" || isPrinting) && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Trend Chart */}
            <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-white lg:col-span-2 card">
              <div className="mb-6">
                <h3 className="font-black uppercase tracking-tight text-[#1a2c1a]">Net Sales Trend</h3>
                <p className="text-[10px] text-[#8a8a7a]">Daily Net Revenue progression over time.</p>
              </div>
              <div className="h-[260px] w-full">
                {data?.dailySales && data.dailySales.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.dailySales}>
                      <defs>
                        <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3d5a2e" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#3d5a2e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f2e8" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#8a8a7a", fontSize: 9, fontWeight: 700 }}
                        dy={8}
                        interval={getChartInterval(data?.dailySales?.length || 0)}
                        tickFormatter={(str) => {
                          try {
                            const dateObj = new Date(str);
                            return dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                          } catch {
                            return str;
                          }
                        }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#8a8a7a", fontSize: 9, fontWeight: 700 }}
                        tickFormatter={(value) => `₹${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "6px",
                          border: "1px solid #d4d9b8",
                          boxShadow: "none",
                          fontSize: "11px",
                          fontWeight: "700"
                        }}
                        formatter={(value) => [`₹${value}`, "Net Sales"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="net"
                        stroke="#3d5a2e"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorNet)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-[#8a8a7a] font-bold uppercase">No data found in range</div>
                )}
              </div>
            </Card>

            {/* Accounting Adjustments */}
            <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-white card">
              <h3 className="font-black uppercase tracking-tight text-[#1a2c1a] mb-4">Accounting Reconciliation</h3>
              <div className="space-y-4 text-xs">
                <div className="flex justify-between border-b border-[#f0f2e8] pb-2">
                  <span className="text-[#8a8a7a]">Gross Sales (Items Total)</span>
                  <span className="font-bold text-[#1a2c1a]">₹{(summary.grossSales || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-b border-[#f0f2e8] pb-2 text-rose-600 font-medium">
                  <span>- Coupon Discounts</span>
                  <span>-₹{(summary.totalCouponDiscount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-b border-[#f0f2e8] pb-2 text-emerald-600 font-medium">
                  <span>+ Delivery Collected</span>
                  <span>₹{(summary.totalDeliveryCharge || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-b border-[#f0f2e8] pb-2 text-emerald-600 font-medium">
                  <span>+ Packaging Fees</span>
                  <span>₹{(summary.totalPackagingFee || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-b border-[#f0f2e8] pb-2">
                  <span className="text-gray-500 font-medium">+ GST Tax (5% / 18%)</span>
                  <span className="font-bold text-[#1a2c1a]">₹{(summary.totalTax || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-t border-[#d4d9b8] pt-3 text-sm font-black text-[#3d5a2e]">
                  <span>Net Ledger Income</span>
                  <span>₹{(summary.netSales || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="pt-4 border-t border-dashed border-[#d4d9b8] mt-2">
                  <h4 className="font-bold text-[10px] uppercase text-[#A32D2D] flex items-center gap-1.5">
                    <AlertCircle size={12} />
                    Cancellation Loss Ledger
                  </h4>
                  <div className="mt-2 space-y-1.5 text-[10px] font-bold text-[#8a8a7a]">
                    <div className="flex justify-between">
                      <span>Cancelled Orders</span>
                      <span className="text-[#A32D2D]">{summary.cancelledOrdersCount} Orders</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Restocked/Lost Revenue</span>
                      <span className="text-[#A32D2D]">₹{(summary.revenueLostCancelled || 0).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCT & CATEGORY SALES */}
      {(activeTab === "products" || isPrinting) && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Products Breakdown Table */}
          <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-white lg:col-span-3 card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-black uppercase tracking-tight text-[#1a2c1a]">Sales by Item</h3>
                <p className="text-[10px] text-[#8a8a7a]">Quantity and revenue aggregated by product variant.</p>
              </div>
              <div className="flex items-center gap-2 no-print">
                <input
                  type="text"
                  placeholder="Search item..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-[#d4d9b8] rounded focus:outline-none focus:border-[#3d5a2e] w-40"
                />
                <Button
                  onClick={handleExportProducts}
                  variant="outline"
                  className="border-[#d4d9b8] text-[#3d5a2e] hover:bg-[#3d5a2e] hover:text-white text-[10px] font-bold uppercase h-8 px-2 cursor-pointer"
                >
                  <Download size={12} />
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#f0f2e8] text-[#1a2c1a] text-[10px] uppercase tracking-widest font-black border-b border-[#d4d9b8]">
                  <tr>
                    <th className="px-4 py-2.5 font-bold">Product Name</th>
                    <th className="px-4 py-2.5 font-bold">Variant</th>
                    <th className="px-4 py-2.5 font-bold text-center">Units Sold</th>
                    <th className="px-4 py-2.5 text-right font-bold">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f2e8]">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((item: any, i: number) => (
                      <tr key={item.id} className={cn(i % 2 === 0 ? "bg-white" : "bg-[#f9faf6]", "text-xs hover:bg-[#f0f2e8] transition-colors")}>
                        <td className="px-4 py-3 font-bold text-[#1a2c1a]">{item.name}</td>
                        <td className="px-4 py-3 text-gray-500 font-medium">{item.variant}</td>
                        <td className="px-4 py-3 text-center font-bold text-[#3d5a2e]">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-bold text-[#1a2c1a]">₹{(item.revenue || 0).toLocaleString("en-IN")}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-xs text-[#8a8a7a] font-bold uppercase">No product sales in range</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Categories Breakdown Card */}
          <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-white lg:col-span-2 card">
            <h3 className="font-black uppercase tracking-tight text-[#1a2c1a] mb-6">Sales by Category</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#f0f2e8] text-[#1a2c1a] text-[10px] uppercase tracking-widest font-black border-b border-[#d4d9b8]">
                  <tr>
                    <th className="px-4 py-2.5 font-bold">Category</th>
                    <th className="px-4 py-2.5 text-center font-bold">Units</th>
                    <th className="px-4 py-2.5 text-right font-bold">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f2e8]">
                  {data?.categorySales && data.categorySales.length > 0 ? (
                    data.categorySales.map((item: any, i: number) => (
                      <tr key={item.name} className={cn(i % 2 === 0 ? "bg-white" : "bg-[#f9faf6]", "text-xs hover:bg-[#f0f2e8]/50 transition-colors")}>
                        <td className="px-4 py-3 font-black text-[#3d5a2e]">{item.name}</td>
                        <td className="px-4 py-3 text-center font-bold text-gray-500">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-bold text-[#1a2c1a]">₹{(item.revenue || 0).toLocaleString("en-IN")}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-xs text-[#8a8a7a] font-bold uppercase">No category sales in range</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: GST TAX LEDGER */}
      {(activeTab === "gst" || isPrinting) && (
        <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-white card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-black uppercase tracking-tight text-[#1a2c1a]">GST Sales Ledger</h3>
              <p className="text-[10px] text-[#8a8a7a]">Order-by-order audit log of taxes collected (CGST / SGST / IGST breakdown).</p>
            </div>
            <div className="flex items-center gap-2 no-print">
              <input
                type="text"
                placeholder="Search order/buyer..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="px-2.5 py-1 text-xs border border-[#d4d9b8] rounded focus:outline-none focus:border-[#3d5a2e] w-48"
              />
              <Button
                onClick={handleExportTaxLedger}
                variant="outline"
                className="border-[#d4d9b8] text-[#3d5a2e] hover:bg-[#3d5a2e] hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer h-9"
              >
                <Download size={14} /> Export CSV
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap print:whitespace-normal">
              <thead className="bg-[#1a2c1a] text-white text-[9px] uppercase tracking-widest font-black">
                <tr>
                  <th className="px-3 py-2.5 font-bold">Date</th>
                  <th className="px-3 py-2.5 font-bold">Order #</th>
                  <th className="px-3 py-2.5 font-bold">Customer</th>
                  <th className="px-3 py-2.5 text-right font-bold">Subtotal</th>
                  <th className="px-3 py-2.5 text-right font-bold">Discount</th>
                  <th className="px-3 py-2.5 text-right font-bold">CGST</th>
                  <th className="px-3 py-2.5 text-right font-bold">SGST</th>
                  <th className="px-3 py-2.5 text-right font-bold">IGST</th>
                  <th className="px-3 py-2.5 text-right font-bold">Total GST</th>
                  <th className="px-3 py-2.5 text-right font-bold">Net Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2e8]">
                {filteredLedger.length > 0 ? (
                  filteredLedger.map((row: any, i: number) => (
                    <tr key={row.orderId} className={cn(i % 2 === 0 ? "bg-white" : "bg-[#f9faf6]", "text-[11px] hover:bg-[#f0f2e8] transition-colors")}>
                      <td className="px-3 py-3 text-gray-500 font-bold">
                        {new Date(row.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
                      </td>
                      <td className="px-3 py-3 font-mono font-bold text-[#3d5a2e]">{row.orderNumber}</td>
                      <td className="px-3 py-3 text-[#1a2c1a] font-bold max-w-[120px] truncate" title={row.customerName}>
                        {row.customerName}
                      </td>
                      <td className="px-3 py-3 text-right font-medium">₹{row.subtotal.toFixed(0)}</td>
                      <td className="px-3 py-3 text-right text-[#A32D2D] font-medium">-₹{row.couponDiscount.toFixed(0)}</td>
                      <td className="px-3 py-3 text-right text-gray-500 font-medium">₹{row.cgst.toFixed(1)}</td>
                      <td className="px-3 py-3 text-right text-gray-500 font-medium">₹{row.sgst.toFixed(1)}</td>
                      <td className="px-3 py-3 text-right text-gray-500 font-medium">₹{row.igst.toFixed(1)}</td>
                      <td className="px-3 py-3 text-right text-[#185FA5] font-bold">₹{row.totalTax.toFixed(1)}</td>
                      <td className="px-3 py-3 text-right font-black text-[#1a2c1a]">₹{row.totalAmount.toFixed(0)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="px-3 py-8 text-center text-xs text-[#8a8a7a] font-bold uppercase">No audit entries found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: PAYMENT SUMMARY */}
      {(activeTab === "payments" || isPrinting) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Methods Table */}
          <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-white lg:col-span-1 card">
            <h3 className="font-black uppercase tracking-tight text-[#1a2c1a] mb-6">Payment Distribution</h3>
            <div className="space-y-4">
              {data?.paymentBreakdown?.map((item: any, idx: number) => {
                const percentage = summary.netSales > 0 ? (item.total / summary.netSales) * 100 : 0;
                return (
                  <div key={item.method} className="p-4 bg-[#f9faf6] border border-[#f0f2e8] rounded-[6px]">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                        />
                        <span className="text-xs font-black uppercase text-[#1a2c1a]">{item.method}</span>
                      </div>
                      <span className="text-xs font-bold text-[#3d5a2e]">{percentage.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <p className="text-[10px] text-[#8a8a7a] font-bold uppercase">{item.count} Transactions</p>
                      <p className="text-sm font-black text-[#1a2c1a]">₹{item.total.toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Recharts Pie Chart of Payments */}
          <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-white lg:col-span-2 card flex flex-col justify-between">
            <div>
              <h3 className="font-black uppercase tracking-tight text-[#1a2c1a]">Method Share</h3>
              <p className="text-[10px] text-[#8a8a7a]">Visual share of payment modes by total net revenue value.</p>
            </div>
            
            <div className="h-[220px] w-full flex items-center justify-center mt-4">
              {data?.paymentBreakdown && data.paymentBreakdown.some((item: any) => item.total > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.paymentBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total"
                      nameKey="method"
                      label={({ name, percent }) => `${name} ${percent !== undefined ? (percent * 100).toFixed(0) : "0"}%`}
                    >
                      {data.paymentBreakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`₹${value}`, "Net Total"]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-[#8a8a7a] font-bold uppercase">No payment transactions recorded</div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
