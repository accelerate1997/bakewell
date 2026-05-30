"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface WishlistContextType {
  wishlistIds: string[];
  wishlistProducts: any[];
  toggleWishlist: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  loading: boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = async () => {
    if (status !== "authenticated") {
      setWishlistIds([]);
      setWishlistProducts([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/store/wishlist");
      if (res.ok) {
        const data = await res.json();
        setWishlistProducts(data);
        setWishlistIds(data.map((p: any) => p.id));
      }
    } catch (err) {
      console.error("Failed to fetch wishlist:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [status]);

  const toggleWishlist = async (productId: string) => {
    if (status !== "authenticated") {
      toast.error("Please login to wishlist products!");
      return;
    }

    const isCurrentlyWishlisted = wishlistIds.includes(productId);

    // Optimistic Update
    if (isCurrentlyWishlisted) {
      setWishlistIds((prev) => prev.filter((id) => id !== productId));
      setWishlistProducts((prev) => prev.filter((p) => p.id !== productId));
    } else {
      setWishlistIds((prev) => [...prev, productId]);
    }

    try {
      if (isCurrentlyWishlisted) {
        const res = await fetch(`/api/store/wishlist?productId=${productId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          toast.success("Removed from wishlist");
        } else {
          throw new Error("Failed to remove");
        }
      } else {
        const res = await fetch("/api/store/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        if (res.ok) {
          toast.success("Added to wishlist!");
        } else {
          throw new Error("Failed to add");
        }
      }
      // Refresh to ensure database state matches
      fetchWishlist();
    } catch (error) {
      toast.error("Failed to update wishlist. Please try again.");
      // Rollback
      fetchWishlist();
    }
  };

  const isWishlisted = (productId: string) => wishlistIds.includes(productId);

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistProducts,
        toggleWishlist,
        isWishlisted,
        loading,
        refreshWishlist: fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
