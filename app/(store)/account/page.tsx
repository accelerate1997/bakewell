"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User as UserIcon,
  ShoppingBag,
  MapPin,
  Settings,
  LogOut,
  Plus,
  Trash2,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
  CreditCard,
  Lock,
  Phone,
  Mail,
  Home,
  Heart
} from "lucide-react";
import { toast } from "sonner";
import { useWishlist } from "@/lib/store/WishlistContext";
import { ProductCard } from "@/components/store/ProductCard";

interface OrderItem {
  id: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variant: {
    label: string;
    product: {
      name: string;
      images: string[];
    };
  };
}

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  deliveryCharge: number;
  couponDiscount: number;
  packagingFee: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  status: "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentMethod: "UPI" | "CARD" | "COD";
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  deliveryDate: string | null;
  deliverySlot: {
    label: string;
    startTime: string;
    endTime: string;
  } | null;
  items: OrderItem[];
  createdAt: string;
}

interface Address {
  id: string;
  fullAddress: string;
  isDefault: boolean;
}

export default function CustomerAccountPage() {
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/login?callbackUrl=/account");
    },
  });

  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "addresses" | "profile" | "wishlist" | "subscriptions">("overview");
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(true);
  const [isUpdatingSubId, setIsUpdatingSubId] = useState<string | null>(null);
  const { wishlistProducts, loading: isLoadingWishlist } = useWishlist();

  // State for fetched data
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isCancellingId, setIsCancellingId] = useState<string | null>(null);

  // Expanded orders tracker
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  // Profile forms state
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Address form state
  const [newAddressText, setNewAddressText] = useState("");
  const [newAddressDefault, setNewAddressDefault] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isActionAddressId, setIsActionAddressId] = useState<string | null>(null);

  // Initialize profile values when session is loaded
  useEffect(() => {
    if (session?.user) {
      setProfileName(session.user.name || "");
      setProfileEmail(session.user.email || "");
      setProfilePhone((session.user as any).phone || "");
    }
  }, [session]);

  // Parse URL search parameters on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "subscriptions" || tab === "orders" || tab === "addresses" || tab === "profile" || tab === "wishlist") {
        setActiveTab(tab as any);
      }
    }
  }, []);

  // Fetch subscriptions
  const fetchSubscriptions = async () => {
    try {
      setIsLoadingSubscriptions(true);
      const res = await fetch("/api/store/subscriptions");
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data);
      } else {
        toast.error("Failed to load subscriptions");
      }
    } catch (err) {
      console.error("Fetch subscriptions error:", err);
      toast.error("An error occurred loading subscriptions");
    } finally {
      setIsLoadingSubscriptions(false);
    }
  };

  const handleUpdateSubscriptionStatus = async (subscriptionId: string, status: "ACTIVE" | "PAUSED" | "CANCELLED") => {
    const confirmationMessages = {
      ACTIVE: "Are you sure you want to resume this subscription? Deliveries will start scheduling again.",
      PAUSED: "Are you sure you want to pause this subscription? Today's and future deliveries will be paused.",
      CANCELLED: "Are you sure you want to cancel this subscription? This action cannot be undone.",
    };

    if (!confirm(confirmationMessages[status])) return;

    setIsUpdatingSubId(subscriptionId);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId, status }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Subscription status updated to ${status}!`);
        fetchSubscriptions();
      } else {
        toast.error(data.error || "Failed to update subscription");
      }
    } catch (error) {
      console.error("Update subscription status error:", error);
      toast.error("Something went wrong");
    } finally {
      setIsUpdatingSubId(null);
    }
  };

  // Load orders and addresses
  useEffect(() => {
    if (status === "authenticated") {
      fetchOrders();
      fetchAddresses();
      fetchSubscriptions();
    }
  }, [status]);

  // Load subscriptions when activeTab changes to subscriptions
  useEffect(() => {
    if (status === "authenticated" && activeTab === "subscriptions") {
      fetchSubscriptions();
    }
  }, [activeTab, status]);

  const fetchOrders = async () => {
    try {
      setIsLoadingOrders(true);
      const res = await fetch("/api/store/account/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        toast.error("Failed to load orders");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred loading orders");
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      setIsLoadingAddresses(true);
      const res = await fetch("/api/store/account/addresses");
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      } else {
        toast.error("Failed to load addresses");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred loading addresses");
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order? This will release all items back into stock.")) return;

    setIsCancellingId(orderId);
    try {
      const res = await fetch("/api/store/account/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Order cancelled successfully!");
        fetchOrders();
      } else {
        toast.error(data.error || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Cancel order error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsCancellingId(null);
    }
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      setIsUpdatingProfile(true);
      const res = await fetch("/api/store/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName.trim(),
          email: profileEmail.trim(),
          phone: profilePhone.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Profile updated successfully!");
        // Update NextAuth local session data
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            name: profileName.trim(),
            email: profileEmail.trim(),
            phone: profilePhone.trim(),
          },
        });
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle password update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Current password is required");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setIsUpdatingPassword(true);
      const res = await fetch("/api/store/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName,
          email: profileEmail,
          phone: profilePhone,
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Failed to update password");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handle adding an address
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressText.trim()) {
      toast.error("Address content cannot be empty");
      return;
    }

    try {
      setIsAddingAddress(true);
      const res = await fetch("/api/store/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullAddress: newAddressText.trim(),
          isDefault: newAddressDefault,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Address added successfully!");
        setNewAddressText("");
        setNewAddressDefault(false);
        fetchAddresses();
      } else {
        toast.error(data.error || "Failed to save address");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setIsAddingAddress(false);
    }
  };

  // Handle setting default address
  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      setIsActionAddressId(addressId);
      const res = await fetch("/api/store/account/addresses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addressId, isDefault: true }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Default address updated!");
        fetchAddresses();
      } else {
        toast.error(data.error || "Failed to update default address");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setIsActionAddressId(null);
    }
  };

  // Handle deleting an address
  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      setIsActionAddressId(addressId);
      const res = await fetch(`/api/store/account/addresses?addressId=${addressId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Address deleted successfully!");
        fetchAddresses();
      } else {
        toast.error(data.error || "Failed to delete address");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setIsActionAddressId(null);
    }
  };

  // Status badging styles
  const getStatusBadge = (status: Order["status"]) => {
    const styles = {
      PENDING: "bg-amber-100 text-amber-800 border-amber-200",
      CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
      SHIPPED: "bg-indigo-100 text-indigo-800 border-indigo-200",
      DELIVERED: "bg-emerald-100 text-emerald-800 border-emerald-200",
      CANCELLED: "bg-rose-100 text-rose-800 border-rose-200",
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: Order["paymentStatus"]) => {
    const styles = {
      PENDING: "bg-amber-100 text-amber-800 border-amber-200",
      PAID: "bg-emerald-100 text-emerald-800 border-emerald-200",
      FAILED: "bg-rose-100 text-rose-800 border-rose-200",
    };
    return (
      <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#3A4A2E]" />
        <p className="text-sm font-medium text-gray-500">Loading your account dashboard...</p>
      </div>
    );
  }

  // Calculate statistics
  const totalOrdersCount = orders.length;
  const totalAmountSpent = orders
    .filter((o) => o.paymentStatus === "PAID" || o.status === "DELIVERED")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const defaultAddress = addresses.find((a) => a.isDefault);
  const latestOrder = orders.length > 0 ? orders[0] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Welcome Banner */}
      <div className="bg-[#3A4A2E] text-white rounded-2xl p-6 md:p-8 mb-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#E8C97A]">Customer Portal</span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
            Bonjour, {session?.user?.name || "Valued Baker"}!
          </h1>
          <p className="text-sm text-gray-200 mt-2 font-medium">
            Manage your orders, update contact details, and save shipping addresses.
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center justify-center gap-2 bg-[#f0f2e8] text-[#3A4A2E] px-4 py-2.5 rounded-full text-xs font-bold hover:bg-[#DCE9CC] transition-colors shadow-sm self-start md:self-auto"
        >
          <LogOut size={14} />
          LOG OUT
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-white rounded-xl border border-[#DCE9CC] p-4 shadow-sm">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold tracking-wide transition-colors ${
                activeTab === "overview"
                  ? "bg-[#3A4A2E] text-white"
                  : "text-[#3A4A2E] hover:bg-[#F0F5EA]"
              }`}
            >
              <Home size={16} />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold tracking-wide transition-colors mt-1 ${
                activeTab === "orders"
                  ? "bg-[#3A4A2E] text-white"
                  : "text-[#3A4A2E] hover:bg-[#F0F5EA]"
              }`}
            >
              <ShoppingBag size={16} />
              My Orders
              {orders.length > 0 && (
                <span
                  className={`ml-auto text-[10px] px-2 py-0.5 font-bold rounded-full ${
                    activeTab === "orders" ? "bg-white text-[#3A4A2E]" : "bg-[#3A4A2E] text-white"
                  }`}
                >
                  {orders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("subscriptions")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold tracking-wide transition-colors mt-1 ${
                activeTab === "subscriptions"
                  ? "bg-[#3A4A2E] text-white"
                  : "text-[#3A4A2E] hover:bg-[#F0F5EA]"
              }`}
            >
              <Calendar size={16} />
              My Subscriptions
              {subscriptions.length > 0 && (
                <span
                  className={`ml-auto text-[10px] px-2 py-0.5 font-bold rounded-full ${
                    activeTab === "subscriptions" ? "bg-white text-[#3A4A2E]" : "bg-[#3A4A2E] text-white"
                  }`}
                >
                  {subscriptions.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("addresses")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold tracking-wide transition-colors mt-1 ${
                activeTab === "addresses"
                  ? "bg-[#3A4A2E] text-white"
                  : "text-[#3A4A2E] hover:bg-[#F0F5EA]"
              }`}
            >
              <MapPin size={16} />
              Saved Addresses
            </button>
            <button
              onClick={() => setActiveTab("wishlist")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold tracking-wide transition-colors mt-1 ${
                activeTab === "wishlist"
                  ? "bg-[#3A4A2E] text-white"
                  : "text-[#3A4A2E] hover:bg-[#F0F5EA]"
              }`}
            >
              <Heart size={16} />
              My Wishlist
              {wishlistProducts.length > 0 && (
                <span
                  className={`ml-auto text-[10px] px-2 py-0.5 font-bold rounded-full ${
                    activeTab === "wishlist" ? "bg-white text-[#3A4A2E]" : "bg-[#3A4A2E] text-white"
                  }`}
                >
                  {wishlistProducts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold tracking-wide transition-colors mt-1 ${
                activeTab === "profile"
                  ? "bg-[#3A4A2E] text-white"
                  : "text-[#3A4A2E] hover:bg-[#F0F5EA]"
              }`}
            >
              <Settings size={16} />
              Profile Settings
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="lg:col-span-3">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl border border-[#DCE9CC] p-6 shadow-sm flex items-center gap-4">
                  <div className="p-3.5 bg-[#F0F5EA] rounded-full text-[#3A4A2E]">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Orders</span>
                    <h3 className="text-2xl font-black text-[#3A4A2E] mt-0.5">{totalOrdersCount}</h3>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-[#DCE9CC] p-6 shadow-sm flex items-center gap-4">
                  <div className="p-3.5 bg-[#F0F5EA] rounded-full text-[#3A4A2E]">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Spent</span>
                    <h3 className="text-2xl font-black text-[#3A4A2E] mt-0.5">₹{totalAmountSpent.toLocaleString("en-IN")}</h3>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-[#DCE9CC] p-6 shadow-sm flex items-center gap-4">
                  <div className="p-3.5 bg-[#F0F5EA] rounded-full text-[#3A4A2E]">
                    <MapPin size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Default Destination</span>
                    <p className="text-xs font-bold text-[#3A4A2E] truncate mt-0.5">
                      {defaultAddress ? defaultAddress.fullAddress : "No default address"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Latest Order Summary */}
              <div className="bg-white rounded-xl border border-[#DCE9CC] p-6 shadow-sm">
                <h2 className="text-lg font-extrabold text-[#3A4A2E] mb-4 flex items-center gap-2">
                  <Calendar size={18} />
                  Most Recent Order
                </h2>

                {isLoadingOrders ? (
                  <div className="py-6 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#3A4A2E]" />
                  </div>
                ) : latestOrder ? (
                  <div className="border border-[#F0F5EA] rounded-lg p-5 bg-[#F0F5EA]/20">
                    <div className="flex flex-col sm:flex-row justify-between gap-4 pb-4 border-b border-[#DCE9CC]/50">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-[#3A4A2E]">{latestOrder.orderNumber}</span>
                          {getStatusBadge(latestOrder.status)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Placed on: {new Date(latestOrder.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                      <div className="sm:text-right">
                        <span className="text-xs font-semibold text-gray-400">Total Value</span>
                        <div className="text-lg font-black text-[#3A4A2E]">₹{latestOrder.totalAmount.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <h4 className="text-xs font-bold text-[#3A4A2E] uppercase tracking-wide">Ordered Items</h4>
                      <div className="space-y-2">
                        {latestOrder.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-xs">
                            <span className="text-gray-600 font-medium">
                              {item.variant.product.name} ({item.variant.label}) <span className="text-[#3A4A2E] font-bold">x{item.quantity}</span>
                            </span>
                            <span className="font-bold text-[#3A4A2E]">₹{item.totalPrice.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-[#DCE9CC]/50 flex justify-between">
                      <button
                        onClick={() => {
                          setActiveTab("orders");
                          toggleOrderExpand(latestOrder.id);
                        }}
                        className="text-xs font-bold text-[#3A4A2E] hover:underline"
                      >
                        View Full Invoice details &rarr;
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center text-gray-400 text-sm font-medium border border-dashed border-[#DCE9CC] rounded-lg">
                    You haven&apos;t placed any orders yet. 🥐
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MY ORDERS */}
          {activeTab === "orders" && (
            <div className="bg-white rounded-xl border border-[#DCE9CC] p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-[#3A4A2E] mb-6 flex items-center gap-2">
                <ShoppingBag size={20} />
                Order History
              </h2>

              {isLoadingOrders ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-[#3A4A2E]" />
                  <p className="text-xs text-gray-400">Retrieving invoices...</p>
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-6">
                  {orders.map((order) => {
                    const isExpanded = !!expandedOrders[order.id];
                    const orderSubtotal = order.items.reduce((sum, item) => sum + item.totalPrice, 0);

                    return (
                      <div key={order.id} className="border border-[#DCE9CC] rounded-xl overflow-hidden shadow-xs">
                        {/* Header Box */}
                        <div
                          onClick={() => toggleOrderExpand(order.id)}
                          className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-[#F0F5EA]/40 hover:bg-[#F0F5EA]/70 transition-colors cursor-pointer gap-4"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="text-sm font-extrabold text-[#3A4A2E]">{order.orderNumber}</span>
                              {getStatusBadge(order.status)}
                              {getPaymentStatusBadge(order.paymentStatus)}
                            </div>
                            <span className="text-xs text-gray-400 block mt-1">
                              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-6 self-stretch sm:self-auto justify-between sm:justify-end">
                            <div className="text-right">
                              <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Total</span>
                              <span className="text-sm font-black text-[#3A4A2E]">₹{order.totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="text-[#3A4A2E] p-1 bg-[#DCE9CC]/40 rounded-full">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </div>
                        </div>

                        {/* Collapsed/Expanded Invoice Content */}
                        {isExpanded && (
                          <div className="p-5 border-t border-[#DCE9CC] bg-white animate-in fade-in duration-100">
                            {/* Summary grids */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-[#DCE9CC]/60">
                              <div className="space-y-2">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Delivery Details</h4>
                                <p className="text-xs font-bold text-[#3A4A2E]">Saved Address:</p>
                                <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded border border-gray-100 leading-relaxed">
                                  {addresses.find((a) => a.id === order.id)?.fullAddress || "Shipping Address Saved on Order"}
                                </p>
                                {order.deliveryDate && (
                                  <div className="text-xs text-gray-600 pt-1">
                                    <span className="font-bold text-[#3A4A2E]">Slot:</span>{" "}
                                    {new Date(order.deliveryDate).toLocaleDateString("en-IN", {
                                      weekday: "long",
                                      day: "numeric",
                                      month: "long",
                                    })}{" "}
                                    ({order.deliverySlot?.label || "Flexible Time"})
                                  </div>
                                )}
                              </div>

                              <div className="space-y-2">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payment Details</h4>
                                <div className="text-xs text-gray-600 space-y-1">
                                  <div>
                                    <span className="font-bold text-[#3A4A2E]">Method:</span> {order.paymentMethod}
                                  </div>
                                  <div>
                                    <span className="font-bold text-[#3A4A2E]">Status:</span> {order.paymentStatus}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Itemized list */}
                            <div className="py-4 border-b border-[#DCE9CC]/60 space-y-3">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Item Breakdown</h4>
                              {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center text-xs py-1">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-[#F0F5EA] flex items-center justify-center font-bold text-[10px] text-[#3A4A2E]">
                                      🍞
                                    </div>
                                    <div>
                                      <p className="font-bold text-[#3A4A2E]">{item.variant.product.name}</p>
                                      <p className="text-[10px] text-gray-400">{item.variant.label} x {item.quantity}</p>
                                    </div>
                                  </div>
                                  <span className="font-bold text-[#3A4A2E]">₹{item.totalPrice.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>

                            {/* Cost Breakdown */}
                            <div className="pt-4 space-y-1.5 max-w-sm ml-auto text-xs">
                              <div className="flex justify-between text-gray-500">
                                <span>Subtotal</span>
                                <span>₹{orderSubtotal.toFixed(2)}</span>
                              </div>
                              {order.couponDiscount > 0 && (
                                <div className="flex justify-between text-emerald-600 font-medium">
                                  <span>Coupon Discount</span>
                                  <span>-₹{order.couponDiscount.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-gray-500">
                                <span>Delivery Fee</span>
                                <span>₹{order.deliveryCharge.toFixed(2)}</span>
                              </div>
                              {order.packagingFee > 0 && (
                                <div className="flex justify-between text-gray-500">
                                  <span>Packaging Fee</span>
                                  <span>₹{order.packagingFee.toFixed(2)}</span>
                                </div>
                              )}
                              {order.totalTax > 0 && (
                                <div className="flex justify-between text-gray-500">
                                  <span>Tax (GST)</span>
                                  <span>₹{order.totalTax.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-black text-sm text-[#3A4A2E] border-t border-[#DCE9CC] pt-2 mt-2">
                                <span>Total Paid</span>
                                <span>₹{order.totalAmount.toFixed(2)}</span>
                              </div>
                            </div>

                            {order.status === "PENDING" && (
                              <div className="flex justify-end pt-4 mt-4 border-t border-[#DCE9CC]/50">
                                <button
                                  disabled={isCancellingId === order.id}
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                  {isCancellingId === order.id ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cancelling...
                                    </>
                                  ) : (
                                    "Cancel Order"
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-20 text-center text-gray-400 text-sm font-medium border border-dashed border-[#DCE9CC] rounded-lg">
                  You haven&apos;t placed any orders yet. Visit the shop to make your first order!
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAVED ADDRESSES */}
          {activeTab === "addresses" && (
            <div className="space-y-8">
              {/* Saved Addresses grid */}
              <div className="bg-white rounded-xl border border-[#DCE9CC] p-6 shadow-sm">
                <h2 className="text-lg font-extrabold text-[#3A4A2E] mb-6 flex items-center gap-2">
                  <MapPin size={20} />
                  Saved Shipping Addresses
                </h2>

                {isLoadingAddresses ? (
                  <div className="py-10 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#3A4A2E]" />
                  </div>
                ) : addresses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className={`border rounded-xl p-4 flex flex-col justify-between gap-4 transition-all relative ${
                          address.isDefault
                            ? "border-[#3A4A2E] bg-[#F0F5EA]/10"
                            : "border-gray-200 bg-white hover:border-[#DCE9CC]"
                        }`}
                      >
                        <div>
                          {address.isDefault && (
                            <span className="absolute top-3 right-3 bg-[#3A4A2E] text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check size={8} /> DEFAULT
                            </span>
                          )}
                          <p className="text-xs text-gray-600 pr-16 leading-relaxed font-medium">
                            {address.fullAddress}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 border-t border-gray-100 pt-3 mt-1">
                          {!address.isDefault && (
                            <button
                              disabled={isActionAddressId !== null}
                              onClick={() => handleSetDefaultAddress(address.id)}
                              className="text-[10px] font-bold text-[#3A4A2E] hover:underline flex items-center gap-1 disabled:opacity-50"
                            >
                              {isActionAddressId === address.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                "Set as default"
                              )}
                            </button>
                          )}
                          <button
                            disabled={isActionAddressId !== null}
                            onClick={() => handleDeleteAddress(address.id)}
                            className="text-[10px] font-bold text-rose-600 hover:underline flex items-center gap-1 ml-auto disabled:opacity-50"
                          >
                            {isActionAddressId === address.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <Trash2 size={12} /> Delete
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-gray-400 text-sm font-medium border border-dashed border-gray-200 rounded-lg">
                    No saved addresses found. Add one below to speed up checkout!
                  </div>
                )}
              </div>

              {/* Add New Address Form */}
              <div className="bg-white rounded-xl border border-[#DCE9CC] p-6 shadow-sm">
                <h3 className="text-sm font-extrabold text-[#3A4A2E] mb-4 flex items-center gap-2">
                  <Plus size={16} />
                  Add a New Address
                </h3>

                <form onSubmit={handleAddAddress} className="space-y-4">
                  <div>
                    <label htmlFor="address-content" className="block text-xs font-bold text-[#3A4A2E] mb-1.5 uppercase tracking-wide">
                      Full Address (House, Building, Street, Pincode, State)
                    </label>
                    <textarea
                      id="address-content"
                      rows={3}
                      required
                      placeholder="e.g. Flat 302, Green Meadows Apartment, Koramangala 4th Block, Bengaluru, Karnataka - 560034"
                      value={newAddressText}
                      onChange={(e) => setNewAddressText(e.target.value)}
                      className="w-full text-xs p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-[#3A4A2E] focus:ring-1 focus:ring-[#3A4A2E]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="set-default"
                      checked={newAddressDefault}
                      onChange={(e) => setNewAddressDefault(e.target.checked)}
                      className="rounded border-gray-300 text-[#3A4A2E] focus:ring-[#3A4A2E] h-4 w-4"
                    />
                    <label htmlFor="set-default" className="text-xs font-bold text-gray-600 cursor-pointer">
                      Make this my default shipping address
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isAddingAddress}
                    className="flex items-center gap-2 bg-[#3A4A2E] text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-[#2f4422] transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isAddingAddress ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                      </>
                    ) : (
                      "Save Address"
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB: MY WISHLIST */}
          {activeTab === "wishlist" && (
            <div className="bg-white rounded-xl border border-[#DCE9CC] p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-[#3A4A2E] mb-6 flex items-center gap-2">
                <Heart size={20} className="fill-[#A32D2D] text-[#A32D2D]" />
                My Wishlist
              </h2>

              {isLoadingWishlist ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-[#3A4A2E]" />
                  <p className="text-xs text-gray-400">Retrieving your wishlisted items...</p>
                </div>
              ) : wishlistProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {wishlistProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center text-gray-400 text-sm font-medium border border-dashed border-[#DCE9CC] rounded-lg">
                  Your wishlist is empty. 🥐 Save your favorite bakes here!
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PROFILE SETTINGS */}
          {activeTab === "profile" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Edit Details */}
              <div className="bg-white rounded-xl border border-[#DCE9CC] p-6 shadow-sm">
                <h2 className="text-sm font-extrabold text-[#3A4A2E] mb-5 flex items-center gap-2">
                  <UserIcon size={16} />
                  Personal Information
                </h2>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label htmlFor="profile-name" className="block text-xs font-bold text-[#3A4A2E] mb-1.5 uppercase tracking-wide">
                      Full Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <UserIcon size={14} />
                      </span>
                      <input
                        type="text"
                        id="profile-name"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#3A4A2E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="profile-email" className="block text-xs font-bold text-[#3A4A2E] mb-1.5 uppercase tracking-wide">
                      Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <Mail size={14} />
                      </span>
                      <input
                        type="email"
                        id="profile-email"
                        placeholder="Not set"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#3A4A2E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="profile-phone" className="block text-xs font-bold text-[#3A4A2E] mb-1.5 uppercase tracking-wide">
                      Phone Number
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <Phone size={14} />
                      </span>
                      <input
                        type="text"
                        id="profile-phone"
                        placeholder="Not set"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#3A4A2E]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="flex items-center gap-2 bg-[#3A4A2E] text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-[#2f4422] transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                      </>
                    ) : (
                      "Save Details"
                    )}
                  </button>
                </form>
              </div>

              {/* Edit Password */}
              <div className="bg-white rounded-xl border border-[#DCE9CC] p-6 shadow-sm">
                <h2 className="text-sm font-extrabold text-[#3A4A2E] mb-5 flex items-center gap-2">
                  <Lock size={16} />
                  Change Password
                </h2>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <label htmlFor="current-pw" className="block text-xs font-bold text-[#3A4A2E] mb-1.5 uppercase tracking-wide">
                      Current Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <Lock size={14} />
                      </span>
                      <input
                        type="password"
                        id="current-pw"
                        required
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#3A4A2E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="new-pw" className="block text-xs font-bold text-[#3A4A2E] mb-1.5 uppercase tracking-wide">
                      New Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <Lock size={14} />
                      </span>
                      <input
                        type="password"
                        id="new-pw"
                        required
                        placeholder="At least 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#3A4A2E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirm-pw" className="block text-xs font-bold text-[#3A4A2E] mb-1.5 uppercase tracking-wide">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                        <Lock size={14} />
                      </span>
                      <input
                        type="password"
                        id="confirm-pw"
                        required
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#3A4A2E]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="flex items-center gap-2 bg-[#3A4A2E] text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-[#2f4422] transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isUpdatingPassword ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" /> Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB: MY SUBSCRIPTIONS */}
          {activeTab === "subscriptions" && (
            <div className="bg-white rounded-xl border border-[#DCE9CC] p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-[#3A4A2E] mb-6 flex items-center gap-2">
                <Calendar size={20} />
                My Subscriptions
              </h2>

              {isLoadingSubscriptions ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-[#3A4A2E]" />
                  <p className="text-xs text-gray-400">Retrieving subscription plans...</p>
                </div>
              ) : subscriptions.length > 0 ? (
                <div className="space-y-8">
                  {subscriptions.map((sub) => {
                    const statusColors = {
                      ACTIVE: "bg-emerald-100 text-emerald-800 border-emerald-200",
                      PAUSED: "bg-amber-100 text-amber-800 border-amber-200",
                      CANCELLED: "bg-rose-100 text-rose-800 border-rose-200",
                      EXPIRED: "bg-gray-100 text-gray-800 border-gray-200",
                    };

                    const frequencyLabels = {
                      DAILY: "Every Day (Daily)",
                      ALTERNATING: "Every Alternate Day",
                      WEEKLY: "Once a Week",
                      CUSTOM_DAYS: "Custom Selected Days",
                    };

                    return (
                      <div key={sub.id} className="border border-[#DCE9CC] rounded-xl overflow-hidden shadow-xs bg-white">
                        {/* Header Banner */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-[#F0F5EA]/40 border-b border-[#DCE9CC]/60 gap-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Plan ID: {sub.id.substring(sub.id.length - 8)}</span>
                              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${statusColors[sub.status as keyof typeof statusColors] || "bg-gray-100"}`}>
                                {sub.status}
                              </span>
                            </div>
                            <span className="text-sm font-extrabold text-[#3A4A2E] block mt-1">
                              Schedule: {frequencyLabels[sub.frequency as keyof typeof frequencyLabels] || sub.frequency}
                            </span>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Delivery Slot</span>
                            <span className="text-xs font-bold text-[#3A4A2E]">{sub.deliverySlot?.label || "Standard"}</span>
                          </div>
                        </div>

                        {/* Details grid */}
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-[#DCE9CC]/60">
                          {/* Deliveries & Custom Schedule */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Delivery Schedule Info</h4>
                            <div className="text-xs space-y-2 text-gray-600">
                              <div>
                                <span className="font-bold text-[#3A4A2E]">Start Date:</span>{" "}
                                {new Date(sub.startDate).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                              <div>
                                <span className="font-bold text-[#3A4A2E]">End Date:</span>{" "}
                                {sub.endDate 
                                  ? new Date(sub.endDate).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "Ongoing (Pause/Cancel anytime)"}
                              </div>
                              {sub.frequency === "CUSTOM_DAYS" && sub.customDays && sub.customDays.length > 0 && (
                                <div>
                                  <span className="font-bold text-[#3A4A2E]">Selected Days:</span>{" "}
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {sub.customDays.map((d: string) => (
                                      <span key={d} className="bg-[#F0F5EA] text-[#3A4A2E] text-[9px] font-bold px-2 py-0.5 rounded border border-[#DCE9CC]">
                                        {d}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Items Breakdown */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subscribed Items</h4>
                            <div className="space-y-2">
                              {sub.items.map((item: any) => (
                                <div key={item.id} className="flex justify-between items-center text-xs">
                                  <span className="text-gray-600 font-medium">
                                    {item.variant?.product?.name} ({item.variant?.label}) <span className="text-[#3A4A2E] font-bold">x{item.quantity}</span>
                                  </span>
                                  <span className="font-bold text-[#3A4A2E]">₹{item.pricePerUnit.toFixed(2)}/unit</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Upcoming deliveries list */}
                        {sub.deliveries && sub.deliveries.length > 0 && (
                          <div className="p-5 border-b border-[#DCE9CC]/60 bg-gray-50/50">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Next Scheduled Delivery Log</h4>
                            <div className="flex flex-wrap gap-2">
                              {sub.deliveries
                                .filter((d: any) => d.status === "PENDING")
                                .slice(0, 4)
                                .map((d: any) => (
                                  <div key={d.id} className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-[11px] font-medium text-gray-600 flex items-center gap-1.5 shadow-xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                    {new Date(d.deliveryDate).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                    })}
                                  </div>
                                ))}
                              {sub.deliveries.filter((d: any) => d.status === "PENDING").length === 0 && (
                                <p className="text-xs text-gray-400 font-medium">No pending scheduled deliveries found.</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="p-4 bg-white flex justify-end gap-3 flex-wrap">
                          {sub.status === "ACTIVE" && (
                            <>
                              <button
                                disabled={isUpdatingSubId !== null}
                                onClick={() => handleUpdateSubscriptionStatus(sub.id, "PAUSED")}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {isUpdatingSubId === sub.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  "Pause Subscription"
                                )}
                              </button>
                              <button
                                disabled={isUpdatingSubId !== null}
                                onClick={() => handleUpdateSubscriptionStatus(sub.id, "CANCELLED")}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {isUpdatingSubId === sub.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  "Cancel Plan"
                                )}
                              </button>
                            </>
                          )}
                          {sub.status === "PAUSED" && (
                            <>
                              <button
                                disabled={isUpdatingSubId !== null}
                                onClick={() => handleUpdateSubscriptionStatus(sub.id, "ACTIVE")}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {isUpdatingSubId === sub.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  "Resume Deliveries"
                                )}
                              </button>
                              <button
                                disabled={isUpdatingSubId !== null}
                                onClick={() => handleUpdateSubscriptionStatus(sub.id, "CANCELLED")}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {isUpdatingSubId === sub.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  "Cancel Plan"
                                )}
                              </button>
                            </>
                          )}
                          {sub.status === "CANCELLED" && (
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider py-2">
                              This subscription was cancelled.
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-20 text-center text-gray-400 text-sm font-medium border border-dashed border-[#DCE9CC] rounded-lg space-y-4">
                  <p>You haven&apos;t scheduled any recurring deliveries yet. 🥐</p>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Choose the &quot;Subscribe & Save&quot; option on any sourdough breads, croissants, or daily essentials catalog item to get automatic morning bakes at 10% discount!
                  </p>
                  <Link href="/products" className="inline-block mt-2">
                    <button className="bg-[#3A4A2E] text-white hover:bg-[#2f4422] text-xs font-bold uppercase tracking-widest px-5 py-3 rounded-lg transition-colors cursor-pointer">
                      Explore Shop Catalog
                    </button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
