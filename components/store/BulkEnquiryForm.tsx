"use client";

import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { Check, Loader2, Info, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
}

interface BulkEnquiryFormProps {
  categories: Category[];
  products: Product[];
}

export default function BulkEnquiryForm({ categories, products }: BulkEnquiryFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Filter products based on selected categories
  const filteredProducts = useMemo(() => {
    if (selectedCategoryIds.length === 0) {
      return products;
    }
    return products.filter((p) => selectedCategoryIds.includes(p.categoryId));
  }, [selectedCategoryIds, products]);

  // Handle category checkbox toggle
  const handleToggleCategory = (categoryId: string) => {
    setSelectedCategoryIds((prev) => {
      const isSelected = prev.includes(categoryId);
      const nextCategoryIds = isSelected
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId];

      // Clean up selected products that no longer match the selected categories
      if (isSelected) {
        setSelectedProductIds((prevProds) => {
          return prevProds.filter((prodId) => {
            const prod = products.find((p) => p.id === prodId);
            // If the product belongs to the deselected category and no other selected category, remove it
            return prod ? prod.categoryId !== categoryId : true;
          });
        });
      }

      return nextCategoryIds;
    });
  };

  // Handle product checkbox toggle
  const handleToggleProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // Select all products in the filtered list
  const handleSelectAllProducts = () => {
    const allFilteredIds = filteredProducts.map((p) => p.id);
    const areAllSelected = allFilteredIds.every((id) => selectedProductIds.includes(id));

    if (areAllSelected) {
      setSelectedProductIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      setSelectedProductIds((prev) => {
        const uniqueNewIds = allFilteredIds.filter((id) => !prev.includes(id));
        return [...prev, ...uniqueNewIds];
      });
    }
  };

  const isAllProductsSelected = useMemo(() => {
    if (filteredProducts.length === 0) return false;
    return filteredProducts.map((p) => p.id).every((id) => selectedProductIds.includes(id));
  }, [filteredProducts, selectedProductIds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please fill in your Name.");
      return;
    }

    if (!phone.trim()) {
      toast.error("Please fill in your Phone Number.");
      return;
    }

    // Basic phone validation (simple numeric check)
    const phoneRegex = /^[0-9+\s-]{8,15}$/;
    if (!phoneRegex.test(phone.trim())) {
      toast.error("Please provide a valid Phone Number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/store/bulk-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email: email || undefined,
          quantity: quantity ? parseInt(quantity) : undefined,
          message: message || undefined,
          categoryIds: selectedCategoryIds,
          productIds: selectedProductIds,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsSubmitted(true);
        toast.success("Bulk enquiry submitted successfully!");
      } else {
        toast.error(data.error || "Failed to submit enquiry.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="border-[#d4d9b8] shadow-lg max-w-2xl mx-auto bg-white rounded-2xl overflow-hidden py-10 px-6 text-center animate-in fade-in zoom-in-95 duration-300">
        <CardContent className="space-y-6">
          <div className="w-16 h-16 bg-[#eaf3de] text-[#3B6D11] rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Check className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-playfair font-black text-2xl text-[#1a2c1a] uppercase tracking-wide">
              Thank You!
            </h2>
            <p className="text-sm font-semibold text-[#8a8a7a] uppercase tracking-wider">
              Enquiry Received Successfully
            </p>
          </div>
          <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
            We have received your bulk enquiry. Our operations team will check the product availability, compute custom pricing, and contact you at <span className="font-bold text-[#1a2c1a]">{phone}</span> within 24 hours.
          </p>
          <div className="pt-4">
            <Link href="/products">
              <Button className="bg-[#1a2c1a] hover:bg-[#2d4c2d] text-white font-bold uppercase tracking-wider text-xs px-6 h-11 rounded-xl cursor-pointer">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[#d4d9b8] shadow-lg max-w-3xl mx-auto bg-white rounded-2xl overflow-hidden animate-in fade-in duration-300">
      <CardHeader className="bg-[#f9faf6] border-b border-[#d4d9b8] p-6 text-center">
        <CardTitle className="font-playfair font-black text-2xl uppercase tracking-wider text-[#1a2c1a]">
          Bulk Purchase Enquiry
        </CardTitle>
        <CardDescription className="text-xs font-bold uppercase tracking-wider text-[#8a8a7a] mt-1">
          Provide your details below to request wholesale or custom corporate orders
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#1a2c1a] border-b border-gray-100 pb-1 flex items-center gap-1.5">
              <span>1. Contact Information</span>
              <span className="text-rose-500 font-bold text-sm">*</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#8a8a7a]">
                  Full Name <span className="text-rose-500 font-bold">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-10 border-[#d4d9b8] bg-[#fdfdfb] text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#8a8a7a]">
                  Phone Number <span className="text-rose-500 font-bold">*</span>
                </label>
                <Input
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="h-10 border-[#d4d9b8] bg-[#fdfdfb] text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#8a8a7a]">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 border-[#d4d9b8] bg-[#fdfdfb] text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#8a8a7a]">
                  Expected Quantity (In Units / Packages)
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 50, 100, 500 (optional)"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  className="h-10 border-[#d4d9b8] bg-[#fdfdfb] text-sm"
                />
              </div>
            </div>
          </div>

          {/* Categories Selector */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#1a2c1a] border-b border-gray-100 pb-1">
              2. Select Categories of Interest
            </h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
              Check categories to filter specific products below:
            </p>
            {categories.length === 0 ? (
              <p className="text-xs text-gray-400 font-semibold uppercase">No categories available</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {categories.map((cat) => {
                  const isChecked = selectedCategoryIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleToggleCategory(cat.id)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider text-left transition-all cursor-pointer ${
                        isChecked
                          ? "bg-[#1a2c1a] border-transparent text-white shadow-sm"
                          : "bg-white border-[#d4d9b8] text-[#1a2c1a] hover:bg-[#f9faf6]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{cat.name}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 flex-shrink-0 ml-1.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Products Selector */}
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-gray-100 pb-1">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#1a2c1a]">
                3. Select Products to Enquire
              </h3>
              {filteredProducts.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllProducts}
                  className="text-[10px] font-bold uppercase tracking-wider text-[#c8872a] hover:underline"
                >
                  {isAllProductsSelected ? "Deselect All" : "Select All Products"}
                </button>
              )}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-[#f9faf6] border border-[#d4d9b8] rounded-xl p-6 text-center text-xs text-gray-500 font-bold uppercase">
                No products match the selected categories
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto border border-[#d4d9b8] rounded-xl p-3 bg-[#fdfdfb] space-y-1.5 scrollbar-thin">
                {filteredProducts.map((prod) => {
                  const isChecked = selectedProductIds.includes(prod.id);
                  const parentCat = categories.find((c) => c.id === prod.categoryId);
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleToggleProduct(prod.id)}
                      className={`w-full px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all flex items-center justify-between cursor-pointer ${
                        isChecked
                          ? "bg-[#eaf3de]/60 text-[#1a2c1a]"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <span className="truncate pr-4">{prod.name}</span>
                      <div className="flex items-center gap-2">
                        {parentCat && (
                          <span className="text-[8px] font-bold uppercase tracking-wider bg-gray-200/80 text-gray-600 px-1.5 py-0.5 rounded">
                            {parentCat.name}
                          </span>
                        )}
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                            isChecked
                              ? "bg-[#1a2c1a] border-transparent text-white"
                              : "border-[#d4d9b8] bg-white"
                          }`}
                        >
                          {isChecked && <Check className="w-2.5 h-2.5" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            
            <div className="flex items-center gap-1.5 text-[9px] text-[#8a8a7a] font-bold uppercase tracking-wider">
              <Info className="w-3.5 h-3.5 text-[#c8872a]" />
              <span>
                Currently selected:{" "}
                <span className="text-[#1a2c1a] font-extrabold">
                  {selectedProductIds.length}
                </span>{" "}
                products
              </span>
            </div>
          </div>

          {/* Requirements Message */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#1a2c1a] border-b border-gray-100 pb-1 mb-2">
              4. Additional Details or Custom Requirements
            </h3>
            <textarea
              rows={4}
              placeholder="Tell us more about your bulk order (e.g. customized packaging, specific delivery schedule, target budget, or special ingredient requirements)..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-[#d4d9b8] bg-[#fdfdfb] p-3 rounded-xl text-sm focus:border-[#c8872a] focus:bg-white focus:outline-none transition-all placeholder:text-gray-400 placeholder:font-normal font-medium text-[#1a2c1a]"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1a2c1a] hover:bg-[#2d4c2d] text-white font-bold uppercase tracking-widest text-xs h-12 rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting Request...
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" /> Submit Bulk Enquiry
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
