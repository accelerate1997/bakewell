"use client"

import { useState, useEffect } from 'react';
import { 
  Search, 
  Trash2, 
  Star, 
  MessageSquare,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
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
import { toast } from 'sonner';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');

  const fetchReviews = () => {
    setLoading(true);
    fetch('/api/admin/reviews')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setReviews(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        toast.error("Failed to load reviews");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Review deleted successfully!");
        setReviews(prev => prev.filter(r => r.id !== id));
      } else {
        toast.error(data.error || "Failed to delete review");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while deleting the review");
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      review.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.title?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesRating = ratingFilter === 'all' || review.rating.toString() === ratingFilter;
    
    return matchesSearch && matchesRating;
  });

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#1a2c1a]">Customer Reviews</h1>
          <p className="text-xs text-[#8a8a7a] mt-1 font-bold uppercase tracking-wider">Monitor and moderate product reviews and ratings</p>
        </div>
      </div>

      {/* Stats Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Reviews", value: reviews.length, icon: MessageSquare, color: "text-[#1a2c1a]" },
          { 
            label: "Average Rating", 
            value: averageRating > 0 ? `${averageRating.toFixed(1)} / 5.0` : "0.0 / 5.0", 
            icon: Star, 
            color: "text-[#c8872a]" 
          },
          { 
            label: "Verified Purchases", 
            value: reviews.filter(r => r.isVerified).length, 
            icon: CheckCircle2, 
            color: "text-[#3B6D11]" 
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-4 border-[#d4d9b8] rounded-[8px] shadow-none bg-white flex items-center gap-4">
              <div className="p-3 bg-[#f0f2e8] rounded-full text-[#3d5a2e]">
                <Icon size={20} className={stat.label === "Average Rating" ? "fill-[#c8872a] text-[#c8872a]" : ""} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a8a7a]">{stat.label}</p>
                <h4 className={cn("text-xl font-black mt-0.5", stat.color)}>{stat.value}</h4>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filters bar */}
      <Card className="p-4 border-[#d4d9b8] rounded-[8px] shadow-none bg-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8a7a]" size={16} />
            <Input 
              placeholder="Search by customer, product name, or review content..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 border-[#d4d9b8]" 
            />
          </div>

          <Select value={ratingFilter} onValueChange={(val: any) => setRatingFilter(val || 'all')}>
            <SelectTrigger className="h-10 border-[#d4d9b8]">
              <SelectValue placeholder="Filter by Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Reviews list */}
      <Card className="border-[#d4d9b8] rounded-[8px] shadow-none bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#1a2c1a] text-white text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 font-bold">Customer</th>
                <th className="px-6 py-4 font-bold">Product</th>
                <th className="px-6 py-4 font-bold text-center">Rating</th>
                <th className="px-6 py-4 font-bold">Review Details</th>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2e8] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#8a8a7a]">Loading reviews...</td>
                </tr>
              ) : filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#8a8a7a]">No reviews found</td>
                </tr>
              ) : filteredReviews.map((review, i) => (
                <tr 
                  key={review.id}
                  className={cn(
                    "transition-colors",
                    i % 2 === 0 ? "bg-white" : "bg-[#f9faf6]", 
                    "hover:bg-[#f0f2e8]"
                  )}
                >
                  {/* User details */}
                  <td className="px-6 py-4">
                    <div className="font-bold text-[#1a2c1a]">{review.user?.name || "Guest User"}</div>
                    <div className="text-[10px] text-[#8a8a7a] mt-0.5 font-medium">{review.user?.email || review.user?.phone || "N/A"}</div>
                  </td>

                  {/* Product details */}
                  <td className="px-6 py-4">
                    <div className="font-bold text-[#3d5a2e]">{review.product?.name}</div>
                  </td>

                  {/* Rating stars */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-0.5 text-[#e8c97a]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          size={12} 
                          className={i < review.rating ? "fill-[#e8c97a] text-[#e8c97a]" : "text-gray-200"} 
                        />
                      ))}
                    </div>
                  </td>

                  {/* Comment and Badges */}
                  <td className="px-6 py-4 max-w-sm space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {review.title && <span className="font-black text-[#1a2c1a]">{review.title}</span>}
                      {review.isVerified && (
                        <Badge className="bg-[#EAF3DE] text-[#3B6D11] hover:bg-[#EAF3DE] border-none text-[8px] font-black uppercase tracking-wider rounded-sm px-1.5 py-0">
                          Verified Buy
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 leading-relaxed break-words">{review.comment}</p>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4 font-bold text-[#8a8a7a] text-[10px]">
                    {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(review.id)}
                      className="h-8 w-8 text-[#A32D2D] hover:bg-[#FCEBEB] rounded-sm"
                      title="Delete Review"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
