'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { 
  CreditCard, 
  Lock, 
  Eye, 
  EyeOff, 
  Save, 
  Loader2, 
  HelpCircle, 
  Check, 
  AlertCircle,
  Truck,
  Percent,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const currentUser = session?.user as any;
  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "admin";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  
  // Settings State
  const [razorpayEnable, setRazorpayEnable] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  const [showRazorpaySecret, setShowRazorpaySecret] = useState(false);
  const [razorpayKeySecretConfigured, setRazorpayKeySecretConfigured] = useState(false);

  const [stripeEnable, setStripeEnable] = useState(false);
  const [stripeKeyPublishable, setStripeKeyPublishable] = useState('');
  const [stripeKeySecret, setStripeKeySecret] = useState('');
  const [showStripeSecret, setShowStripeSecret] = useState(false);
  const [stripeKeySecretConfigured, setStripeKeySecretConfigured] = useState(false);

  const [codEnable, setCodEnable] = useState(true);
  const [storeState, setStoreState] = useState('Karnataka');
  const [storeGstin, setStoreGstin] = useState('');
  const [defaultPackagingFee, setDefaultPackagingFee] = useState('0');
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState('499');
  const [subscriptionDiscount, setSubscriptionDiscount] = useState('10');

  // Delivery Slots State
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [slotLabel, setSlotLabel] = useState('');
  const [slotStartTime, setSlotStartTime] = useState('');
  const [slotEndTime, setSlotEndTime] = useState('');
  const [slotIsActive, setSlotIsActive] = useState(true);
  const [savingSlot, setSavingSlot] = useState(false);

  // Load Settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.status === 401 || res.status === 403) {
          setUnauthorized(true);
          return;
        }
        if (!res.ok) {
          throw new Error('Failed to fetch settings');
        }
        const data = await res.json();
        
        setRazorpayEnable(data.razorpayEnable);
        setRazorpayKeyId(data.razorpayKeyId);
        setRazorpayKeySecret(data.razorpayKeySecret);
        setRazorpayKeySecretConfigured(data.razorpayKeySecretConfigured);

        setStripeEnable(data.stripeEnable);
        setStripeKeyPublishable(data.stripeKeyPublishable);
        setStripeKeySecret(data.stripeKeySecret);
        setStripeKeySecretConfigured(data.stripeKeySecretConfigured);

        setCodEnable(data.codEnable);
        setStoreState(data.storeState || 'Karnataka');
        setStoreGstin(data.storeGstin || '');
        setDefaultPackagingFee(data.defaultPackagingFee || '0');
        setFreeDeliveryThreshold(data.freeDeliveryThreshold || '499');
        setSubscriptionDiscount(data.subscriptionDiscount || '10');
      } catch (err) {
        toast.error('Could not load settings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (status !== 'loading') {
      if (status === 'authenticated' && isAdmin) {
        fetchSettings();
      } else {
        setLoading(false);
      }
    }
  }, [status, isAdmin]);

  // Fetch slots list
  const fetchSlots = async () => {
    if (status !== 'authenticated' || !isAdmin) return;
    setLoadingSlots(true);
    try {
      const res = await fetch('/api/admin/slots');
      if (res.ok) {
        const data = await res.json();
        setSlots(data);
      }
    } catch (err) {
      console.error("Error fetching slots:", err);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && isAdmin) {
      fetchSlots();
    }
  }, [status, isAdmin]);

  // Save Settings
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpayEnable,
          razorpayKeyId,
          razorpayKeySecret,
          stripeEnable,
          stripeKeyPublishable,
          stripeKeySecret,
          codEnable,
          storeState,
          storeGstin,
          defaultPackagingFee,
          freeDeliveryThreshold,
          subscriptionDiscount,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save settings');
      }

      const data = await res.json();
      if (data.success) {
        toast.success('Settings saved successfully!');
        if (razorpayKeySecret && !razorpayKeySecret.includes('••')) {
          setRazorpayKeySecretConfigured(true);
        }
        if (stripeKeySecret && !stripeKeySecret.includes('••')) {
          setStripeKeySecretConfigured(true);
        }
      } else {
        toast.error('Failed to save settings');
      }
    } catch (err) {
      toast.error('An error occurred while saving settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Slot handlers
  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotLabel || !slotStartTime || !slotEndTime) {
      toast.error("Please fill in all slot fields");
      return;
    }
    setSavingSlot(true);
    try {
      const url = editingSlotId ? `/api/admin/slots/${editingSlotId}` : '/api/admin/slots';
      const method = editingSlotId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: slotLabel,
          startTime: slotStartTime,
          endTime: slotEndTime,
          isActive: slotIsActive
        })
      });
      if (res.ok) {
        toast.success(editingSlotId ? "Slot updated!" : "Slot created!");
        setSlotLabel('');
        setSlotStartTime('');
        setSlotEndTime('');
        setSlotIsActive(true);
        setEditingSlotId(null);
        fetchSlots();
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Failed to save slot");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving slot");
    } finally {
      setSavingSlot(false);
    }
  };

  const handleEditSlotClick = (slot: any) => {
    setEditingSlotId(slot.id);
    setSlotLabel(slot.label);
    setSlotStartTime(slot.startTime);
    setSlotEndTime(slot.endTime);
    setSlotIsActive(slot.isActive);
    
    // Smooth scroll the slot form card into view (important for stacked layout on smaller screens)
    const element = document.getElementById('slot-form');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm("Are you sure you want to delete this slot? If orders are linked, it will be deactivated instead.")) return;
    try {
      const res = await fetch(`/api/admin/slots/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          toast.success(data.message);
        } else {
          toast.success("Slot deleted successfully!");
        }
        fetchSlots();
      } else {
        toast.error("Failed to delete slot");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting slot");
    }
  };

  // Helper validation alerts
  const isRazorpayKeyIdValid = !razorpayKeyId || razorpayKeyId.startsWith('rzp_test_') || razorpayKeyId.startsWith('rzp_live_');
  const isStripePubValid = !stripeKeyPublishable || stripeKeyPublishable.startsWith('pk_test_') || stripeKeyPublishable.startsWith('pk_live_');

  if (status === 'loading' || (loading && status === 'authenticated' && isAdmin)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#c8872a]" />
        <p className="text-sm font-bold uppercase tracking-wider text-[#8a8a7a]">Loading Settings...</p>
      </div>
    );
  }

  if (unauthorized || (status === 'authenticated' && !isAdmin)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center border border-amber-100 shadow-sm animate-bounce">
          <Lock className="w-8 h-8 text-amber-600" />
        </div>
        <div className="space-y-2">
          <h2 className="font-playfair font-black text-2xl text-[#1a2c1a] uppercase tracking-tight">Access Denied</h2>
          <p className="text-xs text-[#8a8a7a] leading-relaxed">
            You must be logged in as an administrator to access these settings. Please sign in to your admin account and try again.
          </p>
        </div>
        <Button 
          onClick={() => window.location.href = '/login?callbackUrl=/admin/settings'}
          className="bg-[#3d5a2e] hover:bg-[#1a2c1a] text-white font-bold uppercase tracking-widest px-6 py-4 rounded-full mt-2 transition-all shadow-md"
        >
          Sign In as Admin
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#d4d9b8] pb-6 gap-4">
        <div>
          <h1 className="font-playfair font-black text-3xl text-[#1a2c1a] uppercase tracking-tight">Settings</h1>
          <p className="text-sm text-[#8a8a7a] mt-1">Configure your store settings, payment gateways, and credentials.</p>
        </div>
        <Button 
          type="submit" 
          onClick={handleSave} 
          disabled={saving}
          className="bg-[#3d5a2e] hover:bg-[#1a2c1a] text-white font-bold uppercase tracking-widest px-6 py-6 rounded-full shadow-lg transition-all flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </Button>
      </div>

      <Tabs defaultValue="payment" className="space-y-6">
        <TabsList className="bg-white border border-[#d4d9b8] p-1 rounded-full grid grid-cols-4 max-w-2xl">
          <TabsTrigger value="payment" className="rounded-full font-bold uppercase tracking-wider text-[10px] sm:text-xs py-2 data-[state=active]:bg-[#3d5a2e] data-[state=active]:text-white text-center">
            Payments
          </TabsTrigger>
          <TabsTrigger value="general" className="rounded-full font-bold uppercase tracking-wider text-[10px] sm:text-xs py-2 data-[state=active]:bg-[#3d5a2e] data-[state=active]:text-white text-center">
            General
          </TabsTrigger>
          <TabsTrigger value="tax_packaging" className="rounded-full font-bold uppercase tracking-wider text-[10px] sm:text-xs py-2 data-[state=active]:bg-[#3d5a2e] data-[state=active]:text-white text-center">
            Tax & Fees
          </TabsTrigger>
          <TabsTrigger value="delivery_slots" className="rounded-full font-bold uppercase tracking-wider text-[10px] sm:text-xs py-2 data-[state=active]:bg-[#3d5a2e] data-[state=active]:text-white text-center">
            Slots
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payment" className="space-y-6">
          {/* Razorpay Connector */}
          <Card className="border-[#d4d9b8] rounded-2xl shadow-none bg-white overflow-hidden">
            <CardHeader className="border-b border-[#f0f2e8] bg-[#f9faf6] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg border border-blue-100">
                    R
                  </div>
                  <div>
                    <CardTitle className="font-black text-[#1a2c1a] uppercase tracking-wider text-base">Razorpay Integration</CardTitle>
                    <CardDescription className="text-xs text-[#8a8a7a]">Connect your Razorpay account to accept UPI, Cards, and NetBanking payments.</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${razorpayEnable ? 'bg-[#EAF3DE] text-[#3B6D11]' : 'bg-[#f0f2e8] text-[#8a8a7a]'}`}>
                    {razorpayEnable ? 'Active' : 'Inactive'}
                  </span>
                  <Switch 
                    checked={razorpayEnable} 
                    onCheckedChange={setRazorpayEnable}
                    className="data-[state=checked]:bg-[#3d5a2e]"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="rzp-key-id" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a] flex items-center gap-1">
                    <span>Razorpay Key ID</span>
                    <span title="Standard Razorpay credential usually starting with rzp_test_ or rzp_live_">
                      <HelpCircle className="w-3.5 h-3.5 text-[#8a8a7a]" />
                    </span>
                  </Label>
                  <Input 
                    id="rzp-key-id"
                    placeholder="rzp_test_ab12cd34ef56gh"
                    value={razorpayKeyId}
                    onChange={(e) => setRazorpayKeyId(e.target.value)}
                    className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white"
                  />
                  {!isRazorpayKeyIdValid && (
                    <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Key ID usually starts with &quot;rzp_test_&quot; or &quot;rzp_live_&quot;</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rzp-key-secret" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a] flex items-center gap-1">
                    <span>Razorpay Key Secret</span>
                    {razorpayKeySecretConfigured && (
                      <span className="text-[10px] text-[#3d5a2e] font-black uppercase bg-[#EAF3DE] px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Connected
                      </span>
                    )}
                  </Label>
                  <div className="relative">
                    <Input 
                      id="rzp-key-secret"
                      type={showRazorpaySecret ? 'text' : 'password'}
                      placeholder={razorpayKeySecretConfigured ? '••••••••••••••••' : 'Enter Key Secret'}
                      value={razorpayKeySecret}
                      onChange={(e) => setRazorpayKeySecret(e.target.value)}
                      className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRazorpaySecret(!showRazorpaySecret)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8a8a7a] hover:text-[#1a2c1a]"
                    >
                      {showRazorpaySecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stripe Connector */}
          <Card className="border-[#d4d9b8] rounded-2xl shadow-none bg-white overflow-hidden">
            <CardHeader className="border-b border-[#f0f2e8] bg-[#f9faf6] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-lg border border-purple-100">
                    S
                  </div>
                  <div>
                    <CardTitle className="font-black text-[#1a2c1a] uppercase tracking-wider text-base">Stripe Integration</CardTitle>
                    <CardDescription className="text-xs text-[#8a8a7a]">Connect your Stripe account to process international credit card and wallet payments.</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${stripeEnable ? 'bg-[#EAF3DE] text-[#3B6D11]' : 'bg-[#f0f2e8] text-[#8a8a7a]'}`}>
                    {stripeEnable ? 'Active' : 'Inactive'}
                  </span>
                  <Switch 
                    checked={stripeEnable} 
                    onCheckedChange={setStripeEnable}
                    className="data-[state=checked]:bg-[#3d5a2e]"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="stripe-pub-key" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a] flex items-center gap-1">
                    <span>Stripe Publishable Key</span>
                  </Label>
                  <Input 
                    id="stripe-pub-key"
                    placeholder="pk_test_51P..."
                    value={stripeKeyPublishable}
                    onChange={(e) => setStripeKeyPublishable(e.target.value)}
                    className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white"
                  />
                  {!isStripePubValid && (
                    <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Publishable Key usually starts with &quot;pk_test_&quot; or &quot;pk_live_&quot;</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stripe-sec-key" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a] flex items-center gap-1">
                    <span>Stripe Secret Key</span>
                    {stripeKeySecretConfigured && (
                      <span className="text-[10px] text-[#3d5a2e] font-black uppercase bg-[#EAF3DE] px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Connected
                      </span>
                    )}
                  </Label>
                  <div className="relative">
                    <Input 
                      id="stripe-sec-key"
                      type={showStripeSecret ? 'text' : 'password'}
                      placeholder={stripeKeySecretConfigured ? '••••••••••••••••' : 'Enter Secret Key'}
                      value={stripeKeySecret}
                      onChange={(e) => setStripeKeySecret(e.target.value)}
                      className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStripeSecret(!showStripeSecret)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8a8a7a] hover:text-[#1a2c1a]"
                    >
                      {showStripeSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card className="border-[#d4d9b8] rounded-2xl shadow-none bg-white overflow-hidden">
            <CardHeader className="border-b border-[#f0f2e8] bg-[#f9faf6] p-6">
              <CardTitle className="font-black text-[#1a2c1a] uppercase tracking-wider text-base">Checkout Options</CardTitle>
              <CardDescription className="text-xs text-[#8a8a7a]">Configure general payment options for customer checkout flow.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#f9faf6] border border-[#f0f2e8]">
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-[#3d5a2e] mt-0.5" />
                  <div>
                    <Label htmlFor="cod-toggle" className="font-bold text-sm text-[#1a2c1a] uppercase tracking-wider">Enable Cash on Delivery (COD)</Label>
                    <p className="text-xs text-[#8a8a7a] mt-0.5">Allow customers to choose cash/pay-on-delivery during checkout.</p>
                  </div>
                </div>
                <Switch 
                  id="cod-toggle"
                  checked={codEnable} 
                  onCheckedChange={setCodEnable}
                  className="data-[state=checked]:bg-[#3d5a2e]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax_packaging" className="space-y-6">
          <Card className="border-[#d4d9b8] rounded-2xl shadow-none bg-white overflow-hidden">
            <CardHeader className="border-b border-[#f0f2e8] bg-[#f9faf6] p-6">
              <CardTitle className="font-black text-[#1a2c1a] uppercase tracking-wider text-base">Tax & GST Settings</CardTitle>
              <CardDescription className="text-xs text-[#8a8a7a]">Configure store origins and tax details for statutory compliance.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="store-state" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">Store State Origin *</Label>
                  <Input 
                    id="store-state"
                    placeholder="e.g. Karnataka"
                    value={storeState}
                    onChange={(e) => setStoreState(e.target.value)}
                    className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white"
                  />
                  <p className="text-[10px] text-[#8a8a7a]">Used to split CGST/SGST (for intra-state sales) vs IGST (for inter-state sales).</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="store-gstin" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">Store GSTIN (Optional)</Label>
                  <Input 
                    id="store-gstin"
                    placeholder="e.g. 29AAAAA0000A1Z5"
                    value={storeGstin}
                    onChange={(e) => setStoreGstin(e.target.value)}
                    className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white uppercase"
                  />
                  <p className="text-[10px] text-[#8a8a7a]">Your business Goods and Services Tax Identification Number.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#d4d9b8] rounded-2xl shadow-none bg-white overflow-hidden">
            <CardHeader className="border-b border-[#f0f2e8] bg-[#f9faf6] p-6">
              <CardTitle className="font-black text-[#1a2c1a] uppercase tracking-wider text-base">Fees & Limits</CardTitle>
              <CardDescription className="text-xs text-[#8a8a7a]">Default packaging fees and free delivery limits.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="default-packaging-fee" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">Default Packaging Fee (₹)</Label>
                  <Input 
                    id="default-packaging-fee"
                    type="number"
                    placeholder="0"
                    value={defaultPackagingFee}
                    onChange={(e) => setDefaultPackagingFee(e.target.value)}
                    className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white"
                  />
                  <p className="text-[10px] text-[#8a8a7a]">This flat amount will be added to every checkout unless overridden on product variant levels.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="free-delivery-threshold" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">Minimum Order for Free Delivery (₹)</Label>
                  <Input 
                    id="free-delivery-threshold"
                    type="number"
                    placeholder="499"
                    value={freeDeliveryThreshold}
                    onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
                    className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white"
                  />
                  <p className="text-[10px] text-[#8a8a7a]">Orders with a subtotal equal to or exceeding this amount will receive free shipping.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subscription-discount" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">Subscription Discount (%)</Label>
                  <Input 
                    id="subscription-discount"
                    type="number"
                    placeholder="10"
                    value={subscriptionDiscount}
                    onChange={(e) => setSubscriptionDiscount(e.target.value)}
                    className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white"
                  />
                  <p className="text-[10px] text-[#8a8a7a]">Discount percentage applied to morning subscription orders (e.g. 10 for 10% off).</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery_slots" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Slot Form */}
            <Card id="slot-form" className="lg:col-span-5 border-[#d4d9b8] rounded-2xl shadow-none bg-white overflow-hidden h-fit">
              <CardHeader className="border-b border-[#f0f2e8] bg-[#f9faf6] p-6">
                <CardTitle className="font-black text-[#1a2c1a] uppercase tracking-wider text-base">
                  {editingSlotId ? "Edit Delivery Slot" : "Add Delivery Slot"}
                </CardTitle>
                <CardDescription className="text-xs text-[#8a8a7a]">
                  {editingSlotId ? "Update selected slot settings." : "Create a new selectable scheduling slot."}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSaveSlot}>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="slot-label" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">Slot Label *</Label>
                    <Input 
                      id="slot-label"
                      placeholder="e.g. Morning (9 AM - 12 PM)"
                      value={slotLabel}
                      onChange={(e) => setSlotLabel(e.target.value)}
                      className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="slot-start" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">Start Time (24h) *</Label>
                      <Input 
                        id="slot-start"
                        placeholder="e.g. 09:00"
                        value={slotStartTime}
                        onChange={(e) => setSlotStartTime(e.target.value)}
                        className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slot-end" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">End Time (24h) *</Label>
                      <Input 
                        id="slot-end"
                        placeholder="e.g. 12:00"
                        value={slotEndTime}
                        onChange={(e) => setSlotEndTime(e.target.value)}
                        className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white"
                        required
                      />
                    </div>
                  </div>



                  <div className="flex items-center justify-between p-3 bg-[#f9faf6] rounded-xl border border-[#f0f2e8] mt-2">
                    <Label htmlFor="slot-active-toggle" className="font-bold text-xs text-[#1a2c1a] uppercase tracking-wider">Active Status</Label>
                    <Switch 
                      id="slot-active-toggle"
                      checked={slotIsActive} 
                      onCheckedChange={setSlotIsActive}
                      className="data-[state=checked]:bg-[#3d5a2e]"
                    />
                  </div>
                </CardContent>
                <CardFooter className="p-6 bg-[#f9faf6] border-t border-[#f0f2e8] flex items-center justify-between">
                  {editingSlotId && (
                    <Button 
                      type="button" 
                      onClick={() => {
                        setEditingSlotId(null);
                        setSlotLabel('');
                        setSlotStartTime('');
                        setSlotEndTime('');
                        setSlotIsActive(true);
                      }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold uppercase tracking-wider text-xs px-4 py-2 rounded-full"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button 
                    type="submit" 
                    disabled={savingSlot}
                    className="bg-[#3d5a2e] hover:bg-[#1a2c1a] text-white font-bold uppercase tracking-wider text-xs px-6 py-2 rounded-full ml-auto flex items-center gap-2"
                  >
                    {savingSlot && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingSlotId ? "Update Slot" : "Create Slot"}</span>
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* Slots List */}
            <Card className="lg:col-span-7 border-[#d4d9b8] rounded-2xl shadow-none bg-white overflow-hidden">
              <CardHeader className="border-b border-[#f0f2e8] bg-[#f9faf6] p-6">
                <CardTitle className="font-black text-[#1a2c1a] uppercase tracking-wider text-base">Configured Slots</CardTitle>
                <CardDescription className="text-xs text-[#8a8a7a]">Manage active scheduling intervals and their limits.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-10 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#c8872a]" />
                    <span className="text-xs font-bold text-[#8a8a7a] uppercase tracking-wider">Loading slots...</span>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-[#d4d9b8] rounded-2xl bg-[#f9faf6] text-xs text-[#8a8a7a]">
                    No delivery slots configured yet. Create one on the left panel.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {slots.map((slot) => (
                      <div 
                        key={slot.id} 
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          slot.isActive ? 'border-[#f0f2e8] bg-white hover:border-[#d4d9b8]' : 'border-gray-200 bg-gray-50 opacity-70'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#1a2c1a]">{slot.label}</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              slot.isActive ? 'bg-[#EAF3DE] text-[#3B6D11]' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {slot.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-xs text-[#8a8a7a]">
                            Hours: <strong className="text-slate-700">{slot.startTime} - {slot.endTime}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button 
                            onClick={() => handleEditSlotClick(slot)}
                            className="bg-transparent hover:bg-gray-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider py-1 px-3 h-8 rounded-full border border-gray-200"
                          >
                            Edit
                          </Button>
                          <Button 
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="bg-transparent hover:bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider py-1 px-3 h-8 rounded-full border border-red-100"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
