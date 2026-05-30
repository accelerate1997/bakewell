"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  MapPin, 
  Truck, 
  CreditCard, 
  Trash2, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  X, 
  Check, 
  Loader2, 
  AlertCircle 
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface PincodeRecord {
  id: string;
  pincode: string;
  city: string;
  state: string;
  deliveryDays: number;
  deliveryCharge: number;
  codAvailable: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function AdminPincodesPage() {
  const [pincodes, setPincodes] = useState<PincodeRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Single Add form state
  const [newPincode, setNewPincode] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newDeliveryDays, setNewDeliveryDays] = useState(2);
  const [newDeliveryCharge, setNewDeliveryCharge] = useState(0);
  const [newCodAvailable, setNewCodAvailable] = useState(true);
  const [submittingSingle, setSubmittingSingle] = useState(false);

  // Bulk CSV state
  const [dragActive, setDragActive] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedPincodes, setParsedPincodes] = useState<any[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [submittingBulk, setSubmittingBulk] = useState(false);

  // Fetch pincodes from API
  const fetchPincodes = async (query = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pincodes?search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setPincodes(data);
      } else {
        toast.error("Failed to load pincodes");
      }
    } catch (error) {
      console.error("Error fetching pincodes:", error);
      toast.error("An error occurred while loading pincodes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPincodes(searchQuery);
  }, [searchQuery]);

  // Handle delete pincode
  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete pincode ${code}?`)) return;

    try {
      const res = await fetch(`/api/admin/pincodes/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`Pincode ${code} deleted successfully`);
        fetchPincodes(searchQuery);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete pincode");
      }
    } catch (error) {
      console.error("Error deleting pincode:", error);
      toast.error("Something went wrong during deletion");
    }
  };

  // Add a single pincode
  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPincode.trim().length !== 6) {
      toast.error("Pincode must be exactly 6 digits");
      return;
    }

    setSubmittingSingle(true);
    try {
      const res = await fetch("/api/admin/pincodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pincode: newPincode.trim(),
          city: newCity.trim(),
          state: newState.trim(),
          deliveryDays: newDeliveryDays,
          deliveryCharge: newDeliveryCharge,
          codAvailable: newCodAvailable,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Pincode ${newPincode} configured successfully!`);
        setIsAddModalOpen(false);
        // Reset form
        setNewPincode("");
        setNewCity("");
        setNewState("");
        setNewDeliveryDays(2);
        setNewDeliveryCharge(0);
        setNewCodAvailable(true);
        fetchPincodes(searchQuery);
      } else {
        toast.error(data.error || "Failed to add pincode");
      }
    } catch (err) {
      console.error("Add pincode error:", err);
      toast.error("Something went wrong while adding pincode");
    } finally {
      setSubmittingSingle(false);
    }
  };

  // Parse CSV data
  const handleCSVParse = (text: string) => {
    try {
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        setCsvError("CSV file is empty or contains no records");
        return;
      }

      // Check headers
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/['"]/g, ""));
      const required = ["pincode", "city", "state"];
      const missing = required.filter(r => !headers.includes(r));

      const hasHeaders = missing.length === 0;
      const startLineIdx = hasHeaders ? 1 : 0;

      const results = [];
      for (let i = startLineIdx; i < lines.length; i++) {
        const row = lines[i].split(",").map(cell => cell.trim().replace(/['"]/g, ""));
        if (row.length < 3) continue;

        let pincode = "";
        let city = "";
        let state = "";
        let deliveryDays = 2;
        let deliveryCharge = 0;
        let codAvailable = true;

        if (hasHeaders) {
          pincode = row[headers.indexOf("pincode")] || "";
          city = row[headers.indexOf("city")] || "";
          state = row[headers.indexOf("state")] || "";

          const daysIdx = headers.indexOf("deliverydays");
          if (daysIdx !== -1 && row[daysIdx]) deliveryDays = parseInt(row[daysIdx]) || 2;

          const chargeIdx = headers.indexOf("deliverycharge");
          if (chargeIdx !== -1 && row[chargeIdx]) deliveryCharge = parseFloat(row[chargeIdx]) || 0;

          const codIdx = headers.indexOf("codavailable");
          if (codIdx !== -1 && row[codIdx]) {
            const val = row[codIdx].toLowerCase();
            codAvailable = val !== "false" && val !== "0" && val !== "no";
          }
        } else {
          // Positional parsing fallback
          pincode = row[0] || "";
          city = row[1] || "";
          state = row[2] || "";
          if (row[3]) deliveryDays = parseInt(row[3]) || 2;
          if (row[4]) deliveryCharge = parseFloat(row[4]) || 0;
          if (row[5]) {
            const val = row[5].toLowerCase();
            codAvailable = val !== "false" && val !== "0" && val !== "no";
          }
        }

        // Basic validation: 6-digit pincodes
        const cleanPincode = pincode.replace(/\D/g, "");
        if (cleanPincode.length === 6 && city && state) {
          results.push({
            pincode: cleanPincode,
            city,
            state,
            deliveryDays,
            deliveryCharge,
            codAvailable
          });
        }
      }

      if (results.length === 0) {
        setCsvError("No valid 6-digit pincode records found. Please ensure City, State, and Pincode are valid.");
      } else {
        setParsedPincodes(results);
        setCsvError(null);
      }
    } catch (err) {
      console.error("CSV parse error:", err);
      setCsvError("Failed to parse CSV file. Please check formatting.");
    }
  };

  // Handle CSV file selection/drop
  const handleCSVFile = (file: File) => {
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setCsvError("Only CSV files are supported");
      return;
    }

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) handleCSVParse(text);
    };
    reader.readAsText(file);
  };

  // Drag over handler
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Drop handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleCSVFile(e.dataTransfer.files[0]);
    }
  };

  // Submit bulk upload
  const handleBulkUpload = async () => {
    if (parsedPincodes.length === 0) return;

    setSubmittingBulk(true);
    try {
      const res = await fetch("/api/admin/pincodes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedPincodes),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Successfully imported/upserted ${data.count} serviceable pincodes!`);
        setIsBulkModalOpen(false);
        setCsvFile(null);
        setParsedPincodes([]);
        fetchPincodes(searchQuery);
      } else {
        toast.error(data.error || "Failed to upload pincodes");
      }
    } catch (err) {
      console.error("Bulk upload error:", err);
      toast.error("Something went wrong during bulk import");
    } finally {
      setSubmittingBulk(false);
    }
  };

  // Stats calculation
  const totalPincodes = pincodes.length;
  const uniqueCities = Array.from(new Set(pincodes.map(p => p.city.toLowerCase()))).length;
  const freeShippingCount = pincodes.filter(p => p.deliveryCharge === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#1a2c1a]">Serviceable Pincodes</h1>
          <p className="text-xs text-[#8a8a7a] mt-1 font-bold uppercase tracking-wider">
            Configure shipping areas, delivery days, custom rates, and COD options
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            onClick={() => setIsBulkModalOpen(true)}
            variant="outline"
            className="border-[#d4d9b8] hover:bg-[#f0f2e8] text-[#1a2c1a] gap-2 font-bold uppercase tracking-wider text-xs"
          >
            <Upload size={14} />
            Bulk CSV Import
          </Button>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#3d5a2e] hover:bg-[#1a2c1a] text-white gap-2 font-bold uppercase tracking-wider text-xs"
          >
            <Plus size={14} />
            Add Pincode
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: "Configured Pincodes", value: loading ? "..." : totalPincodes, icon: MapPin, bg: "bg-[#eaf3de]", color: "text-[#3d5a2e]" },
          { label: "Covered Cities", value: loading ? "..." : uniqueCities, icon: Truck, bg: "bg-[#e6f1fb]", color: "text-[#185fa5]" },
          { label: "Free Shipping Areas", value: loading ? "..." : freeShippingCount, icon: CreditCard, bg: "bg-[#faeeda]", color: "text-[#854f0b]" },
        ].map((stat) => (
          <Card key={stat.label} className="p-5 border-[#d4d9b8] rounded-xl shadow-none bg-white flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bg, stat.color)}>
              <stat.icon size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a8a7a]">{stat.label}</p>
              <h4 className="text-xl font-black text-[#1a2c1a] mt-0.5">{stat.value}</h4>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters and Table Area */}
      <Card className="border-[#d4d9b8] rounded-xl shadow-none bg-white overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 sm:p-6 border-b border-[#f0f2e8] bg-[#f9faf6] flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8a7a]" />
            <Input
              type="text"
              placeholder="Search pincode, city, or state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-[#d4d9b8] focus:border-[#c8872a] rounded-lg text-sm"
            />
          </div>
          <div className="text-[11px] text-[#8a8a7a] font-bold uppercase tracking-wider">
            {loading ? "Refreshing records..." : `Showing ${pincodes.length} results`}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading && pincodes.length === 0 ? (
            <div className="py-24 text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#c8872a] mx-auto" />
              <p className="text-sm text-[#8a8a7a] font-bold uppercase tracking-wider">Loading configurations...</p>
            </div>
          ) : pincodes.length === 0 ? (
            <div className="py-24 text-center space-y-4">
              <div className="w-16 h-16 bg-[#f0f2e8] rounded-full flex items-center justify-center mx-auto">
                <MapPin className="w-8 h-8 text-[#8a8a7a]" />
              </div>
              <h3 className="text-lg font-black uppercase text-[#1a2c1a]">No Pincodes Found</h3>
              <p className="text-xs text-[#8a8a7a] max-w-sm mx-auto uppercase tracking-wider font-bold">
                {searchQuery ? "Try checking spelling or type another term" : "Click 'Add Pincode' to configure delivery areas."}
              </p>
              {searchQuery && (
                <Button 
                  onClick={() => setSearchQuery("")} 
                  variant="link" 
                  className="text-[#3d5a2e] font-black uppercase tracking-wider text-xs"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#1a2c1a] text-white text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 font-bold border-r border-white/5">Pincode</th>
                  <th className="px-6 py-4 font-bold border-r border-white/5">City & State</th>
                  <th className="px-6 py-4 font-bold text-center border-r border-white/5">Delivery Days</th>
                  <th className="px-6 py-4 font-bold text-center border-r border-white/5">Shipping Charge</th>
                  <th className="px-6 py-4 font-bold text-center border-r border-white/5">COD Available</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2e8]">
                {pincodes.map((pin, i) => (
                  <tr 
                    key={pin.id} 
                    className={cn(
                      i % 2 === 0 ? "bg-white" : "bg-[#f9faf6]", 
                      "hover:bg-[#f0f2e8]/60 transition-colors"
                    )}
                  >
                    <td className="px-6 py-4 font-mono font-bold text-sm text-[#3d5a2e]">
                      {pin.pincode}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-[#1a2c1a]">{pin.city}</span>
                        <span className="text-[9px] text-[#8a8a7a] font-bold uppercase tracking-wider">{pin.state}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center bg-[#eaf3de] text-[#3d5a2e] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {pin.deliveryDays} Days
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-xs text-[#1a2c1a]">
                      {pin.deliveryCharge === 0 ? (
                        <span className="text-[#3d5a2e] font-black uppercase">Free</span>
                      ) : (
                        `₹${pin.deliveryCharge}`
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider",
                        pin.codAvailable 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      )}>
                        {pin.codAvailable ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-[#A32D2D] hover:bg-[#FCEBEB] rounded-full"
                        onClick={() => handleDelete(pin.id, pin.pincode)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* MODAL 1: Add Single Pincode Form */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border-[#d4d9b8] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#1a2c1a] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-playfair font-black text-lg uppercase tracking-wider">Add Serviceable Pincode</h3>
                <p className="text-[9px] text-white/70 uppercase tracking-widest font-bold mt-0.5">Configure new delivery area</p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddSingle} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label htmlFor="modalPincode" className="text-[10px] font-bold uppercase tracking-wider text-[#1a2c1a]">Pincode (6 Digits) *</label>
                  <Input
                    id="modalPincode"
                    required
                    maxLength={6}
                    placeholder="e.g. 560001"
                    value={newPincode}
                    onChange={(e) => setNewPincode(e.target.value.replace(/\D/g, ""))}
                    className="border-[#d4d9b8] focus:border-[#c8872a] bg-[#f9faf6] text-sm"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label htmlFor="modalCity" className="text-[10px] font-bold uppercase tracking-wider text-[#1a2c1a]">City *</label>
                  <Input
                    id="modalCity"
                    required
                    placeholder="e.g. Bengaluru"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="border-[#d4d9b8] focus:border-[#c8872a] bg-[#f9faf6] text-sm"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label htmlFor="modalState" className="text-[10px] font-bold uppercase tracking-wider text-[#1a2c1a]">State *</label>
                  <Input
                    id="modalState"
                    required
                    placeholder="e.g. Karnataka"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="border-[#d4d9b8] focus:border-[#c8872a] bg-[#f9faf6] text-sm"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label htmlFor="modalDays" className="text-[10px] font-bold uppercase tracking-wider text-[#1a2c1a]">Delivery Days *</label>
                  <Input
                    id="modalDays"
                    type="number"
                    required
                    min={1}
                    max={30}
                    value={newDeliveryDays}
                    onChange={(e) => setNewDeliveryDays(parseInt(e.target.value) || 2)}
                    className="border-[#d4d9b8] focus:border-[#c8872a] bg-[#f9faf6] text-sm"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <label htmlFor="modalCharge" className="text-[10px] font-bold uppercase tracking-wider text-[#1a2c1a]">Shipping Charge (₹) *</label>
                  <Input
                    id="modalCharge"
                    type="number"
                    required
                    min={0}
                    value={newDeliveryCharge}
                    onChange={(e) => setNewDeliveryCharge(parseFloat(e.target.value) || 0)}
                    className="border-[#d4d9b8] focus:border-[#c8872a] bg-[#f9faf6] text-sm"
                  />
                </div>
                <label className="col-span-2 sm:col-span-1 flex items-center justify-between border border-[#d4d9b8] rounded-lg p-3 bg-[#f9faf6] cursor-pointer select-none">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1a2c1a] block">Cash on Delivery</span>
                    <span className="text-[9px] text-[#8a8a7a] font-medium block">Allow COD for this area</span>
                  </div>
                  <Switch
                    checked={newCodAvailable}
                    onCheckedChange={setNewCodAvailable}
                  />
                </label>
              </div>

              <div className="pt-4 border-t border-[#f0f2e8] flex items-center justify-end gap-3">
                <Button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  variant="outline"
                  className="border-[#d4d9b8] font-bold uppercase tracking-wider text-xs px-5 py-4 h-auto"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submittingSingle}
                  className="bg-[#3d5a2e] hover:bg-[#1a2c1a] font-bold uppercase tracking-wider text-xs px-5 py-4 h-auto"
                >
                  {submittingSingle ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null}
                  Confirm & Save
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 2: Bulk CSV Upload */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <Card className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border-[#d4d9b8] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#1a2c1a] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-playfair font-black text-lg uppercase tracking-wider">Bulk CSV Import</h3>
                <p className="text-[9px] text-white/70 uppercase tracking-widest font-bold mt-0.5">Import serviceable pincodes lists</p>
              </div>
              <button 
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setCsvFile(null);
                  setParsedPincodes([]);
                  setCsvError(null);
                }}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Instructions and Sample download */}
              <div className="bg-[#f9faf6] border border-[#d4d9b8] rounded-xl p-4 space-y-3">
                <div className="flex gap-2 items-start text-[#3d5a2e]">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-wider text-[#1a2c1a]">CSV Formatting Guide</h5>
                    <p className="text-[11px] text-[#4a4a4a] mt-0.5 leading-relaxed">
                      Make sure your CSV contains a header row with at least <strong className="text-[#3d5a2e]">pincode, city, state</strong>. 
                      You can optionally include columns for <strong className="text-[#3d5a2e]">deliveryDays, deliveryCharge, codAvailable</strong>.
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#d4d9b8]/50 flex items-center justify-between">
                  <span className="text-[10px] text-[#8a8a7a] font-bold uppercase tracking-wider">Download starting format:</span>
                  <a
                    href="data:text/csv;charset=utf-8,pincode,city,state,deliveryDays,deliveryCharge,codAvailable%0A560001,Bengaluru,Karnataka,2,40,true%0A400001,Mumbai,Maharashtra,3,60,false"
                    download="pincodes_template.csv"
                    className="inline-flex items-center gap-1.5 text-xs text-[#3d5a2e] font-black uppercase hover:underline"
                  >
                    <Download size={12} />
                    Download CSV Template
                  </a>
                </div>
              </div>

              {/* File Dropzone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3",
                  dragActive 
                    ? "border-[#c8872a] bg-[#c8872a]/5" 
                    : csvFile 
                    ? "border-[#3d5a2e] bg-[#eaf3de]/20" 
                    : "border-[#d4d9b8] hover:border-[#3d5a2e] bg-[#f9faf6]"
                )}
                onClick={() => document.getElementById("csv-file-input")?.click()}
              >
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleCSVFile(e.target.files[0])}
                />
                
                {csvFile ? (
                  <>
                    <FileSpreadsheet className="w-12 h-12 text-[#3d5a2e]" />
                    <div>
                      <h4 className="text-sm font-black text-[#1a2c1a]">{csvFile.name}</h4>
                      <p className="text-[10px] text-[#8a8a7a] uppercase tracking-wider font-bold mt-0.5">
                        {(csvFile.size / 1024).toFixed(2)} KB • {parsedPincodes.length} Valid Records Found
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-[#8a8a7a] group-hover:text-[#3d5a2e]" />
                    <div>
                      <h4 className="text-sm font-black text-[#1a2c1a] uppercase tracking-wider">Drag & Drop CSV File</h4>
                      <p className="text-[10px] text-[#8a8a7a] uppercase tracking-widest mt-1">
                        or click to browse your files
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Error block */}
              {csvError && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3.5 text-xs font-semibold flex gap-2 items-center">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{csvError}</span>
                </div>
              )}

              {/* Preview parsed data */}
              {parsedPincodes.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#1a2c1a]">Data Preview (First 3 rows)</h5>
                  <div className="border border-[#d4d9b8] rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-[#f0f2e8] text-[#1a2c1a] text-[9px] uppercase tracking-widest font-black">
                        <tr>
                          <th className="px-4 py-2 border-r border-[#d4d9b8]">Pincode</th>
                          <th className="px-4 py-2 border-r border-[#d4d9b8]">City & State</th>
                          <th className="px-4 py-2 border-r border-[#d4d9b8] text-center">Days</th>
                          <th className="px-4 py-2 border-r border-[#d4d9b8] text-center">Charge</th>
                          <th className="px-4 py-2 text-center">COD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#d4d9b8]">
                        {parsedPincodes.slice(0, 3).map((item, idx) => (
                          <tr key={idx} className="bg-white">
                            <td className="px-4 py-2 font-mono font-bold text-[#3d5a2e]">{item.pincode}</td>
                            <td className="px-4 py-2">{item.city}, {item.state}</td>
                            <td className="px-4 py-2 text-center">{item.deliveryDays} d</td>
                            <td className="px-4 py-2 text-center">₹{item.deliveryCharge}</td>
                            <td className="px-4 py-2 text-center">{item.codAvailable ? "Yes" : "No"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-4 border-t border-[#f0f2e8] flex items-center justify-end gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    setIsBulkModalOpen(false);
                    setCsvFile(null);
                    setParsedPincodes([]);
                    setCsvError(null);
                  }}
                  variant="outline"
                  className="border-[#d4d9b8] font-bold uppercase tracking-wider text-xs px-5 py-4 h-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkUpload}
                  disabled={parsedPincodes.length === 0 || submittingBulk}
                  className="bg-[#3d5a2e] hover:bg-[#1a2c1a] font-bold uppercase tracking-wider text-xs px-5 py-4 h-auto"
                >
                  {submittingBulk ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null}
                  Import {parsedPincodes.length} Pincodes
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
