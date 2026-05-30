"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';

interface OrderUpdateFormProps {
  order: {
    id: string;
    status: string;
    trackingNumber: string | null;
    notes: string | null;
  };
}

export function OrderUpdateForm({ order }: OrderUpdateFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status.toLowerCase());
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [notes, setNotes] = useState(order.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          trackingNumber: trackingNumber.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to update order');
      } else {
        toast.success('Order updated successfully!');
        router.refresh();
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Something went wrong while updating the order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 border-[#d4d9b8] rounded-[8px] shadow-none bg-[#f9faf6] space-y-6">
      <h3 className="font-black uppercase tracking-tight text-[#1a2c1a]">Update Order</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-[10px]">Change Status</Label>
          <Select value={status} onValueChange={(val: any) => setStatus(val || status)}>
            <SelectTrigger className="h-10 border-[#d4d9b8] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-[10px]">Tracking Number</Label>
          <Input 
            value={trackingNumber} 
            onChange={e => setTrackingNumber(e.target.value)} 
            placeholder="Enter AWB number..." 
            className="h-10 border-[#d4d9b8] bg-white" 
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px]">Note to Customer</Label>
          <Textarea 
            value={notes} 
            onChange={e => setNotes(e.target.value)} 
            placeholder="Add a message..." 
            className="min-h-[80px] border-[#d4d9b8] bg-white" 
          />
        </div>
        <Button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? 'Updating...' : 'Update Order'}
        </Button>
      </form>
    </Card>
  );
}
