"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/store/CartContext";
import { useWishlist } from "@/lib/store/WishlistContext";
import { useSession } from "next-auth/react";
import { 
  Minus, 
  Plus, 
  ShoppingBag, 
  ShieldCheck, 
  Clock, 
  Truck, 
  ArrowLeft, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  Star, 
  MessageSquare, 
  AlertCircle,
  Loader2
} from "lucide-react";
import { PincodeChecker } from "@/components/store/PincodeChecker";
import { ProductCard } from "@/components/store/ProductCard";
import { toast } from "sonner";

interface Variant {
  id: string;
  label: string;
  price: number;
  stock: number;
  sku: string;
}

interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    images: string[];
    nutritionTags: string[];
    category: {
      name: string;
      slug: string;
    };
    variants: Variant[];
  };
  relatedProducts: any[];
}

export function ProductDetailView({ product, relatedProducts }: ProductDetailProps) {
  const { addToCart, setIsSubscriptionCheckout, subscriptionDiscount } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wish = isWishlisted(product.id);
  const { data: session } = useSession();
  const [purchaseType, setPurchaseType] = useState<"onetime" | "subscription">("onetime");

  const [selectedVariant, setSelectedVariant] = useState<Variant>(
    product.variants[0] || {
      id: "fallback",
      label: "Standard",
      price: 99,
      stock: 10,
      sku: "FALLBACK-SKU",
    }
  );
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(product.images[0] || "");
  const scrollRef = useRef<HTMLDivElement>(null);
  const reviewSectionRef = useRef<HTMLDivElement>(null);
  const allSameCategory = relatedProducts ? relatedProducts.every((p) => p.category?.slug === product.category.slug) : true;

  // Reviews & Rating states
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [distribution, setDistribution] = useState<Record<number, number>>({
    5: 0, 4: 0, 3: 0, 2: 0, 1: 0
  });
  const [hasPurchased, setHasPurchased] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Write Review form states
  const [ratingInput, setRatingInput] = useState(5);
  const [titleInput, setTitleInput] = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await fetch(`/api/store/reviews?productId=${product.id}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setAverageRating(data.averageRating || 0);
        setTotalCount(data.totalCount || 0);
        setDistribution(data.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
        setHasPurchased(data.hasPurchased || false);
        setHasReviewed(data.hasReviewed || false);
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [product.id, session]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) {
      toast.error("Please enter a review comment.");
      return;
    }
    setIsSubmittingReview(true);
    try {
      const res = await fetch("/api/store/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          rating: ratingInput,
          title: titleInput.trim() || undefined,
          comment: commentInput.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Review submitted successfully!");
        setRatingInput(5);
        setTitleInput("");
        setCommentInput("");
        fetchReviews();
      } else {
        toast.error(data.error || "Failed to submit review");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" 
        ? scrollLeft - clientWidth * 0.75 
        : scrollLeft + clientWidth * 0.75;
      
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  const handleAddToCart = () => {
    if (purchaseType === "subscription") {
      setIsSubscriptionCheckout(true);
    }
    addToCart({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      variantLabel: selectedVariant.label,
      price: selectedVariant.price,
      image: product.images[0] || "",
      quantity,
      maxStock: selectedVariant.stock,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Breadcrumb */}
      <Link href="/products" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-[#8a8a7a] hover:text-[#c8872a] transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Products</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left Side: Image Gallery */}
        <div className="space-y-4 sticky top-28">
          <div className="relative w-full aspect-square rounded-2xl bg-white border border-[#d4d9b8] overflow-hidden shadow-sm">
            {selectedImage ? (
              <Image
                src={selectedImage}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl">
                🍞
              </div>
            )}
            <span className="absolute top-4 left-4 bg-[#1a2c1a] text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow">
              {product.category.name}
            </span>
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                    selectedImage === img ? "border-[#c8872a] ring-2 ring-[#c8872a]/20" : "border-[#d4d9b8] opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={img} alt={`${product.name} ${idx + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Product Details & Actions */}
        <div className="space-y-8 bg-white border border-[#d4d9b8] rounded-2xl p-8 sm:p-12 shadow-sm">
          {/* Header */}
          <div className="space-y-2 border-b border-[#d4d9b8] pb-6">
            <h1 className="font-playfair font-black text-3xl sm:text-4xl text-[#1a2c1a] uppercase tracking-tight">
              {product.name}
            </h1>
            {totalCount > 0 && (
              <button
                onClick={() => reviewSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="flex items-center gap-1.5 text-xs text-[#c8872a] hover:underline font-bold mt-1 uppercase tracking-wider cursor-pointer"
              >
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < Math.round(averageRating) ? "fill-[#e8c97a] text-[#e8c97a]" : "text-gray-300"}
                    />
                  ))}
                </div>
                <span>{averageRating.toFixed(1)} ({totalCount} {totalCount === 1 ? 'review' : 'reviews'})</span>
              </button>
            )}
            <p className="text-xs font-bold uppercase tracking-widest text-[#8a8a7a] mt-1">
              SKU: {selectedVariant.sku}
            </p>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-4">
            <span className="font-playfair font-black text-4xl text-[#1a2c1a]">
              ₹{purchaseType === "subscription" ? Math.round(selectedVariant.price * ((100 - subscriptionDiscount) / 100) * 100) / 100 : selectedVariant.price}
            </span>
            {purchaseType === "subscription" && (
              <span className="line-through text-lg text-[#8a8a7a] font-bold">
                ₹{selectedVariant.price}
              </span>
            )}
            <span className="text-xs font-bold uppercase tracking-widest text-[#8a8a7a]">
              (Inclusive of all taxes)
            </span>
          </div>

          {/* Description */}
          {product.description && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#1a2c1a]">Description</h3>
              <p className="text-sm text-[#4a4a4a] leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Nutrition Tags */}
          {product.nutritionTags.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#1a2c1a]">Dietary Highlights</h3>
              <div className="flex flex-wrap gap-2">
                {product.nutritionTags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-[#f0f2e8] text-[#1a2c1a] text-xs font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-full border border-[#d4d9b8]"
                  >
                    ✨ {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Variants Selector */}
          <div className="space-y-3 pt-4 border-t border-[#d4d9b8]/50">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#1a2c1a]">Choose Size / Weight</h3>
              <span className={`text-xs font-bold uppercase tracking-widest ${selectedVariant.stock > 0 ? "text-[#3d5a2e]" : "text-red-600"}`}>
                {selectedVariant.stock > 0 ? `${selectedVariant.stock} in stock` : "Out of stock"}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {product.variants.map((v) => {
                const isSelected = selectedVariant.id === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => { setSelectedVariant(v); setQuantity(1); }}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-[#c8872a] bg-[#c8872a]/10 text-[#1a2c1a] shadow-sm"
                        : "border-[#d4d9b8] bg-white text-[#4a4a4a] hover:border-[#c8872a]/50"
                    }`}
                  >
                    <span className="font-bold text-sm uppercase tracking-wider block">{v.label}</span>
                    <span className="font-playfair font-black text-lg block mt-1">₹{v.price}</span>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#c8872a] text-white flex items-center justify-center shadow">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Purchase Options Selector */}
          <div className="space-y-3 pt-4 border-t border-[#d4d9b8]/50">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#1a2c1a]">Select Purchase Option</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* One-Time Option */}
              <button
                onClick={() => setPurchaseType("onetime")}
                className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between relative cursor-pointer ${
                  purchaseType === "onetime"
                    ? "border-[#3d5a2e] bg-[#3d5a2e]/5 text-[#1a2c1a] shadow-sm"
                    : "border-[#d4d9b8] bg-white text-[#4a4a4a] hover:border-[#3d5a2e]/50"
                }`}
              >
                <span className="font-bold text-sm uppercase tracking-wider block">One-Time Purchase</span>
                <span className="font-playfair font-black text-lg block mt-1">₹{selectedVariant.price}</span>
                {purchaseType === "onetime" && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#3d5a2e] text-white flex items-center justify-center shadow">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>

              {/* Subscribe & Save Option */}
              <button
                onClick={() => setPurchaseType("subscription")}
                className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between relative cursor-pointer ${
                  purchaseType === "subscription"
                    ? "border-[#c8872a] bg-[#c8872a]/10 text-[#1a2c1a] shadow-sm"
                    : "border-[#d4d9b8] bg-white text-[#4a4a4a] hover:border-[#c8872a]/50"
                }`}
              >
                <div className="flex justify-between items-start w-full">
                  <span className="font-bold text-sm uppercase tracking-wider block">Subscribe & Save</span>
                  <span className="bg-[#c8872a] text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ml-auto">
                    {subscriptionDiscount}% OFF
                  </span>
                </div>
                <span className="font-playfair font-black text-lg block mt-1">₹{Math.round(selectedVariant.price * ((100 - subscriptionDiscount) / 100) * 100) / 100}</span>
                {purchaseType === "subscription" && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#c8872a] text-white flex items-center justify-center shadow">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            </div>
            {purchaseType === "subscription" && (
              <p className="text-[11px] text-[#c8872a] font-bold uppercase tracking-wide mt-2">
                📅 Flexible deliveries (Daily/Weekly/Custom) configured at Checkout!
              </p>
            )}
          </div>

          {/* Add to Cart Actions */}
          <div className="space-y-4 pt-6 border-t border-[#d4d9b8]/50">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              {/* Quantity Selector */}
              <div className="flex items-center justify-between sm:justify-start border-2 border-[#d4d9b8] rounded-xl p-1 bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="p-3 text-[#4a4a4a] hover:bg-[#f0f2e8] rounded-lg transition-colors disabled:opacity-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-6 font-bold text-lg text-[#1a2c1a] min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(selectedVariant.stock, quantity + 1))}
                  disabled={quantity >= selectedVariant.stock}
                  className="p-3 text-[#4a4a4a] hover:bg-[#f0f2e8] rounded-lg transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Bag Button */}
              <Button
                onClick={handleAddToCart}
                disabled={selectedVariant.stock < 1}
                className={`flex-1 ${purchaseType === "subscription" ? "bg-[#c8872a] hover:bg-[#a86e1e]" : "bg-[#3d5a2e] hover:bg-[#1a2c1a]"} text-white py-7 rounded-xl font-bold uppercase tracking-widest text-base shadow-lg transition-all flex items-center justify-center gap-2`}
              >
                <ShoppingBag className="w-5 h-5" />
                <span>
                  {selectedVariant.stock < 1 
                    ? "Sold Out" 
                    : purchaseType === "subscription" 
                      ? "Subscribe & Save" 
                      : "Add to Bag"}
                </span>
              </Button>

              {/* Wishlist Button */}
              <button
                onClick={() => toggleWishlist(product.id)}
                className="p-4.5 rounded-xl border-2 border-[#d4d9b8] hover:border-[#c8872a]/50 hover:bg-[#fdfcf8] bg-white transition-all flex items-center justify-center text-[#3a4a2e] cursor-pointer"
                aria-label={wish ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart
                  className={wish ? "fill-[#A32D2D] text-[#A32D2D]" : "text-[#3a4a2e] hover:text-[#A32D2D]"}
                  size={20}
                />
              </button>
            </div>
          </div>

          <PincodeChecker />

          {/* Guarantees Strip */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#d4d9b8]/50 text-center">
            <div className="flex flex-col items-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-[#f0f2e8] flex items-center justify-center text-[#3d5a2e]">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1a2c1a]">Fresh Morning Batches</span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-[#f0f2e8] flex items-center justify-center text-[#3d5a2e]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1a2c1a]">100% Natural</span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-[#f0f2e8] flex items-center justify-center text-[#3d5a2e]">
                <Truck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1a2c1a]">Secure Packaging</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div 
        ref={reviewSectionRef} 
        className="pt-16 border-t border-[#d4d9b8] space-y-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Reviews Aggregates & Distribution */}
          <div className="space-y-6">
            <div>
              <h2 className="font-playfair font-black text-2xl text-[#1a2c1a] uppercase tracking-tight">
                Customer Reviews
              </h2>
              <p className="text-xs font-bold uppercase tracking-wider text-[#8a8a7a]">
                What our community says about {product.name}
              </p>
            </div>

            {totalCount > 0 ? (
              <div className="bg-white border border-[#d4d9b8] rounded-2xl p-6 space-y-6 shadow-sm">
                {/* Big Score */}
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-playfair font-black text-[#3d5a2e]">
                    {averageRating.toFixed(1)}
                  </div>
                  <div>
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={18}
                          className={i < Math.round(averageRating) ? "fill-[#e8c97a] text-[#e8c97a]" : "text-gray-200"}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-[#8a8a7a] font-bold uppercase mt-1">
                      Based on {totalCount} {totalCount === 1 ? 'rating' : 'ratings'}
                    </p>
                  </div>
                </div>

                {/* Rating Distribution Bar Charts */}
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = distribution[stars] || 0;
                    const percent = totalCount > 0 ? (count / totalCount) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3 text-xs">
                        <span className="font-bold text-[#1a2c1a] w-3 text-right">{stars}</span>
                        <Star size={12} className="fill-[#e8c97a] text-[#e8c97a]" />
                        {/* Progress Bar */}
                        <div className="flex-1 h-2 bg-[#f0f2e8] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#3d5a2e] rounded-full transition-all duration-500" 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="font-bold text-[#8a8a7a] w-8 text-right">
                          {percent.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#d4d9b8] rounded-2xl p-6 text-center text-xs text-[#8a8a7a] font-bold uppercase py-10 shadow-sm">
                No reviews yet. Be the first to share your experience!
              </div>
            )}

            {/* Write a Review Section */}
            {hasPurchased && !hasReviewed ? (
              <div className="bg-[#fcfdfa] border border-[#d4d9b8] rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#1a2c1a] flex items-center gap-1.5">
                  <MessageSquare size={16} /> Write a Review
                </h3>
                <p className="text-xs text-[#8a8a7a] font-medium leading-relaxed">
                  As a verified buyer of this product, your feedback helps our bakers maintain the highest quality standards.
                </p>

                <form onSubmit={handleSubmitReview} className="space-y-4 pt-2">
                  {/* Stars input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#1a2c1a]">Your Rating *</label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingInput(star)}
                          className="text-[#e8c97a] hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            size={24}
                            className={star <= ratingInput ? "fill-[#e8c97a] text-[#e8c97a]" : "text-gray-300"}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title input */}
                  <div className="space-y-1.5">
                    <label htmlFor="review-title" className="text-[10px] font-bold uppercase tracking-widest text-[#1a2c1a]">Review Title (Optional)</label>
                    <input
                      id="review-title"
                      type="text"
                      placeholder="e.g. Deliciously fresh, perfect crust!"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-[#d4d9b8] focus:outline-none focus:border-[#3d5a2e] focus:ring-1 focus:ring-[#3d5a2e]"
                    />
                  </div>

                  {/* Comment input */}
                  <div className="space-y-1.5">
                    <label htmlFor="review-comment" className="text-[10px] font-bold uppercase tracking-widest text-[#1a2c1a]">Review Details *</label>
                    <textarea
                      id="review-comment"
                      rows={3}
                      required
                      placeholder="Share your thoughts on taste, texture, packaging, or delivery..."
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-[#d4d9b8] focus:outline-none focus:border-[#3d5a2e] focus:ring-1 focus:ring-[#3d5a2e] resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="w-full bg-[#3d5a2e] hover:bg-[#1a2c1a] text-white py-3 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                  >
                    {isSubmittingReview ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                      </>
                    ) : (
                      "Submit Review"
                    )}
                  </Button>
                </form>
              </div>
            ) : session?.user && hasReviewed ? (
              <div className="bg-white border border-[#d4d9b8] rounded-2xl p-5 flex items-center gap-3 text-xs text-[#3B6D11] font-bold uppercase shadow-sm">
                <Check size={16} /> Thank you! You have reviewed this product.
              </div>
            ) : session?.user && !hasPurchased ? (
              <div className="bg-white border border-[#d4d9b8] rounded-2xl p-5 flex gap-3 text-xs text-[#8a8a7a] font-medium shadow-sm items-start">
                <AlertCircle size={16} className="text-[#c8872a] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#1a2c1a] uppercase text-[10px] tracking-wider mb-0.5">Verified Review Only</p>
                  <p className="leading-relaxed">To ensure authentic community ratings, only verified buyers who have received this product can write a review.</p>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#d4d9b8] rounded-2xl p-5 text-center shadow-sm">
                <p className="text-xs text-[#8a8a7a] font-medium mb-3">Want to leave a rating? Please log in first.</p>
                <Link href={`/login?callbackUrl=/product/${product.slug}`}>
                  <Button variant="outline" className="w-full border-[#d4d9b8] hover:bg-[#f0f2e8] text-xs font-bold uppercase tracking-wider h-10">
                    Sign In to Review
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Reviews List Feed */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="font-bold text-sm uppercase tracking-wider text-[#1a2c1a] border-b border-[#f0f2e8] pb-3">
              Review Feed ({reviews.length})
            </h3>

            {loadingReviews ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#3d5a2e]" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a8a7a]">Loading reviews...</p>
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-6 divide-y divide-[#f0f2e8]">
                {reviews.map((review, idx) => (
                  <div key={review.id} className={idx > 0 ? "pt-6" : ""}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      {/* Rating stars & verified badge */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={i < review.rating ? "fill-[#e8c97a] text-[#e8c97a]" : "text-gray-200"}
                            />
                          ))}
                        </div>
                        {review.isVerified && (
                          <span className="bg-[#EAF3DE] text-[#3B6D11] border border-[#d0e5b5] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      
                      {/* Name & date */}
                      <div className="text-[10px] text-[#8a8a7a] font-bold uppercase tracking-wide">
                        {review.user?.name || "Guest User"} &bull; {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>

                    <div className="mt-3 space-y-1">
                      {review.title && (
                        <h4 className="text-xs font-black text-[#1a2c1a]">
                          {review.title}
                        </h4>
                      )}
                      <p className="text-xs text-[#4a4a4a] leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-[#8a8a7a] font-medium border border-dashed border-[#d4d9b8] rounded-2xl bg-[#fdfcfb]">
                No reviews yet. Be the first to share your thoughts!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products Carousel */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="pt-16 border-t border-[#d4d9b8] space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-playfair font-black text-2xl text-[#1a2c1a] uppercase tracking-tight">
                You May Also Like
              </h2>
              <p className="text-xs font-bold uppercase tracking-wider text-[#8a8a7a]">
                {allSameCategory
                  ? `More fresh delights from our ${product.category.name} selection`
                  : "More fresh delights from our selection"}
              </p>
            </div>
            {/* Navigation Arrows */}
            <div className="flex gap-2">
              <button 
                onClick={() => scroll("left")}
                className="w-10 h-10 rounded-full border border-[#d4d9b8] hover:bg-[#f0f2e8] flex items-center justify-center text-[#3d5a2e] transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => scroll("right")}
                className="w-10 h-10 rounded-full border border-[#d4d9b8] hover:bg-[#f0f2e8] flex items-center justify-center text-[#3d5a2e] transition-colors"
                aria-label="Next page"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Carousel container */}
          <div 
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {relatedProducts.map((prod) => (
              <div key={prod.id} className="w-[280px] sm:w-[320px] flex-shrink-0 snap-start">
                <ProductCard product={prod} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
