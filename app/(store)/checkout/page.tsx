"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/store/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { ShieldCheck, Truck, CreditCard, ArrowLeft, Tag, Check, Loader2, Calendar } from "lucide-react";
import { useSession } from "next-auth/react";

export default function CheckoutPage() {
  const { 
    items, 
    subtotal, 
    clearCart,
    isSubscriptionCheckout,
    subscriptionFrequency,
    setSubscriptionFrequency,
    subscriptionCustomDays,
    setSubscriptionCustomDays,
    subscriptionStartDate,
    setSubscriptionStartDate,
    subscriptionEndDate,
    setSubscriptionEndDate,
    subscriptionDiscount
  } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CARD" | "COD" | "STRIPE">("COD");
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pincode Serviceability State
  const [pincodeResult, setPincodeResult] = useState<{
    serviceable: boolean;
    city?: string;
    state?: string;
    deliveryDays?: number;
    deliveryCharge?: number;
    codAvailable?: boolean;
    isFallback?: boolean;
  } | null>(null);
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);

  // Payment Dynamic Configurations & Processing Overlay States
  const [paymentConfig, setPaymentConfig] = useState<{
    razorpayEnable: boolean;
    razorpayKeyId: string;
    stripeEnable: boolean;
    stripeKeyPublishable: string;
    codEnable: boolean;
    freeDeliveryThreshold?: number;
  } | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(499);

  // Delivery slot state
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Quote details state
  const [quoteDetails, setQuoteDetails] = useState<{
    subtotal: number;
    couponDiscount: number;
    deliveryCharge: number;
    packagingFee: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalTax: number;
    totalAmount: number;
    customerState: string;
    storeState: string;
  } | null>(null);
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);

  const baseDeliveryCharge = subtotal >= freeDeliveryThreshold ? 0 : 50;
  const deliveryCharge = subtotal >= freeDeliveryThreshold
    ? 0
    : pincodeResult && pincodeResult.serviceable && pincodeResult.deliveryCharge !== undefined
    ? pincodeResult.deliveryCharge
    : baseDeliveryCharge;
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;

  const finalDeliveryCharge = quoteDetails ? quoteDetails.deliveryCharge : deliveryCharge;
  const finalDiscount = quoteDetails ? quoteDetails.couponDiscount : discount;
  const finalPackagingFee = quoteDetails ? quoteDetails.packagingFee : 0;
  const finalTax = quoteDetails ? quoteDetails.totalTax : 0;
  const finalTotalAmount = quoteDetails ? quoteDetails.totalAmount : (subtotal - finalDiscount + finalDeliveryCharge);

  // Get selectable dates helper
  const getSelectableDates = () => {
    const dates = [];
    const startOffset = pincodeResult?.serviceable && pincodeResult.deliveryDays !== undefined ? pincodeResult.deliveryDays : 0;
    for (let i = startOffset; i < startOffset + 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const formatDateValue = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Pre-populate name, email, phone from session
  useEffect(() => {
    if (session?.user) {
      if (session.user.name && !name) setName(session.user.name);
      if (session.user.email && !email) setEmail(session.user.email);
      const userPhone = (session.user as any).phone || "";
      if (userPhone && !phone) setPhone(userPhone);
    }
  }, [session, name, email, phone]);

  // Load customer default saved address to prefill form
  useEffect(() => {
    async function loadDefaultAddress() {
      if (status !== "authenticated") return;
      try {
        const res = await fetch("/api/store/account/addresses");
        if (res.ok) {
          const addressesList = await res.json();
          const defaultAddr = addressesList.find((a: any) => a.isDefault);
          if (defaultAddr) {
            setAddress(defaultAddr.fullAddress);
            const pincodeMatch = defaultAddr.fullAddress.match(/\b\d{6}\b/);
            if (pincodeMatch) {
              setPincode(pincodeMatch[0]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load customer default address:", err);
      }
    }
    loadDefaultAddress();
  }, [status]);

  // Load Payment Configurations
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/store/payment/config");
        if (res.ok) {
          const data = await res.json();
          setPaymentConfig(data);
          if (data.freeDeliveryThreshold !== undefined) {
            setFreeDeliveryThreshold(data.freeDeliveryThreshold);
          }
          // Set default payment method based on available gateways
          if (data.codEnable) {
            setPaymentMethod("COD");
          } else if (data.razorpayEnable) {
            setPaymentMethod("UPI");
          } else if (data.stripeEnable) {
            setPaymentMethod("CARD");
          }
        }
      } catch (err) {
        console.error("Failed to load payment gateways config:", err);
      }
    }
    loadConfig();
  }, []);

  // Fetch available slots when selected date changes
  useEffect(() => {
    if (selectedDate) {
      const fetchSlots = async () => {
        setIsLoadingSlots(true);
        setSlotsError(null);
        try {
          const dateStr = formatDateValue(selectedDate);
          const res = await fetch(`/api/store/slots?date=${dateStr}`);
          if (res.ok) {
            const data = await res.json();
            setAvailableSlots(data);
          } else {
            setSlotsError("Failed to fetch slots for this date");
          }
        } catch (err) {
          console.error("Error fetching slots:", err);
          setSlotsError("Error loading delivery slots");
        } finally {
          setIsLoadingSlots(false);
        }
      };
      fetchSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDate]);

  // Set default date when pincodeResult is loaded/changed
  useEffect(() => {
    const dates = getSelectableDates();
    if (dates.length > 0) {
      setSelectedDate(dates[0]);
      setSelectedSlotId("");
    }
  }, [pincodeResult]);

  // Synchronize subscriptionStartDate with selectedDate
  useEffect(() => {
    if (isSubscriptionCheckout && subscriptionStartDate) {
      setSelectedDate(new Date(subscriptionStartDate));
    }
  }, [subscriptionStartDate, isSubscriptionCheckout]);

  // Fetch order quote (tax, packaging fee, etc.) dynamically
  useEffect(() => {
    async function fetchQuote() {
      if (items.length === 0) return;
      setIsFetchingQuote(true);
      try {
        const res = await fetch("/api/store/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quoteOnly: true,
            pincode: pincode.length === 6 ? pincode : undefined,
            couponCode: appliedCoupon?.code || undefined,
            items: items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              price: isSubscriptionCheckout ? Math.round(item.price * ((100 - subscriptionDiscount) / 100) * 100) / 100 : item.price,
            })),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setQuoteDetails(data);
        }
      } catch (err) {
        console.error("Error fetching order quote:", err);
      } finally {
        setIsFetchingQuote(false);
      }
    }
    fetchQuote();
  }, [items, pincode, appliedCoupon, isSubscriptionCheckout]);

  // Verify pincode serviceability and handle COD restrictions
  useEffect(() => {
    if (pincode.length === 6) {
      const checkPincode = async () => {
        setIsCheckingPincode(true);
        setPincodeError(null);
        try {
          const res = await fetch(`/api/store/pincode/${pincode}`);
          if (res.ok) {
            const data = await res.json();
            setPincodeResult(data);
            if (data.serviceable) {
              if (data.city) {
                setCity(data.city);
              }
              // If COD is not available, switch away from COD if selected
              if (!data.codAvailable) {
                setPaymentMethod((prev) => {
                  if (prev === "COD") {
                    if (paymentConfig?.razorpayEnable) return "UPI";
                    if (paymentConfig?.stripeEnable) return "CARD";
                    return "CARD";
                  }
                  return prev;
                });
              }
            } else {
              setPincodeError("This pincode is not serviceable for delivery.");
            }
          } else {
            setPincodeError("Failed to verify pincode serviceability.");
          }
        } catch (err) {
          console.error("Error checking pincode:", err);
          setPincodeError("Error verifying pincode.");
        } finally {
          setIsCheckingPincode(false);
        }
      };
      checkPincode();
    } else {
      setPincodeResult(null);
      setPincodeError(null);
    }
  }, [pincode, paymentConfig]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsApplyingCoupon(true);
    try {
      const res = await fetch("/api/store/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), subtotal }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Invalid coupon code");
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({
          code: data.code,
          discountAmount: data.discountAmount,
        });
        toast.success(`Coupon ${data.code} applied! Saved ₹${data.discountAmount}`);
      }
    } catch (error) {
      toast.error("Failed to apply coupon");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleVerifyPayment = async (orderId: string, paymentId: string, signature: string, mode: string) => {
    setPaymentProcessing(true);
    setProcessingMessage("Verifying secure payment and completing order...");
    try {
      const res = await fetch("/api/store/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
          name,
          email,
          phone,
          fullAddress: `${address}, ${city}, Pincode: ${pincode}`,
          pincode,
          deliveryDate: selectedDate ? formatDateValue(selectedDate) : undefined,
          deliverySlotId: selectedSlotId || undefined,
          paymentMethod,
          couponCode: appliedCoupon?.code || undefined,
          items: items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
          })),
          mode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Payment verification failed");
      } else {
        toast.success("Payment verified! Order placed successfully.");
        clearCart();
        router.push(`/checkout/success/${data.orderId}`);
      }
    } catch (error) {
      toast.error("Something went wrong during payment verification");
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleVerifySubscriptionPayment = async (
    subscriptionId: string,
    planId: string,
    paymentId: string,
    signature: string,
    mode: string
  ) => {
    setPaymentProcessing(true);
    setProcessingMessage("Verifying secure payment and creating subscription...");
    try {
      const res = await fetch("/api/store/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frequency: subscriptionFrequency,
          customDays: subscriptionFrequency === "CUSTOM_DAYS" ? subscriptionCustomDays : [],
          deliverySlotId: selectedSlotId,
          startDate: subscriptionStartDate,
          endDate: subscriptionEndDate || undefined,
          items: items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
          razorpaySubscriptionId: subscriptionId,
          razorpayPlanId: planId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
          mode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Subscription verification failed");
      } else {
        toast.success("Subscription scheduled and paid successfully!");
        clearCart();
        router.push("/account?tab=subscriptions");
      }
    } catch (error) {
      toast.error("Something went wrong during subscription payment verification");
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Your shopping bag is empty");
      return;
    }

    if (!name || !phone || !address || !city || !pincode) {
      toast.error("Please fill in all required shipping fields");
      return;
    }

    const fullAddress = `${address}, ${city}, Pincode: ${pincode}`;

    if (isSubscriptionCheckout) {
      if (status !== "authenticated") {
        toast.error("Please sign in to schedule a subscription.");
        return;
      }
      if (subscriptionFrequency === "CUSTOM_DAYS" && subscriptionCustomDays.length === 0) {
        toast.error("Please select at least one delivery day for Custom Days schedule.");
        return;
      }
      setIsSubmitting(true);
      setPaymentProcessing(true);
      setProcessingMessage("Initiating subscription payment session...");
      try {
        // Save address as default for subscription deliveries
        await fetch("/api/store/account/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullAddress,
            isDefault: true,
          }),
        });

        // Initiate subscription payment session (using dynamic discount price)
        const res = await fetch("/api/store/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              price: Math.round(item.price * ((100 - subscriptionDiscount) / 100) * 100) / 100,
            })),
            couponCode: appliedCoupon?.code || undefined,
            pincode,
            deliveryDate: subscriptionStartDate ? subscriptionStartDate : undefined,
            deliverySlotId: selectedSlotId || undefined,
            isSubscription: true,
            frequency: subscriptionFrequency,
            customDays: subscriptionFrequency === "CUSTOM_DAYS" ? subscriptionCustomDays : [],
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to initiate payment gateway");
        }

        if (data.mode === "simulation") {
          setProcessingMessage("Processing subscription payment simulation. Please wait...");
          setTimeout(async () => {
            const mockPaymentId = `pay_sim_${Math.random().toString(36).substring(2, 11)}`;
            await handleVerifySubscriptionPayment(
              data.razorpaySubscriptionId,
              data.planId,
              mockPaymentId,
              "sim_signature",
              "simulation"
            );
            setIsSubmitting(false);
          }, 2000);
        } else {
          setProcessingMessage("Launching payment gateway...");
          if (!(window as any).Razorpay) {
            throw new Error("Razorpay checkout SDK failed to load. Please check your internet connection.");
          }

          const options = {
            key: data.keyId,
            subscription_id: data.razorpaySubscriptionId,
            name: "The Daily Bake",
            description: "Subscription Payment",
            handler: async function (response: any) {
              await handleVerifySubscriptionPayment(
                response.razorpay_subscription_id || data.razorpaySubscriptionId,
                data.planId,
                response.razorpay_payment_id,
                response.razorpay_signature,
                "live"
              );
              setIsSubmitting(false);
            },
            modal: {
              ondismiss: function () {
                toast.error("Payment cancelled");
                setPaymentProcessing(false);
                setIsSubmitting(false);
              }
            },
            prefill: {
              name: name,
              email: email,
              contact: phone,
            },
            theme: {
              color: "#3d5a2e",
            },
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
          setPaymentProcessing(false);
        }
      } catch (error: any) {
        toast.error(error.message || "Something went wrong during subscription checkout");
        setPaymentProcessing(false);
        setIsSubmitting(false);
      }
      return;
    }

    if (paymentMethod === "COD") {
      setIsSubmitting(true);
      try {
        const res = await fetch("/api/store/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            phone,
            fullAddress,
            pincode,
            paymentMethod,
            couponCode: appliedCoupon?.code || undefined,
            items: items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
            })),
            deliveryDate: selectedDate ? formatDateValue(selectedDate) : undefined,
            deliverySlotId: selectedSlotId || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to place order");
          setIsSubmitting(false);
        } else {
          toast.success("Order placed successfully!");
          clearCart();
          router.push(`/checkout/success/${data.orderId}`);
        }
      } catch (error) {
        toast.error("Something went wrong during checkout");
        setIsSubmitting(false);
      }
    } else {
      // UPI or CARD online checkout
      setIsSubmitting(true);
      setPaymentProcessing(true);
      setProcessingMessage("Initiating payment session...");

      try {
        const res = await fetch("/api/store/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
            })),
            couponCode: appliedCoupon?.code || undefined,
            pincode,
            deliveryDate: selectedDate ? formatDateValue(selectedDate) : undefined,
            deliverySlotId: selectedSlotId || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to initiate payment gateway");
        }

        if (data.mode === "simulation") {
          setProcessingMessage("Processing payment simulation. Please wait...");
          setTimeout(async () => {
            const mockPaymentId = `pay_sim_${Math.random().toString(36).substring(2, 11)}`;
            await handleVerifyPayment(data.razorpayOrderId, mockPaymentId, "sim_signature", "simulation");
            setIsSubmitting(false);
          }, 2000);
        } else {
          setProcessingMessage("Launching payment gateway...");
          if (!(window as any).Razorpay) {
            throw new Error("Razorpay checkout SDK failed to load. Please check your internet connection.");
          }

          const options = {
            key: data.keyId,
            amount: data.amount,
            currency: data.currency,
            name: "The Daily Bake",
            description: "Checkout Payment",
            order_id: data.razorpayOrderId,
            handler: async function (response: any) {
              await handleVerifyPayment(
                response.razorpay_order_id,
                response.razorpay_payment_id,
                response.razorpay_signature,
                "live"
              );
              setIsSubmitting(false);
            },
            modal: {
              ondismiss: function () {
                toast.error("Payment cancelled");
                setPaymentProcessing(false);
                setIsSubmitting(false);
              }
            },
            prefill: {
              name: name,
              email: email,
              contact: phone,
            },
            theme: {
              color: "#3d5a2e",
            },
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
          setPaymentProcessing(false);
        }
      } catch (err: any) {
        toast.error(err.message || "Could not launch payment gateway");
        setPaymentProcessing(false);
        setIsSubmitting(false);
      }
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow">
          <Truck className="w-10 h-10 text-[#3d5a2e]" />
        </div>
        <h2 className="font-playfair font-black text-3xl text-[#1a2c1a] uppercase">Your Bag is Empty</h2>
        <p className="text-[#8a8a7a] text-sm max-w-md mx-auto">
          You need to add at least one delicious baked good to your bag before proceeding to checkout.
        </p>
        <Link href="/products" className="inline-block pt-4">
          <Button className="bg-[#3d5a2e] hover:bg-[#1a2c1a] text-white font-bold uppercase tracking-widest px-8 py-6 rounded-full shadow-lg">
            Explore Fresh Bakes
          </Button>
        </Link>
      </div>
    );
  }

  if (isSubscriptionCheckout && status === "unauthenticated") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow">
          <Calendar className="w-10 h-10 text-[#c8872a]" />
        </div>
        <h2 className="font-playfair font-black text-3xl text-[#1a2c1a] uppercase">Sign In Required</h2>
        <p className="text-[#8a8a7a] text-sm max-w-md mx-auto">
          Subscriptions require a secure account to manage future delivery schedules and history.
        </p>
        <Link href={`/login?callbackUrl=/checkout`} className="inline-block pt-4">
          <Button className="bg-[#c8872a] hover:bg-[#a86e1e] text-white font-bold uppercase tracking-widest px-8 py-6 rounded-full shadow-lg">
            Sign In to Continue
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#d4d9b8] pb-6">
        <Link href="/products" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-[#8a8a7a] hover:text-[#c8872a] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
        <h1 className="font-playfair font-black text-3xl text-[#1a2c1a] uppercase tracking-tight">
          Secure Checkout
        </h1>
        <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-[#3d5a2e]">
          <ShieldCheck className="w-4 h-4" />
          <span>SSL Encrypted</span>
        </div>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Shipping & Payment Form */}
        <div className="lg:col-span-7 space-y-8 bg-white border border-[#d4d9b8] rounded-2xl p-6 sm:p-10 shadow-sm">
          {/* Contact Details */}
          <div className="space-y-4">
            <h3 className="font-playfair font-bold text-xl text-[#1a2c1a] uppercase tracking-wider border-b border-[#f0f2e8] pb-3">
              1. Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">Full Name *</Label>
                <Input
                  id="name"
                  required
                  placeholder="Priya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">Phone Number *</Label>
                <Input
                  id="phone"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white"
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">Email Address (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="priya@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="space-y-4 pt-4">
            <h3 className="font-playfair font-bold text-xl text-[#1a2c1a] uppercase tracking-wider border-b border-[#f0f2e8] pb-3">
              2. Delivery Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">Street Address / Apartment / Suite *</Label>
                <Textarea
                  id="address"
                  required
                  placeholder="Flat 402, Sunshine Apartments, 5th Cross, Koramangala"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">City *</Label>
                <Input
                  id="city"
                  required
                  placeholder="Bengaluru"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">Pincode *</Label>
                <Input
                  id="pincode"
                  required
                  placeholder="560034"
                  value={pincode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setPincode(val);
                  }}
                  className={`bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white ${
                    pincodeError ? "border-red-500 focus:border-red-500" : ""
                  }`}
                />
                {isCheckingPincode && (
                  <p className="text-xs text-[#8a8a7a] flex items-center gap-1 mt-1">
                    <Loader2 className="w-3 h-3 animate-spin text-[#c8872a]" /> Checking serviceability...
                  </p>
                )}
                {pincodeError && (
                  <p className="text-xs text-red-600 font-semibold mt-1">
                    {pincodeError}
                  </p>
                )}
                {pincodeResult && pincodeResult.serviceable && !isCheckingPincode && (
                  <p className="text-xs text-[#3d5a2e] font-semibold mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Serviceable: {pincodeResult.city && `${pincodeResult.city}, `}{pincodeResult.state || ""} 
                    {pincodeResult.deliveryDays ? ` (Delivered in ${pincodeResult.deliveryDays} days)` : ""}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Scheduling / Time Slot */}
          <div className="space-y-4 pt-4">
            <h3 className="font-playfair font-bold text-xl text-[#1a2c1a] uppercase tracking-wider border-b border-[#f0f2e8] pb-3">
              3. Delivery Scheduling
            </h3>
            <div className="space-y-4 pt-2">
              {isSubscriptionCheckout ? (
                <div className="space-y-4 bg-[#fcfdfa] border border-[#d4d9b8] rounded-2xl p-6 shadow-sm">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#c8872a] mb-2 flex items-center gap-1.5 font-bold">
                    📅 Subscription Scheduling Plan
                  </h4>
                  
                  {/* Frequency Selector */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">Delivery Frequency</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(["DAILY", "ALTERNATING", "WEEKLY", "CUSTOM_DAYS"] as const).map((freq) => (
                        <button
                          key={freq}
                          type="button"
                          onClick={() => setSubscriptionFrequency(freq)}
                          className={`p-3 rounded-xl border text-xs font-bold uppercase tracking-wider text-center transition-all cursor-pointer ${
                            subscriptionFrequency === freq
                              ? "border-[#c8872a] bg-[#c8872a]/10 text-[#1a2c1a] shadow-sm"
                              : "border-[#d4d9b8] bg-white text-[#4a4a4a] hover:border-[#c8872a]/50"
                          }`}
                        >
                          {freq === "DAILY" && "Daily"}
                          {freq === "ALTERNATING" && "Alt Days"}
                          {freq === "WEEKLY" && "Weekly"}
                          {freq === "CUSTOM_DAYS" && "Custom"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Days Checkboxes */}
                  {subscriptionFrequency === "CUSTOM_DAYS" && (
                    <div className="space-y-2 pt-2 animate-in fade-in duration-200">
                      <Label className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">Select Delivery Days</Label>
                      <div className="flex flex-wrap gap-2">
                        {["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].map((day) => {
                          const isChecked = subscriptionCustomDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                if (isChecked) {
                                  setSubscriptionCustomDays(subscriptionCustomDays.filter(d => d !== day));
                                } else {
                                  setSubscriptionCustomDays([...subscriptionCustomDays, day]);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                isChecked
                                  ? "border-[#c8872a] bg-[#c8872a] text-white"
                                  : "border-[#d4d9b8] bg-white text-[#4a4a4a] hover:border-[#c8872a]/50"
                              }`}
                            >
                              {day.substring(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Start & End Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="start-date" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        required
                        min={(() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          return tomorrow.toISOString().split("T")[0];
                        })()}
                        max={(() => {
                          const maxDate = new Date();
                          maxDate.setDate(maxDate.getDate() + 14);
                          return maxDate.toISOString().split("T")[0];
                        })()}
                        value={subscriptionStartDate}
                        onChange={(e) => setSubscriptionStartDate(e.target.value)}
                        className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">End Date (Optional)</Label>
                      <Input
                        id="end-date"
                        type="date"
                        min={(() => {
                          const minDate = new Date(subscriptionStartDate || new Date());
                          minDate.setDate(minDate.getDate() + 2);
                          return minDate.toISOString().split("T")[0];
                        })()}
                        value={subscriptionEndDate}
                        onChange={(e) => setSubscriptionEndDate(e.target.value)}
                        className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {getSelectableDates().map((date) => {
                    const isSelected = selectedDate && formatDateValue(selectedDate) === formatDateValue(date);
                    return (
                      <button
                        key={formatDateValue(date)}
                        type="button"
                        onClick={() => setSelectedDate(date)}
                        className={`flex-shrink-0 flex flex-col items-center justify-center w-20 h-24 rounded-2xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#3d5a2e] bg-[#3d5a2e]/10 text-[#3d5a2e]"
                            : "border-[#d4d9b8] bg-white text-[#4a4a4a] hover:border-[#3d5a2e]/50"
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold tracking-widest text-[#8a8a7a]">
                          {date.toLocaleDateString("en-IN", { weekday: "short" })}
                        </span>
                        <span className="text-2xl font-playfair font-black mt-1">
                          {date.getDate()}
                        </span>
                        <span className="text-[9px] font-semibold mt-1 uppercase text-[#8a8a7a]">
                          {date.toLocaleDateString("en-IN", { month: "short" })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedDate && (
                <div className="space-y-3 pt-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a]">Select Time Slot</Label>
                  {isLoadingSlots ? (
                    <div className="flex items-center gap-2 text-sm text-[#8a8a7a] py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-[#c8872a]" />
                      <span>Checking slot capacities...</span>
                    </div>
                  ) : slotsError ? (
                    <p className="text-xs text-red-600 font-semibold">{slotsError}</p>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-xs text-[#8a8a7a] bg-[#f9faf6] p-4 rounded-xl border border-dashed border-[#d4d9b8] text-center">
                      No active delivery slots configured for this date.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {availableSlots.map((slot) => {
                        const isSelected = selectedSlotId === slot.id;
                        const isSlotAvailable = slot.isAvailable;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={!isSlotAvailable}
                            onClick={() => setSelectedSlotId(slot.id)}
                            className={`p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                              isSelected
                                ? "border-[#c8872a] bg-[#c8872a]/10 text-[#1a2c1a]"
                                : isSlotAvailable
                                ? "border-[#d4d9b8] bg-white text-[#4a4a4a] hover:border-[#c8872a]/50"
                                : "border-[#f0f2e8] bg-[#fdfdfb] text-gray-400 opacity-60 cursor-not-allowed"
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className={`text-sm font-bold uppercase tracking-wider ${isSelected ? "text-[#c8872a]" : "text-[#1a2c1a]"}`}>
                                {slot.label}
                              </span>
                              <span className="text-xs text-[#8a8a7a] mt-0.5">
                                Hours: {slot.startTime} - {slot.endTime} | {isSlotAvailable ? "Available" : "Fully booked"}
                              </span>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-[#c8872a] text-white flex items-center justify-center shadow">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            )}
                            {!isSlotAvailable && (
                              <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full uppercase">
                                Full
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-4 pt-4">
            <h3 className="font-playfair font-bold text-xl text-[#1a2c1a] uppercase tracking-wider border-b border-[#f0f2e8] pb-3">
              4. Payment Method
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {(() => {
                const availablePaymentMethods = [];
                const hasConfig = paymentConfig !== null;
                const isCodAllowed = !pincodeResult || pincodeResult.codAvailable !== false;

                if ((!hasConfig || paymentConfig.codEnable) && isCodAllowed && !isSubscriptionCheckout) {
                  availablePaymentMethods.push({
                    id: "COD" as const,
                    label: "Cash on Delivery",
                    icon: Truck,
                    desc: "Pay at your doorstep",
                  });
                }
                if (hasConfig && paymentConfig.razorpayEnable) {
                  availablePaymentMethods.push({
                    id: "UPI" as const,
                    label: "UPI / GPay / PhonePe",
                    icon: CreditCard,
                    desc: "Instant mobile payment",
                  });
                  availablePaymentMethods.push({
                    id: "CARD" as const,
                    label: "Credit / Debit Card",
                    icon: CreditCard,
                    desc: "Visa, MasterCard, RuPay",
                  });
                } else if (hasConfig && paymentConfig.stripeEnable) {
                  availablePaymentMethods.push({
                    id: "CARD" as const,
                    label: "Credit / Debit Card",
                    icon: CreditCard,
                    desc: "Powered by Stripe",
                  });
                }

                if (availablePaymentMethods.length === 0) {
                  return (
                    <div className="sm:col-span-3 p-4 rounded-xl border border-dashed border-[#d4d9b8] bg-[#f9faf6] text-center text-xs text-[#8a8a7a]">
                      No payment methods currently configured.
                    </div>
                  );
                }

                return availablePaymentMethods.map((pm) => {
                  const isSelected = paymentMethod === pm.id;
                  const Icon = pm.icon;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id as any)}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-[#c8872a] bg-[#c8872a]/10 text-[#1a2c1a] shadow-sm"
                          : "border-[#d4d9b8] bg-white text-[#4a4a4a] hover:border-[#c8872a]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-5 h-5 ${isSelected ? "text-[#c8872a]" : "text-[#8a8a7a]"}`} />
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#c8872a] text-white flex items-center justify-center shadow">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-sm uppercase tracking-wider block text-[#1a2c1a]">{pm.label}</span>
                        <span className="text-xs text-[#8a8a7a] block mt-0.5">{pm.desc}</span>
                      </div>
                    </button>
                  );
                });
              })()}
            </div>
          </div>

          {/* Place Order Button */}
          <div className="pt-6 border-t border-[#f0f2e8]">
            {/* Consent Box */}
            <div className="flex items-start gap-2.5 mb-5 select-none">
              <input
                id="agree-to-policies"
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[#d4d9b8] text-[#3d5a2e] focus:ring-[#3d5a2e] accent-[#3d5a2e] cursor-pointer"
              />
              <Label
                htmlFor="agree-to-policies"
                className="text-[11px] text-[#4a4a4a] leading-tight font-medium cursor-pointer"
              >
                I agree to the{" "}
                <Link
                  href="/terms-and-conditions"
                  target="_blank"
                  className="text-[#3d5a2e] hover:text-[#1a2c1a] font-bold underline transition-colors"
                >
                  Terms &amp; Conditions
                </Link>
                ,{" "}
                <Link
                  href="/privacy-policy"
                  target="_blank"
                  className="text-[#3d5a2e] hover:text-[#1a2c1a] font-bold underline transition-colors"
                >
                  Privacy Policy
                </Link>
                , and{" "}
                <Link
                  href="/refund-policy"
                  target="_blank"
                  className="text-[#3d5a2e] hover:text-[#1a2c1a] font-bold underline transition-colors"
                >
                  Refund Policy
                </Link>
                .
              </Label>
            </div>

            <Button
              type="submit"
              disabled={
                isSubmitting ||
                isCheckingPincode ||
                pincode.length !== 6 ||
                (pincodeResult !== null && !pincodeResult.serviceable) ||
                !selectedDate ||
                (availableSlots.length > 0 && !selectedSlotId) ||
                !agreeToTerms
              }
              className={`w-full ${
                isSubscriptionCheckout 
                  ? "bg-[#c8872a] hover:bg-[#a86e1e]" 
                  : "bg-[#3d5a2e] hover:bg-[#1a2c1a]"
              } text-white py-7 rounded-xl font-bold uppercase tracking-widest text-base shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span>
                {isSubmitting
                  ? isSubscriptionCheckout ? "Scheduling Subscription..." : "Processing Order..."
                  : isCheckingPincode
                  ? "Verifying Pincode..."
                  : pincode.length !== 6
                  ? "Enter 6-Digit Pincode"
                  : pincodeResult && !pincodeResult.serviceable
                  ? "Pincode Unserviceable"
                  : !selectedDate
                  ? "Select Start Date"
                  : availableSlots.length > 0 && !selectedSlotId
                  ? "Select Delivery Time Slot"
                  : isSubscriptionCheckout
                  ? `Schedule Subscription • ₹${finalTotalAmount}/del`
                  : `Place Order • ₹${finalTotalAmount}`}
              </span>
            </Button>
            <p className="text-[10px] text-center text-[#8a8a7a] mt-3 uppercase tracking-wider">
              {isSubscriptionCheckout 
                ? "By creating this subscription, recurring delivery invoices will be auto-generated." 
                : "By placing your order, you agree to The Daily Bake™ terms of service, privacy policy, and refund policy."}
            </p>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5 space-y-8 bg-white border border-[#d4d9b8] rounded-2xl p-6 sm:p-10 shadow-sm sticky top-28">
          <h3 className="font-playfair font-bold text-xl text-[#1a2c1a] uppercase tracking-wider border-b border-[#f0f2e8] pb-3">
            Order Summary ({items.reduce((acc, item) => acc + item.quantity, 0)} items)
          </h3>

          {/* Items List */}
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2 divide-y divide-[#f0f2e8]">
            {items.map((item) => (
              <div key={item.variantId} className="flex gap-4 pt-4 first:pt-0">
                <div className="relative w-16 h-16 rounded-lg bg-[#f0f2e8] overflow-hidden flex-shrink-0 border border-[#d4d9b8]">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">🍞</div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-[#1a2c1a] text-sm leading-tight">{item.name}</h4>
                    <p className="text-xs font-semibold text-[#c8872a] mt-0.5">{item.variantLabel}</p>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-[#4a4a4a]">
                    <span>Qty: {item.quantity}</span>
                    <span className="text-[#1a2c1a] text-sm">
                      ₹{(isSubscriptionCheckout ? Math.round(item.price * ((100 - subscriptionDiscount) / 100) * 100) / 100 : item.price) * item.quantity}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Coupon Code Section */}
          <div className="pt-4 border-t border-[#f0f2e8] space-y-3">
            <Label htmlFor="coupon" className="text-xs font-bold uppercase tracking-wider text-[#1a2c1a] flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-[#c8872a]" />
              <span>Have a coupon code?</span>
            </Label>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-[#c8872a]/10 border border-[#c8872a] rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#c8872a]" />
                  <span className="font-bold text-sm text-[#1a2c1a] uppercase tracking-wider">{appliedCoupon.code}</span>
                  <span className="bg-[#c8872a] text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Applied</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAppliedCoupon(null)}
                  className="text-xs font-bold text-red-600 hover:underline uppercase tracking-wider"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  id="coupon"
                  placeholder="e.g. FRESHBAKE"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="bg-[#f0f2e8] border-transparent focus:border-[#c8872a] focus:bg-white uppercase"
                />
                <Button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={isApplyingCoupon || !couponCode.trim()}
                  className="bg-[#1a2c1a] hover:bg-[#c8872a] text-white font-bold uppercase tracking-wider shadow-none"
                >
                  {isApplyingCoupon ? "..." : "Apply"}
                </Button>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="pt-6 border-t border-[#f0f2e8] space-y-3 text-sm text-[#4a4a4a]">
            <div className="flex justify-between items-center">
              <span>Subtotal</span>
              <span className="font-bold text-[#1a2c1a]">₹{subtotal}</span>
            </div>
            {finalDiscount > 0 && (
              <div className="flex justify-between items-center text-[#3d5a2e] font-bold">
                <span>Coupon Discount {appliedCoupon?.code ? `(${appliedCoupon.code})` : ""}</span>
                <span>- ₹{finalDiscount}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span>Delivery Charges {subtotal >= freeDeliveryThreshold && <span className="text-xs bg-[#3d5a2e] text-white px-2 py-0.5 rounded-full ml-1">FREE OVER ₹{freeDeliveryThreshold}</span>}</span>
              <span className="font-bold text-[#1a2c1a]">
                {finalDeliveryCharge === 0 ? <span className="text-[#3d5a2e]">FREE</span> : `₹${finalDeliveryCharge}`}
              </span>
            </div>
            {finalPackagingFee > 0 && (
              <div className="flex justify-between items-center text-[#4a4a4a]">
                <span>Packaging & Handling Fee</span>
                <span className="font-bold text-[#1a2c1a]">₹{finalPackagingFee}</span>
              </div>
            )}
            {finalTax > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs text-[#8a8a7a]">
                  <span>GST Taxes</span>
                  <span className="font-bold">₹{finalTax}</span>
                </div>
                {quoteDetails && quoteDetails.cgstAmount > 0 && (
                  <div className="flex justify-between items-center text-[11px] text-[#8a8a7a] pl-3">
                    <span>CGST (Intra-state)</span>
                    <span>₹{quoteDetails.cgstAmount}</span>
                  </div>
                )}
                {quoteDetails && quoteDetails.sgstAmount > 0 && (
                  <div className="flex justify-between items-center text-[11px] text-[#8a8a7a] pl-3">
                    <span>SGST (Intra-state)</span>
                    <span>₹{quoteDetails.sgstAmount}</span>
                  </div>
                )}
                {quoteDetails && quoteDetails.igstAmount > 0 && (
                  <div className="flex justify-between items-center text-[11px] text-[#8a8a7a] pl-3">
                    <span>IGST (Inter-state)</span>
                    <span>₹{quoteDetails.igstAmount}</span>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-between items-center pt-4 border-t border-[#d4d9b8] text-[#1a2c1a]">
              <span className="text-base font-bold uppercase tracking-wider">Grand Total</span>
              <span className="font-playfair font-black text-3xl text-[#1a2c1a]">₹{finalTotalAmount}</span>
            </div>
          </div>
        </div>
      </form>

      {/* Razorpay Script */}
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      {/* Payment Processing Screen Overlay */}
      {paymentProcessing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center text-white p-4">
          <div className="bg-[#1a2c1a] border border-[#d4d9b8]/20 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-[#c8872a]/15 border border-[#c8872a] rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-[#c8872a] animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="font-playfair font-black text-xl uppercase tracking-wider text-white">
                Securing Order
              </h3>
              <p className="text-sm text-[#e8ead8]">
                {processingMessage}
              </p>
            </div>
            <p className="text-[10px] text-white/50 uppercase tracking-widest">
              Please do not close this page or press back
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
