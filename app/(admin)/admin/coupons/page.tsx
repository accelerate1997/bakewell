"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Copy, 
  Trash2, 
  Pencil,
  Ticket,
  Users,
  TrendingUp,
  RefreshCw,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  minOrderAmount: number;
  maxUses: number | null;
  usedCount: number;
  perUserLimit: number;
  expiryDate: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState({
    activeCount: 0,
    totalRedemptions: 0,
    couponRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);

  // Form states
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [formValue, setFormValue] = useState<string | number>('');
  const [formMinOrder, setFormMinOrder] = useState<string | number>('0');
  const [formMaxUses, setFormMaxUses] = useState<string | number>('');
  const [formExpiry, setFormExpiry] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
        setStats(data.stats || { activeCount: 0, totalRedemptions: 0, couponRevenue: 0 });
      } else {
        toast.error('Failed to fetch coupons');
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Error loading coupons');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Coupon ${code} copied to clipboard!`);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean, code: string) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) {
        toast.success(`Coupon ${code} ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchCoupons();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to toggle status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error updating status');
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon "${code}"?`)) return;
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success(`Coupon ${code} deleted successfully`);
        fetchCoupons();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete coupon');
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Error deleting coupon');
    }
  };

  const resetForm = () => {
    setFormCode('');
    setFormType('PERCENTAGE');
    setFormValue('');
    setFormMinOrder('0');
    setFormMaxUses('');
    setFormExpiry('');
    setFormIsActive(true);
  };

  const handleOpenCreate = () => {
    setEditingCouponId(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCouponId(coupon.id);
    setFormCode(coupon.code);
    setFormType(coupon.type);
    setFormValue(coupon.value);
    setFormMinOrder(coupon.minOrderAmount);
    setFormMaxUses(coupon.maxUses || '');
    setFormExpiry(coupon.expiryDate ? coupon.expiryDate.split('T')[0] : '');
    setFormIsActive(coupon.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formCode.trim()) {
      toast.error('Coupon code is required');
      return;
    }
    const valNum = parseFloat(formValue.toString());
    if (isNaN(valNum) || valNum <= 0) {
      toast.error('Discount value must be a positive number');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: formCode.trim().toUpperCase(),
        type: formType,
        value: valNum,
        minOrderAmount: parseFloat(formMinOrder.toString() || '0'),
        maxUses: formMaxUses ? parseInt(formMaxUses.toString()) : null,
        expiryDate: formExpiry ? new Date(formExpiry).toISOString() : null,
        isActive: formIsActive,
      };

      const url = editingCouponId ? `/api/admin/coupons/${editingCouponId}` : '/api/admin/coupons';
      const method = editingCouponId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(editingCouponId ? `Coupon ${payload.code} updated successfully!` : `Coupon ${payload.code} created successfully!`);
        setIsModalOpen(false);
        resetForm();
        fetchCoupons();
      } else {
        toast.error(data.error || 'Failed to save coupon');
      }
    } catch (error) {
      console.error('Submit coupon error:', error);
      toast.error('Something went wrong while saving coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const formatExpiry = (dateStr: string | null) => {
    if (!dateStr) return 'Never Expires';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const filteredCoupons = coupons.filter((c) =>
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#1a2c1a]">Coupons & Discounts</h1>
          <p className="text-xs text-[#8a8a7a] mt-1 font-bold uppercase tracking-wider">Manage promotional codes and offers</p>
        </div>
        <Button 
          className="btn-primary gap-2"
          onClick={handleOpenCreate}
        >
          <Plus size={18} />
          Create Coupon
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Active Coupons', value: isLoading ? '...' : stats.activeCount, icon: Ticket, bg: 'bg-[#EAF3DE]', color: 'text-[#3B6D11]' },
          { label: 'Total Redemptions', value: isLoading ? '...' : stats.totalRedemptions, icon: Users, bg: 'bg-[#E6F1FB]', color: 'text-[#185FA5]' },
          { label: 'Revenue from Coupons', value: isLoading ? '...' : `₹${stats.couponRevenue.toLocaleString('en-IN')}`, icon: TrendingUp, bg: 'bg-[#FAEEDA]', color: 'text-[#854F0B]' },
        ].map((stat) => (
          <Card key={stat.label} className="p-5 border-[#d4d9b8] rounded-[8px] shadow-none bg-white flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", stat.bg, stat.color)}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a8a7a]">{stat.label}</p>
              <h4 className="text-xl font-black text-[#1a2c1a]">{stat.value}</h4>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters & Table */}
      <Card className="border-[#d4d9b8] rounded-[8px] shadow-none bg-white overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-[#f0f2e8] bg-[#f9faf6] flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8a7a]" size={16} />
            <Input 
              placeholder="Search coupon code..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 border-[#d4d9b8] bg-white text-sm" 
            />
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={fetchCoupons}
            className="text-[10px] font-bold uppercase tracking-widest text-[#1a2c1a] gap-1 hover:bg-[#f0f2e8]"
          >
            <RefreshCw size={12} className={cn(isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        <div className="overflow-x-auto">
          {isLoading && coupons.length === 0 ? (
            <div className="py-24 text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#3b6d11] mx-auto" />
              <p className="text-sm text-[#8a8a7a] font-bold uppercase tracking-wider">Loading Coupons...</p>
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="py-24 text-center space-y-4">
              <div className="w-16 h-16 bg-[#f0f2e8] rounded-full flex items-center justify-center mx-auto">
                <Ticket className="w-8 h-8 text-[#8a8a7a]" />
              </div>
              <h3 className="text-lg font-black uppercase text-[#1a2c1a]">No Coupons Found</h3>
              <p className="text-xs text-[#8a8a7a] max-w-sm mx-auto uppercase tracking-wider font-bold">
                {searchQuery ? "Try checking spelling or type another code" : "Click 'Create Coupon' to configure a new discount."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-[#1a2c1a] text-white text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 font-bold">Coupon Code</th>
                  <th className="px-6 py-4 font-bold">Type & Value</th>
                  <th className="px-6 py-4 font-bold text-center">Min Order</th>
                  <th className="px-6 py-4 font-bold">Usage Progress</th>
                  <th className="px-6 py-4 font-bold">Expiry Date</th>
                  <th className="px-6 py-4 font-bold text-center">Status</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2e8]">
                {filteredCoupons.map((coupon, i) => {
                  const isExpired = coupon.expiryDate ? new Date(coupon.expiryDate) < new Date() : false;
                  const isLimitReached = coupon.maxUses ? coupon.usedCount >= coupon.maxUses : false;
                  
                  return (
                    <tr 
                      key={coupon.id} 
                      className={cn(
                        i % 2 === 0 ? "bg-white" : "bg-[#f9faf6]", 
                        "hover:bg-[#f0f2e8] transition-colors"
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="bg-[#f0f2e8] px-2 py-1 rounded font-mono font-bold text-sm text-[#3d5a2e]">
                            {coupon.code}
                          </code>
                          <button 
                            onClick={() => handleCopy(coupon.code)}
                            className="text-[#8a8a7a] hover:text-[#1a2c1a] transition-colors"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-[#1a2c1a]">
                            {coupon.type === 'PERCENTAGE' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                          </span>
                          <span className="text-[10px] text-[#8a8a7a] font-bold uppercase tracking-wider">
                            {coupon.type === 'PERCENTAGE' ? 'Percentage' : 'Fixed Amount'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-bold text-[#1a2c1a]">₹{coupon.minOrderAmount}</span>
                      </td>
                      <td className="px-6 py-4 w-48">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-[#8a8a7a]">
                            <span>{coupon.usedCount} / {coupon.maxUses || '∞'} used</span>
                            <span>{coupon.maxUses ? Math.round((coupon.usedCount / coupon.maxUses) * 100) : 0}%</span>
                          </div>
                          <Progress 
                            value={coupon.maxUses ? (coupon.usedCount / coupon.maxUses) * 100 : 0} 
                            className="h-1.5 bg-[#f0f2e8]" 
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-wider",
                          isExpired ? "text-[#A32D2D]" : "text-[#1a2c1a]"
                        )}>
                          {formatExpiry(coupon.expiryDate)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Switch 
                          checked={coupon.isActive && !isExpired && !isLimitReached} 
                          disabled={isExpired || isLimitReached}
                          onCheckedChange={() => handleToggleActive(coupon.id, coupon.isActive, coupon.code)}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-[#1a2c1a] hover:bg-[#f0f2e8]"
                            onClick={() => handleOpenEdit(coupon)}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-[#A32D2D] hover:bg-[#FCEBEB]"
                            onClick={() => handleDelete(coupon.id, coupon.code)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* CREATE & EDIT FORM OVERLAY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border-[#d4d9b8] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#1a2c1a] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-playfair font-black text-lg uppercase tracking-wider">
                  {editingCouponId ? 'Edit Coupon' : 'Create Coupon'}
                </h3>
                <p className="text-[9px] text-white/70 uppercase tracking-widest font-bold mt-0.5">
                  {editingCouponId ? 'Update promotional code details' : 'Configure new promotional code'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Coupon Code */}
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <Label htmlFor="modalCode" className="text-[10px] font-bold uppercase tracking-wider text-[#1a2c1a]">
                    Coupon Code *
                  </Label>
                  <Input
                    id="modalCode"
                    required
                    placeholder="e.g. BAKEWELL50"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                    className="border-[#d4d9b8] focus:border-[#c8872a] bg-[#f9faf6] text-sm font-mono font-bold"
                  />
                </div>

                {/* Type */}
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-[#1a2c1a]">
                    Discount Type *
                  </Label>
                  <Select 
                    value={formType} 
                    onValueChange={(val: any) => {
                      setFormType(val);
                      // Clear value on change to prevent range violations
                      setFormValue('');
                    }}
                  >
                    <SelectTrigger className="border-[#d4d9b8] bg-[#f9faf6] text-sm">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                      <SelectItem value="FIXED_AMOUNT">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Value */}
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <Label htmlFor="modalValue" className="text-[10px] font-bold uppercase tracking-wider text-[#1a2c1a]">
                    {formType === 'PERCENTAGE' ? 'Discount Percentage (%) *' : 'Discount Amount (₹) *'}
                  </Label>
                  <Input
                    id="modalValue"
                    required
                    type="number"
                    step="any"
                    min="0.01"
                    max={formType === 'PERCENTAGE' ? '100' : undefined}
                    placeholder={formType === 'PERCENTAGE' ? 'e.g. 10' : 'e.g. 100'}
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    className="border-[#d4d9b8] focus:border-[#c8872a] bg-[#f9faf6] text-sm"
                  />
                </div>

                {/* Min Order */}
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <Label htmlFor="modalMinOrder" className="text-[10px] font-bold uppercase tracking-wider text-[#1a2c1a]">
                    Minimum Order Amount (₹)
                  </Label>
                  <Input
                    id="modalMinOrder"
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 299"
                    value={formMinOrder}
                    onChange={(e) => setFormMinOrder(e.target.value)}
                    className="border-[#d4d9b8] focus:border-[#c8872a] bg-[#f9faf6] text-sm"
                  />
                </div>

                {/* Max Uses */}
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <Label htmlFor="modalMaxUses" className="text-[10px] font-bold uppercase tracking-wider text-[#1a2c1a]">
                    Usage Limit (Total Uses)
                  </Label>
                  <Input
                    id="modalMaxUses"
                    type="number"
                    min="1"
                    placeholder="Blank for unlimited"
                    value={formMaxUses}
                    onChange={(e) => setFormMaxUses(e.target.value)}
                    className="border-[#d4d9b8] focus:border-[#c8872a] bg-[#f9faf6] text-sm"
                  />
                </div>

                {/* Expiry Date */}
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <Label htmlFor="modalExpiry" className="text-[10px] font-bold uppercase tracking-wider text-[#1a2c1a]">
                    Expiry Date
                  </Label>
                  <Input
                    id="modalExpiry"
                    type="date"
                    value={formExpiry}
                    onChange={(e) => setFormExpiry(e.target.value)}
                    className="border-[#d4d9b8] focus:border-[#c8872a] bg-[#f9faf6] text-sm"
                  />
                </div>

                {/* Is Active Switch */}
                <Label className="col-span-2 flex items-center justify-between border border-[#d4d9b8] rounded-lg p-3 bg-[#f9faf6] cursor-pointer select-none">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1a2c1a] block">Active Status</span>
                    <span className="text-[9px] text-[#8a8a7a] font-medium block">
                      Allow customers to redeem this coupon immediately
                    </span>
                  </div>
                  <Switch
                    checked={formIsActive}
                    onCheckedChange={setFormIsActive}
                  />
                </Label>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-[#f0f2e8] flex items-center justify-end gap-3">
                <Button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  variant="outline"
                  className="border-[#d4d9b8] font-bold uppercase tracking-wider text-xs px-5 py-4 h-auto"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-[#3d5a2e] hover:bg-[#1a2c1a] font-bold uppercase tracking-wider text-xs px-5 py-4 h-auto text-white"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />}
                  Confirm & Save
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
