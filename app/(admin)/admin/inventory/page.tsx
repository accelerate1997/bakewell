"use client"

import { useState, useEffect } from 'react';
import { 
  Search, 
  Upload, 
  Plus, 
  Minus, 
  Save,
  AlertTriangle,
  FileDown,
  X,
  Loader2,
  Check,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockStatus, setStockStatus] = useState('all');
  const [stockAdjustments, setStockAdjustments] = useState<Record<string, number>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Bulk CSV States
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [submittingBulk, setSubmittingBulk] = useState(false);

  const fetchInventoryData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/admin/products').then(res => res.json()),
      fetch('/api/admin/categories').then(res => res.json())
    ]).then(([prodData, catData]) => {
      if (Array.isArray(prodData)) setProducts(prodData);
      if (Array.isArray(catData)) setCategories(catData);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
      toast.error('Failed to load inventory data');
    });
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const handleUpdateStock = async (variantId: string, newStock: number) => {
    setUpdatingId(variantId);
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, stock: newStock })
      });
      if (res.ok) {
        setProducts(prevProducts => prevProducts.map(p => ({
          ...p,
          variants: p.variants?.map((v: any) => v.id === variantId ? { ...v, stock: newStock } : v)
        })));
        setStockAdjustments(prev => {
          const next = { ...prev };
          delete next[variantId];
          return next;
        });
        toast.success('Stock updated successfully');
      } else {
        toast.error('Failed to update stock');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating stock');
    } finally {
      setUpdatingId(null);
    }
  };

  // Compile all variants into flat inventory list
  const inventoryItems: any[] = [];
  products.forEach((p: any) => {
    if (p.variants && Array.isArray(p.variants)) {
      p.variants.forEach((v: any) => {
        inventoryItems.push({
          id: v.id,
          productId: p.id,
          name: p.name,
          categorySlug: p.category?.slug,
          variant: v.label,
          sku: v.sku,
          stock: v.stock,
          threshold: 10,
          status: v.stock === 0 ? 'Out of Stock' : v.stock <= 10 ? 'Low Stock' : 'In Stock'
        });
      });
    }
  });

  const filteredInventory = inventoryItems.filter((item: any) => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || item.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || item.categorySlug === selectedCategory;
    const matchesStatus = stockStatus === 'all' || 
      (stockStatus === 'in-stock' && item.status === 'In Stock') ||
      (stockStatus === 'low-stock' && item.status === 'Low Stock') ||
      (stockStatus === 'out-of-stock' && item.status === 'Out of Stock');
    return matchesSearch && matchesCat && matchesStatus;
  });

  const lowStockCount = inventoryItems.filter((item: any) => item.status === 'Low Stock' || item.status === 'Out of Stock').length;

  // CSV Template generation
  const handleDownloadTemplate = () => {
    if (inventoryItems.length === 0) {
      toast.error("No items in inventory to export");
      return;
    }
    const headers = 'sku,stock\n';
    const rows = inventoryItems.map(item => `${item.sku || ''},${item.stock || 0}`).join('\n');
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', 'dailybake_inventory.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Inventory CSV template downloaded!");
  };

  // CSV Parsing
  const handleCSVParse = (text: string) => {
    try {
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        setCsvError("CSV file is empty or contains no records");
        return;
      }

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/['"]/g, ""));
      const skuIdx = headers.indexOf("sku");
      const stockIdx = headers.indexOf("stock");

      if (skuIdx === -1 || stockIdx === -1) {
        setCsvError("CSV must contain both 'sku' and 'stock' headers");
        return;
      }

      const results = [];
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(",").map(cell => cell.trim().replace(/['"]/g, ""));
        if (row.length < Math.max(skuIdx, stockIdx) + 1) continue;

        const sku = row[skuIdx];
        const stockVal = parseInt(row[stockIdx]);

        if (sku && !isNaN(stockVal)) {
          results.push({
            sku,
            stock: Math.max(0, stockVal)
          });
        }
      }

      if (results.length === 0) {
        setCsvError("No valid inventory records found with correct SKU and stock values");
      } else {
        setParsedItems(results);
        setCsvError(null);
      }
    } catch (err) {
      console.error("CSV parse error:", err);
      setCsvError("Failed to parse CSV file. Please check formatting.");
    }
  };

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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleCSVFile(e.dataTransfer.files[0]);
    }
  };

  const handleBulkUpload = async () => {
    if (parsedItems.length === 0) return;

    setSubmittingBulk(true);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedItems),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Successfully updated ${data.count} inventory stock levels!`);
        setIsBulkModalOpen(false);
        setCsvFile(null);
        setParsedItems([]);
        fetchInventoryData();
      } else {
        toast.error(data.error || "Failed to update inventory");
      }
    } catch (err) {
      console.error("Bulk upload error:", err);
      toast.error("Something went wrong during bulk update");
    } finally {
      setSubmittingBulk(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#1a2c1a]">Inventory</h1>
          <p className="text-xs text-[#8a8a7a] mt-1 font-bold uppercase tracking-wider">Monitor and update stock levels</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={handleDownloadTemplate}
            variant="outline" 
            className="border-[#d4d9b8] gap-2 uppercase text-xs font-bold tracking-widest h-10"
          >
            <FileDown size={16} />
            CSV Template
          </Button>
          <Button 
            onClick={() => setIsBulkModalOpen(true)}
            className="btn-primary gap-2"
          >
            <Upload size={16} />
            Bulk Update
          </Button>
        </div>
      </div>

      {/* Alert Banner */}
      {lowStockCount > 0 && (
        <Card className="bg-[#FCEBEB] border-[#A32D2D]/20 p-4 rounded-[8px] flex items-center justify-between">
          <div className="flex items-center gap-3 text-[#A32D2D]">
            <AlertTriangle size={20} />
            <p className="text-xs font-bold uppercase tracking-wide">{lowStockCount} products are running low on stock and need attention</p>
          </div>
          <Button variant="link" className="text-[#A32D2D] font-black uppercase text-[10px] p-0 h-auto underline">
            View All
          </Button>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4 border-[#d4d9b8] rounded-[8px] shadow-none bg-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8a7a]" size={16} />
            <Input 
              placeholder="Search products or SKU..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 h-10 border-[#d4d9b8] bg-white text-sm" 
            />
          </div>
          <Select value={selectedCategory} onValueChange={(val: any) => setSelectedCategory(val || 'all')}>
            <SelectTrigger className="h-10 border-[#d4d9b8] bg-white text-sm">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="border-[#d4d9b8]">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stockStatus} onValueChange={(val: any) => setStockStatus(val || 'all')}>
            <SelectTrigger className="h-10 border-[#d4d9b8] bg-white text-sm">
              <SelectValue placeholder="Stock Status" />
            </SelectTrigger>
            <SelectContent className="border-[#d4d9b8]">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in-stock">In Stock</SelectItem>
              <SelectItem value="low-stock">Low Stock</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card className="border-[#d4d9b8] rounded-[8px] shadow-none bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#1a2c1a] text-white text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 font-bold">Product & Variant</th>
                <th className="px-6 py-4 font-bold">SKU</th>
                <th className="px-6 py-4 font-bold text-center">Current Stock</th>
                <th className="px-6 py-4 font-bold text-center">Threshold</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold">Stock Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2e8]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#8a8a7a]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-[#3d5a2e]" />
                      <p className="text-xs font-bold uppercase tracking-wider">Loading inventory...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm font-bold text-[#8a8a7a] uppercase tracking-wider">
                    No inventory items found
                  </td>
                </tr>
              ) : filteredInventory.map((item: any, i: number) => {
                const currentVal = stockAdjustments[item.id] !== undefined ? stockAdjustments[item.id] : item.stock;

                return (
                  <tr key={item.id} className={cn(i % 2 === 0 ? "bg-white" : "bg-[#f9faf6]", "hover:bg-[#f0f2e8] transition-colors")}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-xs font-black text-[#1a2c1a]">{item.name}</p>
                        <p className="text-[10px] text-[#8a8a7a] font-bold uppercase">{item.variant}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-mono font-bold text-[#8a8a7a]">{item.sku}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "text-sm font-black",
                        item.stock <= item.threshold ? (item.stock === 0 ? "text-[#8a8a7a]" : "text-[#A32D2D]") : "text-[#3B6D11]"
                      )}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-bold text-[#8a8a7a]">{item.threshold}</td>
                    <td className="px-6 py-4 text-center">
                      <Badge className={cn(
                        "rounded-full border-none px-3 py-0.5 text-[9px] font-black uppercase",
                        item.status === 'In Stock' ? "bg-[#EAF3DE] text-[#3B6D11]" : 
                        item.status === 'Low Stock' ? "bg-[#FAEEDA] text-[#854F0B]" : "bg-[#F5F5F5] text-[#8a8a7a]"
                      )}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-[#d4d9b8] rounded-md overflow-hidden bg-white">
                          <button 
                            type="button"
                            onClick={() => setStockAdjustments({ ...stockAdjustments, [item.id]: Math.max(0, currentVal - 1) })}
                            className="p-1 hover:bg-[#f0f2e8] border-r border-[#d4d9b8] text-[#1a2c1a]"
                          >
                            <Minus size={14} />
                          </button>
                          <Input 
                            value={currentVal} 
                            onChange={(e) => setStockAdjustments({ ...stockAdjustments, [item.id]: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="w-12 h-8 border-none text-center text-xs font-bold focus-visible:ring-0 text-[#1a2c1a]" 
                          />
                          <button 
                            type="button"
                            onClick={() => setStockAdjustments({ ...stockAdjustments, [item.id]: currentVal + 1 })}
                            className="p-1 hover:bg-[#f0f2e8] border-l border-[#d4d9b8] text-[#1a2c1a]"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <Button 
                          type="button"
                          disabled={updatingId === item.id || stockAdjustments[item.id] === undefined || stockAdjustments[item.id] === item.stock}
                          onClick={() => handleUpdateStock(item.id, currentVal)}
                          variant="ghost" 
                          size="icon" 
                          className={cn("h-8 w-8 text-[#3d5a2e] hover:bg-[#EAF3DE]", updatingId === item.id ? "opacity-50" : "")}
                        >
                          <Save size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* BULK CSV UPDATE MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <Card className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border-[#d4d9b8] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#1a2c1a] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-playfair font-black text-lg uppercase tracking-wider">Bulk Stock Update</h3>
                <p className="text-[9px] text-white/70 uppercase tracking-widest font-bold mt-0.5">Import CSV to adjust stock counts</p>
              </div>
              <button 
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setCsvFile(null);
                  setParsedItems([]);
                  setCsvError(null);
                }}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Info Area */}
              <div className="bg-[#f9faf6] border border-[#d4d9b8] rounded-xl p-4 space-y-3">
                <div className="flex gap-2 items-start text-[#3d5a2e]">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-wider text-[#1a2c1a]">CSV Formatting Guide</h5>
                    <p className="text-[11px] text-[#4a4a4a] mt-0.5 leading-relaxed">
                      Make sure your CSV contains a header row with <strong className="text-[#3d5a2e]">sku, stock</strong> columns.
                      Each SKU must match an existing product variant, and stock counts must be non-negative integers.
                    </p>
                  </div>
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
                onClick={() => document.getElementById("inventory-csv-file-input")?.click()}
              >
                <input
                  id="inventory-csv-file-input"
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
                        {(csvFile.size / 1024).toFixed(2)} KB • {parsedItems.length} Records Found
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

              {/* Error box */}
              {csvError && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3.5 text-xs font-semibold flex gap-2 items-center">
                  <AlertTriangle size={16} className="flex-shrink-0" />
                  <span>{csvError}</span>
                </div>
              )}

              {/* Preview parsed data */}
              {parsedItems.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#1a2c1a]">Data Preview (First 3 rows)</h5>
                  <div className="border border-[#d4d9b8] rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-[#f0f2e8] text-[#1a2c1a] text-[9px] uppercase tracking-widest font-black">
                        <tr>
                          <th className="px-4 py-2 border-r border-[#d4d9b8]">SKU</th>
                          <th className="px-4 py-2 text-center">New Stock Count</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#d4d9b8]">
                        {parsedItems.slice(0, 3).map((item, idx) => (
                          <tr key={idx} className="bg-white text-[#1a2c1a] font-semibold">
                            <td className="px-4 py-2 font-mono text-[#3d5a2e]">{item.sku}</td>
                            <td className="px-4 py-2 text-center">{item.stock}</td>
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
                    setParsedItems([]);
                    setCsvError(null);
                  }}
                  variant="outline"
                  className="border-[#d4d9b8] font-bold uppercase tracking-wider text-xs px-5 py-4 h-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkUpload}
                  disabled={parsedItems.length === 0 || submittingBulk}
                  className="bg-[#3d5a2e] hover:bg-[#1a2c1a] font-bold uppercase tracking-wider text-xs px-5 py-4 h-auto text-white"
                >
                  {submittingBulk ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null}
                  Update {parsedItems.length} Items
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
